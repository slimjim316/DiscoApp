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
    if(toggle){
      // Set initial label correctly
      toggle.textContent = (D.view==="grid") ? "Artists" : "Albums";
    }

    var back=document.getElementById('backBtn'); if(back){ back.addEventListener('click', D.backToList); }
    var random=document.getElementById('random'); if(random){ random.addEventListener('click', openRandom); }

    D.fetchAllItems(function(){
      // when allItems is ready:
      if(typeof D.buildArtistIndex === 'function') D.buildArtistIndex();
      D.applyFilterAndPaginate();
    });
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded', boot);
  }else{
    boot();
  }
})();
