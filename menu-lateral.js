(() => {
  if (document.getElementById('adimaxSidebar')) return;

  const style = document.createElement('style');
  style.textContent = `
    #adimaxSidebar{position:fixed;left:0;top:0;bottom:0;width:76px;background:#171717;border-right:1px solid #2b2b2b;z-index:9000;display:flex;flex-direction:column;padding:12px 10px;transition:width .22s ease;box-shadow:4px 0 18px #00000014}
    #adimaxSidebar.open{width:230px}
    #adimaxSidebar .side-toggle,#adimaxSidebar .side-item{width:100%;height:52px;border:0;border-radius:12px;background:transparent;color:#fff;display:flex;align-items:center;gap:14px;padding:0 15px;cursor:pointer;white-space:nowrap;overflow:hidden;font:700 14px/1 Inter,system-ui,sans-serif;transition:.18s}
    #adimaxSidebar .side-toggle{margin-bottom:16px;color:#f28c00}
    #adimaxSidebar .side-item:hover{background:#292929}
    #adimaxSidebar .side-item.active{background:#f28c00;color:#171717}
    #adimaxSidebar .side-icon{width:26px;min-width:26px;text-align:center;font-size:21px}
    #adimaxSidebar .side-label{opacity:0;transition:opacity .12s}
    #adimaxSidebar.open .side-label{opacity:1}
    #adimaxSidebar .side-spacer{flex:1}
    body{padding-left:76px;transition:padding-left .22s ease}
    body.sidebar-open{padding-left:230px}
    .viewnav{display:none!important}
    @media(max-width:700px){#adimaxSidebar{width:64px;padding:10px 7px}#adimaxSidebar.open{width:220px}body{padding-left:64px}body.sidebar-open{padding-left:64px}#adimaxSidebar.open{box-shadow:8px 0 28px #0005}}
  `;
  document.head.appendChild(style);

  const sidebar = document.createElement('aside');
  sidebar.id = 'adimaxSidebar';
  sidebar.innerHTML = `
    <button class="side-toggle" type="button" aria-label="Abrir ou fechar menu"><span class="side-icon">☰</span><span class="side-label">Menu</span></button>
    <button class="side-item active" type="button" data-target="agendaViewBtn"><span class="side-icon">▣</span><span class="side-label">Agenda</span></button>
    <button class="side-item" type="button" data-target="overviewViewBtn"><span class="side-icon">▥</span><span class="side-label">Visão geral</span></button>
    <button class="side-item" type="button" data-target="suppliersViewBtn"><span class="side-icon">♙</span><span class="side-label">Fornecedores</span></button>
    <div class="side-spacer"></div>`;
  document.body.appendChild(sidebar);

  sidebar.querySelector('.side-toggle').addEventListener('click',()=>{
    const open=sidebar.classList.toggle('open');
    document.body.classList.toggle('sidebar-open',open);
  });
  const items=[...sidebar.querySelectorAll('.side-item')];
  items.forEach(item=>item.addEventListener('click',()=>{
    document.getElementById(item.dataset.target)?.click();
    items.forEach(x=>x.classList.toggle('active',x===item));
    if(innerWidth<=700){sidebar.classList.remove('open');document.body.classList.remove('sidebar-open')}
  }));
})();
