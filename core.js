(function(){
  if (!window.DiscoApp) window.DiscoApp = {};
  var D = window.DiscoApp;

  D.API  = "https://disco.slimjim316.workers.dev";
  D.USER = "slimjim316";

  D.page=1; D.per=100; D.folder=0; D.total=0; D.pages=1; D.q=""; D.view="grid";
  D.allItems = []; D.filteredItems = [];
  D.scrollMemo = 0;

  D.PER_KEY     = 'discoapp_per_page';
  D.COUNTRY_KEY = 'discoapp_country';
  D.TRACKS_KEY  = 'discoapp_tracks';
  D.VIEW_KEY    = 'discoapp_view';

  try {
    var savedPer = parseInt(localStorage.getItem(D.PER_KEY)||'100',10);
    if([25,50,100,250].indexOf(savedPer)===-1) savedPer = 100;
    D.per = savedPer;
  } catch(e){}

  try {
    var savedView = String(localStorage.getItem(D.VIEW_KEY)||"grid");
    D.view = (savedView==="list")?"list":"grid";
  } catch(e){}

  var RATE_COOLDOWN_MS = 0;
  function showApiStatus(on){
    var el = document.getElementById('apiStatus');
    if(el) el.style.display = on ? 'inline' : 'none';
  }

  function get(url, cb){
    var delay = RATE_COOLDOWN_MS || 0;
    function send(){
      var x=new XMLHttpRequest();
      x.open("GET", url, true);
      try { x.setRequestHeader('Accept','application/json'); } catch(e){}
      x.onreadystatechange=function(){
        if(x.readyState===4){
          if(x.status>=200 && x.status<300){
            var json=null, err=null;
            try{ json = JSON.parse(x.responseText); } catch(e){ err = new Error("Bad JSON from API"); }
            cb(err, json);
          }else{
            var e = new Error("HTTP "+x.status+" on "+url);
            if(x.status===429){ e.rateLimit = true; }
            cb(e, null);
          }
        }
      };
      x.onerror=function(){ cb(new Error("Network/CORS error on "+url), null); };
      x.send();
    }
    if(delay>0){ setTimeout(send, delay); } else { send(); }
  }
  function on429(){
    RATE_COOLDOWN_MS = Math.min( (RATE_COOLDOWN_MS? Math.round(RATE_COOLDOWN_MS*1.6):800) + Math.floor(Math.random()*400), 8000);
    showApiStatus(true);
  }
  function onSuccessAfter429(){
    if(RATE_COOLDOWN_MS>0){
      RATE_COOLDOWN_MS = Math.max( Math.floor(RATE_COOLDOWN_MS*0.8), 0);
      if(RATE_COOLDOWN_MS===0) showApiStatus(false);
    }
  }
  D.getWithRetry = function(url, cb){
    var attempt=0;
    (function tryOnce(){
      get(url, function(err, data){
        if(err && err.rateLimit){
          on429(); attempt++;
          var backoff = Math.min( 1000*Math.pow(1.5,attempt)+Math.floor(Math.random()*300), 9000);
          setTimeout(tryOnce, backoff);
        }else if(err){
          cb(err,null);
        }else{
          onSuccessAfter429();
          cb(null,data);
        }
      });
    })();
  };

  D.isArray=function(x){return Object.prototype.toString.call(x)==='[object Array]';};
  D.escapeHtml=function(s){return String(s).replace(/[&<>\"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m];});};
  D.validYear=function(y){ var n=parseInt(y,10); return (n>=1000 && n<=3000) ? n : null; };
  D.firstYearFromString=function(s){ var m=/(\d{4})/.exec(String(s||"")); return m ? D.validYear(+m[1]) : null; };
  D.normalizeArtist=function(name){ if(!name) return ""; var s=String(name).replace(/^\s*the\s+/i,""); return s.toLowerCase(); };
  D.isVarious=function(name){ return /^\s*various\s*$/i.test(name||""); };

  var CONCURRENCY=6, inflight=0; D.queue=[];
  function runQueue(){
    while(inflight<CONCURRENCY && D.queue.length){
      var job = D.queue.shift();
      inflight++;
      job(function(){ inflight--; D.updateProgress(); D.updateTrackProgress(); runQueue(); });
    }
  }
  D.runQueue = runQueue;

  D.MASTER_YEAR = {};
  try { D.MASTER_YEAR = JSON.parse(localStorage.getItem('discoapp_master_year') || '{}') || {}; } catch(e){ D.MASTER_YEAR = {}; }
  D.MASTER_INFLIGHT = {};
  function saveMasterYearCache(){ try{ localStorage.setItem('discoapp_master_year', JSON.stringify(D.MASTER_YEAR)); }catch(e){} }

  D.RELEASE_COUNTRY = {};
  try { D.RELEASE_COUNTRY = JSON.parse(localStorage.getItem(D.COUNTRY_KEY)||'{}')||{}; } catch(e){ D.RELEASE_COUNTRY={}; }
  var saveCountryTimer=null;
  function saveCountryCacheDebounced(){
    if(saveCountryTimer) return;
    saveCountryTimer=setTimeout(function(){
      saveCountryTimer=null;
      try{ localStorage.setItem(D.COUNTRY_KEY, JSON.stringify(D.RELEASE_COUNTRY)); }catch(e){}
    },400);
  }

  D.TRACK_INDEX={};
  try {
    var _t = JSON.parse(localStorage.getItem(D.TRACKS_KEY)||'{}')||{};
    for(var k in _t){ if(_t.hasOwnProperty(k)){ D.TRACK_INDEX[k] = D.isArray(_t[k]) ? _t[k] : String(_t[k]||"").split("\n"); } }
  } catch(e){ D.TRACK_INDEX={}; }
  D.TRACK_INFLIGHT = {};
  D.TRACK_MAX_FETCH_PER_QUERY = 30;
  D.TRACK_CANDIDATES = [];
  var saveTracksTimer=null;
  function saveTracksCacheDebounced(){
    if(saveTracksTimer) return;
    saveTracksTimer=setTimeout(function(){
      saveTracksTimer=null;
      try{ localStorage.setItem(D.TRACKS_KEY, JSON.stringify(D.TRACK_INDEX)); }catch(e){}
    },600);
  }

  function parseYearFromMaster(data){
    if(!data) return null;
    if(typeof data.year==="number") return D.validYear(data.year);
    if(typeof data.year==="string" && /^\d{4}$/.test(data.year)) return D.validYear(+data.year);
    var r=data.released || data.released_date || "";
    var m=/^(\d{4})/.exec(r);
    return m ? D.validYear(+m[1]) : null;
  }
  D.fetchMaster=function(mid,murl,cb){
    if(!mid){ cb(null,null); return; }
    if(D.MASTER_YEAR.hasOwnProperty(mid)){ cb(null, D.MASTER_YEAR[mid]); return; }
    if(D.MASTER_INFLIGHT[mid]){ cb(null,null); return; }
    D.MASTER_INFLIGHT[mid]=true;

    var urls=[]; if(murl) urls.push(murl);
    urls.push("https://api.discogs.com/masters/"+encodeURIComponent(mid));

    D.queue.push(function(done){
      var i=0;
      (function next(){
        if(i>=urls.length){ delete D.MASTER_INFLIGHT[mid]; done(); cb(null,null); return; }
        var u=urls[i++];
        D.getWithRetry(u,function(err,data){
          var y=!err?parseYearFromMaster(data):null;
          if(!err && y!=null){
            D.MASTER_YEAR[mid]=y; saveMasterYearCache();
            delete D.MASTER_INFLIGHT[mid]; done(); cb(null,y);
          }else{
            next();
          }
        });
      })();
    });
    D.updateProgress(); runQueue();
  };
  D.fetchRelease=function(id,cb){ D.getWithRetry(D.API+"/api/release?id="+encodeURIComponent(id), cb); };

  function wantMasters(items){
    var list=[], seen={};
    for(var i=0;i<items.length;i++){ var m=items[i].master_id; if(m && !seen[m]){ seen[m]=1; list.push({id:m, url:items[i].master_url}); } }
    return list;
  }
  D.wantMasters = wantMasters;

  D.fillMasterYears=function(items,onDone){
    var all=wantMasters(items), pending=[], i;
    for(i=0;i<all.length;i++){ var m=all[i].id; if(!D.MASTER_YEAR.hasOwnProperty(m) && !D.MASTER_INFLIGHT[m]) pending.push(all[i]); }
    if(!pending.length){ D.updateProgress(); if(onDone) onDone(); return; }
    var left=pending.length;
    for(i=0;i<pending.length;i++){ (function(mid,murl){ D.fetchMaster(mid,murl,function(){ left--; if(left===0){ D.updateProgress(); if(onDone) onDone(); } }); })(pending[i].id,pending[i].url); }
    D.updateProgress();
  };

  function basicMatches(it, lc){
    if(!lc) return true;
    if((it.title||"").toLowerCase().indexOf(lc)>-1) return true;
    if((it.artist||"").toLowerCase().indexOf(lc)>-1) return true;
    if(String(it.year!=null?it.year:"").indexOf(lc)>-1) return true;
    if(String(it.master_year!=null?it.master_year:"").indexOf(lc)>-1) return true;
    if(String(it.catno||"").toLowerCase().indexOf(lc)>-1) return true;
    return false;
  }
  function hasTrackMatch(releaseId, lc){
    var list=D.TRACK_INDEX[String(releaseId)];
    if(!list||!list.length) return false;
    for(var i=0;i<list.length;i++){ if(list[i].indexOf(lc)>-1) return true; }
    return false;
  }
  D.matches=function(it, needle){
    var lc=String(needle||"").toLowerCase();
    if(!lc) return true;
    if(basicMatches(it, lc)) return true;
    if(lc.length>=3 && hasTrackMatch(it.id, lc)) return true;
    return false;
  };
  D.warmTrackIndexForQuery=function(needle){
    var lc=String(needle||"").toLowerCase();
    if(lc.length<3){ D.TRACK_CANDIDATES=[]; D.updateTrackProgress(); return; }
    var candidates=[];
    for(var i=0;i<D.allItems.length;i++){ var it=D.allItems[i]; if(!basicMatches(it, lc)){ candidates.push(it); } }
    D.TRACK_CANDIDATES=candidates;
    indexTracksFor(candidates, lc);
    D.updateTrackProgress();
  };
  function indexTracksFor(items, lc){
    var queued=0;
    for(var i=0;i<items.length;i++){
      var it=items[i]; if(!it||!it.id) continue;
      var rid=String(it.id);
      if(D.TRACK_INDEX.hasOwnProperty(rid) || D.TRACK_INFLIGHT[rid]) continue;
      D.TRACK_INFLIGHT[rid]=true; queued++;
      (function(releaseId){
        D.queue.push(function(done){
          D.fetchRelease(releaseId,function(err,data){
            var arr=[];
            if(!err && data){
              if(data.country){ D.RELEASE_COUNTRY[String(releaseId)]=data.country; }
              if(data.tracklist && data.tracklist.length){
                for(var t=0;t<data.tracklist.length;t++){
                  var nm=(data.tracklist[t] && data.tracklist[t].title) ? String(data.tracklist[t].title).toLowerCase() : "";
                  if(nm) arr.push(nm);
                }
              }
            }
            D.TRACK_INDEX[String(releaseId)]=arr;
            delete D.TRACK_INFLIGHT[String(releaseId)];
            done();
            var hit=false;
            if(arr && arr.length && lc.length>=3){ for(var z=0;z<arr.length;z++){ if(arr[z].indexOf(lc)>-1){ hit=true; break; } } }
            if(hit || (D.RELEASE_COUNTRY[String(releaseId)]!=null)){ D.applyFilterAndPaginate(); }
          });
        });
      })(rid);
      if(queued>=D.TRACK_MAX_FETCH_PER_QUERY) break;
    }
    D.runQueue();
  }

  D.cmpItems=function(a,b){
    if(a.normArtist<b.normArtist) return -1;
    if(a.normArtist>b.normArtist) return 1;
    if(a.isVarious && b.isVarious){
      var at=(a.title||"").toLowerCase(), bt=(b.title||"").toLowerCase();
      if(at<bt) return -1; if(at>bt) return 1; return 0;
    }
    var am=(a.master_year!=null? a.master_year : (a.year!=null? a.year : null));
    var bm=(b.master_year!=null? b.master_year : (b.year!=null? b.year : null));
    if(am!=null && bm!=null && am!==bm) return am - bm;
    if(a.master_id && b.master_id && a.master_id===b.master_id){
      var ar=a.year||0, br=b.year||0; if(ar!==br) return ar - br;
    }
    var aT=(a.title||"").toLowerCase(), bT=(b.title||"").toLowerCase();
    if(aT<bT) return -1; if(aT>bT) return 1; return 0;
  };

  D.updateProgress=function(){
    var progressTxt=document.getElementById("progressTxt");
    var progressBar=document.getElementById("progressBar");
    var progressWrap=document.querySelector(".progress-wrap");

    var all = wantMasters(D.allItems);
    var totalMasters = all.length;
    var resolved=0, i; for(i=0;i<all.length;i++){ if(D.MASTER_YEAR.hasOwnProperty(all[i].id)) resolved++; }
    var active=0; for(var k in D.MASTER_INFLIGHT){ if(D.MASTER_INFLIGHT.hasOwnProperty(k)) active++; }

    var pct = totalMasters ? Math.round((resolved/totalMasters)*100) : 0;
    if(progressBar) progressBar.style.width = pct + "%";

    if(!progressTxt || !progressWrap) return;
    if(totalMasters && pct===100 && !active){
      progressWrap.style.display = "none";
      progressTxt.style.display = "none";
    }else{
      progressWrap.style.display = "block";
      progressTxt.style.display = "inline";
      progressTxt.textContent = "Master years: " + resolved + " / " + totalMasters + " (" + active + " active)";
    }
  };

  D.updateTrackProgress=function(){
    var txt=document.getElementById("trackProgressTxt");
    var wrap=document.getElementById("trackProgressWrap");
    var bar=document.getElementById("trackProgressBar");
    if(!txt || !wrap || !bar) return;

    var total=D.TRACK_CANDIDATES.length;
    if(!D.q || String(D.q).length<3 || total===0){
      txt.style.display="none"; wrap.style.display="none"; return;
    }
    var resolved=0, active=0, i;
    for(i=0;i<D.TRACK_CANDIDATES.length;i++){
      var id=String(D.TRACK_CANDIDATES[i].id);
      if(D.TRACK_INDEX.hasOwnProperty(id)) resolved++;
    }
    for(var k in D.TRACK_INFLIGHT){ if(D.TRACK_INFLIGHT.hasOwnProperty(k)) active++; }

    var pct=total?Math.round((resolved/total)*100):0;
    bar.style.width=pct+"%";
    if(total && pct===100 && !active){ wrap.style.display="none"; txt.style.display="none"; }
    else{ wrap.style.display="block"; txt.style.display="inline"; txt.textContent="Track titles: "+resolved+" / "+total+" ("+active+" active)"; }
  };

  function mapReleases(arr){
    return arr.map(function(r){
      var info = r && r.basic_information ? r.basic_information : r || {};
      var artistsArr = info.artists || [];
      var firstArtist = artistsArr[0] && artistsArr[0].name ? artistsArr[0].name : (info.artist || "");
      var lbls = info.labels || [];
      var firstLbl = lbls[0] || {};
      var mid = info.master_id || r.master_id || null;
      var norm = D.normalizeArtist(firstArtist);
      return {
        id: info.id || r.id,
        title: info.title || "",
        artist: firstArtist,
        normArtist: D.isVarious(firstArtist) ? "various" : norm,
        isVarious: D.isVarious(firstArtist),
        year: D.validYear((typeof info.year==="number"||typeof info.year==="string")?info.year:null),
        master_id: mid,
        master_url: info.master_url || (mid ? ("https://api.discogs.com/masters/"+mid) : null),
        master_year: (mid && D.MASTER_YEAR[mid]!=null) ? D.validYear(D.MASTER_YEAR[mid]) : null,
        catno: firstLbl.catno || info.catno || "",
        thumb: info.cover_image || info.thumb || ""
      };
    });
  }
  D.fetchAllItems=function(cb){
    var apiPer=100;
    var url1=D.API+"/api/collection?username="+encodeURIComponent(D.USER)+"&folder_id="+D.folder+"&per_page="+apiPer+"&page=1";
    D.getWithRetry(url1,function(err,data){
      if(err){ alert(err.message); return; }
      var first=[];
      if(data){
        if(D.isArray(data.releases)) first=data.releases;
        else if(D.isArray(data.items)) first=data.items;
        else if(D.isArray(data.results)) first=data.results;
        else if(D.isArray(data)) first=data;
      }
      D.total=(data && data.pagination && data.pagination.items)?data.pagination.items:first.length;
      var totalPages=(data && data.pagination && data.pagination.pages)?data.pagination.pages:Math.ceil(D.total/apiPer);

      D.allItems = mapReleases(first);

      if(totalPages<=1){ finalizeAll(cb); return; }
      var nextPage=2;
      (function loadNext(){
        if(nextPage>totalPages){ finalizeAll(cb); return; }
        var url=D.API+"/api/collection?username="+encodeURIComponent(D.USER)+"&folder_id="+D.folder+"&per_page="+apiPer+"&page="+nextPage;
        D.getWithRetry(url,function(e,d){
          if(!e && d){
            var arr=[];
            if(D.isArray(d.releases)) arr=d.releases;
            else if(D.isArray(d.items)) arr=d.items;
            else if(D.isArray(d.results)) arr=d.results;
            else if(D.isArray(d)) arr=d;
            D.allItems = D.allItems.concat(mapReleases(arr));
          }
          nextPage++; loadNext();
        });
      })();
    });
  };

  function finalizeAll(cb){
    D.allItems.sort(D.cmpItems);
    D.updateProgress();
    D.fillMasterYears(D.allItems,function(){
      var changed=false;
      for(var i=0;i<D.allItems.length;i++){
        var it=D.allItems[i];
        if(it.master_id && it.master_year==null && D.MASTER_YEAR.hasOwnProperty(it.master_id)){
          var vy=D.validYear(D.MASTER_YEAR[it.master_id]);
          if(vy!=null){ it.master_year=vy; changed=true; }
        }
      }
      if(changed){ D.allItems.sort(D.cmpItems); }
      D.updateProgress();
      if(typeof cb==="function") cb();
    });

    if(!D.tickTimer){
      D.tickTimer=setInterval(function(){
        D.fillMasterYears(D.allItems,function(){});
        D.updateProgress();
        var all=wantMasters(D.allItems), done=true;
        for(var i=0;i<all.length;i++){ if(!D.MASTER_YEAR.hasOwnProperty(all[i].id)){ done=false; break; } }
        if(done && !Object.keys(D.MASTER_INFLIGHT).length){ clearInterval(D.tickTimer); D.tickTimer=null; }
      },4000);
    }
  }

  D.countryForItem=function(it){ return D.RELEASE_COUNTRY[String(it.id)] || null; };
  D.joinYearCountry=function(year, country){
    var ys=(year!=null)?String(year):"-";
    var cs=(country && typeof country==="string")?String(country):null;
    return cs ? (ys + " " + cs) : ys;
  };
})();