/* Стенд вариантов дизайна Foksten (10.10.2026).
   Общее для всех пяти вариантов: переключатель «вариант N из 5» в углу
   и формы. На стенде заявка никуда не уходит — так и пишем человеку,
   а не изображаем отправку. */
(function () {
  var VARIANTS = [
    { dir: '1-noch', name: 'Ночь' },
    { dir: '2-vozduh', name: 'Воздух' },
    { dir: '3-redakciya', name: 'Редакция' },
    { dir: '4-steklo', name: 'Стекло' },
    { dir: '5-plakat', name: 'Плакат' }
  ];

  /* ---------- переключатель ---------- */
  function switcher() {
    var parts = location.pathname.split('/');
    var dir = parts[parts.length - 2];
    var page = parts[parts.length - 1] || 'index.html';
    var i = VARIANTS.findIndex(function (v) { return v.dir === dir; });
    if (i < 0) return;
    var prev = VARIANTS[(i + VARIANTS.length - 1) % VARIANTS.length];
    var next = VARIANTS[(i + 1) % VARIANTS.length];
    var bar = document.createElement('nav');
    bar.className = 'fk-stand';
    bar.setAttribute('aria-label', 'Варианты дизайна');
    bar.innerHTML =
      '<a class="fk-stand__all" href="../index.html" title="Все варианты">Варианты</a>' +
      '<a class="fk-stand__arrow" href="../' + prev.dir + '/' + page + '" aria-label="Предыдущий: ' + prev.name + '">&larr;</a>' +
      '<span class="fk-stand__now">' + (i + 1) + ' / ' + VARIANTS.length + ' · ' + VARIANTS[i].name + '</span>' +
      '<a class="fk-stand__arrow" href="../' + next.dir + '/' + page + '" aria-label="Следующий: ' + next.name + '">&rarr;</a>';
    var css = document.createElement('style');
    css.textContent =
      '.fk-stand{position:fixed;left:16px;bottom:16px;z-index:9999;display:flex;align-items:center;gap:2px;padding:4px;' +
      'border-radius:999px;background:rgba(18,18,20,.86);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);' +
      'font:500 13px/1 Inter,system-ui,sans-serif;color:#fff;box-shadow:0 0 0 1px rgba(255,255,255,.1)}' +
      '.fk-stand a,.fk-stand span{display:inline-flex;align-items:center;justify-content:center;height:36px;padding:0 12px;border-radius:999px;color:#fff;text-decoration:none}' +
      '.fk-stand__arrow{width:36px;padding:0!important;font-size:16px}' +
      '.fk-stand a:hover{background:rgba(255,255,255,.14)}' +
      '.fk-stand a:focus-visible{outline:2px solid #fff;outline-offset:1px}' +
      '.fk-stand__all{color:rgba(255,255,255,.72)!important}' +
      '@media (max-width:520px){.fk-stand__all{display:none!important}.fk-stand{left:50%;transform:translateX(-50%)}}' +
      '@media print{.fk-stand{display:none}}';
    document.head.appendChild(css);
    document.body.appendChild(bar);
  }

  /* ---------- формы ----------
     Разметка: <form data-form> … <p data-err> под полем … <div data-sent hidden>.
     Ошибка показывается после ухода из поля и при отправке, не по каждой букве. */
  function check(field) {
    var box = field.closest('[data-field]');
    if (!box) return true;
    var err = box.querySelector('[data-err]');
    var v = field.value.trim();
    var msg = '';
    if (field.required && !v) msg = field.getAttribute('data-msg') || 'Заполните поле';
    else if (field.name === 'contact' && v && !/^(@[\w\d_]{4,}|\+?[\d\s()-]{10,}|[^@\s]+@[^@\s]+\.[^@\s]+)$/.test(v))
      msg = 'Телефон, @ник в Telegram или почта — например, +7 999 000-00-00';
    box.classList.toggle('is-invalid', !!msg);
    field.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (err) err.textContent = msg;
    return !msg;
  }
  function forms() {
    Array.prototype.forEach.call(document.querySelectorAll('form[data-form]'), function (form) {
      form.setAttribute('novalidate', '');
      Array.prototype.forEach.call(form.querySelectorAll('input,textarea,select'), function (f) {
        f.addEventListener('blur', function () { if (f.value || f.dataset.touched) check(f); f.dataset.touched = '1'; });
        f.addEventListener('input', function () { if (f.closest('.is-invalid')) check(f); });
      });
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var ok = true, first = null;
        Array.prototype.forEach.call(form.querySelectorAll('input,textarea,select'), function (f) {
          if (!check(f)) { ok = false; first = first || f; }
        });
        if (!ok) { first.focus(); return; }
        var sent = form.parentNode.querySelector('[data-sent]');
        if (sent) { form.hidden = true; sent.hidden = false; sent.focus && sent.focus(); }
      });
    });
  }

  function ready(fn) { document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', fn) : fn(); }
  ready(function () { switcher(); forms(); });
})();
