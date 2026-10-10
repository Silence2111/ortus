/* Foksten · «Ночь»: шапка, меню, поле задачи на первом экране. */
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* шапка темнеет и размывается при прокрутке */
  var top = $('.top');
  function onScroll() { top && top.classList.toggle('is-scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

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

  /* поле задачи: по словам подсказываем направления и нижнюю цену.
     Цены — те же нижние границы, что на всём сайте. */
  var DIRS = [
    { re: /сайт|лендинг|магазин|портал|страниц/, name: 'Сайты и лендинги', price: 'от 40 000 ₽' },
    { re: /\bwb\b|\bвб\b|wildberries|вайлдберр|ozon|озон|маркетплейс|карточк|дрр|селлер/, name: 'Реклама на WB и Ozon', price: 'от 45 000 ₽/мес' },
    { re: /telegram|телеграм|\bтг\b|посев|блогер/, name: 'Telegram Ads', price: 'от 50 000 ₽/мес' },
    { re: /бот|\bии\b|\bai\b|нейросет|автоматиз|ассистент|gpt/, name: 'ИИ-боты и автоматизация', price: 'от 60 000 ₽' },
    { re: /\bseo\b|\bсео\b|поиск|выдач|\bgeo\b/, name: 'SEO и GEO', price: 'от 40 000 ₽/мес' },
    { re: /директ|таргет|\bvk\b|\bвк\b|контекст|заявк/, name: 'Директ и таргет', price: 'от 40 000 ₽/мес' },
    { re: /\bsmm\b|соцсет|reels|рилс|контент|ugc/, name: 'SMM и контент', price: 'от 45 000 ₽/мес' },
    { re: /эксперт|школ|курс|продюс|личный бренд|вебинар/, name: 'Продюсирование', price: 'от 100 000 ₽' },
    { re: /логотип|дизайн|бренд|фирстил|айдентик/, name: 'Дизайн и брендинг', price: 'от 30 000 ₽' },
    { re: /1с|1c|учёт|учет|склад/, name: 'Внедрение 1С', price: 'от 50 000 ₽' },
    { re: /приложени|\bmvp\b|ios|android|\bcrm\b|црм/, name: 'Приложения и MVP', price: 'от 300 000 ₽' },
    { re: /сервер|сисадмин|почт|телефони|хостинг/, name: 'IT-аутсорс', price: 'от 15 000 ₽/мес' }
  ];
  var ta = $('#task'), match = $('#match'), form = $('#prompt');
  function render() {
    if (!ta || !match) return;
    var v = ta.value.toLowerCase();
    var hits = v.length < 3 ? [] : DIRS.filter(function (d) { return d.re.test(v); }).slice(0, 4);
    match.innerHTML = hits.length
      ? '<span class="match__label">Похоже, вам нужно:</span>' + hits.map(function (d) {
          return '<span class="chip">' + d.name + ' <b>' + d.price + '</b></span>'; }).join('')
      : '';
  }
  ta && ta.addEventListener('input', render);
  ta && ta.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); form.requestSubmit ? form.requestSubmit() : form.submit(); }
  });
  $$('.idea').forEach(function (b) {
    b.addEventListener('click', function () { ta.value = b.textContent; render(); ta.focus(); });
  });
  form && form.addEventListener('submit', function (e) {
    e.preventDefault();
    var to = $('#f-task'); if (to && ta.value.trim()) to.value = ta.value.trim();
    var start = $('#start');
    start && start.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    setTimeout(function () { var n = $('#f-name'); n && n.focus({ preventScroll: true }); }, 500);
  });
})();
