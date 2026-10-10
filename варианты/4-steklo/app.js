/* Foksten · «Стекло»: меню, «кто вы?» подсвечивает свои направления, карусель работ. */
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

  /* «кто вы?»: кнопка-переключатель; повторное нажатие снимает фильтр */
  var grid = $('.svc'), note = $('#seg-note');
  var NOTES = {
    mp: 'Вам нужны заказы с карточек, а не показы. Начинаем с рекламы и учёта — там обычно утекают деньги.',
    local: 'Вам нужны заявки и звонки из своего города. Сайт под заявки и реклама, которая окупается.',
    expert: 'Вам нужно, чтобы вас узнавали и покупали продукт. Упаковка, контент и трафик из Telegram.',
    company: 'Вам нужен порядок в учёте и системах: 1С, интеграции, автоматизация и IT без своего штата.'
  };
  var DEFAULT = note ? note.textContent : '';
  $$('.seg button').forEach(function (b) {
    b.addEventListener('click', function () {
      var on = b.getAttribute('aria-pressed') !== 'true';
      $$('.seg button').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      var seg = on ? b.dataset.seg : '';
      grid.classList.toggle('is-filtering', !!seg);
      $$('a', grid).forEach(function (a) {
        a.classList.toggle('is-match', !!seg && (a.dataset.seg || '').split(' ').indexOf(seg) > -1);
      });
      if (note) note.textContent = seg ? NOTES[seg] : DEFAULT;
    });
  });

  /* карусель работ: кнопки листают на одну карточку */
  var reel = $('.reel');
  $$('[data-reel]').forEach(function (b) {
    b.addEventListener('click', function () {
      var card = reel.firstElementChild; if (!card) return;
      var step = card.getBoundingClientRect().width + 18;
      reel.scrollBy({ left: (+b.dataset.reel) * step, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    });
  });
})();
