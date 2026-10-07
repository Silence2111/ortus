/* Форма заявки — одна на 15 страницах. Раньше тот же код был вставлен в каждую
 * страницу, ошибки показывались через alert(), а поле с ошибкой никак не
 * отмечалось. Теперь:
 *   — ошибка появляется у конкретного поля после ухода из него (не на каждую букву);
 *   — при отправке фокус уходит на первое поле с ошибкой;
 *   — на время отправки кнопка «Отправляем…» и недоступна;
 *   — сбой сети или приёмника — блок внутри формы: что случилось и что делать;
 *   — успех — подтверждение на месте формы. */
(function () {
  var f = document.getElementById('leadForm');
  if (!f) return;

  var RULES = {
    name: function (v) { return v ? '' : 'Напишите, как к вам обращаться'; },
    contact: function (v) {
      if (!v) return 'Оставьте телефон или ник в Telegram — иначе мы не сможем ответить';
      var digits = v.replace(/\D/g, '');
      if (/^@?[a-z0-9_]{4,}$/i.test(v) && /[a-z_]/i.test(v)) return '';
      if (digits.length >= 10 && digits.length <= 12) return '';
      return 'Проверьте формат: +7 999 123-45-67 или @nick';
    }
  };

  function errBox(input) {
    var id = input.name + 'Err';
    var box = document.getElementById(id);
    if (!box) {
      box = document.createElement('span');
      box.className = 'lf-err';
      box.id = id;
      box.setAttribute('role', 'alert');
      input.insertAdjacentElement('afterend', box);
      input.setAttribute('aria-describedby', id);
    }
    return box;
  }

  function check(input) {
    var rule = RULES[input.name];
    if (!rule) return true;
    var msg = rule(input.value.trim());
    var box = errBox(input);
    box.textContent = msg;
    box.classList.toggle('show', !!msg);
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    return !msg;
  }

  Object.keys(RULES).forEach(function (n) {
    var input = f.elements[n];
    if (!input) return;
    input.addEventListener('blur', function () { if (input.value.trim() || input.dataset.touched) check(input); input.dataset.touched = '1'; });
    input.addEventListener('input', function () { if (input.getAttribute('aria-invalid') === 'true') check(input); });
  });

  var btn = f.querySelector('button[type=submit]');
  var orig = btn ? btn.textContent : '';
  var fail = document.createElement('div');
  fail.className = 'lf-fail';
  fail.setAttribute('role', 'alert');
  if (btn) btn.insertAdjacentElement('beforebegin', fail);

  function showFail(text) { fail.textContent = text; fail.classList.add('show'); }
  function reset() { if (btn) { btn.disabled = false; btn.removeAttribute('aria-busy'); btn.textContent = orig; } }

  f.addEventListener('submit', function (e) {
    e.preventDefault();
    fail.classList.remove('show');
    var bad = null;
    Object.keys(RULES).forEach(function (n) {
      var input = f.elements[n];
      if (input && !check(input) && !bad) bad = input;
    });
    if (bad) { bad.focus(); return; }
    if (btn) { btn.disabled = true; btn.setAttribute('aria-busy', 'true'); btn.textContent = 'Отправляем…'; }
    fetch(f.action, { method: 'POST', body: new FormData(f), headers: { Accept: 'application/json' } })
      .then(function (r) {
        if (!r.ok) throw new Error('status ' + r.status);
        f.classList.add('sent');
        var ok = document.getElementById('lfOk');
        if (ok) {
          ok.innerHTML = '<strong>Заявка у нас</strong>Ответим в течение дня на телефон или в Telegram, который вы указали.';
          ok.classList.add('show');
          ok.setAttribute('tabindex', '-1');
          ok.focus();
        }
        document.dispatchEvent(new CustomEvent('a3:lead-sent'));
      })
      .catch(function (err) {
        reset();
        showFail(/status/.test(String(err))
          ? 'Заявка не дошла: сервис приёма ответил ошибкой. Данные остались в форме — нажмите кнопку ещё раз через минуту.'
          : 'Нет связи с интернетом, заявка не ушла. Данные остались в форме — проверьте подключение и нажмите кнопку ещё раз.');
      });
  });
})();
