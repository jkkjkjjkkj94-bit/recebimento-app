(() => {
  'use strict';
  const cfg = window.APP_CONFIG || {};
  if (!window.supabase || !cfg.SUPABASE_URL || !cfg.SUPABASE_KEY || !cfg.TABLE || !cfg.SHARED_USER_ID) return;
  const db = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_KEY);
  async function syncManagementData() {
    try {
      const { data, error } = await db.from(cfg.TABLE).select('*').eq('user_id', cfg.SHARED_USER_ID).order('agendamento', { ascending: true });
      if (error) throw error;
      window.__agendamentoRecords = (data || []).map(r => ({
        id:r.id,
        supplier:r.fornecedor ?? r.supplier ?? '',
        description:r.descricao ?? r.description ?? '',
        date:r.agendamento || '',
        shift:r.turno_recebido || '',
        status:r.status || (r.concluido ? 'Concluído' : 'Agendado'),
        responsible:r.responsavel ?? r.responsible ?? '',
        createdAt:r.created_at,
        updatedAt:r.updated_at
      }));
      window.dispatchEvent(new Event('agendamento-records'));
    } catch (e) { console.warn('Gestão: não foi possível sincronizar os dados.', e); }
  }
  window.syncManagementData = syncManagementData;
  syncManagementData();
  setInterval(syncManagementData, 15000);
})();