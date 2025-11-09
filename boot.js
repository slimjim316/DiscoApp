// DiscoApp v1.09a build: 2025-11-09
// Init, view switching, and unified Random behaviour

(function(){
  var D = window.DiscoApp;

  function openRandom(){
    var pool = D.allItems || [];
    if(!pool.length){
      alert("Collection not loaded yet.");
      return;
    }
    var idx = Math.floor(Math.random() * pool.length);
    D.openDetailsById(pool[idx].id);
  }
  D.openRandom = openRandom;

  /* ===== View Switching ===== */

  D.showAlbumsView = function(){
    D.setView("albums");
    var listPage = document.getElementById("listPage");
    var artistsPage = document.getElementById("artistsPage");
    var detailPage = document.getElementById("detailPage");
    if(listPage) listPage.style.display = "block";
    if(artistsPage) artistsPage.style.display = "none";
    if(detailPage) detailPage.style.display = "none";

    if(typeof D.applyFilterAndPaginate === "function"){
      D.applyFilterAndPaginate();
    }
  };

  D.showArtistsView = function(){
    D.setView("artists");
    var listPage = document.getElementById("listPage");
    var artistsPage = document.getElementById("artistsPage");
    var detailPage = document.getElementById("detailPage");
    if(listPage) listPage.style.display = "none";
    if(artistsPage) artistsPage.style.display = "block";
    if(detailPage) detailPage.style.display = "none";

    if(typeof D.renderArtistsView === "function"){
      D.renderArtistsView();
    }
  };

  D.backToList = function(e){
    if(e) e.preventDefault();
    var detailPage = document.getElementById("detailPage");
    var listPage = document.getElementById("listPage");
    var artistsPage = document.getElementById("artistsPage");
    if(detailPage) detailPage.style.display = "none";
    if(D.view === "albums" && listPage){
      listPage.style.display = "block";
      window.scrollTo(0, D.scrollMemo||0);
    }else if(D.view === "artists" && artistsPage){
      artistsPage.style.display = "block";
      window.scrollTo(0, 0);
    }
  };

  function boot(){
    var pageSize=document.getElementById('pageSize');
    if(pageSize){ pageSize.value=String(D.per); }

    if(D.bindListControls) D.bindListControls();
    if(D.bindArtistsControls) D.bindArtistsControls();

    var back=document.getElementById('backBtn');
    if(back){ back.addEventListener('click', D.backToList); }

    var detailRandom=document.getElementById('detailRandom');
    if(detailRandom){
      detailRandom.addEventListener('click', function(e){
        if(e && e.preventDefault) e.preventDefault();
        openRandom();
      });
    }

    D.fetchAllItems(function(){
      if(typeof D.buildArtistIndex === "function"){
        D.buildArtistIndex();
      }

      if(D.view === "artists" && typeof D.showArtistsView === "function"){
        D.showArtistsView();
      }else{
        if(typeof D.applyFilterAndPaginate === "function"){
          D.applyFilterAndPaginate();
        }
      }
    });
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', boot);
  }else{
    boot();
  }
})();
