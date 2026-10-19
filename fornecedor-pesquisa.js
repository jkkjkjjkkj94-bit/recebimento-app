(() => {
  function initSupplierSearch(){
    const select=document.getElementById('supplier');
    if(!select || document.getElementById('supplierSearch')) return;

    const wrap=document.createElement('div');
    wrap.style.position='relative';
    const input=document.createElement('input');
    input.id='supplierSearch';
    input.type='search';
    input.autocomplete='off';
    input.placeholder='Pesquisar fornecedor...';
    input.setAttribute('aria-label','Pesquisar fornecedor');
    input.style.marginBottom='7px';
    select.parentNode.insertBefore(wrap,select);
    wrap.appendChild(input);
    wrap.appendChild(select);

    let all=[];
    const readOptions=()=>[...select.options].map(o=>({value:o.value,text:o.textContent}));
    const sync=()=>{const opts=readOptions();if(opts.length>1)all=opts};
    const rebuild=(items,current='')=>{
      select.innerHTML='';
      items.forEach(o=>{const option=document.createElement('option');option.value=o.value;option.textContent=o.text;select.appendChild(option)});
      if([...select.options].some(o=>o.value===current))select.value=current;else select.value='';
    };
    const filter=()=>{
      sync();
      const current=select.value;
      const q=input.value.trim().toLocaleLowerCase('pt-BR');
      const base=all.length?all:readOptions();
      const filtered=base.filter((o,i)=>i===0||!q||o.text.toLocaleLowerCase('pt-BR').includes(q));
      rebuild(filtered,current);
      select.size=q?Math.min(Math.max(filtered.length,2),7):1;
    };

    input.addEventListener('input',filter);
    input.addEventListener('focus',()=>{sync();filter()});
    input.addEventListener('keydown',e=>{
      if(e.key==='ArrowDown'){e.preventDefault();select.focus();if(select.options.length>1)select.selectedIndex=1}
      if(e.key==='Enter'){
        const options=[...select.options].filter(o=>o.value);
        if(options.length===1){e.preventDefault();select.value=options[0].value;input.value=options[0].textContent;select.size=1;select.dispatchEvent(new Event('change',{bubbles:true}))}
      }
    });
    select.addEventListener('change',()=>{
      const option=select.options[select.selectedIndex];
      if(select.value&&option)input.value=option.textContent;
      select.size=1;
    });
    select.addEventListener('blur',()=>{select.size=1});

    const observer=new MutationObserver(()=>{if(document.activeElement!==input&&document.activeElement!==select)sync()});
    observer.observe(select,{childList:true});
    sync();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initSupplierSearch);else initSupplierSearch();
})();
