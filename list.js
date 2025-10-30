// list.js — v1.08c Artists View full renderer

(function(){
  var D=window.D;
  var grid=document.getElementById('grid'),
      artistsPane=document.getElementById('artistsPane'),
      side=document.getElementById('artistsSide'),
      body=document.getElementById('artistsBody'),
      toggle=document.getElementById('viewToggle'),
      search=document.getElementById('searchBox');

  D.toggleView=function(){
    D.view=(D.view==='albums')?'artists':'albums';
    D.saveView();
    D.renderLibrary();
  };

  D.renderLibrary=function(){
    if(!D.ready)return;
    toggle.textContent=(D.view==='albums')?'Artists':'Albums';
    if(D.view==='albums'){grid.style.display='';artistsPane.style.display='none';D.renderAlbums();}
    else{grid.style.display='none';artistsPane.style.display='';D.renderArtists();}
  };

  D.renderAlbums=function(){
    var html=[],items=D.allItems;
    for(var i=0;i<items.length;i++) html.push(D.renderCard(items[i]));
    grid.innerHTML=html.join('');
  };

  D.renderCard=function(it){
    var t=D.escape(it.title),a=D.escape(it.artist),
        y=it.master_year||it.year||'-',c=it.country||'',
        img=it.thumb?'<img src="'+D.escape(it.thumb)+'">':'<div class="noimg"></div>';
    return '<div class="card" data-id="'+it.id+'"><div class="thumb">'+img+'</div><div class="meta"><div class="title">'+t+'</div><div class="artist">'+a+'</div><div class="sub">'+y+(c?' • '+c:'')+'</div></div></div>';
  };

  D.renderArtists=function(){
    var q=(search&&search.value||'').toLowerCase(),list=D.ARTISTS.slice(0);
    if(q){list=list.filter(function(a){return a.name.toLowerCase().indexOf(q)>=0;});}
    var html=[];
    for(var i=0;i<list.length;i++){
      var a=list[i],act=(D.artistSelected===a.norm)?' is-active':'',
          img=a.thumb?'<img class="ava" src="'+D.escape(a.thumb)+'">':'<div class="ava noimg"></div>';
      html.push('<div class="artists-item'+act+'" data-norm="'+D.escape(a.norm)+'">'+img+'<span class="name">'+D.escape(a.name)+'</span><span class="count">'+a.count+'</span></div>');
    }
    side.innerHTML=html.join('');
    side.scrollTop=D.artistScroll||0;
    D.renderArtistAlbums(D.artistSelected);
  };

  D.renderArtistAlbums=function(norm){
    if(!norm){body.innerHTML='<p class="hint">Choose an artist to view albums</p>';return;}
    var a=D.ARTISTS[D.ARTIST_MAP[norm]];
    var albums=D.getArtistAlbums(norm),html=[];
    var mobile=isMobile();
    if(mobile) html.push('<div class="back-mobile" id="artistBackBtn">← All Artists</div>');
    html.push('<h2 class="artist-title">'+D.escape(a.name)+'</h2><div class="grid smallgrid">');
    for(var i=0;i<albums.length;i++){
      var it=albums[i],t=D.escape(it.title),y=it.master_year||it.year||'-',c=it.country||'',
          img=it.thumb?'<img src="'+D.escape(it.thumb)+'">':'<div class="noimg"></div>';
      html.push('<div class="card" data-id="'+it.id+'"><div class="thumb">'+img+'</div><div class="meta"><div class="title">'+t+'</div><div class="sub">'+y+(c?' • '+c:'')+'</div></div></div>');
    }
    html.push('</div>');
    body.innerHTML=html.join('');
    if(mobile){document.getElementById('artistBackBtn').onclick=function(){D.artistSelected=null;D.renderArtists();window.scrollTo(0,0);};}
  };

  side.addEventListener('click',function(e){
    var el=e.target;while(el&&!el.classList.contains('artists-item'))el=el.parentNode;
    if(!el)return;
    D.artistScroll=side.scrollTop;
    D.artistSelected=el.getAttribute('data-norm');
    D.renderArtists();
  });

  grid.addEventListener('click',cardClick);
  body.addEventListener('click',cardClick);

  function cardClick(e){
    var el=e.target;while(el&&!el.classList.contains('card'))el=el.parentNode;
    if(!el)return;
    D.openDetail&&D.openDetail(el.getAttribute('data-id'));
  }

  D.escape=function(s){if(!s)return'';return String(s).replace(/[&<>"']/g,function(m){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m];});};
  function isMobile(){return window.innerWidth<820;}
})();
