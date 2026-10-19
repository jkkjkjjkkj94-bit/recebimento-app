(() => {
  'use strict';
  const sidebar = document.getElementById('sidebar');
  const toggle = document.getElementById('sidebarToggle');
  if (!sidebar || !toggle) return;

  toggle.addEventListener('click', () => sidebar.classList.toggle('expanded'));

  const viewButtons = {
    agenda: document.getElementById('agendaViewBtn'),
    overview: document.getElementById('overviewViewBtn'),
    suppliers: document.getElementById('suppliersViewBtn')
  };

  function markActive(view) {
    document.querySelectorAll('.side-link[data-view]').forEach(btn => btn.classList.toggle('active', btn.dataset.view === view));
  }

  document.querySelectorAll('.side-link[data-view]').forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view;
      viewButtons[view]?.click();
      markActive(view);
      if (window.innerWidth <= 700) sidebar.classList.remove('expanded');
    });
  });

  viewButtons.agenda?.addEventListener('click', () => markActive('agenda'));
  viewButtons.overview?.addEventListener('click', () => markActive('overview'));
  viewButtons.suppliers?.addEventListener('click', () => markActive('suppliers'));

  document.querySelector('[data-action="new"]')?.addEventListener('click', () => {
    viewButtons.agenda?.click(); markActive('agenda');
    document.getElementById('appointmentForm')?.scrollIntoView({ behavior:'smooth', block:'start' });
    setTimeout(() => { const el=document.getElementById('supplierSearch') || document.getElementById('supplier'); el?.focus(); }, 250);
  });

  document.querySelector('[data-action="search"]')?.addEventListener('click', () => {
    viewButtons.agenda?.click(); markActive('agenda');
    const search=document.getElementById('search'); search?.scrollIntoView({behavior:'smooth',block:'center'}); setTimeout(()=>search?.focus(),250);
  });

  document.querySelector('[data-action="export"]')?.addEventListener('click', () => document.getElementById('exportBtn')?.click());

  function loadScript(src, done) {
    const s=document.createElement('script'); s.src=src; s.onload=()=>done?.(); document.body.appendChild(s);
  }
  loadScript('./gestao-dados.js', () => loadScript('./recursos-gestao.js'));
})();
