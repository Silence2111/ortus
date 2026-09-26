/* Тесты витрины «Ортус».
 *
 * Запуск: node --test тесты/
 *
 * Здесь проверяется не «работает ли код» — кода почти нет, это статика.
 * Здесь проверяется, НЕ ВРЁТ ЛИ САЙТ. Каждый тест закрывает ошибку, которая
 * в этом проекте уже случилась и дожила до публикации.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readConfig, validate, buildVars, buildFlags, render, auditOutput } from '../build.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const страницы = readdirSync(ROOT).filter((f) => f.endsWith('.html'));
const читать = (f) => readFileSync(join(ROOT, f), 'utf8');

describe('чужой домен', () => {
  /* Полгода canonical, og:url и sitemap.xml вели на ortus.ru — домен другой
   * компании (сервисная книжка автомобиля на Tilda). То есть индексация и все
   * репосты работали на чужой бренд. Этот тест — чтобы такое не вернулось
   * ни в разметку, ни в тексты, ни в карту сайта. */
  test('ortus.ru не встречается ни в одном исходнике', () => {
    const файлы = readdirSync(ROOT).filter((f) => /\.(html|xml|txt|js|css|json)$/.test(f));
    for (const f of файлы) {
      assert.ok(!/(^|[^a-z0-9-])ortus\.ru/i.test(читать(f)), `${f}: вернулся чужой домен ortus.ru`);
    }
  });

  test('сборка отказывается собирать на чужой домен', () => {
    const ошибки = validate({ origin: 'https://ortus.ru', email: '', metrikaId: '' });
    assert.ok(ошибки.some((e) => e.includes('ДРУГОЙ компании')), 'ortus.ru прошёл валидацию');
  });

  /* Домен не должен быть зашит в страницах — иначе замена опять станет
   * поиском по двадцати пяти файлам, и опять что-то забудут. */
  test('абсолютных адресов в исходниках нет — только параметр {{SITE_ORIGIN}}', () => {
    for (const f of [...страницы, 'sitemap.xml', 'robots.txt']) {
      const свои = читать(f).match(/https:\/\/(?!schema\.org|formspree\.io|mc\.yandex\.ru|fonts\.|www\.w3\.org|ogp\.me|commons\.wikimedia\.org)[a-z0-9.-]+\.[a-z]{2,}/gi);
      assert.equal(свои, null, `${f}: зашит абсолютный адрес ${свои}`);
    }
  });
});

describe('сборка без домена', () => {
  /* Пустой домен — это не «соберём и потом поправим». Собранный сайт с
   * canonical="/" или с недоменом ломает индексацию молча, поэтому падаем. */
  test('без SITE_ORIGIN сборка сообщает причину и не собирает', () => {
    const ошибки = validate({ origin: '', email: '', metrikaId: '' });
    assert.equal(ошибки.length, 1);
    assert.match(ошибки[0], /canonical/);
  });

  test('домен со слешем, с путём или на http отклоняется', () => {
    for (const плохой of ['https://ortusdigital.ru/', 'https://ortusdigital.ru/sub',
                          'http://ortusdigital.ru', 'ortusdigital.ru', 'https://localhost:8080']) {
      assert.ok(validate({ origin: плохой, email: '', metrikaId: '' }).length > 0,
                `${плохой} почему-то прошёл`);
    }
  });

  test('нормальный домен проходит', () => {
    assert.deepEqual(validate({ origin: 'https://ortusdigital.ru', email: '', metrikaId: '' }), []);
  });
});

describe('контакты: мёртвая ссылка хуже отсутствующей', () => {
  const пусто = { origin: 'https://x.ru', email: '', telegram: '', whatsapp: '', phone: '', legal: '', metrikaId: '' };

  /* На странице контактов стояли три карточки-канала: Telegram и WhatsApp с
   * href="#" и почта на домене, которого никто не купил. Посетитель кликал
   * и не попадал никуда — при том, что это единственная страница, ради которой
   * на сайт и заходят. */
  test('незаданный канал не превращается в ссылку в никуда', () => {
    const вышло = render(читать('kontakty.html'), buildVars(пусто), buildFlags(пусто));
    assert.ok(!вышло.includes('href="#"'), 'осталась кнопка в никуда');
    assert.ok(!вышло.includes('href=""'), 'осталась пустая ссылка');
    assert.ok(!вышло.includes('mailto:"'), 'осталось пустое mailto');
    assert.ok(!вышло.includes('<h3>Telegram</h3>'), 'карточка Telegram осталась без адреса');
  });

  test('когда каналов нет вообще, страница это признаёт', () => {
    const вышло = render(читать('kontakty.html'), buildVars(пусто), buildFlags(пусто));
    assert.match(вышло, /единственный рабочий способ связи это форма/);
  });

  test('заданные каналы превращаются в рабочие ссылки', () => {
    const cfg = { ...пусто, email: 'hi@x.ru', telegram: '@nick', whatsapp: '+7 999 111-22-33', phone: '+7 999 111-22-33' };
    const вышло = render(читать('kontakty.html'), buildVars(cfg), buildFlags(cfg));
    assert.ok(вышло.includes('href="https://t.me/nick"'));
    assert.ok(вышло.includes('href="https://wa.me/79991112233"'));
    assert.ok(вышло.includes('href="tel:+79991112233"'));
    assert.ok(вышло.includes('href="mailto:hi@x.ru"'));
    assert.ok(!вышло.includes('единственный рабочий способ связи это форма'));
  });

  /* Владелец впишет «@nick», а не «https://t.me/nick» — и это нормально.
   * Ссылка должна собираться сама, иначе мёртвая кнопка вернётся. */
  test('ник без протокола всё равно даёт рабочий адрес', () => {
    assert.equal(buildVars({ ...пусто, telegram: 'nick' }).TELEGRAM_URL, 'https://t.me/nick');
    assert.equal(buildVars({ ...пусто, telegram: 'https://t.me/nick' }).TELEGRAM_URL, 'https://t.me/nick');
  });
});

describe('заглушки', () => {
  /* «ИП Фамилия И. О. · ИНН 000000000000 · реквизиты — placeholder» стояло
   * прямо в видимом тексте страницы контактов, а телефон-заглушка
   * +7 (000) 000-00-00 был живой ссылкой tel:. */
  test('в исходниках не осталось заглушек, которые уже доезжали до публикации', () => {
    for (const f of страницы) {
      const проблемы = auditOutput(f, читать(f)).filter((p) => !p.includes('не подставлено') && !p.includes('маркеры'));
      assert.deepEqual(проблемы, [], проблемы.join('; '));
    }
  });

  test('слово «прототип» не вернулось в заголовки и мета', () => {
    for (const f of страницы) {
      const t = читать(f);
      const заголовок = t.match(/<title>(.*?)<\/title>/s)?.[1] ?? '';
      assert.ok(!/прототип/i.test(заголовок), `${f}: в <title> снова «прототип»`);
      for (const m of t.matchAll(/<meta property="og:(title|description)" content="([^"]*)"/g)) {
        assert.ok(!/прототип сайта/i.test(m[2]), `${f}: og:${m[1]} снова про прототип`);
      }
    }
  });
});

describe('ссылки внутри сайта', () => {
  /* Главная кнопка «Обсудить проект» на восьми страницах вела на #cta,
   * которого на этих страницах нет. Единственный призыв к действию
   * не делал ничего. */
  test('каждый href="#якорь" ведёт на существующий id', () => {
    for (const f of страницы) {
      const t = читать(f);
      const ids = new Set([...t.matchAll(/id="([^"]+)"/g)].map((m) => m[1]));
      for (const m of new Set([...t.matchAll(/href="#([^"]+)"/g)].map((m) => m[1]))) {
        assert.ok(ids.has(m), `${f}: якорь #${m} никуда не ведёт`);
      }
    }
  });

  test('каждая внутренняя ссылка ведёт на существующий файл', () => {
    const свои = new Set(readdirSync(ROOT));
    for (const f of страницы) {
      for (const m of читать(f).matchAll(/(?:href|src)="([^"#][^"]*)"/g)) {
        const u = m[1];
        if (/^(https?:|mailto:|tel:|data:|\/\/|\{\{)/.test(u)) continue;
        const путь = u.split('#')[0].split('?')[0];
        if (!путь) continue;
        const первый = путь.split('/')[0];
        assert.ok(свои.has(первый), `${f}: ссылка «${u}» ведёт на несуществующий файл`);
      }
    }
  });
});

describe('аналитика', () => {
  /* Счётчик не должен быть «кнопкой без механизма»: либо считает, либо
   * не грузится. Отдельно проверяем, что несобранный analytics.js не начнёт
   * инициализировать Метрику строкой «{{METRIKA_ID}}». */
  test('несобранный analytics.js не шлёт ничего наружу', () => {
    const js = читать('analytics.js');
    assert.match(js, /METRIKA_ID\.charAt\(0\) === '\{'/, 'нет защиты от несобранного файла');
    const строка = js.match(/var METRIKA_ID = '([^']*)'/)[1];
    assert.equal(строка, '{{METRIKA_ID}}', 'номер счётчика зашит в файл вместо параметра');
  });

  test('номер счётчика проверяется на вид', () => {
    assert.ok(validate({ origin: 'https://x.ru', email: '', metrikaId: 'ym-98765432' }).length > 0);
    assert.deepEqual(validate({ origin: 'https://x.ru', email: '', metrikaId: '98765432' }), []);
  });
});

describe('карта сайта и robots', () => {
  test('в карте сайта столько же адресов, сколько публичных страниц', () => {
    const карта = читать('sitemap.xml');
    const адреса = [...карта.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    assert.equal(адреса.length, страницы.length, 'карта разошлась со списком страниц');
    for (const a of адреса) assert.match(a, /^\{\{SITE_ORIGIN\}\}/);
  });

  test('robots указывает на карту сайта через параметр домена', () => {
    assert.match(читать('robots.txt'), /Sitemap: \{\{SITE_ORIGIN\}\}\/sitemap\.xml/);
  });
});

describe('переопределение конфига', () => {
  /* Покупка домена должна быть последним шагом на пять минут: одна переменная
   * окружения, без правки файлов в репозитории. */
  test('переменная окружения перебивает site.config.json', () => {
    const cfg = readConfig({ SITE_ORIGIN: 'https://из-окружения.ru' }, ROOT);
    assert.equal(cfg.origin, 'https://из-окружения.ru');
  });
});
