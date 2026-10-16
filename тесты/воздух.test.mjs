/* Тесты дизайна «Воздух» (vozduh/) — основного дизайна foksten.ru с 16.10.2026.
 *
 * Проверяется то же, что у «Студии» (страница на каждый исходник, тексты не
 * теряются, ссылки не ведут в никуда, формы годятся для form.js, на сайте для
 * клиентов всё в корне и индексируется), плюс главное правило «Воздуха»:
 * цены на главной, в карточках и в смете — ровно тарифы со страниц услуг. */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { buildVars, buildFlags, render, auditOutput } from '../build.mjs';
import { vozduhPages, tiersOf, VOZDUH_SERVICES } from '../vozduh/vozduh.mjs';
import { parseBase } from '../studio/studio.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const страницы = readdirSync(ROOT).filter((f) => f.endsWith('.html'));
const читать = (f) => readFileSync(join(ROOT, f), 'utf8');
const пусто = { origin: 'https://demo.invalid', email: '', telegram: '', whatsapp: '', phone: '', legal: '', metrikaId: '', skins: '' };
const собрать = (cfg = пусто) => vozduhPages(ROOT).map((p) => ({ ...p, out: render(p.text, buildVars(cfg), buildFlags(cfg)) }));
const vz = собрать();
const по = (f) => vz.find((p) => p.file === f).out;
const текст = (s) => s.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

describe('«Воздух» собирается целиком', () => {
  test('у каждой страницы сайта есть страница «Воздуха»', () => {
    assert.deepEqual(vz.map((p) => p.file).sort(), [...страницы].sort());
  });

  test('преобразованные страницы не теряют заголовок и разделы исходника', () => {
    const ручные = ['index.html', 'uslugi.html', 'cases.html', 'o-nas.html', 'kontakty.html'];
    for (const f of страницы.filter((x) => !ручные.includes(x))) {
      const d = parseBase(читать(f));
      const out = текст(по(f));
      assert.ok(out.includes(текст(d.h1)), `${f}: потерян заголовок «${текст(d.h1)}»`);
      for (const s of d.sections) if (s.head) assert.ok(out.includes(текст(s.head.h2)), `${f}: потерян раздел «${текст(s.head.h2)}»`);
    }
  });

  test('проверки сборки проходят: ни подстановок, ни заглушек, ни href="#"', () => {
    for (const p of vz) assert.deepEqual(auditOutput(p.rel, p.out), [], p.file);
  });

  test('у каждой формы есть всё, что нужно form.js', () => {
    for (const p of vz) {
      if (!p.out.includes('id="leadForm"')) continue;
      for (const нужно of ['id="lfOk"', 'name="name"', 'name="contact"', 'type="submit"', 'name="_gotcha"']) {
        assert.ok(p.out.includes(нужно), `${p.file}: в форме нет ${нужно}`);
      }
    }
  });
});

describe('цены — только из тарифов на страницах услуг', () => {
  test('карточка каждой услуги показывает первый тариф своей страницы', () => {
    const uslugi = по('uslugi.html');
    for (const s of VOZDUH_SERVICES) {
      const t = tiersOf(читать(s.file))[0];
      const карточка = uslugi.match(new RegExp(`<a class="vz-tile[^"]*" href="${s.file}"[\\s\\S]*?</a>`));
      assert.ok(карточка, `нет карточки ${s.file}`);
      assert.ok(карточка[0].includes(t.price) && карточка[0].includes(t.name), `${s.file}: в карточке не «${t.name} ${t.price}»`);
    }
  });

  test('прайс на главной — все тарифы страниц разработки', () => {
    const home = текст(по('index.html'));
    for (const f of ['razrabotka-sajtov.html', 'ii-avtomatizaciya.html', 'prilozheniya.html', 'vnedrenie-1c.html']) {
      for (const t of tiersOf(читать(f))) assert.ok(home.includes(t.name) && home.includes(t.price), `${f}: на главной нет «${t.name} — ${t.price}»`);
    }
  });

  test('смета считает по тем же тарифам', () => {
    const home = по('index.html');
    const значения = [...home.matchAll(/name="calc-\d" value="(\d+)" data-name="([^"]+)"/g)].filter((m) => +m[1] > 0);
    assert.ok(значения.length >= 8, 'в смете меньше восьми вариантов');
    const все = VOZDUH_SERVICES.flatMap((s) => tiersOf(читать(s.file)));
    for (const [, v, имя] of значения) {
      const t = все.find((x) => x.name === имя.replace(/&quot;/g, '"').replace(/&amp;/g, '&'));
      assert.ok(t, `в смете тариф «${имя}», которого нет на страницах`);
      assert.equal(+v, Number(t.price.match(/\d[\d\s]*/)[0].replace(/\s/g, '')), `«${имя}»: в смете ${v}, на странице ${t.price}`);
    }
  });
});

describe('честность', () => {
  test('без каналов связи контакты честно говорят про форму и не рисуют пустых ссылок', () => {
    const k = по('kontakty.html');
    assert.match(k, /рабочий способ связи один: форма/);
    assert.ok(!/href="(tel:|mailto:)?"/.test(k), 'пустая ссылка на канал связи');
  });

  test('заданные каналы на контактах становятся рабочими ссылками', () => {
    const cfg = { ...пусто, telegram: '@foksten_test', email: 'hello@foksten.ru' };
    const k = собрать(cfg).find((p) => p.file === 'kontakty.html').out;
    assert.match(k, /href="https:\/\/t\.me\/foksten_test"/);
    assert.match(k, /href="mailto:hello@foksten\.ru"/);
  });

  test('свои продукты — ссылки на живые домены, а не заглушки', () => {
    const home = по('index.html');
    for (const d of ['ratespot.ru', 'pervyschet.ru', 'naimspot.ru']) assert.match(home, new RegExp(`href="https://${d.replace('.', '\\.')}"`), `нет ссылки на ${d}`);
  });
});

describe('«Воздух» как основной дизайн сайта', () => {
  const собратьВ = (env) => {
    const dir = mkdtempSync(join(tmpdir(), 'foksten-dist-'));
    execFileSync(process.execPath, [join(ROOT, 'build.mjs')], { env: { ...process.env, SITE_ORIGIN: 'https://demo.invalid', SITE_DIST: dir, ...env }, stdio: 'pipe' });
    return dir;
  };

  test('страницы в корне, индексируются, все пути внутри сайта, шрифты свои', () => {
    const dir = собратьВ({ SITE_SKINS: '', SITE_DESIGN: 'vozduh' });
    try {
      const есть = new Set(readdirSync(dir));
      assert.deepEqual(readdirSync(join(dir, 'vozduh')).sort(), ['fonts', 'vozduh.css', 'vozduh.js']);
      for (const f of страницы) {
        const t = readFileSync(join(dir, f), 'utf8');
        assert.match(t, /class="vz-top"/, `${f}: в корне не «Воздух»`);
        assert.ok(!/noindex/.test(t), `${f}: страница закрыта от индексации`);
        assert.ok(!/(href|src)="\.\.\//.test(t), `${f}: путь «../» ведёт за пределы сайта`);
        assert.ok(!/fonts\.(googleapis|gstatic)\.com/.test(t), `${f}: шрифт тянется с Google`);
        for (const m of t.matchAll(/(?:href|src)="([^"#][^"]*)"/g)) {
          const u = m[1];
          if (/^(https?:|mailto:|tel:|data:|\/\/)/.test(u)) continue;
          assert.ok(есть.has(u.split('#')[0].split('?')[0].split('/')[0]), `${f}: «${u}» — нет такого файла`);
        }
        for (const m of t.matchAll(/href="(?:([a-z0-9-]+\.html))?#([a-z0-9-]+)"/g)) {
          const цель = m[1] ? readFileSync(join(dir, m[1]), 'utf8') : t;
          assert.ok(цель.includes(`id="${m[2]}"`), `${f}: якорь «${m[0]}» ведёт в никуда`);
        }
      }
      const css = readFileSync(join(dir, 'vozduh', 'vozduh.css'), 'utf8');
      for (const m of css.matchAll(/url\((fonts\/[^)]+)\)/g)) assert.ok(existsSync(join(dir, 'vozduh', m[1])), `нет файла ${m[1]}`);
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });

  test('конфиг сайта выбирает «Воздух»', () => {
    assert.equal(JSON.parse(читать('site.config.json')).design, 'vozduh');
  });
});
