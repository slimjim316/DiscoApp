// DiscoApp v1.09a build: 2025-11-09
// Detail view: footer Back + Random, uses global D.openRandom()

(function(){
  var D = window.DiscoApp;

  function formatFormats(arr){
    if(!arr || !arr.length) return "";
    var out=[], seen={};
    for(var i=0;i<arr.length;i++){
      var f=arr[i]||{};
      var base=""; var qty=(f.qty!=null && String(f.qty)!=="" && String(f.qty)!=="1") ? (String(f.qty)+"×") : "";
      if(f.name){ base=qty+String(f.name); if(!seen[base]){ out.push(base); seen[base]=1; } }
      if(f.descriptions && f.descriptions.length){
        for(var j=0;j<f.descriptions.length;j++){ var d=String(f.descriptions[j]); if(!seen[d]){ out.push(d); seen[d]=1; } }
      }
      if(f.text){ var t=String(f.text); if(!seen[t]){ out.push(t); seen[t]=1; } }
    }
    return out.join(", ");
  }

  function clamp(n, min, max){ return Math.max(min, Math.min(max, n)); }

  function sizeArt(){
    var head=document.getElementById('md-head-block');
    var artEl=document.getElementById('md-art');
    var info=document.getElementById('md-info');
    if(!head||!artEl||!info) return;
    var stacked = (window.getComputedStyle(head).flexDirection === 'column');
    if(stacked){
      var w = info.clientWidth || head.clientWidth || artEl.clientWidth || 320;
      w = clamp(Math.round(w * 0.6), 200, 420);
      artEl.style.width  = w + 'px';
      artEl.style.height = w + 'px';
    }else{
      artEl.style.width  = '320px';
      artEl.style.height = '320px';
    }
  }

  function moreByTitle(artist){ return 'More by '+D.escapeHtml(artist); }

  function renderMoreBy(artistName, excludeId){
    if(D.isVarious(artistName)) return;
    var targetNorm=D.normalizeArtist(artistName);
    var others=[];
    for(var i=0;i<D.allItems.length;i++){
      var it=D.allItems[i];
      if(it && !it.isVarious && it.normArtist===targetNorm && String(it.id)!==String(excludeId)){ others.push(it); }
    }
    if(!others.length) return;
    others.sort(D.cmpItems);

    var mount=document.getElementById('moreByMount'); if(!mount) return;
    mount.style.display='block';

    var h='';
    h+='<div class="more-title">'+moreByTitle(artistName)+'</div>';
    h+='<div class="mini-grid">';
    for(var j=0;j<others.length;j++){
      var it=others[j];
      var y=D.joinYearCountry(it.year, D.countryForItem(it));
      var my=(it.master_year!=null)?String(it.master_year):"-";
      h+='<div class="mini-card">';
      h+='<div class="mini-inner" data-id="'+it.id+'">';
      h+='<div class="mini-artWrap"><img class="mini-art img-fade" alt="" src="'+(it.thumb||'')+'"></div>';
      h+='<div class="mini-meta">';
      h+='<div class="mini-t">'+D.escapeHtml(it.title||'')+'</div>';
      h+='<div class="mini-s">'
        + '<span class="s-year" title="Release year and country">'+D.escapeHtml(y)+'</span>'
        + '<span class="s-mid">•</span>'
        + '<span class="s-master" title="Master release year">'+D.escapeHtml(my)+'</span>'
        + '</div>';
      h+='</div></div></div>';
    }
    h+='</div>';
    mount.innerHTML=h;

    var imgs=mount.getElementsByClassName('img-fade');
    for(var k=0;k<imgs.length;k++){
      (function(im){
        if(im.complete && im.naturalWidth){ im.className += " show"; }
        else{ im.onload=function(){ im.className += " show"; }; }
      })(imgs[k]);
    }

    var cards = mount.getElementsByClassName('mini-inner');
    for(var c=0;c<cards.length;c++){
      (function(el){
        var rid=el.getAttribute('data-id');
        el.addEventListener('click', function(){ D.openDetailsById(rid); });
      })(cards[c]);
    }
  }

  D.openDetailsById=function(id){
    D.scrollMemo = window.scrollY || document.documentElement.scrollTop || 0;
    D.fetchRelease(id, function(err, rel){
      if(err){ alert("Could not load details: " + err.message); return; }
      if(rel && rel.country){ D.RELEASE_COUNTRY[String(id)]=rel.country; }
      showDetails(rel);
      document.getElementById('listPage').style.display='none';
      document.getElementById('artistsPage').style.display='none';
      document.getElementById('detailPage').style.display='block';
      window.scrollTo(0,0);
    });
  };

  D.backToList = function(e){
    if(e) e.preventDefault();
    document.getElementById('detailPage').style.display='none';
    if(D.view === "artists"){
      document.getElementById('artistsPage').style.display='block';
    }else{
      document.getElementById('listPage').style.display='block';
    }
    window.scrollTo(0, D.scrollMemo||0);
  };

  function showDetails(release){
    var body=document.getElementById("detailBody");
    if(!body) return;
    var title = release.title || "";
    var artists = (release.artists && release.artists[0] ? release.artists[0].name : "");
    var year = D.validYear(release.year);
    var art = (release.images && release.images[0] ? release.images[0].uri : "");

    var labelName="", catno="";
    if(release.labels && release.labels[0]){
      labelName = release.labels[0].name || "";
      catno     = release.labels[0].catno || "";
    }
    var formatFull = formatFormats(release.formats);
    var country    = release.country || "";
    var rawRel     = release.released || release.released_formatted || "";
    var releasedYr = D.firstYearFromString(rawRel) || (year!=null?year:null);
    var genres = (release.genres ? release.genres.join(", ") : "");
    var styles = (release.styles ? release.styles.join(", ") : "");

    var masterYear = null;
    if(release.master_id && D.MASTER_YEAR[release.master_id]!=null){
      masterYear = D.validYear(D.MASTER_YEAR[release.master_id]);
    }

    function parseDurToSec(d){
      if(!d) return 0;
      var parts=String(d).trim().split(":").map(function(x){return parseInt(x,10)||0;});
      if(parts.length===1) return parts[0];
      if(parts.length===2) return parts[0]*60 + parts[1];
      if(parts.length>=3)  return parts[0]*3600 + parts[1]*60 + parts[2];
      return 0;
    }
    var trackCount=0,totalSec=0;
    if(release.tracklist && release.tracklist.length){
      for(var i=0;i<release.tracklist.length;i++){
        var t=release.tracklist[i];
        if(t && t.title) trackCount++;
        if(t && t.duration) totalSec += parseDurToSec(t.duration);
      }
    }
    var totalMinutes=Math.round(totalSec/60);

    var pCopyright="";
    if(release.companies && release.companies.length){
      for(var c=0;c<release.companies.length;c++){
        var co=release.companies[c];
        var type=(co.entity_type_name || co.entity_type || "").toLowerCase();
        if(type.indexOf("phonographic")!==-1){
          var name=co.name||"";
          var yr=releasedYr ? releasedYr : (year||"");
          pCopyright="℗ " + (yr ? (yr+" ") : "") + name;
          break;
        }
      }
    }
    if(!pCopyright && release.copyright){ pCopyright = "℗ " + release.copyright; }

    var h='';
    h+='<div class="md-head" id="md-head-block">';
    h+='  <div class="md-art" id="md-art"><img id="md-art-img" alt="" class="img-fade" src="'+(art||'')+'"></div>';
    h+='  <div class="md-info" id="md-info">';
    h+='    <div class="md-title" id="md-album-title">'+D.escapeHtml(title)+'</div>';
    if(artists) h+='    <div class="md-artist" id="md-artist">'+D.escapeHtml(artists)+'</div>';
    h+='    <div class="md-lines">';
    var lineLabel=(labelName||catno)?(D.escapeHtml(labelName)+(catno?(" – "+D.escapeHtml(catno)):"")):"-";
    h+='      <div class="line"><span class="muted">Label</span> '+(lineLabel||"-")+'</div>';
    h+='      <div class="line"><span class="muted">Format</span> '+D.escapeHtml(formatFull||"")+'</div>';
    h+='      <div class="line"><span class="muted">Country</span> '+(country||"-")+'</div>';
    h+='      <div class="line"><span class="muted">Released</span> '+(releasedYr!=null?releasedYr:"-")+'</div>';
    h+='      <div class="line"><span class="muted">Genre</span> '+(genres||"-")+'</div>';
    h+='      <div class="line"><span class="muted">Style</span> '+(styles||"-")+'</div>';
    h+='    </div>';
    h+='  </div>';
    h+='</div>';

    if(release.tracklist && release.tracklist.length){
      h+='<ul class="tracks">';
      for(var i2=0;i2<release.tracklist.length;i2++){
        var tt=release.tracklist[i2]||{};
        var nm=tt.title||"";
        var pos=tt.position || (i2+1);
        var dur=tt.duration||"";
        h+='<li class="tr">';
        h+=' <div class="no">'+D.escapeHtml(String(pos))+'</div>';
        h+=' <div class="twrap"><div class="name">'+D.escapeHtml(nm)+'</div></div>';
        h+=' <div class="dur">'+D.escapeHtml(dur)+'</div>';
        h+='</li>';
      }
      h+='</ul>';
    }

    h+='<div class="detail-foot"><span class="muted">Master release</span>: '
      + (masterYear!=null ? '<span class="s-master" title="Master release year">'+D.escapeHtml(String(masterYear))+'</span>' : '-') + '</div>';

    var songsLine=(trackCount ? (trackCount+' song'+(trackCount>1?'s':'')+(totalMinutes? (', '+totalMinutes+' minutes') : '')) : "-");
    h+='<div class="detail-foot">'+songsLine+'</div>';
    if(pCopyright){ h+='<div class="detail-foot">'+D.escapeHtml(pCopyright)+'</div>'; }
    if(release.uri){ h+='<a class="deep-link" target="_blank" rel="noopener" href="'+release.uri+'">Open in Discogs ↗</a>'; }

    h+='<div id="moreByMount" class="more-wrap" style="display:none;"></div>';

    body.innerHTML=h;

    var imgEl=document.getElementById('md-art-img');
    if(imgEl){
      if(imgEl.complete && imgEl.naturalWidth){ imgEl.className += " show"; }
      else{ imgEl.onload=function(){ imgEl.className += " show"; }; }
    }

    function deferSize(){ sizeArt(); }
    if(window.requestAnimationFrame){ requestAnimationFrame(deferSize); } else { setTimeout(sizeArt,0); }
    setTimeout(sizeArt,50); setTimeout(sizeArt,250);
    window.addEventListener('resize', sizeArt);

    renderMoreBy(artists, release.id);
  }
  D.showDetails = showDetails;
})();
