(function(){
  var D=window.DiscoApp;

  function openRandom(){
    var pool = D.filteredItems.length ? D.filteredItems : D.allItems;
    if(!pool.length){ alert("Collection not loaded yet."); return; }
    var idx=Math.floor(Math.random()*pool.length);
    D.openDetailsById(pool[idx].id);
  }
  D.openRandom = openRandom;

  function boot(){
    var pageSize=document.getElementById('pageSize');
    if(pageSize){ pageSize.value=String(D.per); }

    var toggle=document.getElementById('toggle');
    if(toggle){ toggle.textContent=(D.view==='grid')?'List View':'Grid View'; }

    D.bindListControls();

    var back=document.getElementById('backBtn'); if(back){ back.addEventListener('click', D.backToList); }
    var hr=document.getElementById('headerRandom'); if(hr){ hr.addEventListener('click', function(e){ e.preventDefault(); openRandom(); }); }

    D.fetchAllItems(function(){
      D.applyFilterAndPaginate();
    });
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded', boot);
  }else{
    boot();
  }
})();