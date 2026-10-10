#!/usr/bin/env node
/* GitHub Pages для Foksten — только переадресация на прод.
 *
 * Сайт живёт на российской коробке (деплой/выкатить.sh): зарубежный хостинг
 * ТСПУ обрывает для посетителей из РФ на ~16 КБ. А по адресу
 * silence2111.github.io/ortus/ полгода висела первая версия с canonical на
 * ortus.ru — домен чужой компании. Чтобы старые ссылки и индекс вели на
 * настоящий сайт, Pages отдаёт на каждую страницу маленькую заглушку:
 * canonical + мгновенный переход на ту же страницу прода.
 *
 *   node деплой/pages-переадресация.mjs <папка>   — адрес из site.config.json
 */
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = process.argv[2] || join(ROOT, 'pages');
const origin = (process.env.SITE_ORIGIN || JSON.parse(readFileSync(join(ROOT, 'site.config.json'), 'utf8')).origin || '').trim();
if (!/^https:\/\/[a-z0-9.-]+\.[a-z]{2,}$/i.test(origin)) {
  console.error('Адрес прода не задан или неверный: site.config.json → origin');
  process.exit(1);
}

const stub = (path) => {
  const url = origin + '/' + (path === 'index.html' ? '' : path);
  return `<!doctype html>
<html lang="ru"><head><meta charset="utf-8">
<title>Foksten — сайт переехал</title>
<meta name="robots" content="noindex">
<link rel="canonical" href="${url}">
<meta http-equiv="refresh" content="0; url=${url}">
<script>location.replace(${JSON.stringify(url)} + location.hash)</script>
</head><body><p>Сайт Foksten переехал: <a href="${url}">${url}</a></p></body></html>
`;
};

mkdirSync(out, { recursive: true });
const pages = readdirSync(ROOT).filter((f) => f.endsWith('.html'));
for (const p of pages) writeFileSync(join(out, p), stub(p));
writeFileSync(join(out, '404.html'), stub('index.html'));
writeFileSync(join(out, 'robots.txt'), `User-agent: *\nDisallow: /\n`);
console.log(`Pages: ${pages.length} заглушек → ${origin}`);
