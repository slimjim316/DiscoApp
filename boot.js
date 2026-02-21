// DiscoApp v3.01 build: 2026-02-21
// Init, theme control, view switching, and unified Random behaviour

(function(){
  var D = window.DiscoApp;
  var THEME_KEY = 'disco.theme';

  function applyTheme(mode){
    var html = document.documentElement;
    var valid = { light:1, dark:1, system:1 };
    var next = valid[mode] ? mode : 'system';
    html.setAttribute('data-theme', next);
    try{ localStorage.setItem(THEME_KEY, next); }catch(e){}
    var themeMode = document.getElementById('themeMode');
    if(themeMode) themeMode.value = next;
  }

  function initTheme(){
    var stored = 'system';
    try{ stored = localStorage.getItem(THEME_KEY) || 'system'; }catch(e){}
    applyTheme(stored);
    var themeMode = document.getElementById('themeMode');
    if(themeMode){
      themeMode.addEventListener('change', function(e){ applyTheme(e.target.value); });
    }
  }

  function openRandom(){
    var pool = D.allItems || [];
    if(!pool.length){
      alert('Collection not loaded yet.');
      return;
    }
    var idx = Math.floor(Math.random() * pool.length);
    D.openDetailsById(pool[idx].id);
  }
  D.openRandom = openRandom;

  function updateRailState(){
    var albums = document.getElementById('toggle');
    var artists = document.getElementById('toggleArtists');
    if(albums) albums.classList.toggle('active', D.view === 'albums');
    if(artists) artists.classList.toggle('active', D.view === 'artists');
  }

  D.showAlbumsView = function(){
    D.setView('albums');
    var listPage = document.getElementById('listPage');
    var artistsPage = document.getElementById('artistsPage');
    if(listPage) listPage.style.display = 'block';
    if(artistsPage) artistsPage.style.display = 'none';
    if(typeof D.closeDetailsDrawer === 'function') D.closeDetailsDrawer();

    updateRailState();

    if(typeof D.applyFilterAndPaginate === 'function'){
      D.applyFilterAndPaginate();
    }
  };

  D.showArtistsView = function(){
    D.setView('artists');
    var listPage = document.getElementById('listPage');
    var artistsPage = document.getElementById('artistsPage');
    if(listPage) listPage.style.display = 'none';
    if(artistsPage) artistsPage.style.display = 'block';
    if(typeof D.closeDetailsDrawer === 'function') D.closeDetailsDrawer();

    updateRailState();

    if(typeof D.renderArtistsView === 'function'){
      D.renderArtistsView();
    }
  };

  function boot(){
    initTheme();

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
      if(typeof D.buildArtistIndex === 'function'){
        D.buildArtistIndex();
      }

      if(D.view === 'artists' && typeof D.showArtistsView === 'function'){
        D.showArtistsView();
      }else if(typeof D.applyFilterAndPaginate === 'function'){
        D.applyFilterAndPaginate();
      }
    });
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
