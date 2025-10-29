// core.js
// v1.08a – Artist Index + View Migration
// Builds artist index, adds state for artist view, and migrates saved view names.

(function () {
  var D = window.D = window.D || {};

  // --------------------------------------------------
  // Existing core state
  // --------------------------------------------------
  D.VERSION = '1.08a';
  D.allItems = [];
  D.filtered = [];
  D.view = 'albums'; // default
  D.pageSize = 100;
  D.pageIndex = 0;
  D.search = '';
  D.countries = {};
  D.masterYears = {};
  D.ready = false;

  // --------------------------------------------------
  // New state for Artist View
  // --------------------------------------------------
  D.ARTISTS = [];
  D.ARTIST_MAP = {};
  D.artistSelected = null;
  D.artistScroll = 0;

  // --------------------------------------------------
  // Utility: normalise artist name
  // (we already use this elsewhere, define once safely)
  // --------------------------------------------------
  D.normalizeArtist = D.normalizeArtist || function (name) {
    if (!name) return '';
    return name.replace(/^The\s+/i, '').trim().toLowerCase();
  };

  D.isVarious = function (name) {
    if (!name) return false;
    var n = name.toLowerCase();
    return n.indexOf('various') === 0 || n.indexOf('soundtrack') >= 0;
  };

  // --------------------------------------------------
  // Map API response → internal release item
  // (unchanged from v1.07c)
  // --------------------------------------------------
  D.mapReleases = function (releases) {
    var out = [];
    for (var i = 0; i < releases.length; i++) {
      var r = releases[i];
      var artist = r.basic_information.artists && r.basic_information.artists.length
        ? r.basic_information.artists[0].name
        : 'Unknown Artist';
      var title = r.basic_information.title || 'Unknown Title';
      var thumb = r.basic_information.thumb || '';
      var country = r.basic_information.country || '';
      var year = parseInt(r.basic_information.year, 10) || 0;
      var masterYear = parseInt(r.basic_information.master_year, 10) || 0;

      out.push({
        id: r.id,
        artist: artist,
        title: title,
        thumb: thumb,
        country: country,
        year: year,
        master_year: masterYear,
        basic_information: r.basic_information
      });
    }
    return out;
  };

  // --------------------------------------------------
  // Build artist index from allItems
  // --------------------------------------------------
  D.buildArtistIndex = function () {
    var map = {};
    var arr = [];
    for (var i = 0; i < D.allItems.length; i++) {
      var it = D.allItems[i];
      var name = it.artist || 'Unknown Artist';
      var norm = D.normalizeArtist(name);
      var isVarious = D.isVarious(name);
      if (!map[norm]) {
        map[norm] = {
          name: name,
          norm: norm,
          isVarious: isVarious,
          count: 0,
          thumb: '',
          firstYear: 9999,
          lastYear: 0
        };
      }
      var a = map[norm];
      a.count++;
      if (!a.thumb && it.thumb) a.thumb = it.thumb;
      var y = it.master_year || it.year || 0;
      if (y) {
        if (y < a.firstYear) a.firstYear = y;
        if (y > a.lastYear) a.lastYear = y;
      }
    }

    for (var key in map) {
      var a2 = map[key];
      if (a2.firstYear === 9999) a2.firstYear = 0;
      arr.push(a2);
    }

    // Sort A–Z (Various always last)
    arr.sort(function (a, b) {
      if (a.isVarious && !b.isVarious) return 1;
      if (!a.isVarious && b.isVarious) return -1;
      if (a.norm < b.norm) return -1;
      if (a.norm > b.norm) return 1;
      return 0;
    });

    D.ARTISTS = arr;
    D.ARTIST_MAP = {};
    for (var j = 0; j < arr.length; j++) {
      D.ARTIST_MAP[arr[j].norm] = j;
    }
  };

  // --------------------------------------------------
  // Helper: get all albums for a given artist (norm)
  // --------------------------------------------------
  D.getArtistAlbums = function (norm) {
    var out = [];
    for (var i = 0; i < D.allItems.length; i++) {
      var it = D.allItems[i];
      var n = D.normalizeArtist(it.artist);
      if (n === norm) out.push(it);
    }
    // Sort by our normal cmp (year > title)
    out.sort(function (a, b) {
      var ay = a.master_year || a.year;
      var by = b.master_year || b.year;
      if (ay !== by) return ay - by;
      var at = a.title.toLowerCase(), bt = b.title.toLowerCase();
      if (at < bt) return -1;
      if (at > bt) return 1;
      return 0;
    });
    return out;
  };

  // --------------------------------------------------
  // Initialise with migration logic
  // --------------------------------------------------
  D.init = function (releases) {
    // Map releases to internal form
    D.allItems = D.mapReleases(releases || []);

    // Build artist index
    D.buildArtistIndex();

    // Load settings (with migration)
    try {
      var v = localStorage.getItem('discoapp_view');
      if (v === 'grid') v = 'albums';
      if (v === 'list') v = 'artists';
      if (v !== 'albums' && v !== 'artists') v = 'albums';
      D.view = v;

      var ps = parseInt(localStorage.getItem('discoapp_pageSize'), 10);
      if (!isNaN(ps)) D.pageSize = ps;
    } catch (e) {}

    D.ready = true;
  };

  // --------------------------------------------------
  // Export helper for saving settings
  // --------------------------------------------------
  D.saveView = function () {
    try {
      localStorage.setItem('discoapp_view', D.view);
    } catch (e) {}
  };

})();
