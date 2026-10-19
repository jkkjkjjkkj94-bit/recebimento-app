/* AGENDAMENTO PROMOCIONAIS — aplicação principal */
(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const config = window.APP_CONFIG || {};
  const { SUPABASE_URL, SUPABASE_KEY, TABLE, SHARED_USER_ID } = config;
  const SUPPLIER_TABLE = 'fornecedores_agendamento';

  let client = null;
  let records = [];
  let suppliers = [];

  const now = new Date();
  const todayISO = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function toast(message) {
    const el = $('toast');
    if (!el) return;
    el.textContent = message;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 3000);
  }

  function mapRow(r) {
    return {
      id: r.id,
      nf: r.codigo || '',
      supplier: r.fornecedor ?? r.supplier ?? '',
      description: r.descricao ?? r.description ?? '',
      date: r.agendamento || todayISO,
      shift: r.turno_recebido || '',
      status: r.status || (r.concluido ? 'Concluído' : 'Agendado'),
      responsible: r.responsavel ?? r.responsible ?? '',
      createdAt: r.created_at,
      updatedAt: r.updated_at
    };
  }

  function toRow(x) {
    return {
      id: x.id || crypto.randomUUID(),
      user_id: SHARED_USER_ID,
      codigo: x.nf || '',
      fornecedor: x.supplier,
      descricao: x.description || '',
      agendamento: x.date,
      turno_recebido: x.shift || null,
      status: x.status || 'Agendado',
      concluido: x.status === 'Concluído',
      responsavel: x.responsible || '',
      updated_at: new Date().toISOString()
    };
  }

  async function loadRecords() {
    const { data, error } = await client.from(TABLE).select('*').eq('user_id', SHARED_USER_ID).order('agendamento', { ascending: true });
    if (error) throw error;
    records = (data || []).map(mapRow);
    render();
  }

  async function loadSuppliers() {
    const { data, error } = await client.from(SUPPLIER_TABLE).select('id,nome').eq('user_id', SHARED_USER_ID).order('nome', { ascending: true });
    if (error) throw error;
    suppliers = data || [];
    renderSupplierOptions();
    renderSupplierList();
  }

  function supplierNames() {
    return [...new Set([...suppliers.map(x => x.nome), ...records.map(x => x.supplier)].filter(Boolean))]
      .sort((a,b) => a.localeCompare(b, 'pt-BR'));
  }

  function renderSupplierOptions() {
    const el = $('supplier');
    if (!el) return;
    const current = el.value;
    const names = supplierNames();
    el.innerHTML = '<option value="">Selecione um fornecedor</option>' + names.map(n => `<option value="${esc(n)}">${esc(n)}</option>`).join('');
    if (names.includes(current)) el.value = current;
  }

  function renderSupplierList() {
    const el = $('supplierList');
    if (!el) return;
    if (!suppliers.length) {
      el.innerHTML = '<div class="empty"><strong>Nenhum fornecedor cadastrado</strong><span>Use o campo acima para adicionar o primeiro.</span></div>';
      return;
    }
    el.innerHTML = suppliers.map(s => `<article class="appointment" style="grid-template-columns:minmax(0,1fr) auto;align-items:center"><div class="itemtitle">${esc(s.nome)}</div><div class="itemactions"><button class="danger small" type="button" data-delete-supplier="${esc(s.id)}">Excluir</button></div></article>`).join('');
  }

  async function saveRecord(x) {
    const row = { ...toRow(x), user_id: SHARED_USER_ID };
    const exists = records.some(r => String(r.id) === String(x.id));
    if (exists) {
      const { id, user_id, ...changes } = row;
      const { data, error } = await client.from(TABLE).update(changes).eq('id', id).eq('user_id', SHARED_USER_ID).select('id').maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('Nenhuma linha foi atualizada. Verifique as permissões do Supabase.');
      return data;
    }
    const { data, error } = await client.from(TABLE).insert(row).select('id').single();
    if (error) throw error;
    if (!data) throw new Error('O banco não confirmou a inclusão do agendamento.');
    return data;
  }

  async function deleteRecord(id) {
    const { data, error } = await client.from(TABLE).delete().eq('id', id).eq('user_id', SHARED_USER_ID).select('id');
    if (error) throw error;
    if (!data?.length) throw new Error('O Supabase não excluiu nenhuma linha.');
  }

  function render() {
    renderSupplierOptions();
    $('totalCount').textContent = records.length;
    $('todayCount').textContent = records.filter(x => x.date === todayISO && x.status !== 'Cancelado').length;
    $('doneCount').textContent = records.filter(x => x.status === 'Concluído').length;

    const q = $('search').value.trim().toLocaleLowerCase('pt-BR');
    const sf = $('statusFilter').value;
    const df = $('dateFilter').value;
    const arr = records.filter(x => [x.supplier,x.description,x.responsible,x.shift].join(' ').toLocaleLowerCase('pt-BR').includes(q) && (!sf || x.status === sf) && (df === 'all' || (df === 'upcoming' ? x.date >= todayISO : x.date < todayISO))).sort((a,b) => a.date.localeCompare(b.date));

    $('resultCount').textContent = `${arr.length} ${arr.length === 1 ? 'registro' : 'registros'}`;
    renderOverview();
    if (!arr.length) {
      $('appointments').innerHTML = '<div class="empty"><div style="font-size:30px">▦</div><strong>Nenhum agendamento encontrado</strong><span>Cadastre um agendamento ou ajuste os filtros.</span></div>';
      return;
    }
    $('appointments').innerHTML = arr.map(x => {
      const [y,m,d] = x.date.split('-');
      const date = new Date(+y,+m-1,+d);
      const month = date.toLocaleDateString('pt-BR',{month:'short'}).replace('.','');
      const cls = x.status === 'Concluído' ? 'done' : x.status === 'Cancelado' ? 'cancelled' : 'scheduled';
      return `<article class="appointment"><div class="datebox"><div class="day">${d}</div><div class="month">${esc(month)}</div></div><div><div class="itemtitle">${esc(x.supplier)}</div><div class="meta">${x.shift ? `<span>Turno recebido: <b>${esc(x.shift)}</b></span>` : ''}</div>${x.description ? `<div class="desc">${esc(x.description)}</div>` : ''}${x.responsible ? `<div class="meta">Responsável: ${esc(x.responsible)}</div>` : ''}<span class="pill ${cls}">${esc(x.status)}</span></div><div class="itemactions"><button class="secondary small" data-edit="${esc(x.id)}">Editar</button><button class="danger small" data-delete="${esc(x.id)}">Excluir</button></div></article>`;
    }).join('');
  }

  function renderOverview() {
    const supplierSelect = $('ovSupplier');
    const previous = supplierSelect.value;
    const names = [...new Set(records.map(x => x.supplier).filter(Boolean))].sort((a,b) => a.localeCompare(b,'pt-BR'));
    supplierSelect.innerHTML = '<option value="">Todos os fornecedores</option>' + names.map(s => `<option value="${esc(s)}">${esc(s)}</option>`).join('');
    if (names.includes(previous)) supplierSelect.value = previous;

    const month = $('ovMonth').value || todayISO.slice(0,7);
    const monthRecords = records.filter(x => (x.date || '').slice(0,7) === month);
    $('monthTotal').textContent = monthRecords.length;
    $('monthReceived').textContent = monthRecords.filter(x => x.status === 'Concluído').length;
    $('monthScheduled').textContent = monthRecords.filter(x => x.status === 'Agendado').length;
    $('monthCancelled').textContent = monthRecords.filter(x => x.status === 'Cancelado').length;

    const q = $('ovSearch').value.trim().toLocaleLowerCase('pt-BR');
    const supplier = supplierSelect.value, status = $('ovStatus').value, shift = $('ovShift').value, from = $('ovFrom').value, to = $('ovTo').value;
    const filtered = records.filter(x => {
      const hay = [x.supplier,x.description,x.responsible,x.shift,x.status,x.date].join(' ').toLocaleLowerCase('pt-BR');
      return (x.date||'').slice(0,7) === month && (!q || hay.includes(q)) && (!supplier || x.supplier === supplier) && (!status || x.status === status) && (!shift || (shift === 'none' ? !x.shift : x.shift === shift)) && (!from || x.date >= from) && (!to || x.date <= to);
    }).sort((a,b) => b.date.localeCompare(a.date));

    $('overviewCount').textContent = `${filtered.length} de ${records.length} registro(s) • ${month}`;
    $('overviewRows').innerHTML = filtered.length ? filtered.map(x => `<tr><td data-column="Data">${esc(new Date(x.date+'T12:00:00').toLocaleDateString('pt-BR'))}</td><td data-column="Fornecedor"><strong>${esc(x.supplier||'—')}</strong></td><td data-column="Descrição da carga">${esc(x.description||'—')}</td><td data-column="Turno recebido">${esc(x.shift||'Não informado')}</td><td data-column="Status">${esc(x.status||'Agendado')}</td><td data-column="Responsável">${esc(x.responsible||'—')}</td></tr>`).join('') : '<tr><td colspan="6" style="text-align:center;padding:24px">Nenhum registro corresponde ao mês e aos filtros selecionados.</td></tr>';
  }

  function showView(view) {
    const overview = view === 'overview', supplierView = view === 'suppliers';
    $('overviewView').classList.toggle('hidden', !overview);
    $('suppliersView').classList.toggle('hidden', !supplierView);
    document.querySelector('.layout').classList.toggle('hidden', overview || supplierView);
    document.querySelector('.stats').classList.toggle('hidden', overview || supplierView);
    $('agendaViewBtn').classList.toggle('active', !overview && !supplierView);
    $('overviewViewBtn').classList.toggle('active', overview);
    $('suppliersViewBtn').classList.toggle('active', supplierView);
    if (overview) renderOverview();
    if (supplierView) renderSupplierList();
  }

  function resetForm() {
    $('appointmentForm').reset();
    $('editId').value = '';
    $('date').value = todayISO;
    $('status').value = 'Agendado';
    $('formTitle').textContent = 'Novo agendamento';
    $('saveBtn').textContent = '＋ Salvar agendamento';
    $('cancelEdit').classList.add('hidden');
  }

  function csvCell(value) { const s = String(value ?? ''); return '"' + s.replace(/"/g,'""') + '"'; }
  function exportCsv(rows, filename) {
    const headers = ['Data','Fornecedor','Descrição da carga','Turno recebido','Status','Responsável'];
    const lines = [headers, ...rows.map(x => [x.date ? new Date(x.date+'T12:00:00').toLocaleDateString('pt-BR') : '',x.supplier,x.description,x.shift,x.status,x.responsible])].map(row => row.map(csvCell).join(';'));
    const blob = new Blob(['\ufeff' + lines.join('\r\n')], {type:'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
  }

  function bindEvents() {
    $('appointmentForm').addEventListener('submit', async e => {
      e.preventDefault();
      const id = $('editId').value || crypto.randomUUID();
      const existing = records.find(x => String(x.id) === String(id));
      const x = {id,nf:'',supplier:$('supplier').value.trim(),description:$('description').value.trim(),date:$('date').value,shift:$('shift').value,status:$('status').value,responsible:$('responsible').value.trim(),createdAt:existing?.createdAt};
      if (!x.supplier || !x.date) return toast('Preencha fornecedor e data.');
      const btn = $('saveBtn'); btn.disabled = true; btn.textContent = 'Salvando...';
      try { await saveRecord(x); await loadRecords(); resetForm(); toast(existing ? 'Agendamento atualizado no Supabase!' : 'Agendamento salvo no Supabase!'); }
      catch (err) { console.error(err); toast('Erro ao salvar: ' + (err.message || 'verifique a conexão/permissões.')); }
      finally { btn.disabled = false; btn.textContent = '＋ Salvar agendamento'; }
    });

    $('cancelEdit').addEventListener('click', resetForm);
    $('supplierForm').addEventListener('submit', async e => {
      e.preventDefault();
      const nome = $('newSupplier').value.trim();
      if (!nome) return;
      if (suppliers.some(s => s.nome.toLocaleLowerCase('pt-BR') === nome.toLocaleLowerCase('pt-BR'))) return toast('Este fornecedor já está cadastrado.');
      const btn = $('addSupplierBtn'); btn.disabled = true; btn.textContent = 'Salvando...';
      try { const {error} = await client.from(SUPPLIER_TABLE).insert({user_id:SHARED_USER_ID,nome}); if(error) throw error; await loadSuppliers(); $('newSupplier').value=''; toast('Fornecedor adicionado às opções.'); }
      catch(err) { console.error(err); toast('Erro ao cadastrar fornecedor: '+(err.message||'verifique o banco de dados.')); }
      finally { btn.disabled=false; btn.textContent='＋ Adicionar'; }
    });

    $('supplierList').addEventListener('click', async e => {
      const btn = e.target.closest('[data-delete-supplier]'); if(!btn) return;
      const item = suppliers.find(s => String(s.id) === String(btn.dataset.deleteSupplier));
      if(!item || !confirm(`Excluir "${item.nome}" da lista de opções? Os agendamentos antigos serão mantidos.`)) return;
      btn.disabled=true;
      try { const {error}=await client.from(SUPPLIER_TABLE).delete().eq('id',item.id).eq('user_id',SHARED_USER_ID); if(error) throw error; await loadSuppliers(); toast('Fornecedor removido das opções.'); }
      catch(err){ console.error(err); toast('Erro ao excluir fornecedor: '+(err.message||'verifique as permissões.')); }
      finally { btn.disabled=false; }
    });

    $('appointments').addEventListener('click', async e => {
      const eb=e.target.closest('[data-edit]'), db=e.target.closest('[data-delete]');
      if(eb){ const x=records.find(r=>String(r.id)===String(eb.dataset.edit)); if(!x)return; $('editId').value=x.id; $('supplier').value=x.supplier; $('description').value=x.description; $('date').value=x.date; $('shift').value=x.shift||''; $('status').value=x.status; $('responsible').value=x.responsible; $('formTitle').textContent='Editar agendamento'; $('saveBtn').textContent='Salvar alterações'; $('cancelEdit').classList.remove('hidden'); window.scrollTo({top:0,behavior:'smooth'}); }
      if(db){ const x=records.find(r=>String(r.id)===String(db.dataset.delete)); if(x&&confirm(`Excluir o agendamento de ${x.supplier}? Esta ação não pode ser desfeita.`)){ db.disabled=true; db.textContent='Excluindo...'; try{await deleteRecord(x.id);await loadRecords();toast('Agendamento excluído com sucesso.')}catch(err){console.error(err);toast('Não foi possível excluir: '+(err.message||'verifique as permissões do Supabase.'))}finally{db.disabled=false;db.textContent='Excluir'} } }
    });

    ['search','statusFilter','dateFilter'].forEach(id => $(id).addEventListener(id==='search'?'input':'change',render));
    $('agendaViewBtn').addEventListener('click',()=>showView('agenda'));
    $('overviewViewBtn').addEventListener('click',()=>showView('overview'));
    $('suppliersViewBtn').addEventListener('click',()=>showView('suppliers'));
    ['ovMonth','ovSupplier','ovStatus','ovShift','ovFrom','ovTo'].forEach(id=>$(id).addEventListener('change',renderOverview));
    $('ovSearch').addEventListener('input',renderOverview);
    $('clearOverviewFilters').addEventListener('click',()=>{['ovSearch','ovSupplier','ovStatus','ovShift','ovFrom','ovTo'].forEach(id=>$(id).value='');$('ovMonth').value=todayISO.slice(0,7);renderOverview();});
    $('overviewExportBtn').addEventListener('click',()=>{const month=$('ovMonth').value||todayISO.slice(0,7);exportCsv(records.filter(x=>(x.date||'').slice(0,7)===month),'visao-geral-agendamentos-'+todayISO+'.csv');toast('Arquivo CSV exportado.');});
    $('exportBtn').addEventListener('click',()=>{exportCsv(records,'agendamento-promocionais-'+todayISO+'.csv');toast('Arquivo CSV exportado.');});
    $('importFile').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{const data=JSON.parse(await file.text()),arr=Array.isArray(data)?data:data.records;if(!Array.isArray(arr))throw Error('Formato inválido');if(!confirm(`Importar ${arr.length} registro(s)? IDs iguais serão atualizados.`))return;for(const raw of arr){if(raw?.supplier&&raw?.date)await saveRecord({...raw,id:raw.id||crypto.randomUUID()});}await loadRecords();toast('Importação concluída no Supabase.');}catch(err){toast('Falha na importação: '+err.message)}finally{e.target.value='';}});
  }

  function initSplash(){ const screen=$('splashScreen'); if(!screen)return; const enter=()=>{if(screen.classList.contains('splash-leaving'))return;screen.classList.add('splash-leaving');setTimeout(()=>screen.remove(),460)}; screen.addEventListener('click',enter);screen.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();enter();}}); }

  async function init(){
    $('date').value=todayISO;
    $('ovMonth').value=todayISO.slice(0,7);
    $('todayLabel').textContent=now.toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long',year:'numeric'});
    initSplash();
    bindEvents();
    try {
      if(!SUPABASE_URL||!SUPABASE_KEY||!TABLE||!SHARED_USER_ID) throw Error('Configuração do Supabase incompleta.');
      if(!window.supabase?.createClient) throw Error('A biblioteca Supabase não carregou. Verifique sua conexão.');
      client=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
      await loadSuppliers();
      await loadRecords();
      $('connection').textContent='● Conectado ao Supabase';
      $('connection').style.color='#86efac';
      $('notice').textContent='Conectado ao Supabase. Os registros são compartilhados entre dispositivos que usam este sistema. Exporte um backup periodicamente.';
    } catch(err) {
      console.error('Falha ao iniciar conexão Supabase:',err);
      const detail=err?.message||'Verifique a internet, a API do Supabase e as permissões da tabela.';
      $('connection').textContent='● Falha na conexão';
      $('connection').style.color='#fca5a5';
      $('notice').textContent='Erro de conexão: '+detail;
      $('appointments').innerHTML=`<div class="empty"><strong>Não foi possível conectar ao banco de dados</strong><span>${esc(detail)}</span><div style="margin-top:14px"><button type="button" class="secondary" onclick="location.reload()">Tentar novamente</button></div></div>`;
      toast('Falha na conexão com o Supabase: '+detail);
    }
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
