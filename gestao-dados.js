(() => {
  'use strict';
  const cfg = window.APP_CONFIG || {};
  if (!window.supabase || !cfg.TABLE || !cfg.SHARED_USER_ID) return;

  let syncing = false;
  const getDb = () => window.APP_SUPABASE || null;

  async function syncManagementData() {
    if (syncing) return;
    const db = getDb();
    if (!db) return;
    syncing = true;
    try {
      const { data: sessionData, error: sessionError } = await db.auth.getSession();
      if (sessionError) throw sessionError;
      if (!sessionData?.session?.user) {
        window.__agendamentoRecords = [];
        window.__agendamentoHistory = [];
        window.dispatchEvent(new Event('agendamento-records'));
        return;
      }

      const [{ data, error }, { data: history, error: historyError }] = await Promise.all([
        db.from(cfg.TABLE).select('*').eq('user_id', cfg.SHARED_USER_ID).order('agendamento', { ascending: true }),
        db.from('agendamentos_historico').select('id,agendamento_id,acao,usuario_id,usuario_email,alteracoes,criado_em').order('criado_em', { ascending: false }).limit(30)
      ]);
      if (error) throw error;
      if (historyError) throw historyError;

      window.__agendamentoRecords = (data || []).map(r => ({
        id: r.id,
        supplier: r.fornecedor ?? r.supplier ?? '',
        description: r.descricao ?? r.description ?? '',
        date: r.agendamento || '',
        shift: r.turno_recebido || '',
        status: r.status || (r.concluido ? 'Concluído' : 'Agendado'),
        responsible: r.responsavel ?? r.responsible ?? '',
        createdById: r.criado_por_id || '',
        createdByEmail: r.criado_por_email || '',
        createdAt: r.created_at,
        updatedAt: r.updated_at
      }));
      window.__agendamentoHistory = history || [];
      window.dispatchEvent(new Event('agendamento-records'));
    } catch (e) {
      console.warn('Gestão: não foi possível sincronizar os dados.', e);
    } finally {
      syncing = false;
    }
  }

  window.syncManagementData = syncManagementData;
  window.addEventListener('app-auth-ready', () => setTimeout(syncManagementData, 0));
  window.addEventListener('focus', syncManagementData);
  setTimeout(syncManagementData, 500);
  setInterval(syncManagementData, 15000);
})();