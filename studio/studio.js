/* «Студия» — механика страниц. Свой код, без зависимостей; приёмы сняты с
 * rondesignlab и описаны в Projects/дизайн/system/PLAYBOOK.md.
 * Всё уважает prefers-reduced-motion: элементы сразу на месте, ничего не
 * листается само. */
(function () {
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;
  function $$(s, root) { return Array.prototype.slice.call((root || document).querySelectorAll(s)); }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }

  /* 1. Появление: 24 px за 0,6 с, соседи по очереди. То, что видно сразу
   *    при загрузке, не анимируется — первый экран должен стоять. */
  function reveal() {
    $$('.st-body .rv').forEach(function (el) { el.setAttribute('data-reveal', ''); });
    $$('[data-reveal-stagger]').forEach(function (p) {
      Array.prototype.forEach.call(p.children, function (ch, i) {
        ch.setAttribute('data-reveal', ''); ch.style.transitionDelay = (i * 80) + 'ms';
      });
    });
    var els = $$('[data-reveal]');
    if (reduce || !hasIO) { els.forEach(function (e) { e.classList.add('is-in'); }); return; }
    var vh = window.innerHeight;
    els.forEach(function (e) {
      var r = e.getBoundingClientRect();
      if (r.top < vh * 0.92 && r.bottom > 0) { e.style.transition = 'none'; e.classList.add('is-in'); }
    });
    // соседи в одной сетке — по очереди, даже если атрибут стоит на каждом
    var io = new IntersectionObserver(function (en) {
      var shown = 0;
      en.forEach(function (x) {
        if (!x.isIntersecting) return;
        var el = x.target;
        if (!el.style.transitionDelay) el.style.transitionDelay = (shown++ * 80) + 'ms';
        el.classList.add('is-in'); io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    els.forEach(function (e) { if (!e.classList.contains('is-in')) io.observe(e); });
    requestAnimationFrame(function () { els.forEach(function (e) { if (e.style.transition === 'none') e.style.transition = ''; }); });
  }

  /* 2. Реплики между разделами: сначала «печатает…», потом текст */
  function bubbles() {
    var list = $$('[data-typing]');
    list.forEach(function (b) {
      var d = document.createElement('span');
      d.className = 'st-bubble__dots'; d.setAttribute('aria-hidden', 'true');
      d.innerHTML = '<i></i><i></i><i></i>';
      b.insertBefore(d, b.lastElementChild);
    });
    if (reduce || !hasIO) return;
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (x) {
        if (!x.isIntersecting) return;
        var b = x.target; io.unobserve(b);
        b.classList.add('is-typing');
        setTimeout(function () { b.classList.remove('is-typing'); }, 900);
      });
    }, { threshold: 0.9 });
    list.forEach(function (b) { io.observe(b); });
  }

  /* 3. Витрина работ: кадры сменяют друг друга, полоски сверху — как в сторис.
   */
  function showcase() {
    var box = document.querySelector('.st-show');
    if (!box) return;
    var imgs = $$('.st-show__slide', box), btns = $$('.st-show__bar button', box);
    var cap = box.querySelector('.st-show__cap');
    var i = 0, timer = null, visible = true, hover = false;
    var DUR = 5000;
    box.style.setProperty('--show-dur', DUR + 'ms');
    function go(n, user) {
      i = (n + imgs.length) % imgs.length;
      imgs.forEach(function (im, k) { im.classList.toggle('is-on', k === i); });
      btns.forEach(function (b, k) {
        b.classList.toggle('is-done', k < i);
        b.classList.remove('is-on'); void b.offsetWidth;
        if (k === i) b.classList.add('is-on');
        b.setAttribute('aria-current', String(k === i));
      });
      var im = imgs[i];
      if (cap) {
        cap.href = im.dataset.href || cap.href;
        cap.querySelector('.st-show__t').textContent = im.dataset.title || '';
        cap.querySelector('.st-show__s').textContent = im.dataset.sub || '';
      }
      if (user) restart();
    }
    function tick() { if (visible && !hover && !document.hidden) go(i + 1); }
    function restart() { clearInterval(timer); if (!reduce) timer = setInterval(tick, DUR); }
    btns.forEach(function (b, k) { b.addEventListener('click', function () { go(k, true); }); });
    box.addEventListener('mouseenter', function () { hover = true; box.classList.add('is-paused'); });
    box.addEventListener('mouseleave', function () { hover = false; box.classList.remove('is-paused'); restart(); });
    if (hasIO) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }, { threshold: 0.2 }).observe(box);
    go(0); restart();
    if (reduce) btns.forEach(function (b) { b.classList.remove('is-on'); });
  }

  /* 3б. Пилюля с иконками в заголовке: сайт → реклама → ИИ → 1С → поиск */
  function cycle() {
    if (reduce) return;
    $$('.st-pill--cycle').forEach(function (p) {
      var ic = $$('.st-i', p), i = 0;
      if (ic.length < 2) return;
      setInterval(function () {
        if (document.hidden) return;
        var cur = ic[i]; i = (i + 1) % ic.length;
        cur.classList.remove('is-on'); cur.classList.add('is-out');
        setTimeout(function () { cur.classList.remove('is-out'); }, 500);
        ic[i].classList.add('is-on');
      }, 1800);
    });
  }

  /* 4. Карусель услуг: стрелки листают на карточку, на краях гаснут */
  function rails() {
    $$('.st-rail').forEach(function (rail) {
      var prev = document.querySelector('[data-rail-prev="' + rail.id + '"]');
      var next = document.querySelector('[data-rail-next="' + rail.id + '"]');
      function step() { var c = rail.firstElementChild; return c ? c.getBoundingClientRect().width + 24 : 300; }
      function sync() {
        var max = rail.scrollWidth - rail.clientWidth - 4;
        if (prev) prev.disabled = rail.scrollLeft <= 4;
        if (next) next.disabled = rail.scrollLeft >= max;
      }
      if (prev) prev.addEventListener('click', function () { rail.scrollBy({ left: -step(), behavior: reduce ? 'auto' : 'smooth' }); });
      if (next) next.addEventListener('click', function () { rail.scrollBy({ left: step(), behavior: reduce ? 'auto' : 'smooth' }); });
      rail.addEventListener('scroll', sync, { passive: true });
      window.addEventListener('resize', sync);
      sync();
    });
  }

  /* 4б. Шапка: под плитками проявляется растушёвка, когда страница прокручена,
   *     чтобы текст не просвечивал сквозь полупрозрачные плитки */
  function navShade() {
    var n = document.querySelector('.st-nav');
    if (!n) return;
    function s() { n.classList.toggle('is-scrolled', window.scrollY > 24); }
    window.addEventListener('scroll', s, { passive: true }); s();
  }

  /* 5. Меню на телефоне */
  function menu() {
    var b = document.querySelector('.st-nav__menu'), sheet = document.getElementById('st-sheet');
    if (!b || !sheet) return;
    function set(open) { sheet.hidden = !open; b.setAttribute('aria-expanded', String(open)); }
    b.addEventListener('click', function () { set(sheet.hidden); });
    sheet.addEventListener('click', function (e) { if (e.target.closest('a')) set(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !sheet.hidden) { set(false); b.focus(); } });
  }

  /* 6. Карточка «ответим сегодня»: через 2,5 с, прячется у формы, закрытие
   *    запоминается */
  function presence() {
    var p = document.querySelector('.st-presence');
    if (!p || store('a3-presence-x') === '1') return;
    var nearForm = false;
    setTimeout(function () { p.hidden = false; requestAnimationFrame(function () { if (!nearForm) p.classList.add('is-in'); }); }, reduce ? 0 : 2500);
    p.querySelector('.st-presence__x').addEventListener('click', function () {
      p.classList.remove('is-in'); store('a3-presence-x', '1'); setTimeout(function () { p.hidden = true; }, 400);
    });
    var cta = document.getElementById('cta');
    if (cta && hasIO) new IntersectionObserver(function (en) {
      nearForm = en[0].isIntersecting; p.classList.toggle('is-in', !nearForm && !p.hidden);
    }, { threshold: 0.05 }).observe(cta);
  }

  /* 7. Сегменты «кто вы?» на странице услуг */
  function segments() {
    $$('[role="tablist"].st-seg').forEach(function (list) {
      var tabs = $$('[role="tab"]', list);
      function pick(t, focus) {
        tabs.forEach(function (x) {
          var on = x === t;
          x.setAttribute('aria-selected', String(on)); x.tabIndex = on ? 0 : -1;
          document.getElementById(x.getAttribute('aria-controls')).hidden = !on;
        });
        if (focus) t.focus();
      }
      tabs.forEach(function (t, k) {
        t.addEventListener('click', function () { pick(t); });
        t.addEventListener('keydown', function (e) {
          if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
            e.preventDefault();
            pick(tabs[(k + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length], true);
          }
        });
      });
    });
  }

  /* 8. Скриншот во весь экран: Esc или щелчок мимо закрывают */
  function lightbox() {
    $$('[data-lightbox]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var box = document.createElement('div');
        box.className = 'st-lightbox'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true');
        var fig = document.createElement('figure');
        var img = document.createElement('img'); img.src = a.getAttribute('href'); img.alt = a.dataset.caption || '';
        var cap = document.createElement('figcaption'); cap.textContent = a.dataset.caption || '';
        fig.appendChild(img); fig.appendChild(cap); box.appendChild(fig);
        document.body.appendChild(box);
        requestAnimationFrame(function () { box.classList.add('is-in'); });
        function close() { box.classList.remove('is-in'); setTimeout(function () { box.remove(); }, 300); document.removeEventListener('keydown', esc); a.focus(); }
        function esc(ev) { if (ev.key === 'Escape') close(); }
        box.addEventListener('click', close); document.addEventListener('keydown', esc);
        box.tabIndex = -1; box.focus();
      });
    });
  }

  /* 9. Числа досчитываются один раз. В HTML — итоговое значение: его видят
   *    поиск и люди без JS, обнуляем только перед анимацией. */
  function counts() {
    var els = $$('[data-count]');
    if (reduce || !hasIO) return;
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (x) {
        if (!x.isIntersecting) return;
        var el = x.target; io.unobserve(el);
        var to = parseFloat(el.dataset.count), suf = el.dataset.suffix || '', t0 = null;
        function f(n) { return Math.round(n).toLocaleString('ru-RU').replace(/ /g, ' ') + suf; }
        (function tick(t) { if (!t0) t0 = t; var k = Math.min((t - t0) / 1200, 1);
          el.textContent = f(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(tick); })(performance.now());
      });
    }, { threshold: 0.5 });
    els.forEach(function (e) { io.observe(e); });
  }

  /* 10. Бегущая строка: дорожка удваивается, чтобы шов не был виден */
  function marquee() {
    $$('.st-marquee__track').forEach(function (t) {
      Array.prototype.slice.call(t.children).forEach(function (c) {
        var d = c.cloneNode(true); d.setAttribute('aria-hidden', 'true'); t.appendChild(d);
      });
    });
  }

  function init() { reveal(); bubbles(); showcase(); cycle(); navShade(); rails(); menu(); presence(); segments(); lightbox(); counts(); marquee(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
