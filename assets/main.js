(function () {
  'use strict';
  var CFG = window.WEDDING || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var lang = 'en';
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  function digits(s) { return lang === 'ar' ? String(s).replace(/[0-9]/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'[d]; }) : String(s); }
  var T = {
    en: { langName: 'English', langTo: 'العربية', musicOn: 'Pause music', musicOff: 'Play music', title: 'Nadine & Mahmoud' },
    ar: { langName: 'العربية', langTo: 'English', musicOn: 'إيقاف الموسيقى', musicOff: 'تشغيل الموسيقى', title: 'نادين ومحمود' }
  };
  var MONTHS = {
    en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    ar: ['كانون الثاني', 'شباط', 'آذار', 'نيسان', 'أيار', 'حزيران', 'تموز', 'آب', 'أيلول', 'تشرين الأول', 'تشرين الثاني', 'كانون الأول']
  };
  var DAYS = { en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], ar: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'] };

  /* ---------- date & countdown (Istanbul time) ---------- */
  function tzOffsetMin(ms, tz) {
    try {
      var p = {}; new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
        .formatToParts(new Date(ms)).forEach(function (x) { p[x.type] = x.value; });
      return (Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second) - ms) / 60000;
    } catch (e) { return 180; }
  }
  var target = null, ymd = null;
  (function () {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(CFG.date || ''); if (!m) return;
    ymd = [+m[1], +m[2], +m[3]];
    var tm = /^(\d{1,2}):(\d{2})$/.exec(CFG.time || '') || [0, 0, 0];
    var guess = Date.UTC(ymd[0], ymd[1] - 1, ymd[2], +tm[1], +tm[2]);
    target = guess - tzOffsetMin(guess, CFG.timezone || 'Europe/Istanbul') * 60000;
  })();
  function dateText() {
    if (!ymd) return '';
    var wd = new Date(Date.UTC(ymd[0], ymd[1] - 1, ymd[2])).getUTCDay();
    return lang === 'ar' ? DAYS.ar[wd] + '، ' + digits(ymd[2] + ' ' + MONTHS.ar[ymd[1] - 1] + ' ' + ymd[0])
      : DAYS.en[wd] + ', ' + MONTHS.en[ymd[1] - 1] + ' ' + ymd[2] + ', ' + ymd[0];
  }
  function tick() {
    if (target == null) return;
    var s = Math.max(0, Math.floor((target - Date.now()) / 1000));
    var v = [Math.floor(s / 86400), Math.floor(s % 86400 / 3600), Math.floor(s % 3600 / 60), s % 60];
    $$('.pv[data-l="' + lang + '"] [data-u]').forEach(function (el) {
      var i = +el.getAttribute('data-u'), n = v[i]; el.textContent = digits(i === 0 ? n : (n < 10 ? '0' + n : n));
    });
  }

  /* ---------- language ---------- */
  var preloaded = {};
  function preload(l) {
    if (preloaded[l]) return; preloaded[l] = true;
    $$('.pv[data-l="' + l + '"] img').forEach(function (img) { img.loading = 'eager'; var i = new Image(); i.src = img.currentSrc || img.src; });
  }
  function render() {
    var html = document.documentElement;
    html.lang = lang; html.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.title = T[lang].title;
    $('#langName').textContent = T[lang].langName; $('#langBtn').setAttribute('aria-label', T[lang].langTo);
    $$('[data-date]').forEach(function (el) { el.textContent = dateText(); });
    var v = CFG.venue || {};
    $$('.pv[data-l="en"] [data-venue]').forEach(function (el) { el.textContent = ((v.en || {})[el.getAttribute('data-venue')]) || ''; });
    $$('.pv[data-l="ar"] [data-venue]').forEach(function (el) { el.textContent = ((v.ar || {})[el.getAttribute('data-venue')]) || ''; });
    $$('[data-maps]').forEach(function (a) { if (v.mapsLink) a.href = v.mapsLink; else a.removeAttribute('href'); });
    updateMusicBtn(); tick();
  }
  function setLang(l) { lang = l === 'ar' ? 'ar' : 'en'; store('nm4-lang', lang); render(); }

  /* ---------- first-view reveal: each page's wording appears once ---------- */
  $$('[data-d]').forEach(function (el) { el.style.setProperty('--dl', (0.12 + 0.3 * (+el.getAttribute('data-d'))).toFixed(2) + 's'); });
  var opened = false;
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!opened || !e.isIntersecting) return;
      e.target.classList.add('seen'); io.unobserve(e.target);
    });
  }, { root: $('#book'), rootMargin: '0px 0px -28% 0px', threshold: 0 }) : null;
  var pages = $$('.page');
  pages.slice(1).forEach(function (p) { if (io) io.observe(p); });

  /* ---------- RSVP (design preview only: nothing is sent or stored) ---------- */
  var choice = null;
  function syncRsvp() {
    $$('.tile').forEach(function (t) { t.setAttribute('aria-pressed', t.getAttribute('data-v') === choice ? 'true' : 'false'); });
    $$('.tick').forEach(function (t) { t.classList.toggle('on', t.getAttribute('data-tick') === choice); });
  }
  $$('.tile').forEach(function (t) { t.addEventListener('click', function () { var v = this.getAttribute('data-v'); choice = choice === v ? null : v; syncRsvp(); }); });

  /* ---------- music ---------- */
  var audio = $('#music'), playing = false;
  function updateMusicBtn() { var b = $('#musicBtn'); b.setAttribute('aria-pressed', playing ? 'true' : 'false'); b.setAttribute('aria-label', playing ? T[lang].musicOn : T[lang].musicOff); }
  function fade(to, ms, cb) { var from = audio.volume, t0 = performance.now(); (function step(n) { var k = Math.min(1, (n - t0) / ms); try { audio.volume = from + (to - from) * k; } catch (e) { } if (k < 1) requestAnimationFrame(step); else if (cb) cb(); })(t0); }
  function play() {
    if (!CFG.music) return;
    if (!audio.getAttribute('src')) audio.setAttribute('src', CFG.music);
    playing = true; updateMusicBtn();
    try { audio.volume = 0; } catch (e) { }
    var pr = audio.play(); if (pr && pr.then) pr.then(function () { fade(0.7, 3000); }).catch(function () { playing = false; updateMusicBtn(); }); else fade(0.7, 3000);
  }
  function pause() { playing = false; updateMusicBtn(); fade(0, 600, function () { if (!playing) audio.pause(); }); }
  $('#musicBtn').addEventListener('click', function () { playing ? pause() : play(); });
  document.addEventListener('visibilitychange', function () { if (!playing) return; if (document.hidden) audio.pause(); else audio.play().catch(function () { }); });

  /* ---------- falling petals along the sides ---------- */
  var cv = $('#petals'), ctx = cv.getContext && cv.getContext('2d'), petals = [], running = false, last = 0, dpr = 1;
  function sizeCanvas() { dpr = Math.min(2, window.devicePixelRatio || 1); cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; }
  function bands() {
    var r = $('.column').getBoundingClientRect(), w = r.width;
    return [[Math.max(0, r.left - w * 0.14), r.left + w * 0.16], [r.right - w * 0.16, Math.min(innerWidth, r.right + w * 0.14)]];
  }
  function spawn(p, initial) {
    var b = bands()[Math.random() < 0.5 ? 0 : 1];
    p.x = b[0] + Math.random() * (b[1] - b[0]);
    p.y = initial ? Math.random() * innerHeight : -20 - Math.random() * 60;
    p.vy = 16 + Math.random() * 16; p.amp = 8 + Math.random() * 18; p.f = 0.12 + Math.random() * 0.16; p.ph = Math.random() * 6.28;
    p.rot = Math.random() * 6.28; p.vr = (Math.random() - 0.5) * 0.7; p.fl = Math.random() * 6.28; p.vf = 0.6 + Math.random() * 1.2;
    p.s = 6 + Math.random() * 6; p.a = 0.5 + Math.random() * 0.32; p.t = 0;
    return p;
  }
  function drawPetal(p, x) {
    var s = p.s;
    ctx.save(); ctx.translate(x * dpr, p.y * dpr); ctx.rotate(p.rot); ctx.scale(Math.max(0.18, Math.abs(Math.cos(p.fl))) * dpr, dpr);
    ctx.globalAlpha = p.a;
    ctx.shadowColor = 'rgba(90,76,60,.16)'; ctx.shadowBlur = 3 * dpr; ctx.shadowOffsetY = 1.2 * dpr;
    var g = ctx.createRadialGradient(-s * 0.25, -s * 0.35, s * 0.1, 0, 0, s * 1.15);
    g.addColorStop(0, '#ffffff'); g.addColorStop(0.65, '#f8f6f1'); g.addColorStop(1, '#e9e3d9');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(0, -s);
    ctx.bezierCurveTo(s * 0.95, -s * 0.55, s * 0.72, s * 0.75, 0, s);
    ctx.bezierCurveTo(-s * 0.72, s * 0.75, -s * 0.95, -s * 0.55, 0, -s);
    ctx.fill(); ctx.restore();
  }
  function frame(now) {
    if (!running) return;
    var dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
    ctx.clearRect(0, 0, cv.width, cv.height);
    petals.forEach(function (p) {
      p.t += dt; p.y += p.vy * dt; p.rot += p.vr * dt; p.fl += p.vf * dt;
      var x = p.x + Math.sin(p.ph + p.t * p.f * 6.28) * p.amp;
      if (p.y > innerHeight + 24) spawn(p, false);
      drawPetal(p, x);
    });
    requestAnimationFrame(frame);
  }
  function startPetals() {
    if (reduce || !ctx || running) return;
    sizeCanvas();
    var n = innerWidth > 700 ? 14 : 9;
    petals = []; for (var i = 0; i < n; i++) petals.push(spawn({}, true));
    running = true; last = 0; requestAnimationFrame(frame);
  }
  addEventListener('resize', function () { if (running) sizeCanvas(); });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) running = false; else if (petals.length && !reduce) { running = true; last = 0; requestAnimationFrame(frame); }
  });

  /* ---------- the cover ---------- */
  var started = false;
  function open(l) {
    if (started) return; started = true;
    setLang(l);
    if (CFG.playMusicOnOpen !== false) play();
    var body = document.body, k = reduce ? 0.02 : 1;
    body.classList.add('is-opening');
    setTimeout(startPetals, 1200 * k);
    setTimeout(function () {
      opened = true; pages[0].classList.add('seen');
      // pages already on screen when the cover opens (the observer only reports changes)
      pages.slice(1).forEach(function (p) { var r = p.getBoundingClientRect(); if (r.top < innerHeight * 0.72 && r.bottom > 0) { p.classList.add('seen'); if (io) io.unobserve(p); } });
    }, 1700 * k);
    setTimeout(function () {
      body.classList.remove('is-gate', 'is-opening'); body.classList.add('is-open');
      $('#controls').hidden = false;
      preload(lang === 'en' ? 'ar' : 'en');
    }, 3350 * k);
  }
  $$('[data-choose]').forEach(function (b) { b.addEventListener('click', function () { open(this.getAttribute('data-choose')); }); });
  $('#langBtn').addEventListener('click', function () { setLang(lang === 'ar' ? 'en' : 'ar'); });

  lang = store('nm4-lang') === 'ar' ? 'ar' : 'en';
  render();
  setInterval(tick, 1000);
})();
