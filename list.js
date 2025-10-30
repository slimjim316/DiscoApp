// DiscoApp v1.08c — list.js
// - Keeps "grid" / "list" internal view values
// - Replaces "list" branch with Artists view
(function(){
  var D = window.DiscoApp;

  function setCount(start, end, total){
    var el=document.getElementById("count");
    if(!el) return;
    if(total===0){ el.textContent="0 of 0"; }
    else{ el.textContent=(start+1)+"-"+end+" of "+total; }
  }

  function ensureFade(img){
    try{ img.addEventListener('load', function(){ img.style.opacity='1'; }); }catch(e){}
  }

  function makeMetaLine(it){
    var y = it.master_year || it.year || '-';
    var c = it.country ? (' • ' + D.escapeHtml(it.country)) : '';
    return y + c;
  }

  // ===== Albums (grid) – unchanged from your 1.07 renderer =====
  function renderGrid(pageSlice){
    var grid=document.getElementById("grid"); if(!grid) return;
    grid.innerHTML="";
    for(var i=0;i<pageSlice.length;i++){
      var it=pageSlice[i];
      var card=document.createElement("div"); card.className="card";
      var inner=document.createElement("div"); inner.className="cardInner";
      var wrap=document.createElement("div"); wrap.className="artWrap";
      var img=document.createElement("img"); img.className="art"; img.alt=""; img.src=it.thumb||"";
      try{ img.decoding='async'; }catch(e){}
      try{ img.loading='lazy'; }catch(e){}
      ensureFade(img);
      wrap.appendChild(img);

      var meta=document.createElement("div"); meta.className="meta";
      var t=document.createElement("div"); t.className="t"; t.textContent=it.title;
      var a=document.createElement("div"); a.className="a"; a.textContent=it.artist;
      var s=document.createElement("div"); s.className="s"; s.textContent = makeMetaLine(it);

      meta.appendChild(t); meta.appendChild(a); meta.appendChild(s);
      inner.appendChild(wrap); inner.appendChild(meta);
      card.appendChild(inner);

      (function(id){ card.addEventListener("click", function(){ D.openDetailsById(id); }); })(it.id);
      grid.appendChild(card);
    }
  }

  // ===== Artists view (NEW) =====
  function renderArtistsPane(){
    var pane=document.getElementById("artistsPane"),
        side=document.getElementById("artistsSide"),
        body=document.getElementById("artistsBody");
    if(!pane || !side || !body) return;

    // filter artists by the global search box (name only)
    var qEl=document.getElementById("q"), q=(qEl && qEl.value||"").toLowerCase();
    var list=D.ARTISTS.slice(0);
    if(q){ list = list.filter(function(a){ return a.name.toLowerCase().indexOf(q)>=0; }); }

    // left list
    var html=[], i, a, active;
    for(i=0;i<list.length;i++){
      a=list[i]; active=(D.artistSelected===a.norm) ? " is-active" : "";
      html.push(
        '<div class="artists-item'+active+'" data-norm="'+D.escapeHtml(a.norm)+'">' +
          (a.thumb?'<img class="ava" src="'+D.escapeHtml(a.thumb)+'" alt="">':'<div class="ava"></div>') +
          '<span class="name">'+D.escapeHtml(a.name)+'</span>' +
          '<span class="count">'+a.count+'</span>' +
        '</div>'
      );
    }
    side.innerHTML=html.join('');
    side.scrollTop = D.artistScroll || 0;

    // right panel
    renderArtistAlbums(D.artistSelected);

    // click handlers (delegate)
    side.onclick=function(e){
      var el=e.target;
      while(el && !/artists-item/.test(el.className)) el=el.parentNode;
      if(!el) return;
      D.artistScroll = side.scrollTop;
      D.artistSelected = el.getAttribute('data-norm');
      renderArtistsPane();
    };
  }

  function renderArtistAlbums(norm){
    var body=document.getElementById("artistsBody");
    if(!body) return;

    if(!norm){
      body.innerHTML = '<p class="hint">Choose an artist to view albums</p>';
      return;
    }

    var a = D.ARTISTS[D.ARTIST_MAP[norm]];
    var albums = D.getArtistAlbums(norm);
    var html = [];
    var mobile = (window.innerWidth < 820);

    if(mobile){
      html.push('<div class="back-mobile" id="artistBackBtn">← All Artists</div>');
    }

    html.push('<h2 class="artist-title">'+D.escapeHtml(a.name)+'</h2>');
    html.push('<div class="grid smallgrid">');

    for(var i=0;i<albums.length;i++){
      var it=albums[i];
      var img = it.thumb ? '<img class="art" src="'+D.escapeHtml(it.thumb)+'" alt="">' : '';
      html.push(
        '<div class="card" data-id="'+it.id+'">' +
          '<div class="cardInner">' +
            '<div class="artWrap">'+ img +'</div>' +
            '<div class="meta">' +
              '<div class="t">'+D.escapeHtml(it.title)+'</div>' +
              '<div class="s">'+ makeMetaLine(it) +'</div>' + /* artist line omitted */
            '</div>' +
          '</div>' +
        '</div>'
      );
    }
    html.push('</div>');
    body.innerHTML = html.join('');

    var ab=document.getElementById('artistBackBtn');
    if(ab){ ab.onclick=function(){ D.artistSelected=null; renderArtistsPane(); window.scrollTo(0,0); }; }

    // open detail
    body.onclick=function(e){
      var el=e.target; while(el && !/card/.test(el.className)) el=el.parentNode;
      if(!el) return;
      D.openDetailsById(el.getAttribute('data-id'));
    };
  }

  // ===== Shared apply + render entry point =====
  function applyFilterAndPaginate(){
    // filter by search (albums view only)
    var q=document.getElementById("q"); var needle=q && q.value ? q.value.toLowerCase() : "";
    if(D.view==="grid"){
      D.filteredItems = needle ? D.allItems.filter(function(it){
        return (it.title && it.title.toLowerCase().indexOf(needle)>=0) ||
               (it.artist && it.artist.toLowerCase().indexOf(needle)>=0);
      }) : D.allItems.slice(0);
    }else{
      // Artists view filters inside renderArtistsPane()
      D.filteredItems = D.allItems.slice(0);
    }

    D.total = D.filteredItems.length;
    D.pages = Math.max(1, Math.ceil(D.total / D.per));
    if(D.page < 1) D.page=1;
    if(D.page > D.pages) D.page=D.pages;

    var start=(D.page-1)*D.per;
    var end  = Math.min(start + D.per, D.filteredItems.length);
    setCount(D.total?start:0, D.total?end:0, D.total);

    render();
  }
  D.applyFilterAndPaginate = applyFilterAndPaginate;

  function render(){
    var grid=document.getElementById("grid");
    var pane=document.getElementById("artistsPane");
    var listEl=document.getElementById("list"); // legacy element, now unused

    // button label shows the *other* view
    var toggle=document.getElementById("toggle");
    if(toggle){ toggle.textContent = (D.view==="grid") ? "Artists" : "Albums"; }

    // hide/show pager in CSS for artists; but keep legacy visibility too
    var pagerPrev=document.getElementById("prev");
    var pagerNext=document.getElementById("next");
    if(pagerPrev) pagerPrev.style.display = (D.view==="grid") ? "" : "none";
    if(pagerNext) pagerNext.style.display = (D.view==="grid") ? "" : "none";

    if(D.view==="grid"){
      if(listEl) listEl.style.display="none";
      if(pane) pane.style.display="none";
      if(grid) grid.style.display="flex";

      var start=(D.page-1)*D.per;
      var end  = Math.min(start + D.per, D.filteredItems.length);
      renderGrid(D.filteredItems.slice(start, end));
    }else{
      if(grid) grid.style.display="none";
      if(listEl) listEl.style.display="none";
      if(pane) pane.style.display="flex";
      renderArtistsPane();
    }
  }
  D.render = render;

  // Controls
  function bindListControls(){
    var q=document.getElementById("q");
    if(q){ q.addEventListener("input", function(){ D.page=1; applyFilterAndPaginate(); }); }

    var prev=document.getElementById("prev");
    if(prev){ prev.addEventListener("click", function(){ if(D.view!=="grid")return; if(D.page>1){ D.page--; applyFilterAndPaginate(); } }); }

    var next=document.getElementById("next");
    if(next){ next.addEventListener("click", function(){ if(D.view!=="grid")return; if(D.page<D.pages){ D.page++; applyFilterAndPaginate(); } }); }

    var random=document.getElementById("random");
    if(random){ random.addEventListener("click", D.openRandom); }

    var toggle=document.getElementById("toggle");
    if(toggle){
      toggle.addEventListener("click", function(){
        D.view = (D.view==="grid") ? "list" : "grid";
        try{ localStorage.setItem(D.VIEW_KEY, D.view); }catch(e){}
        render();
      });
    }

    var pageSize=document.getElementById("pageSize");
    if(pageSize){
      pageSize.value = String(D.per);
      pageSize.addEventListener("change", function(e){
        var v=parseInt(e.target.value,10);
        D.per = (!isNaN(v) && [25,50,100,250].indexOf(v)!==-1) ? v : 100;
        try{ localStorage.setItem(D.PER_KEY, String(D.per)); }catch(e){}
        D.page=1; applyFilterAndPaginate();
      });
    }
  }
  D.bindListControls = bindListControls;

})();
