(() => {
  function initSupplierSearch(){
    const select=document.getElementById('supplier');
    if(!select || document.getElementById('supplierSearch')) return;

    const input=document.createElement('input');
    input.id='supplierSearch';
    input.type='search';
    input.autocomplete='off';
    input.placeholder='Pesquisar fornecedor...';
    input.setAttribute('aria-label','Pesquisar fornecedor');
    input.style.marginBottom='7px';
    select.parentNode.insertBefore(input,select);

    let all=[];
    const sync=()=>{
      all=[...select.options].map(o=>({value:o.value,text:o.textContent}));
    };
    const filter=()=>{
      const current=select.value;
      const q=input.value.trim().toLocaleLowerCase('pt-BR');
      if(!all.length) sync();
      const filtered=all.filter((o,i)=>i===0 || !q || o.text.toLocaleLowerCase('pt-BR').includes(q));
      select.innerHTML='';
      filtered.forEach(o=>{
        const option=document.createElement('option');
        option.value=o.value; option.textContent=o.text;
        select.appendChild(option);
      });
      if([...select.options].some(o=>o.value===current)) select.value=current;
      else select.value='';
    };

    input.addEventListener('focus',sync);
    input.addEventListener('input',filter);
    select.addEventListener('change',()=>{
      const option=select.options[select.selectedIndex];
      if(select.value && option) input.value=option.textContent;
    });

    const observer=new MutationObserver(()=>{
      if(document.activeElement!==input){sync();return;}
      const q=input.value;
      sync(); input.value=q;
    });
    observer.observe(select,{childList:true});
    sync();
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',initSupplierSearch);
  else initSupplierSearch();
})();
