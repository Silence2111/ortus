/* Переключатель вариантов дизайна. Живёт только на стенде: страницы
 * подключают его при сборке с SITE_SKINS=1. Выбор запоминается в браузере,
 * чтобы при переходе по страницам вариант не слетал. */
(function () {
  var ВАРИАНТЫ = [
    { id: 'aurora',    имя: 'Aurora'    },
    { id: 'system',    имя: 'Системный' },
    { id: 'dark',      имя: 'Тёмный',    шрифт: 'Montserrat:wght@400;500;600;700' },
    { id: 'designpro', имя: 'DesignPro', шрифт: 'Inter:wght@400;500;600;700' },
    // из дизайн-системы (дизайн/system/themes): агентский, стройка, витрина результатов
    { id: 'studio',    имя: 'Студия' },   // своя вёрстка в studio/, см. studio/studio.mjs
    { id: 'vozduh',    имя: 'Воздух' },   // своя вёрстка в vozduh/, см. vozduh/vozduh.mjs
    { id: 'hazard',    имя: 'Стройка',   шрифт: 'Archivo:wght@400;500;600;700;800;900' },
    { id: 'calm',      имя: 'Спокойный', шрифт: 'Manrope:wght@400;500;600&family=Inter:wght@400;500' }
  ];
  var КЛЮЧ = 'a3-skin';
  // «Студия» и «Воздух» — не палитры, а своя вёрстка: их страницы лежат в
  // studio/ и vozduh/ под теми же именами. Выбрать такой вариант — перейти
  // на ту же страницу в его папке; выбрать палитру со страницы отдельной
  // вёрстки — вернуться к исходной странице '../' + ФАЙЛ.
  var ОТДЕЛЬНЫЕ = { studio: 'studio', vozduh: 'vozduh' };
  var html = document.documentElement;
  var ТУТ = html.hasAttribute('data-studio') ? 'studio' : html.hasAttribute('data-vozduh') ? 'vozduh' : '';
  var ФАЙЛ = location.pathname.split('/').pop() || 'index.html';

  function изАдреса() {
    var id = (location.search.match(/[?&]skin=([a-z]+)/) || [])[1];
    return id && ВАРИАНТЫ.some(function (в) { return в.id === id; }) ? id : '';
  }
  function прочитать() {
    // ?skin=system имеет приоритет: так вариант можно показать ссылкой,
    // не объясняя, где нажать переключатель.
    if (изАдреса()) return изАдреса();
    if (ТУТ) return ТУТ;
    try { return localStorage.getItem(КЛЮЧ) || 'aurora'; } catch (e) { return 'aurora'; }
  }
  function перейти(id) {
    try { localStorage.setItem(КЛЮЧ, id); } catch (e) {}
    if (id === ТУТ) return false;
    if (ОТДЕЛЬНЫЕ[id]) {
      var куда = (ТУТ ? '../' : '') + ОТДЕЛЬНЫЕ[id] + '/' + ФАЙЛ + location.hash;
      if (ТУТ) location.href = куда; else location.replace(куда);
      return true;
    }
    if (ТУТ) { location.href = '../' + ФАЙЛ + '?skin=' + id + location.hash; return true; }
    return false;
  }
  // Шрифт макета тянем только когда его вариант выбрали: грузить три
  // семейства сразу ради переключателя не нужно.
  function шрифт(имя) {
    if (!имя) return;
    var id = 'skin-font-' + имя.split(':')[0];
    if (document.getElementById(id)) return;
    var l = document.createElement('link');
    l.id = id; l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=' + имя + '&display=swap';
    document.head.appendChild(l);
  }

  function применить(id) {
    if (перейти(id)) return;
    if (ТУТ) return;   // у отдельной вёрстки свои стили, атрибут ей не нужен
    // aurora — базовый слой страниц, ему атрибут не нужен
    if (id === 'aurora') document.documentElement.removeAttribute('data-skin');
    else document.documentElement.setAttribute('data-skin', id);
    try { localStorage.setItem(КЛЮЧ, id); } catch (e) {}
    ВАРИАНТЫ.forEach(function (в) { if (в.id === id) шрифт(в.шрифт); });
    var b = document.querySelectorAll('.skin-switch button');
    for (var i = 0; i < b.length; i++)
      b[i].setAttribute('aria-pressed', String(b[i].dataset.skin === id));
  }

  применить(прочитать());   // до отрисовки виджета, чтобы не было вспышки

  function виджет() {
    var текущий = прочитать();
    var box = document.createElement('div');
    box.className = 'skin-switch';
    box.setAttribute('role', 'group');
    box.setAttribute('aria-label', 'Вариант дизайна');
    ВАРИАНТЫ.forEach(function (в) {
      var b = document.createElement('button');
      b.type = 'button';
      b.dataset.skin = в.id;
      b.setAttribute('aria-pressed', String(в.id === текущий));
      b.innerHTML = '<i class="i-' + в.id + '"></i><span>' + в.имя + '</span>';
      b.addEventListener('click', function () { применить(в.id); });
      box.appendChild(b);
    });
    document.body.appendChild(box);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', виджет);
  else виджет();
})();
