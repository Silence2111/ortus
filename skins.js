/* Переключатель вариантов дизайна. Живёт только на стенде: страницы
 * подключают его при сборке с SITE_SKINS=1. Выбор запоминается в браузере,
 * чтобы при переходе по страницам вариант не слетал. */
(function () {
  var ВАРИАНТЫ = [
    { id: 'aurora',    имя: 'Aurora'    },
    { id: 'system',    имя: 'Системный' },
    { id: 'dark',      имя: 'Тёмный',    шрифт: 'Montserrat:wght@400;500;600;700' },
    { id: 'designpro', имя: 'DesignPro', шрифт: 'Inter:wght@400;500;600;700' }
  ];
  var КЛЮЧ = 'a3-skin';

  function прочитать() {
    // ?skin=telescope имеет приоритет: так вариант можно показать ссылкой,
    // не объясняя, где нажать переключатель.
    var изАдреса = (location.search.match(/[?&]skin=([a-z]+)/) || [])[1];
    if (изАдреса && ВАРИАНТЫ.some(function (в) { return в.id === изАдреса; })) return изАдреса;
    try { return localStorage.getItem(КЛЮЧ) || 'aurora'; } catch (e) { return 'aurora'; }
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
