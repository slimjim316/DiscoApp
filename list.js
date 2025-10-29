// list.js
// v1.08b – Artists view + renamed toggles

(function () {
  var D = window.D;

  // Cached DOM references
  var gridEl = document.getElementById('grid');
  var artistsPane = document.getElementById('artistsPane');
  var artistsSide = document.getElementById('artistsSide');
  var artistsBody = document.getElementById('artistsBody');
  var toggleBtn = document.getElementById('viewToggle');
  var searchBox = document.getElementById('searchBox');

  // --------------------------------------------------
  // Toggle button handler
  // --------------------------------------------------
  D.toggleView = function () {
    if (D.view === 'albums') {
      D.view = 'artists';
    } else {
      D.view = 'albums';
    }
    D.saveView();
    D.renderLibrary();
  };

  // --------------------------------------------------
  // Render Library view (Albums or Artists)
  // --------------------------------------------------
  D.renderLibrary = function () {
    if (!D.ready) return;

    // Update toggle button label
    if (toggleBtn) {
      toggleBtn.textContent = (D.view === 'albums') ? 'Artists' : 'Albums';
    }

    if (D.view === 'albums') {
      gridEl.style.display = '';
      artistsPane.style.display = 'none';
      D.renderAlbums();
    } else {
      gridEl.style.display = 'none';
      artistsPane.style.display = '';
      D.renderArtists();
    }
  };

  // --------------------------------------------------
  // Render Albums (was grid view)
  // --------------------------------------------------
  D.renderAlbums = function () {
    var html = [];
    var items = D.allItems.slice(0); // all for now
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      html.push(D.renderCard(it));
    }
    gridEl.innerHTML = html.join('');
  };

  // --------------------------------------------------
  // Render individual card (shared)
  // --------------------------------------------------
  D.renderCard = function (it) {
    var title = D.escapeHtml(it.title);
    var artist = D.escapeHtml(it.artist);
    var year = it.master_year || it.year || '-';
    var country = it.country || '';
    var thumb = it.thumb ? ('<img src="' + D.escapeHtml(it.thumb) + '" alt="">') : '<div class="noimg"></div>';
    return (
      '<div class="card" data-id="' + it.id + '">' +
      '<div class="thumb">' + thumb + '</div>' +
      '<div class="meta">' +
      '<div class="title">' + title + '</div>' +
      '<div class="artist">' + artist + '</div>' +
      '<div class="sub">' + year + (country ? ' • ' + country : '') + '</div>' +
      '</div></div>'
    );
  };

  // --------------------------------------------------
  // Render Artists view
  // --------------------------------------------------
  D.renderArtists = function () {
    var q = (searchBox && searchBox.value || '').toLowerCase();
    var list = D.ARTISTS.slice(0);
    if (q) {
      list = list.filter(function (a) {
        return a.name.toLowerCase().indexOf(q) >= 0;
      });
    }

    // Left panel
    var html = [];
    for (var i = 0; i < list.length; i++) {
      var a = list[i];
      var active = (D.artistSelected === a.norm) ? ' is-active' : '';
      var thumb = a.thumb ? '<img class="ava" src="' + D.escapeHtml(a.thumb) + '" alt="">' : '<div class="ava noimg"></div>';
      html.push(
        '<div class="artists-item' + active + '" data-norm="' + D.escapeHtml(a.norm) + '">' +
        thumb + '<span class="name">' + D.escapeHtml(a.name) + '</span>' +
        '<span class="count">' + a.count + '</span>' +
        '</div>'
      );
    }
    artistsSide.innerHTML = html.join('');

    // Right panel
    D.renderArtistAlbums(D.artistSelected);
  };

  // --------------------------------------------------
  // Render selected artist’s albums
  // --------------------------------------------------
  D.renderArtistAlbums = function (norm) {
    if (!norm) {
      artistsBody.innerHTML = '<p class="hint">Choose an artist to view albums</p>';
      return;
    }

    var albums = D.getArtistAlbums(norm);
    var html = [];
    html.push('<h2 class="artist-title">' + D.escapeHtml(D.ARTISTS[D.ARTIST_MAP[norm]].name) + '</h2>');
    html.push('<div class="grid smallgrid">');
    for (var i = 0; i < albums.length; i++) {
      var it = albums[i];
      // Same card but without artist line
      var title = D.escapeHtml(it.title);
      var year = it.master_year || it.year || '-';
      var country = it.country || '';
      var thumb = it.thumb ? ('<img src="' + D.escapeHtml(it.thumb) + '" alt="">') : '<div class="noimg"></div>';
      html.push(
        '<div class="card" data-id="' + it.id + '">' +
        '<div class="thumb">' + thumb + '</div>' +
        '<div class="meta">' +
        '<div class="title">' + title + '</div>' +
        '<div class="sub">' + year + (country ? ' • ' + country : '') + '</div>' +
        '</div></div>'
      );
    }
    html.push('</div>');
    artistsBody.innerHTML = html.join('');
  };

  // --------------------------------------------------
  // Event listeners
  // --------------------------------------------------
  artistsSide.addEventListener('click', function (e) {
    var el = e.target;
    while (el && !el.classList.contains('artists-item')) el = el.parentNode;
    if (!el) return;
    var norm = el.getAttribute('data-norm');
    D.artistSelected = norm;
    D.renderArtists();
  });

  gridEl.addEventListener('click', function (e) {
    var el = e.target;
    while (el && !el.classList.contains('card')) el = el.parentNode;
    if (!el) return;
    var id = el.getAttribute('data-id');
    D.openDetail(id);
  });

  artistsBody.addEventListener('click', function (e) {
    var el = e.target;
    while (el && !el.classList.contains('card')) el = el.parentNode;
    if (!el) return;
    var id = el.getAttribute('data-id');
    D.openDetail(id);
  });

  // --------------------------------------------------
  // Simple HTML escape helper
  // --------------------------------------------------
  D.escapeHtml = function (s) {
    if (s == null) return '';
    return String(s).replace(/[&<>"']/g, function (m) {
      return ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      })[m];
    });
  };

})();
