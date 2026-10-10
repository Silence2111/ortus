/* Foksten · «Плакат»: полноэкранное меню. */
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
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
})();
