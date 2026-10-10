#!/usr/bin/env node
/* Сборка витрины «Ортус»: исходники + site.config.json → dist/
 *
 * Зачем сборка на статическом сайте без фреймворка. Домен светился в 25 файлах
 * и ~160 местах: canonical, og:url, og:image, JSON-LD, sitemap.xml, robots.txt.
 * Из-за этого первая версия сайта полгода отдавала SEO-разметку на ortus.ru —
 * домен ЧУЖОЙ компании, и никто этого не заметил, потому что править нужно было
 * в двадцати пяти местах. Теперь домен живёт в одной строке, а сборка обязана
 * упасть, если строка пуста.
 *
 * Второй смысл: контакты. Мёртвая ссылка хуже отсутствующей. Незаданный канал
 * связи не рисуется вовсе — вместо кнопки «Telegram», ведущей на «#», не
 * остаётся ничего.
 *
 *   node build.mjs                      — собрать в dist/
 *   SITE_ORIGIN=https://x.ru node build.mjs
 *   node build.mjs --check              — только проверить конфиг, ничего не писать
 *
 * Зависимостей нет и не должно быть: витрину чинят в пять минут перед покупкой
 * домена, npm install в этот момент лишний.
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, copyFileSync, rmSync } from 'node:fs';
import { join, dirname, extname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { studioPages, STUDIO_ASSETS, STUDIO_FONTS } from './studio/studio.mjs';

const ROOT = dirname(fileURLToPath(import.meta.url));
// SITE_DIST — только для тестов: собрать во временную папку, не трогая dist/
const DIST = process.env.SITE_DIST || join(ROOT, 'dist');

/* Из сборки исключено служебное: ПРОДУКТ — рабочие документы прогона, они и в
 * robots.txt закрыты; остальное — сама сборка и её тесты. studio — исходники
 * варианта «Студия», он собирается отдельно и только вместе с переключателем. */
const SKIP = new Set(['.git', 'dist', 'pages', 'node_modules', 'ПРОДУКТ', 'тесты', 'studio', 'деплой', '.DS_Store',
                      'build.mjs', 'site.config.json', 'README.md', '.gitignore',
                      'package.json', '.github']);

/* Подстановка идёт только в текст. Картинки копируются байт в байт. */
const TEXT = new Set(['.html', '.xml', '.txt', '.js', '.css', '.json', '.webmanifest', '.svg']);

/* ── конфиг ───────────────────────────────────────────────────────────────── */

export function readConfig(env = process.env, root = ROOT) {
  let file = {};
  try {
    file = JSON.parse(readFileSync(join(root, 'site.config.json'), 'utf8'));
  } catch (e) {
    if (e.code !== 'ENOENT') throw new Error(`site.config.json не читается: ${e.message}`);
  }
  const pick = (envKey, fileKey) => String(env[envKey] ?? file[fileKey] ?? '').trim();
  return {
    origin:    pick('SITE_ORIGIN', 'origin'),
    email:     pick('SITE_EMAIL', 'email'),
    telegram:  pick('SITE_TELEGRAM', 'telegram'),
    whatsapp:  pick('SITE_WHATSAPP', 'whatsapp'),
    phone:     pick('SITE_PHONE', 'phone'),
    legal:     pick('SITE_LEGAL', 'legal'),
    metrikaId: pick('SITE_METRIKA_ID', 'metrikaId'),
    skins:     pick('SITE_SKINS', 'skins'),
    design:    pick('SITE_DESIGN', 'design') || 'aurora',
  };
}

/* Ссылки собираем из человекочитаемых значений: владелец пишет «@ortus_bot»,
 * а не «https://t.me/ortus_bot». Ошибка в протоколе — самая частая причина
 * мёртвой кнопки. */
function telegramUrl(v) {
  if (!v) return '';
  if (/^https?:\/\//i.test(v)) return v;
  return 'https://t.me/' + v.replace(/^@/, '');
}
function whatsappUrl(v) {
  if (!v) return '';
  if (/^https?:\/\//i.test(v)) return v;
  return 'https://wa.me/' + v.replace(/\D/g, '');
}
function telHref(v) {
  return v ? '+' + v.replace(/\D/g, '') : '';
}

export function validate(cfg) {
  const errors = [];
  if (!cfg.origin) {
    errors.push('SITE_ORIGIN не задан. Пока домена нет, собирать нечего: canonical, og:url ' +
                'и sitemap.xml должны указывать на настоящий адрес, иначе они врут. ' +
                'Вписать в site.config.json → "origin" или передать SITE_ORIGIN=https://…');
  } else {
    if (!/^https:\/\/[a-z0-9.-]+\.[a-z]{2,}$/i.test(cfg.origin)) {
      errors.push(`SITE_ORIGIN = «${cfg.origin}» — нужен вид https://домен.ру: только https, ` +
                  'без слеша на конце, без пути и без порта.');
    }
    // Домен предыдущего владельца разметки. Отдельная проверка, а не общая —
    // именно эта ошибка уже случилась и стоила полугода индексации.
    if (/(^|\.)ortus\.ru$/i.test(cfg.origin.replace(/^https:\/\//, ''))) {
      errors.push('SITE_ORIGIN = ortus.ru — это домен ДРУГОЙ компании (сервисная книжка ' +
                  'автомобиля, сайт на Tilda). Сюда его вписывать нельзя.');
    }
  }
  if (cfg.email && !/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(cfg.email)) {
    errors.push(`SITE_EMAIL = «${cfg.email}» — не похоже на адрес почты.`);
  }
  if (cfg.design && !['aurora', 'studio'].includes(cfg.design)) {
    errors.push(`SITE_DESIGN = «${cfg.design}» — бывает aurora (исходные страницы) или studio.`);
  }
  if (cfg.metrikaId && !/^\d{5,10}$/.test(cfg.metrikaId)) {
    errors.push(`SITE_METRIKA_ID = «${cfg.metrikaId}» — номер счётчика это только цифры.`);
  }
  return errors;
}

/* ── шаблонизация ─────────────────────────────────────────────────────────── */

export function buildVars(cfg) {
  return {
    SITE_ORIGIN: cfg.origin,
    CONTACT_EMAIL: cfg.email,
    TELEGRAM_URL: telegramUrl(cfg.telegram),
    TELEGRAM_HANDLE: cfg.telegram.startsWith('@') ? cfg.telegram
                     : cfg.telegram ? '@' + cfg.telegram.replace(/^https?:\/\/t\.me\//i, '') : '',
    WHATSAPP_URL: whatsappUrl(cfg.whatsapp),
    PHONE: cfg.phone,
    PHONE_HREF: telHref(cfg.phone),
    LEGAL: cfg.legal,
    METRIKA_ID: cfg.metrikaId,
  };
}

export function buildFlags(cfg) {
  const f = {
    // Переключатель вариантов дизайна — только для показа себе: на витрине
    // для клиентов его быть не должно, поэтому по умолчанию выключен.
    skins: cfg.skins === '1' || cfg.skins === 'true',
    telegram: !!cfg.telegram,
    whatsapp: !!cfg.whatsapp,
    phone: !!cfg.phone,
    email: !!cfg.email,
    legal: !!cfg.legal,
  };
  // Синтетический флаг: есть ли вообще хоть один прямой канал связи. Нужен,
  // чтобы на странице контактов не оставалось пустой сетки без объяснения.
  f.channels = f.telegram || f.whatsapp || f.phone || f.email;
  return f;
}

export function render(text, vars, flags) {
  let out = text;
  // Условные блоки — до подстановки: иначе в вырезаемый кусок успеют попасть
  // пустые значения и мы получим href="" вместо отсутствующей ссылки.
  for (const [key, on] of Object.entries(flags)) {
    const keep = (_m, body) => body;
    const drop = () => '';
    out = out.replace(new RegExp(`<!--IF:${key}-->([\\s\\S]*?)<!--/IF:${key}-->`, 'g'), on ? keep : drop);
    out = out.replace(new RegExp(`<!--IFNOT:${key}-->([\\s\\S]*?)<!--/IFNOT:${key}-->`, 'g'), on ? drop : keep);
  }
  for (const [name, value] of Object.entries(vars)) {
    out = out.replaceAll(`{{${name}}}`, value);
  }
  return out;
}

/* Проверка результата, а не исходника. Смысл: даже если кто-то добавит новую
 * страницу с новым placeholder-ом или вернёт домен руками, сборка это поймает. */
export function auditOutput(path, text) {
  const problems = [];
  const left = text.match(/\{\{[A-Z_]+\}\}/g);
  if (left) problems.push(`${path}: не подставлено ${[...new Set(left)].join(', ')}`);
  if (/<!--\/?IF(NOT)?:/.test(text)) problems.push(`${path}: остались маркеры условных блоков`);
  // Граница слева нужна, чтобы не ловить ortusdigital.ru как ortus.ru.
  if (/(^|[^a-z0-9-])ortus\.ru/i.test(text)) {
    problems.push(`${path}: в готовой странице есть ortus.ru — это домен чужой компании`);
  }
  if (/href="#"/.test(text)) problems.push(`${path}: ссылка href="#" — кнопка в никуда`);
  // Перечислены ровно те заглушки, которые в этом проекте уже доезжали до
  // публикации. Ловить просто слово «placeholder» нельзя: это ещё и штатный
  // атрибут полей формы.
  const stubs = [
    [/\+7\s?\(?0{3}\)?[\s-]?0{3}/, 'телефон-заглушка +7 (000) …'],
    [/\+7 0{10}/, 'телефон-заглушка +70000000000'],
    [/Фамилия И\. ?О\./i, 'реквизиты «ИП Фамилия И. О.»'],
    [/ИНН 0{6,}/, 'ИНН из нулей'],
    [/—\s*placeholder/i, 'подпись «— placeholder»'],
    [/ваш_аккаунт/i, 'ник @ваш_аккаунт'],
    [/Прототип сайта/i, 'заголовок «Прототип сайта»'],
  ];
  for (const [re, what] of stubs) {
    if (re.test(text)) problems.push(`${path}: ${what}`);
  }
  return problems;
}

/* ── обход дерева ─────────────────────────────────────────────────────────── */

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, acc);
    else acc.push(p);
  }
  return acc;
}

function main() {
  const cfg = readConfig();
  const errors = validate(cfg);
  if (errors.length) {
    console.error('\nСборка остановлена — витрина врала бы о себе:\n');
    for (const e of errors) console.error('  • ' + e);
    console.error('');
    process.exit(1);
  }

  const vars = buildVars(cfg);
  const flags = buildFlags(cfg);

  if (process.argv.includes('--check')) {
    console.log('Конфиг в порядке. Домен:', cfg.origin);
    console.log('Каналы связи:', Object.entries(flags).filter(([k, v]) => v && k !== 'channels')
      .map(([k]) => k).join(', ') || 'нет ни одного — на витрине будет только форма');
    if (!cfg.metrikaId) console.log('Метрика выключена: metrikaId пуст.');
    return;
  }

  rmSync(DIST, { recursive: true, force: true });
  const files = walk(ROOT);
  const problems = [];
  let text = 0, bin = 0;

  // На сайте для клиентов переключателя нет — и его файлов тоже.
  const skinFiles = new Set(['skins.css', 'skins.js']);
  for (const src of files) {
    const rel = relative(ROOT, src);
    if (!flags.skins && skinFiles.has(rel)) continue;
    const dst = join(DIST, rel);
    mkdirSync(dirname(dst), { recursive: true });
    if (TEXT.has(extname(src).toLowerCase())) {
      const out = render(readFileSync(src, 'utf8'), vars, flags);
      problems.push(...auditOutput(rel, out));
      writeFileSync(dst, out);
      text++;
    } else {
      copyFileSync(src, dst);
      bin++;
    }
  }

  /* «Студия»: на стенде (SITE_SKINS=1) — отдельный набор страниц в
   * dist/studio/ рядом с исходными; на сайте для клиентов при design=studio —
   * основной дизайн, её страницы ложатся в корень поверх исходных. */
  let studio = 0;
  const studioPlace = flags.skins ? 'stand' : cfg.design === 'studio' ? 'root' : '';
  if (studioPlace) {
    for (const { rel, text } of studioPages(ROOT, studioPlace)) {
      const out = render(text, vars, flags);
      problems.push(...auditOutput(rel, out));
      mkdirSync(dirname(join(DIST, rel)), { recursive: true });
      writeFileSync(join(DIST, rel), out);
      studio++;
    }
    mkdirSync(join(DIST, 'studio', 'fonts'), { recursive: true });
    for (const a of STUDIO_ASSETS) {
      writeFileSync(join(DIST, 'studio', a), render(readFileSync(join(ROOT, 'studio', a), 'utf8'), vars, flags));
    }
    for (const f of STUDIO_FONTS) copyFileSync(join(ROOT, 'studio', 'fonts', f), join(DIST, 'studio', 'fonts', f));
  }

  if (problems.length) {
    console.error('\nСобрано, но результат публиковать нельзя:\n');
    for (const p of problems) console.error('  • ' + p);
    console.error('');
    process.exit(1);
  }

  console.log(`dist/ готов: ${text} текстовых файлов, ${bin} файлов без изменений.`);
  if (studio && studioPlace === 'stand') console.log(`Стенд: все варианты, «Студия» — страниц в dist/studio/: ${studio}.`);
  if (studio && studioPlace === 'root') console.log(`Дизайн «Студия»: страниц в корне: ${studio}.`);
  console.log(`Домен: ${cfg.origin}`);
  if (!flags.channels) console.log('Прямых контактов нет — на странице контактов только форма.');
  if (!cfg.metrikaId) console.log('Метрика выключена.');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
