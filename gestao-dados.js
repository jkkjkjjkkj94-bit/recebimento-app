(() => {
  'use strict';
  const cfg = window.APP_CONFIG || {};
  if (!window.supabase || !cfg.SUPABASE_URL || !cfg.SUPABASE_KEY || !cfg.TABLE || !cfg.SHARED_USER_ID) return;

  const db = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
  let syncing = false;

  async function syncManagementData() {
    if (syncing) return;
    syncing = true;
    try {
      const { data: sessionData, error: sessionError } = await db.auth.getSession();
      if (sessionError) throw sessionError;
      if (!sessionData?.session?.user) {
        window.__agendamentoRecords = [];
        window.dispatchEvent(new Event('agendamento-records'));
        return;
      }

      const { data, error } = await db.from(cfg.TABLE)
        .select('*')
        .eq('user_id', cfg.SHARED_USER_ID)
        .order('agendamento', { ascending: true });
      if (error) throw error;

      window.__agendamentoRecords = (data || []).map(r => ({
        id: r.id,
        supplier: r.fornecedor ?? r.supplier ?? '',
        description: r.descricao ?? r.description ?? '',
        date: r.agendamento || '',
        shift: r.turno_recebido || '',
        status: r.status || (r.concluido ? 'Concluído' : 'Agendado'),
        responsible: r.responsavel ?? r.responsible ?? '',
        createdAt: r.created_at,
        updatedAt: r.updated_at
      }));
      window.dispatchEvent(new Event('agendamento-records'));
    } catch (e) {
      console.warn('Gestão: não foi possível sincronizar os dados.', e);
    } finally {
      syncing = false;
    }
  }

  window.syncManagementData = syncManagementData;

  db.auth.onAuthStateChange((_event, session) => {
    if (session?.user) setTimeout(syncManagementData, 0);
    else {
      window.__agendamentoRecords = [];
      window.dispatchEvent(new Event('agendamento-records'));
    }
  });

  window.addEventListener('auth-ready', syncManagementData);
  window.addEventListener('focus', syncManagementData);
  setTimeout(syncManagementData, 300);
  setInterval(syncManagementData, 15000);
})();