// core.js — v1.08c Artist Index + View Migration

(function () {
  var D = window.D = window.D || {};

  D.VERSION = '1.08c';
  D.allItems = [];
  D.ready = false;

  D.ARTISTS = [];
  D.ARTIST_MAP = {};
  D.artistSelected = null;
  D.artistScroll = 0;

  D.normalizeArtist = function (name) {
    if (!name) return '';
    return name.replace(/^The\s+/i, '').trim().toLowerCase();
  };
  D.isVarious = function (name) {
    if (!name) return false;
    var n = name.toLowerCase();
    return n.indexOf('various') === 0 || n.indexOf('soundtrack') >= 0;
  };

  D.mapReleases = function (releases) {
    var out = [];
    for (var i = 0; i < releases.length; i++) {
      var r = releases[i], b = r.basic_information;
      var artist = b.artists && b.artists.length ? b.artists[0].name : 'Unknown Artist';
      var item = {
        id: r.id,
        artist: artist,
        title: b.title || 'Unknown Title',
        thumb: b.thumb || '',
        country: b.country || '',
        year: parseInt(b.year, 10) || 0,
        master_year: parseInt(b.master_year, 10) || 0,
        basic_information: b
      };
      out.push(item);
    }
    return out;
  };

  D.buildArtistIndex = function () {
    var map = {}, arr = [];
    for (var i = 0; i < D.allItems.length; i++) {
      var it = D.allItems[i], name = it.artist || 'Unknown Artist';
      var norm = D.normalizeArtist(name), y = it.master_year || it.year || 0;
      if (!map[norm]) {
        map[norm] = { name:name, norm:norm, isVarious:D.isVarious(name), count:0, thumb:'', firstYear:9999, lastYear:0 };
      }
      var a = map[norm];
      a.count++;
      if (!a.thumb && it.thumb) a.thumb = it.thumb;
      if (y) { if (y < a.firstYear) a.firstYear = y; if (y > a.lastYear) a.lastYear = y; }
    }
    for (var key in map) { var a2 = map[key]; if (a2.firstYear===9999) a2.firstYear=0; arr.push(a2); }
    arr.sort(function(a,b){
      if(a.isVarious&&!b.isVarious)return 1;
      if(!a.isVarious&&b.isVarious)return -1;
      return a.norm<b.norm?-1:a.norm>b.norm?1:0;
    });
    D.ARTISTS=arr; D.ARTIST_MAP={};
    for(var j=0;j<arr.length;j++) D.ARTIST_MAP[arr[j].norm]=j;
  };

  D.getArtistAlbums = function (norm) {
    var out = [];
    for (var i=0;i<D.allItems.length;i++){
      var it=D.allItems[i];
      if(D.normalizeArtist(it.artist)===norm) out.push(it);
    }
    out.sort(function(a,b){
      var ay=a.master_year||a.year, by=b.master_year||b.year;
      if(ay!==by) return ay-by;
      return a.title.toLowerCase()<b.title.toLowerCase()?-1:1;
    });
    return out;
  };

  D.init = function (releases) {
    D.allItems = D.mapReleases(releases||[]);
    D.buildArtistIndex();
    try {
      var v=localStorage.getItem('discoapp_view');
      if(v==='grid')v='albums'; if(v==='list')v='artists';
      if(v!=='albums'&&v!=='artists')v='albums';
      D.view=v;
    } catch(e){}
    D.ready=true;
  };

  D.saveView=function(){
    try{localStorage.setItem('discoapp_view',D.view);}catch(e){}
  };
})();
