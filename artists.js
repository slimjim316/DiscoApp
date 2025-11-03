// DiscoApp v1.09 — artists.js (Artists view)
// - Sidebar list of artists (flat, sorted by normalized name)
// - Right-hand / stacked grid of albums for selected artist
// - Remembers selected artist in localStorage (D.selectedArtist)
// - Mobile: stacked view with Back button to artist list

(function(){
  var D = window.DiscoApp;

  var artistIndex = null;

  function ensureArtistIndex(){
    if(!artistIndex){
      artistIndex = D.buildArtistIndex() || [];
    }
    return artistIndex;
  }

  function getArtistByNorm(norm){
    var list = ensureArtistIndex();
    for(var i=0;i<list.length;i++){
      if(list[i].norm === norm) return list[i];
    }
    return null;
  }

  function ensureSelectedArtist(){
    var list = ensureArtistIndex();
    if(!list.length){
      D.setSelectedArtist("");
      return null;
    }
    var currentNorm = D.selectedArtist || "";
    var current = currentNorm ? getArtistByNorm(currentNorm) : null;
    if(!current){
      current = list[0];
      D.setSelectedArtist(current.norm);
    }
    return current;
  }

  function ensureFade(img){
    if(!img) return;
    img.className += " img-fade";
    if(img.complete && img.naturalWidth){ img.className += " show"; }
    else { img.onload = function(){ img.className += " show"; }; }
  }

  function makeMetaLine(it){
    var yearStr = D.joinYearCountry(it.year, D.countryForItem(it));
    var masterStr = (it.master_year!=null) ? String(it.master_year) : "-";
    return (
      '<span class="s-year" title="Release year and country">'+D.escapeHtml(yearStr)+'</span>' +
      '<span class="s-mid">•</span>' +
      '<span class="s-master" title="Master release year">'+D.escapeHtml(masterStr)+'</span>'
    );
  }

  function renderArtistSidebar(){
    var sidebar = document.getElementById("artistSidebar");
    if(!sidebar) return;

    var list = ensureArtistIndex();
    var selectedNorm = D.selectedArtist || "";
    var h = "";

    for(var i=0;i<list.length;i++){
      var a = list[i];
      var cls = "artist-item";
      if(a.norm === selectedNorm) cls += " active";
      h += '<div class="'+cls+'" data-norm="'+D.escapeHtml(a.norm)+'">';
      h += '<span class="artist-name">'+D.escapeHtml(a.name)+'</span>';
      if(a.count>1){
        h += ' <span class="artist-count">('+a.count+')</span>';
      }
      h += '</div>';
    }

    sidebar.innerHTML = h;

    // attach click handlers
    var items = sidebar.getElementsByClassName("artist-item");
    for(var j=0;j<items.length;j++){
      (function(el){
        el.addEventListener("click", function(){
          var norm = el.getAttribute("data-norm") || "";
          D.setSelectedArtist(norm);
          renderArtistSidebar();
          renderArtistGrid();
          updateArtistsLayout();
        });
      })(items[j]);
    }
  }

  function renderArtistGrid(){
    var main = document.getElementById("artistMain");
    var headingEl = document.getElementById("artistHeading");
    var grid = document.getElementById("artistGrid");
    if(!main || !headingEl || !grid) return;

    var current = ensureSelectedArtist();
    grid.innerHTML = "";
    if(!current){
      headingEl.textContent = "No artists in collection";
      return;
    }

    var items = current.items || [];
    headingEl.textContent = current.name + " · " + items.length + (items.length===1 ? " release" : " releases");

    for(var i=0;i<items.length;i++){
      var it=items[i];
      var card=document.createElement("div"); card.className="card";
      var inner=document.createElement("div"); inner.className="cardInner";
      var wrap=document.createElement("div"); wrap.className="artWrap";
      var img=document.createElement("img"); img.className="art"; img.alt=""; img.src=it.thumb||"";
      try{ img.decoding='async'; }catch(e){}
      try{ img.loading='lazy'; }catch(e){}
      ensureFade(img);
      wrap.appendChild(img);

      var meta=document.createElement("div"); meta.className="meta";

      // Album title only (artist line omitted)
      var t=document.createElement("div"); t.className="t"; t.textContent=it.title;

      // Year / Country / Master Year
      var s=document.createElement("div"); s.className="s";
      s.innerHTML = makeMetaLine(it);

      meta.appendChild(t);
      meta.appendChild(s);
      inner.appendChild(wrap);
      inner.appendChild(meta);
      card.appendChild(inner);
      (function(id){ card.addEventListener("click", function(){ D.openDetailsById(id); }); })(it.id);
      grid.appendChild(card);
    }
  }

  function isStackedLayout(){
    return window.innerWidth <= 680;
  }

  function updateArtistsLayout(){
    var sidebar = document.getElementById("artistSidebar");
    var main = document.getElementById("artistMain");
    var back = document.getElementById("artistBack");
    if(!sidebar || !main || !back) return;

    var stacked = isStackedLayout();
    if(!stacked){
      sidebar.style.display = "block";
      main.style.display = "block";
      back.style.display = "none";
      return;
    }

    // stacked layout
    if(D.selectedArtist){
      sidebar.style.display = "none";
      main.style.display = "block";
      back.style.display = "inline-block";
    }else{
      sidebar.style.display = "block";
      main.style.display = "none";
      back.style.display = "none";
    }
  }

  function openRandomFromArtistOrAll(){
    var list = ensureArtistIndex();
    var pool = [];
    var current = D.selectedArtist ? getArtistByNorm(D.selectedArtist) : null;
    if(current && current.items && current.items.length){
      pool = current.items;
    }else{
      pool = D.allItems || [];
    }
    if(!pool.length){
      alert("Collection not loaded yet.");
      return;
    }
    var idx = Math.floor(Math.random()*pool.length);
    D.openDetailsById(pool[idx].id);
  }

  function bindArtistsControls(){
    var back = document.getElementById("artistBack");
    if(back){
      back.addEventListener("click", function(e){
        if(e && e.preventDefault) e.preventDefault();
        // clear selection and show list in stacked mode
        D.setSelectedArtist("");
        renderArtistSidebar();
        renderArtistGrid();
        updateArtistsLayout();
      });
    }

    var randomBtn = document.getElementById("randomArtists");
    if(randomBtn){
      randomBtn.addEventListener("click", function(){
        openRandomFromArtistOrAll();
      });
    }

    var headerRandom = document.getElementById("headerRandomArtists");
    if(headerRandom){
      headerRandom.addEventListener("click", function(e){
        if(e && e.preventDefault) e.preventDefault();
        openRandomFromArtistOrAll();
      });
    }

    var toggleArtists = document.getElementById("toggleArtists");
    if(toggleArtists){
      toggleArtists.addEventListener("click", function(){
        if(typeof D.showAlbumsView === "function"){
          D.showAlbumsView();
        }
      });
    }

    window.addEventListener("resize", function(){
      if(D.view === "artists"){
        updateArtistsLayout();
      }
    });
  }
  D.bindArtistsControls = bindArtistsControls;

  function renderArtistsView(){
    renderArtistSidebar();
    renderArtistGrid();
    updateArtistsLayout();

    // sync toolbar toggle text
    var toggle = document.getElementById("toggleArtists");
    if(toggle){
      toggle.textContent = "Albums";
    }
  }
  D.renderArtistsView = renderArtistsView;

})();