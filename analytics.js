/* Аналитика витрины.
 *
 * Почему так: счётчик не должен быть «кнопкой без механизма» — либо он
 * действительно считает, либо не грузится вообще и не делает ни одного
 * запроса наружу. Пустой METRIKA_ID = выключено.
 *
 * Чтобы включить: завести счётчик на metrika.yandex.ru и вписать его номер
 * одной строкой ниже. Больше ничего менять не нужно ни на одной странице.
 */
(function () {
  'use strict';

  var METRIKA_ID = ''; // например: '98765432'

  if (!METRIKA_ID) return;

  // Стандартный инициализатор Метрики, развёрнутый в читаемый вид.
  window.ym = window.ym || function () {
    (window.ym.a = window.ym.a || []).push(arguments);
  };
  window.ym.l = 1 * new Date();

  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://mc.yandex.ru/metrika/tag.js';
  document.head.appendChild(s);

  window.ym(METRIKA_ID, 'init', {
    clickmap: true,
    trackLinks: true,
    accurateTrackBounce: true,
    webvisor: false
  });

  // Цель «заявка отправлена». Форма сама шлёт это событие после успешного
  // ответа Formspree — без него аналитика показывала бы визиты, но не заявки.
  document.addEventListener('ortus:lead-sent', function () {
    window.ym(METRIKA_ID, 'reachGoal', 'lead');
  });
})();
