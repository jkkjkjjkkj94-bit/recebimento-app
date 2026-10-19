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
  window.addEventListener('app-auth-ready', () => setTimeout(syncManagementData, 0));
  window.addEventListener('focus', syncManagementData);
  setTimeout(syncManagementData, 500);
  setInterval(syncManagementData, 15000);
})();