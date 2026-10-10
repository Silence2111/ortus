/* Тесты варианта «Студия» (studio/).
 *
 * «Студия» — своя вёрстка поверх текстов исходных страниц. Здесь проверяется,
 * что она не теряет тексты, не ведёт в никуда, не попадает на витрину для
 * клиентов и держит правила варианта: свои иконки вместо эмодзи, цены как на
 * витрине, честная страница контактов без каналов. */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { buildVars, buildFlags, render, auditOutput } from '../build.mjs';
import { studioPages, parseBase, catalogRows, SERVICES, HERE } from '../studio/studio.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const страницы = readdirSync(ROOT).filter((f) => f.endsWith('.html'));
const читать = (f) => readFileSync(join(ROOT, f), 'utf8');
const пусто = { origin: 'https://demo.invalid', email: '', telegram: '', whatsapp: '', phone: '', legal: '', metrikaId: '', skins: '1' };
const собрать = (cfg = пусто) => studioPages(ROOT).map((p) => ({ ...p, out: render(p.text, buildVars(cfg), buildFlags(cfg)) }));
const studio = собрать();
const текст = (s) => s.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

describe('«Студия» собирается целиком', () => {
  test('у каждой страницы витрины есть страница «Студии»', () => {
    assert.deepEqual(studio.map((p) => p.file).sort(), [...страницы].sort());
  });

  /* Преобразованные страницы берут тексты из исходника. Если разметка
   * исходника поменяется и разбор её не узнает, раздел пропадёт молча —
   * поэтому сверяем заголовки. */
  test('преобразованные страницы не теряют заголовков исходника', () => {
    for (const p of studio) {
      if (existsSync(join(HERE, 'pages', p.file))) continue;
      const base = parseBase(читать(p.file));
      const out = текст(p.out);
      assert.ok(out.includes(текст(base.h1)), `${p.file}: потерян h1 «${текст(base.h1)}»`);
      for (const m of читать(p.file).matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)) {
        assert.ok(out.includes(текст(m[1])), `${p.file}: потерян раздел «${текст(m[1])}»`);
      }
    }
  });

  test('проверки сборки проходят: ни подстановок, ни заглушек, ни href="#"', () => {
    for (const p of studio) assert.deepEqual(auditOutput(p.rel, p.out), [], p.rel);
  });

  test('все иконки нашлись и вставлены', () => {
    for (const p of studio) assert.ok(!p.out.includes('data-i='), `${p.file}: осталась невставленная иконка`);
  });
});

describe('ссылки «Студии»', () => {
  const есть = new Set(readdirSync(ROOT));
  test('каждая ссылка ведёт на страницу «Студии», файл витрины или якорь на странице', () => {
    for (const p of studio) {
      const ids = new Set([...p.out.matchAll(/id="([^"]+)"/g)].map((m) => m[1]));
      for (const m of p.out.matchAll(/(?:href|src)="([^"]*)"/g)) {
        const u = m[1];
        if (/^(https?:|mailto:|tel:|data:|\/\/)/.test(u)) continue;
        assert.ok(u !== '' && u !== '#', `${p.file}: пустая ссылка`);
        if (u.startsWith('#')) { assert.ok(ids.has(u.slice(1)), `${p.file}: якорь ${u} никуда не ведёт`); continue; }
        const путь = u.split('#')[0].split('?')[0];
        if (путь.startsWith('../')) assert.ok(есть.has(путь.slice(3).split('/')[0]), `${p.file}: «${u}» — нет такого файла витрины`);
        else assert.ok(страницы.includes(путь) || ['studio.css', 'studio.js'].includes(путь)
          || (путь.startsWith('fonts/') && existsSync(join(HERE, путь))), `${p.file}: «${u}» — нет такой страницы «Студии»`);
      }
    }
  });

  test('якоря на исходные страницы (index.html#cta) существуют и в «Студии»', () => {
    for (const p of studio) {
      for (const m of p.out.matchAll(/href="([a-z0-9-]+\.html)#([^"]+)"/g)) {
        const цель = studio.find((x) => x.file === m[1]);
        assert.ok(цель && цель.out.includes(`id="${m[2]}"`), `${p.file}: ${m[1]}#${m[2]} — якоря нет`);
      }
    }
  });
});

describe('правила варианта', () => {
  /* Владелец попросил вместо эмодзи спокойные линейные иконки. Системный
   * эмодзи в тексте — это и есть «кричащий» значок, поэтому их нет нигде. */
  test('в «Студии» нет эмодзи — только свои линейные иконки', () => {
    const эмодзи = /(?![©®™])\p{Extended_Pictographic}/u;
    for (const p of studio) {
      const м = текст(p.out.replace(/<script[\s\S]*?<\/script>/g, '')).match(эмодзи);
      assert.equal(м, null, `${p.file}: эмодзи «${м?.[0]}»`);
    }
  });

  test('иконки — без цветной подложки дизайн-системы', () => {
    for (const f of readdirSync(join(HERE, 'icons'))) {
      assert.ok(!/fill="#225AEA"/.test(readFileSync(join(HERE, 'icons', f), 'utf8')), `${f}: осталась синяя подложка`);
    }
  });

  test('цены в карточках услуг — те же, что в списке услуг на главной витрины', () => {
    const цены = new Set(catalogRows(читать('index.html')).map((r) => r.price));
    for (const s of SERVICES) assert.ok(цены.has(s.price), `${s.name}: «${s.price}» нет в «Полном списке услуг»`);
  });

  test('страницы закрыты от индексации и ссылаются canonical на исходные', () => {
    for (const p of studio) {
      assert.match(p.out, /<meta name="robots" content="noindex/, `${p.file}: нет noindex`);
      const c = p.out.match(/<link rel="canonical" href="([^"]+)">/)?.[1] ?? '';
      assert.ok(!c.includes('/studio/'), `${p.file}: canonical ведёт на «Студию»`);
    }
  });

  test('без каналов связи контакты честно говорят про форму и не рисуют пустых ссылок', () => {
    const k = studio.find((p) => p.file === 'kontakty.html').out;
    assert.match(текст(k), /единственный рабочий способ связи это форма/);
    assert.ok(!k.includes('href=""') && !k.includes('mailto:"'));
  });

  test('заданные каналы на контактах становятся рабочими ссылками', () => {
    const cfg = { ...пусто, telegram: '@nick', email: 'hi@x.ru' };
    const k = собрать(cfg).find((p) => p.file === 'kontakty.html').out;
    assert.ok(k.includes('href="https://t.me/nick"'));
    assert.ok(k.includes('href="mailto:hi@x.ru"'));
    assert.ok(!текст(k).includes('единственный рабочий способ связи это форма'));
  });

  test('у каждой формы есть всё, что нужно form.js', () => {
    for (const p of studio) {
      if (!p.out.includes('id="leadForm"')) continue;
      for (const нужно of ['id="lfOk"', 'name="name"', 'name="contact"', 'type="submit"', 'name="_gotcha"']) {
        assert.ok(p.out.includes(нужно), `${p.file}: в форме нет ${нужно}`);
      }
    }
  });
});

describe('«Студия» и витрина для клиентов', () => {
  const собратьВ = (env) => {
    const dir = mkdtempSync(join(tmpdir(), 'a3-dist-'));
    execFileSync(process.execPath, [join(ROOT, 'build.mjs')], { env: { ...process.env, SITE_ORIGIN: 'https://demo.invalid', SITE_DIST: dir, ...env }, stdio: 'pipe' });
    return dir;
  };

  test('с дизайном aurora «Студия» в сборку не попадает', () => {
    const dir = собратьВ({ SITE_SKINS: '', SITE_DESIGN: 'aurora' });
    try { assert.ok(!existsSync(join(dir, 'studio')), 'dist/studio есть в сборке с исходным дизайном'); }
    finally { rmSync(dir, { recursive: true, force: true }); }
  });

  /* С 10.10.2026 «Студия» — основной дизайн. На сайте для клиентов её страницы
   * лежат в корне: без переключателя, без noindex, без путей «../» (они
   * остались бы от стенда и вели бы за пределы сайта). */
  test('основной дизайн «Студия»: страницы в корне, без переключателя и запрета индексации', () => {
    const dir = собратьВ({ SITE_SKINS: '', SITE_DESIGN: 'studio' });
    try {
      const есть = new Set(readdirSync(dir));
      assert.deepEqual(readdirSync(join(dir, 'studio')).sort(), ['fonts', 'studio.css', 'studio.js']);
      assert.ok(!есть.has('skins.js') && !есть.has('skins.css'), 'файлы переключателя попали на сайт');
      for (const f of страницы) {
        const t = readFileSync(join(dir, f), 'utf8');
        assert.match(t, /class="st-nav"/, `${f}: в корне не «Студия»`);
        assert.ok(!/noindex/.test(t), `${f}: страница закрыта от индексации`);
        assert.ok(!/skins\.(js|css)/.test(t), `${f}: подключён переключатель`);
        assert.ok(!/(href|src)="\.\.\//.test(t), `${f}: путь «../» ведёт за пределы сайта`);
        assert.ok(!/fonts\.(googleapis|gstatic)\.com/.test(t), `${f}: шрифт тянется с Google`);
        for (const m of t.matchAll(/(?:href|src)="([^"#][^"]*)"/g)) {
          const u = m[1];
          if (/^(https?:|mailto:|tel:|data:|\/\/)/.test(u)) continue;
          assert.ok(есть.has(u.split('#')[0].split('?')[0].split('/')[0]), `${f}: «${u}» — нет такого файла`);
        }
      }
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });

  test('с переключателем собирается полностью, вместе со стилями и скриптом', () => {
    const dir = собратьВ({ SITE_SKINS: '1' });
    try {
      for (const f of [...страницы, 'studio.css', 'studio.js', 'fonts/wix-madefor-display-cyrillic.woff2']) assert.ok(existsSync(join(dir, 'studio', f)), `нет studio/${f}`);
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });

  test('переключатель знает, что «Студия» — отдельные страницы', () => {
    const js = читать('skins.js');
    assert.match(js, /'studio\/' \+ ФАЙЛ/, 'выбор «Студии» не переводит на её страницу');
    assert.match(js, /'\.\.\/' \+ ФАЙЛ/, 'из «Студии» не вернуться на исходную страницу');
  });
});
