/* =============================================================================
   ДИЗАЙН-СИСТЕМА — механика (09.10.2026)
   Своя реализация приёмов, снятых с rondesignlab и ux-korchagin (разбор —
   ~/.claude/design-refs). Без зависимостей, ~8 КБ. Подключать после components.css:
     <script src="/system/motion.js" defer></script>
   Всё уважает prefers-reduced-motion: при нём элементы сразу на месте, сцены статичны.

   Атрибуты:
     data-reveal                 — блок всплывает при появлении (24px, 0.6s)
     data-reveal-stagger         — на родителе: дети по очереди, шаг 80 мс
     data-count="1284"           — число досчитывается до значения (data-suffix="+"); в HTML пишите итоговое число
     .ds-scene + [data-float="0.6"] — прилипшая сцена, вокруг плывут элементы с разной скоростью
     .ds-swap                    — слева прилипшее фото меняется по мере пролистывания пунктов справа
     .ds-read                    — абзац проявляется по словам по мере прокрутки
     .ds-presence                — плавающая карточка живого человека в углу (закрытие запоминается)
     [data-lightbox]             — картинка открывается во весь экран по клику
     .ds-locked (клик)           — замок встряхивается: «закрыто, напишите нам»
   ============================================================================= */
(function () {
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var raf = window.requestAnimationFrame || function (f) { return setTimeout(f, 16); };
  function $$(s, root) { return Array.prototype.slice.call((root || document).querySelectorAll(s)); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  /* ---------- 1. Появление при прокрутке ---------- */
  function initReveal() {
    $$('[data-reveal-stagger]').forEach(function (parent) {
      var step = parseFloat(parent.getAttribute('data-reveal-stagger')) || 80;
      Array.prototype.forEach.call(parent.children, function (ch, i) {
        if (!ch.hasAttribute('data-reveal')) ch.setAttribute('data-reveal', '');
        ch.style.transitionDelay = (i * step) + 'ms';
      });
    });
    var els = $$('[data-reveal]');
    if (reduce || !('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('is-in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.forEach(function (e) { io.observe(e); });
  }

  /* ---------- 2. Досчитывающиеся числа ---------- */
  function fmt(n, dec) { return n.toLocaleString('ru-RU', { minimumFractionDigits: dec, maximumFractionDigits: dec }); }
  function initCount() {
    var els = $$('[data-count]');
    function run(el) {
      var to = parseFloat(el.getAttribute('data-count')); var dec = (String(el.getAttribute('data-count')).split('.')[1] || '').length;
      var suf = el.getAttribute('data-suffix') || ''; var pre = el.getAttribute('data-prefix') || '';
      if (reduce) { el.textContent = pre + fmt(to, dec) + suf; return; }
      var t0 = null, dur = 1200;
      function tick(t) { if (!t0) t0 = t; var k = clamp((t - t0) / dur, 0, 1); var e = 1 - Math.pow(1 - k, 3);
        el.textContent = pre + fmt(to * e, dec) + suf; if (k < 1) raf(tick); }
      raf(tick);
    }
    /* В HTML стоит настоящее число — его видят поиск и люди без JS. Обнуляем только
       перед анимацией и только то, что ещё не на экране. */
    if (reduce || !('IntersectionObserver' in window)) { els.forEach(run); return; }
    var io = new IntersectionObserver(function (en) { en.forEach(function (x) { if (x.isIntersecting) { run(x.target); io.unobserve(x.target); } }); }, { threshold: 0.5 });
    els.forEach(function (e) {
      var r = e.getBoundingClientRect();
      if (r.top < innerHeight && r.bottom > 0) { run(e); return; }
      var dec = (String(e.getAttribute('data-count')).split('.')[1] || '').length;
      e.textContent = (e.getAttribute('data-prefix') || '') + fmt(0, dec) + (e.getAttribute('data-suffix') || '');
      io.observe(e);
    });
  }

  /* ---------- 3–5. Сцены, привязанные к прокрутке ---------- */
  var scenes = [], swaps = [], reads = [];
  function progress(el) { var r = el.getBoundingClientRect(); var h = r.height - innerHeight; return h > 0 ? clamp(-r.top / h, 0, 1) : (r.top < 0 ? 1 : 0); }
  function initScenes() {
    scenes = $$('.ds-scene').map(function (s) { return { el: s, items: $$('[data-float]', s).map(function (it, i) {
      return { el: it, speed: parseFloat(it.getAttribute('data-float')) || 0.5, dir: (it.getAttribute('data-float-dir') || (i % 2 ? 'up' : 'down')) }; }) }; });
    swaps = $$('.ds-swap').map(function (s) { return { el: s, media: $$('.ds-swap__media > *', s), items: $$('.ds-swap__item', s), cur: -1 }; });
    reads = $$('.ds-read').map(function (p) {
      if (!p.dataset.split) { p.innerHTML = p.textContent.trim().split(/\s+/).map(function (w) { return '<span class="ds-read__w">' + w + '</span>'; }).join(' '); p.dataset.split = '1'; }
      return { el: p, words: $$('.ds-read__w', p) };
    });
  }
  function frame() {
    var vh = innerHeight;
    scenes.forEach(function (s) { var k = progress(s.el);
      s.items.forEach(function (it) { var d = (it.dir === 'up' ? -1 : 1) * (k - 0.5) * vh * it.speed; it.el.style.transform = 'translate3d(0,' + d.toFixed(1) + 'px,0)'; }); });
    swaps.forEach(function (s) {
      var idx = 0; s.items.forEach(function (it, i) { if (it.getBoundingClientRect().top < vh * 0.55) idx = i; });
      if (idx !== s.cur) { s.cur = idx; s.media.forEach(function (m, i) { m.classList.toggle('is-on', i === idx); });
        s.items.forEach(function (it, i) { it.classList.toggle('is-on', i === idx); }); } });
    reads.forEach(function (r) { var rect = r.el.getBoundingClientRect();
      var k = clamp((vh * 0.85 - rect.top) / (rect.height + vh * 0.35), 0, 1); var n = Math.round(k * r.words.length);
      r.words.forEach(function (w, i) { w.classList.toggle('is-on', i < n); }); });
  }
  function initScroll() {
    initScenes();
    if (reduce) { swaps.forEach(function (s) { s.media.forEach(function (m, i) { m.classList.toggle('is-on', i === 0); }); });
      reads.forEach(function (r) { r.words.forEach(function (w) { w.classList.add('is-on'); }); }); return; }
    var ticking = false;
    function on() { if (!ticking) { ticking = true; raf(function () { frame(); ticking = false; }); } }
    addEventListener('scroll', on, { passive: true }); addEventListener('resize', on); frame();
  }

  /* ---------- 6. Живой человек в углу ---------- */
  function initPresence() {
    $$('.ds-presence').forEach(function (el) {
      var key = 'ds-presence:' + (el.getAttribute('data-key') || location.pathname);
      try { if (localStorage.getItem(key) === 'closed') { el.remove(); return; } } catch (e) {}
      var delay = parseInt(el.getAttribute('data-delay') || '2500', 10);
      setTimeout(function () { el.classList.add('is-in'); }, reduce ? 0 : delay);
      var x = el.querySelector('.ds-presence__close');
      if (x) x.addEventListener('click', function (e) { e.preventDefault(); el.classList.remove('is-in');
        try { localStorage.setItem(key, 'closed'); } catch (err) {} setTimeout(function () { el.remove(); }, 300); });
    });
  }

  /* ---------- 7. Просмотр картинки во весь экран ---------- */
  function initLightbox() {
    var items = $$('[data-lightbox]'); if (!items.length) return;
    var box = document.createElement('div'); box.className = 'ds-lightbox'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true');
    box.innerHTML = '<button class="ds-lightbox__close" aria-label="Закрыть">✕</button><img alt=""><p class="ds-lightbox__cap"></p>';
    document.body.appendChild(box);
    var img = box.querySelector('img'), cap = box.querySelector('.ds-lightbox__cap');
    function close() { box.classList.remove('is-on'); }
    items.forEach(function (el) { el.style.cursor = 'zoom-in'; el.addEventListener('click', function () {
      img.src = el.getAttribute('data-lightbox') || el.currentSrc || el.src; img.alt = el.alt || '';
      cap.textContent = el.getAttribute('data-caption') || el.alt || ''; box.classList.add('is-on'); }); });
    box.addEventListener('click', function (e) { if (e.target === box || e.target.classList.contains('ds-lightbox__close')) close(); });
    addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  }

  /* ---------- 8. Встряхнуть замок закрытой работы ---------- */
  function initLocked() {
    $$('.ds-locked').forEach(function (el) { el.addEventListener('click', function () {
      var l = el.querySelector('.ds-locked__lock'); if (!l || reduce) return;
      l.classList.remove('is-shake'); void l.offsetWidth; l.classList.add('is-shake'); }); });
  }

  function init() { initReveal(); initCount(); initScroll(); initPresence(); initLightbox(); initLocked(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  window.DSMotion = { refresh: function () { initScenes(); frame(); } };
})();
