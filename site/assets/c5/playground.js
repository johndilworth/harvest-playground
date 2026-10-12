/* Harvest Playground · Cycle 5 · first-party script, no network calls.
   - Nav tabs: the active tab's fill slides in from the side you came from.
   - SPIRAL.φ gallery: click / arrow keys through golden-spiral artworks.
   - Dino roar buttons: synthesized roars with the Web Audio API (no audio files). */
(function () {
  var doc = document.documentElement;
  doc.classList.add('js');

  /* ---- nav tab fill direction ---- */
  var links = Array.prototype.slice.call(document.querySelectorAll('.nav-bar .nav-link'));
  var activeIdx = links.findIndex(function (a) { return a.classList.contains('active'); });
  var from = null;
  try { from = sessionStorage.getItem('hp-nav-from'); sessionStorage.removeItem('hp-nav-from'); } catch (e) {}
  if (activeIdx >= 0 && from !== null && +from !== activeIdx) {
    links[activeIdx].classList.add(+from < activeIdx ? 'fill-from-left' : 'fill-from-right');
  }
  links.forEach(function (a) {
    a.addEventListener('click', function () {
      try { sessionStorage.setItem('hp-nav-from', String(activeIdx)); } catch (e) {}
    });
  });

  /* ---- gallery ---- */
  document.querySelectorAll('[data-gallery]').forEach(function (g) {
    var slides = g.querySelectorAll('.gallery-slide');
    var dots = g.querySelectorAll('.gallery-dot');
    var count = g.querySelector('.gallery-count');
    var i = 0;
    function show(n) {
      i = (n + slides.length) % slides.length;
      slides.forEach(function (s, k) { s.classList.toggle('is-active', k === i); s.setAttribute('aria-hidden', k === i ? 'false' : 'true'); });
      dots.forEach(function (d, k) { d.classList.toggle('is-active', k === i); d.setAttribute('aria-pressed', k === i ? 'true' : 'false'); });
      if (count) count.textContent = (i + 1) + ' / ' + slides.length;
    }
    g.querySelector('.gallery-prev').addEventListener('click', function () { show(i - 1); });
    g.querySelector('.gallery-next').addEventListener('click', function () { show(i + 1); });
    dots.forEach(function (d, k) { d.addEventListener('click', function () { show(k); }); });
    g.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { show(i - 1); e.preventDefault(); }
      if (e.key === 'ArrowRight') { show(i + 1); e.preventDefault(); }
    });
    slides.forEach(function (s) { s.addEventListener('click', function () { show(i + 1); }); });
    g.classList.add('gallery-ready');
    show(0);
  });

  /* ---- synthesized dino roars ---- */
  var ctx = null;
  function roar(base, len) {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = ctx || new AC();
    var t = ctx.currentTime, dur = len || 1.6;
    var out = ctx.createGain(); out.gain.setValueAtTime(0.0001, t);
    out.gain.exponentialRampToValueAtTime(0.5, t + 0.12);
    out.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(900, t);
    lp.frequency.exponentialRampToValueAtTime(260, t + dur); lp.Q.value = 6;
    lp.connect(out); out.connect(ctx.destination);
    [1, 1.5, 2.02].forEach(function (m, k) {
      var o = ctx.createOscillator(); o.type = k ? 'square' : 'sawtooth';
      o.frequency.setValueAtTime(base * m * 1.25, t);
      o.frequency.exponentialRampToValueAtTime(base * m * 0.62, t + dur);
      var lfo = ctx.createOscillator(); lfo.frequency.value = 22 + k * 7;
      var lg = ctx.createGain(); lg.gain.value = base * 0.18; lfo.connect(lg); lg.connect(o.frequency);
      var g = ctx.createGain(); g.gain.value = k ? 0.18 : 0.35;
      o.connect(g); g.connect(lp); o.start(t); lfo.start(t); o.stop(t + dur); lfo.stop(t + dur);
    });
    var n = ctx.createBufferSource(), buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate), d = buf.getChannelData(0);
    for (var j = 0; j < d.length; j++) d[j] = (Math.random() * 2 - 1) * 0.6;
    n.buffer = buf; var ng = ctx.createGain(); ng.gain.value = 0.25; n.connect(ng); ng.connect(lp); n.start(t);
  }
  document.querySelectorAll('[data-roar]').forEach(function (b) {
    b.addEventListener('click', function () {
      roar(parseFloat(b.getAttribute('data-roar')) || 70, parseFloat(b.getAttribute('data-roar-len')) || 1.6);
      b.classList.remove('is-roaring'); void b.offsetWidth; b.classList.add('is-roaring');
    });
  });
})();
