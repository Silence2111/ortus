/* Foksten · «Редакция»: колонтитул с живым временем, меню, оглавление статьи. */
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var top = $('.top');
  function onScroll() { top && top.classList.toggle('is-scrolled', window.scrollY > 4); }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* живое время по Москве — маленький знак «здесь работают люди» */
  var clock = $('#clock');
  function tick() {
    if (!clock) return;
    var t = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Moscow' });
    clock.textContent = t; clock.setAttribute('datetime', t);
  }
  tick(); setInterval(tick, 20000);

  /* меню */
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

  /* оглавление статьи подсвечивает раздел, который сейчас читают */
  var links = $$('.art__toc a');
  if (links.length && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (x) {
        if (!x.isIntersecting) return;
        links.forEach(function (a) { a.classList.toggle('is-on', a.getAttribute('href') === '#' + x.target.id); });
      });
    }, { rootMargin: '-30% 0px -60% 0px' });
    links.forEach(function (a) { var s = $(a.getAttribute('href')); s && io.observe(s); });
  }
})();
