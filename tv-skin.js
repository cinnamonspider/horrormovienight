/* =====================================================
   TV BROADCAST LAYER
   Turns every channel page into part of one television:
   a "tuning in" transition on arrival, a unified GUIDE
   button, and channel surfing (on-screen remote + arrow
   keys). Pairs with tv-skin.css.

   The dial below MUST match the cable guide order on
   index.html.
   ===================================================== */
(function () {
  var CHANNELS = [
    { num: '666', name: 'Horror',             file: 'horror.html',         horror: true },
    { num: '04',  name: 'Comedy',             file: 'comedy.html' },
    { num: '05',  name: 'Action & Adventure', file: 'actionadventure.html' },
    { num: '06',  name: 'Animated',           file: 'animated.html' },
    { num: '12',  name: 'Movie Marathon',     file: 'marathon.html' },
    { num: '99',  name: 'Television',         file: 'television.html' }
  ];

  // Which channel is this page?
  var here = (location.pathname.split('/').pop() || '').toLowerCase();
  var idx = -1;
  for (var i = 0; i < CHANNELS.length; i++) {
    if (CHANNELS[i].file === here) { idx = i; break; }
  }
  var cur = idx > -1 ? CHANNELS[idx] : null;

  /* ---- tuning overlay: built immediately so it covers before paint ---- */
  var overlay = document.createElement('div');
  overlay.id = 'tv-tuning';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.innerHTML =
    '<div class="tv-tuning-static"></div>' +
    '<div class="tv-tuning-bug">' +
      '<span class="tv-bug-ch">CH</span>' +
      '<span class="tv-bug-num"></span>' +
      '<span class="tv-bug-name"></span>' +
    '</div>';
  (document.body || document.documentElement).appendChild(overlay);

  function setBug(ch) {
    if (!ch) return;
    overlay.querySelector('.tv-bug-num').textContent = ch.num;
    overlay.querySelector('.tv-bug-name').textContent = ch.name;
    overlay.classList.toggle('is-horror', !!ch.horror);
  }

  // Show the "tuning in" static for the current channel, then let the signal lock in.
  if (cur) {
    setBug(cur);
    overlay.classList.add('show');
  }

  var blip = new Audio('music/freesound_community-menu-change-89197.mp3');
  blip.volume = 0.5;

  function whenReady(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  // Runs as soon as <body> exists — heavy pages can delay DOMContentLoaded
  // by a second with their own parse-time scripts, and the chrome only needs
  // the body, not a fully parsed document.
  function whenBody(fn) {
    if (document.body) return fn();
    var iv = setInterval(function () {
      if (document.body) { clearInterval(iv); fn(); }
    }, 25);
  }

  // Clear the arrival static once the page is ready.
  whenReady(function () {
    setTimeout(function () { overlay.classList.remove('show'); }, 650);
  });

  /* ---- channel surfing ---- */
  function surf(dir) {
    if (idx === -1) return;
    var target = CHANNELS[(idx + dir + CHANNELS.length) % CHANNELS.length];
    try { blip.currentTime = 0; blip.play().catch(function () {}); } catch (e) {}
    setBug(target);
    overlay.classList.add('show'); // flash static toward the new channel
    setTimeout(function () { location.href = target.file; }, 320);
  }

  /* ---- build the on-page chrome ---- */
  whenBody(function () {
    // GUIDE button (always present). The page's own back-links are hidden via CSS.
    var guide = document.createElement('a');
    guide.className = 'tv-guide-btn';
    guide.href = 'index.html?menu';
    guide.innerHTML = '&#9664;&nbsp;Guide';
    document.body.appendChild(guide);

    // Surf remote (only on actual channels).
    if (idx === -1) return;
    var remote = document.createElement('div');
    remote.className = 'tv-remote' + (cur.horror ? ' is-horror' : '');
    remote.innerHTML =
      '<button class="tv-ch-btn" id="tv-ch-up" aria-label="Next channel">CH&nbsp;&#9650;</button>' +
      '<div class="tv-ch-readout">' +
        '<span class="tv-ch-readout-label">CH</span>' +
        '<span class="tv-ch-readout-num">' + cur.num + '</span>' +
      '</div>' +
      '<button class="tv-ch-btn" id="tv-ch-down" aria-label="Previous channel">CH&nbsp;&#9660;</button>' +
      '<div class="tv-remote-hint">&#8592;/&#8594; to surf</div>';
    document.body.appendChild(remote);
    document.getElementById('tv-ch-up').addEventListener('click', function () { surf(1); });
    document.getElementById('tv-ch-down').addEventListener('click', function () { surf(-1); });
  });

  // Left/Right arrow keys surf (kept off Up/Down so page scrolling still works).
  document.addEventListener('keydown', function (e) {
    if (idx === -1 || e.metaKey || e.ctrlKey || e.altKey) return;
    var t = e.target;
    if (t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable)) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); surf(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); surf(-1); }
  });
})();
