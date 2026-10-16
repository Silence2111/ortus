/* «Воздух» — механика страниц: меню, вкладки прайса, смета, появление.
 * Без зависимостей. Всё уважает prefers-reduced-motion: элементы сразу на месте. */
(function () {
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  /* 1. Меню на телефоне */
  var sheet = $('#vz-menu'), opener = $('.vz-top .vz-burger');
  function setMenu(open) {
    if (!sheet) return;
    sheet.hidden = !open;
    opener && opener.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) { var a = $('a', sheet); a && a.focus(); } else if (opener) opener.focus();
  }
  opener && opener.addEventListener('click', function () { setMenu(true); });
  $$('[data-close]').forEach(function (b) { b.addEventListener('click', function () { setMenu(false); }); });
  sheet && $$('a', sheet).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && sheet && !sheet.hidden) setMenu(false); });

  /* 2. Вкладки прайса: стрелки влево-вправо, как у настоящих вкладок */
  var tabs = $$('[role=tab]');
  function select(tab, focus) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      if (on) t.removeAttribute('tabindex'); else t.setAttribute('tabindex', '-1');
      var p = document.getElementById(t.getAttribute('aria-controls'));
      if (p) p.hidden = !on;
    });
    if (focus) tab.focus();
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { select(t); });
    t.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (d) { e.preventDefault(); select(tabs[(i + d + tabs.length) % tabs.length], true); }
    });
  });

  /* 3. Смета: сумма нижних границ, половина — до старта */
  var calc = $('#vzCalc');
  function rub(n) { return 'от ' + Math.round(n).toLocaleString('ru-RU') + ' ₽'; }
  function picked() {
    return $$('input[type=radio]:checked', calc).filter(function (r) { return +r.value > 0; });
  }
  function recalc() {
    var sum = picked().reduce(function (a, r) { return a + (+r.value); }, 0);
    $('#vzSum').textContent = sum ? rub(sum) : 'выберите хотя бы одно';
    $('#vzHalf').textContent = sum ? rub(sum / 2) : '—';
  }
  if (calc) {
    calc.addEventListener('change', recalc);
    calc.addEventListener('submit', function (e) { e.preventDefault(); });
    recalc();
    var go = $('#vzCalcGo');
    go && go.addEventListener('click', function () {
      var task = $('#leadForm textarea[name=task]');
      var list = picked().map(function (r) { return r.getAttribute('data-name'); });
      if (task && list.length && !task.value.trim()) task.value = 'Нужно: ' + list.join(', ') + '. ';
    });
  }

  /* 4. Появление: 24 px за 0,6 с, соседи по очереди. Что видно сразу — стоит сразу. */
  var els = $$('[data-reveal]');
  $$('[data-reveal-stagger]').forEach(function (p) {
    Array.prototype.forEach.call(p.children, function (ch, i) { ch.setAttribute('data-reveal', ''); ch.style.transitionDelay = (i * 80) + 'ms'; els.push(ch); });
  });
  if (reduce || !('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('is-in'); }); return; }
  var vh = window.innerHeight;
  els.forEach(function (e) {
    var r = e.getBoundingClientRect();
    if (r.top < vh * 0.92 && r.bottom > 0) { e.style.transition = 'none'; e.classList.add('is-in'); }
  });
  var io = new IntersectionObserver(function (en) {
    en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('is-in'); io.unobserve(x.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
  els.forEach(function (e) { if (!e.classList.contains('is-in')) io.observe(e); });
  requestAnimationFrame(function () { els.forEach(function (e) { if (e.style.transition === 'none') e.style.transition = ''; }); });
})();
