(function(){
  if(!window.DiscoApp) window.DiscoApp = {};
  var D = window.DiscoApp;

  // --- existing config/state (kept) ---
  D.API  = D.API  || "https://disco.slimjim316.workers.dev";
  D.USER = D.USER || "slimjim316";
  D.page = D.page || 1;
  D.per  = D.per  || 100;
  D.view = D.view || "grid";   // keep original values: "grid" or "list"
  D.q    = D.q    || "";
  D.allItems = D.allItems || [];
  D.filteredItems = D.filteredItems || [];

  // --- NEW: artist index state ---
  D.ARTISTS = [];
  D.ARTIST_MAP = {};
  D.artistSelected = null;
  D.artistScroll = 0;

  // Utilities already present in your codebase — safe fallbacks:
  D.escapeHtml = D.escapeHtml || function(s){ if(s==null) return ""; return String(s).replace(/[&<>"]/g, function(m){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]); }); };
  D.normalizeArtist = D.normalizeArtist || function (name){ if(!name) return ""; return name.replace(/^The\s+/i, '').trim().toLowerCase(); };
  D.isVarious = D.isVarious || function(name){ if(!name) return false; var n=name.toLowerCase(); return n.indexOf('various')===0 || n.indexOf('soundtrack')>=0; };

  // --- hook: call after allItems changes ---
  D.buildArtistIndex = function(){
    var map={}, arr=[], i, it, name, norm, y;
    for(i=0;i<D.allItems.length;i++){
      it=D.allItems[i]; name=it.artist||'Unknown Artist'; norm=D.normalizeArtist(name);
      if(!map[norm]) map[norm]={name:name,norm:norm,isVarious:D.isVarious(name),count:0,thumb:'',firstYear:9999,lastYear:0};
      var a=map[norm]; a.count++; if(!a.thumb && it.thumb) a.thumb=it.thumb;
      y=it.master_year||it.year||0; if(y){ if(y<a.firstYear) a.firstYear=y; if(y>a.lastYear) a.lastYear=y; }
    }
    for(var k in map){ var a2=map[k]; if(a2.firstYear===9999) a2.firstYear=0; arr.push(a2); }
    arr.sort(function(a,b){
      if(a.isVarious && !b.isVarious) return 1;
      if(!a.isVarious && b.isVarious) return -1;
      return a.norm<b.norm?-1:a.norm>b.norm?1:0;
    });
    D.ARTISTS=arr; D.ARTIST_MAP={};
    for(i=0;i<arr.length;i++) D.ARTIST_MAP[arr[i].norm]=i;
  };

  D.getArtistAlbums = function(norm){
    var out=[], i, it;
    for(i=0;i<D.allItems.length;i++){ it=D.allItems[i]; if(D.normalizeArtist(it.artist)===norm) out.push(it); }
    out.sort(function(a,b){
      var ay=a.master_year||a.year, by=b.master_year||b.year;
      if(ay!==by) return ay-by;
      var at=a.title.toLowerCase(), bt=b.title.toLowerCase();
      return at<bt?-1:at>bt?1:0;
    });
    return out;
  };

  // --- IMPORTANT: wherever your code sets D.allItems, call buildArtistIndex() after. ---
  // If you already have D.fetchAllItems(), append D.buildArtistIndex() when items are ready.
  var _origFinalize = D.finalizeLoad;
  D.finalizeLoad = function(){
    if(typeof _origFinalize === 'function'){ _origFinalize(); }
    D.buildArtistIndex();
  };

  // The rest of your existing core.js remains unchanged…
})();
