// DiscoApp v3.01 build: 2026-02-21
// Albums view with infinite scroll and rail controls

(function(){
  var D = window.DiscoApp;
  var observer = null;
  var loading = false;

  function setCount(end, total){
    var el=document.getElementById('count');
    if(!el) return;
    if(total===0) el.textContent='0 of 0';
    else el.textContent=end+' of '+total;
  }

  function ensureFade(img){
    if(!img) return;
    img.className += ' img-fade';
    if(img.complete && img.naturalWidth) img.className += ' show';
    else img.onload = function(){ img.className += ' show'; };
  }

  function renderPageSlice(page, append){
    var grid=document.getElementById('grid');
    if(!grid) return;
    if(!append) grid.innerHTML='';

    var start=(page-1)*D.per;
    var end  = Math.min(start + D.per, D.filteredItems.length);
    var pageSlice=D.filteredItems.slice(start, end);

    for(var i=0;i<pageSlice.length;i++){
      var it=pageSlice[i];
      var card=document.createElement('div'); card.className='card';
      var inner=document.createElement('div'); inner.className='cardInner';
      var wrap=document.createElement('div'); wrap.className='artWrap';
      var img=document.createElement('img'); img.className='art'; img.alt=''; img.src=it.thumb||'';
      try{ img.decoding='async'; }catch(e){}
      try{ img.loading='lazy'; }catch(e){}
      ensureFade(img);
      wrap.appendChild(img);

      var meta=document.createElement('div'); meta.className='meta';
      var t=document.createElement('div'); t.className='t'; t.textContent=it.title;
      var a=document.createElement('div'); a.className='a'; a.textContent=it.artist;
      meta.appendChild(t);
      meta.appendChild(a);
      inner.appendChild(wrap);
      inner.appendChild(meta);
      card.appendChild(inner);
      (function(id){ card.addEventListener('click', function(){ D.openDetailsById(id); }); })(it.id);
      grid.appendChild(card);
    }

    setCount(end, D.filteredItems.length);
  }

  function stopObserver(){
    if(observer){ observer.disconnect(); observer=null; }
  }

  function maybeLoadNext(){
    if(loading) return;
    if(D.page >= D.pages){ stopObserver(); return; }
    loading = true;
    D.page += 1;
    renderPageSlice(D.page, true);
    loading = false;
    if(D.page >= D.pages) stopObserver();
  }

  function setupInfiniteScroll(){
    stopObserver();
    var sentinel = document.getElementById('scrollSentinel');
    if(!sentinel) return;
    observer = new IntersectionObserver(function(entries){
      if(entries[0] && entries[0].isIntersecting) maybeLoadNext();
    }, { root: document.getElementById('canvas'), rootMargin: '600px 0px 600px 0px' });
    observer.observe(sentinel);
  }

  function applyFilterAndPaginate(){
    var lc=String(D.q||'').toLowerCase();
    D.filteredItems=[];
    for(var i=0;i<D.allItems.length;i++){
      if(D.matches(D.allItems[i], D.q)) D.filteredItems.push(D.allItems[i]);
    }

    D.pages=Math.max(1, Math.ceil(D.filteredItems.length / (D.per||1)));
    D.page=1;

    renderPageSlice(1, false);
    setupInfiniteScroll();
    D.warmTrackIndexForQuery(lc);
  }
  D.applyFilterAndPaginate = applyFilterAndPaginate;
  D.render = function(){ renderPageSlice(D.page, false); };

  function bindListControls(){
    var q=document.getElementById('q');
    if(q){
      q.addEventListener('input', function(e){
        D.q=e.target.value;
        applyFilterAndPaginate();
      });
    }

    var random=document.getElementById('random');
    if(random){
      random.addEventListener('click', function(){ if(typeof D.openRandom === 'function') D.openRandom(); });
    }

    var toggle=document.getElementById('toggle');
    if(toggle){
      toggle.addEventListener('click', function(){
        if(typeof D.showAlbumsView==='function') D.showAlbumsView();
      });
    }
  }
  D.bindListControls = bindListControls;
})();
