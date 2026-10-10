/* Foksten · «Воздух»: меню, смета на первом экране, вкладки «кто вы?». */
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* мобильное меню */
  var menu = $('#menu'), burger = $('.burger');
  function setMenu(open) {
    if (!menu) return;
    menu.hidden = !open; burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) $('a', menu).focus(); else burger.focus();
  }
  burger && burger.addEventListener('click', function () { setMenu(true); });
  $$('[data-close]').forEach(function (b) { b.addEventListener('click', function () { setMenu(false); }); });
  menu && $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menu && !menu.hidden) setMenu(false); });

  /* смета: сумма нижних границ, отдельно разовое и ежемесячное.
     data-once / data-month — те же «от», что в прайсе. */
  var calc = $('#calc');
  function rub(n) { return n.toLocaleString('ru-RU') + ' ₽'; }
  function recalc() {
    if (!calc) return;
    var once = 0, month = 0, names = [];
    $$('input[type=checkbox]', calc).forEach(function (c) {
      if (!c.checked) return;
      once += +(c.dataset.once || 0); month += +(c.dataset.month || 0);
      names.push(c.parentNode.textContent.trim());
    });
    $('#t-once').innerHTML = once ? 'от ' + rub(once) : '<small>не выбрано</small>';
    $('#t-month').innerHTML = month ? 'от ' + rub(month) : '<small>не выбрано</small>';
    var go = $('#calc-go');
    go.textContent = names.length ? 'Получить точную смету' : 'Отметьте хотя бы одно';
    go.setAttribute('aria-disabled', names.length ? 'false' : 'true');
    calc.dataset.names = names.join(', ');
  }
  calc && calc.addEventListener('change', recalc); recalc();
  var go = $('#calc-go');
  go && go.addEventListener('click', function (e) {
    if (go.getAttribute('aria-disabled') === 'true') { e.preventDefault(); return; }
    var t = $('#f-task'); if (t && calc.dataset.names) t.value = 'Нужно: ' + calc.dataset.names + '. ';
  });

  /* «кто вы?» — вкладки с клавиатурой */
  var tabs = $$('[role=tab]');
  function select(tab) {
    tabs.forEach(function (t) {
      var on = t === tab; t.setAttribute('aria-selected', on ? 'true' : 'false'); t.tabIndex = on ? 0 : -1;
      $('#' + t.getAttribute('aria-controls')).hidden = !on;
    });
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { select(t); });
    t.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return; e.preventDefault();
      var n = tabs[(i + d + tabs.length) % tabs.length]; select(n); n.focus();
    });
  });
})();
