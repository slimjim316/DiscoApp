// boot.js — v1.08c
(function(){
  var D=window.D;

  function initApp(data){
    D.init(data.releases||[]);
    D.renderLibrary();
  }

  // simulate boot (your existing Discogs fetch logic remains)
  document.addEventListener('DOMContentLoaded',function(){
    // Example: data loaded externally
    if(window._discogsData){initApp(window._discogsData);}
  });

  // re-render on search
  var s=document.getElementById('searchBox');
  if(s){s.addEventListener('input',function(){D.renderLibrary();});}

  // toggle view button
  var t=document.getElementById('viewToggle');
  if(t){t.addEventListener('click',D.toggleView);}
})();
