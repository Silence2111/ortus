/* Вариант «Студия» — отдельная вёрстка поверх тех же текстов.
 *
 * Остальные варианты в переключателе — палитры над одной разметкой. «Студии»
 * этого мало: её приёмы (заголовки-сомнения, реплики между разделами, плитки
 * в шапке, карусель услуг, плита кейса) требуют другой разметки. Поэтому
 * «Студия» собирается в dist/studio/ как свой набор страниц:
 *
 *   — главная, услуги, работы, «О нас» и контакты свёрстаны руками
 *     (studio/pages/*.html — только содержимое <main>);
 *   — остальные страницы (12 услуг, оффер ИЖС, блог, партнёрам, политика)
 *     получаются преобразованием исходной страницы: тексты берутся из неё,
 *     поэтому правка текста в исходнике сама доезжает до «Студии».
 *
 * С 10.10.2026 «Студия» — основной дизайн сайта (site.config.json → design):
 * обычная сборка кладёт её страницы в корень вместо исходных. Сборка стенда
 * (SITE_SKINS=1) по-прежнему держит все варианты рядом: исходные в корне,
 * «Студию» в studio/ с noindex — чтобы их можно было сравнить в любой момент.
 *
 * Иконки — studio/icons, линейные из дизайн-системы без цветной подложки.
 * В разметке пишется <i data-i="имя"></i>, сборка вставляет SVG. */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HERE = dirname(fileURLToPath(import.meta.url));

/* ── иконки ───────────────────────────────────────────────────────────────── */

const iconCache = new Map();
export function icon(name, cls = '') {
  if (!iconCache.has(name)) {
    const p = join(HERE, 'icons', name + '.svg');
    if (!existsSync(p)) throw new Error(`studio: нет иконки «${name}» (studio/icons/${name}.svg)`);
    // размер и толщину линии задаёт CSS — снимаем их только с корневого <svg>,
    // у прямоугольников внутри width/height — это геометрия
    iconCache.set(name, readFileSync(p, 'utf8').trim()
      .replace(/^<svg[^>]*>/, (tag) => tag.replace(/\s(width|height|stroke-width)="[\d.]+"/g, '')));
  }
  return iconCache.get(name).replace('<svg ', `<svg class="st-i${cls ? ' ' + cls : ''}" aria-hidden="true" focusable="false" `);
}
const expandIcons = (html) =>
  html.replace(/<i data-i="([a-z-]+)"(?: class="([^"]*)")?><\/i>/g, (_m, n, c) => icon(n, c));

/* «**ключевые слова**» → два веса в одной фразе, главный приём текста студии */
const two = (s) => s.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
const strip = (s) => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

/* ── данные услуг ─────────────────────────────────────────────────────────────
 * Описания — те же, что на главной исходной витрины, с выделенными словами.
 * Цена — строка из «Полного списка услуг» исходной главной: тест сверяет, что
 * она там есть, чтобы цены «Студии» не разъехались с витриной. */
export const SERVICES = [
  { file: 'razrabotka-sajtov.html', name: 'Сайты и лендинги', icon: 'laptop', tags: ['Лендинги', 'Магазины'],
    text: 'Продающие **сайты, порталы и магазины**. Быстро и **на заявки**, а не на красоту.',
    when: ['clock', 'от 5 дней'], price: 'от 40 000 ₽' },
  { file: 'ii-avtomatizaciya.html', name: 'ИИ-боты и автоматизация', icon: 'sparkles', tags: ['Боты', 'Интеграции'],
    text: 'Чат-боты и **ассистенты по вашей базе знаний**, автоматизация рутины и **интеграции**.',
    when: ['clock', 'старт за 48 ч'], price: 'от 60 000 ₽' },
  { file: 'seo.html', name: 'SEO и GEO', icon: 'search', tags: ['Яндекс', 'Нейросети'],
    text: 'Трафик **из поиска и нейросетей**. Растим заявки **вдолгую**, а не позиции ради позиций.',
    when: ['chart-up', 'отчёт каждый месяц'], price: 'от 40 000 ₽/мес' },
  { file: 'reklama-marketplace.html', name: 'Реклама на WB и Ozon', icon: 'cart', tags: ['WB', 'Ozon'],
    text: 'Внутренняя реклама и контент карточек. **Отчёт по ДРР каждую неделю**, а не «мы поработали».',
    when: ['clock', '2–3 недели до данных'], price: 'от 45 000 ₽/мес' },
  { file: 'telegram-ads.html', name: 'Telegram Ads', icon: 'send', tags: ['Ads', 'Посевы'],
    text: 'Реклама и посевы у блогеров. **Маркировка erid и рекламный сбор — на нас**.',
    when: ['clock', '2–4 недели до результата'], price: 'от 50 000 ₽/мес' },
  { file: 'kontekst-target.html', name: 'Директ и таргет', icon: 'target', tags: ['Директ', 'VK'],
    text: 'Яндекс Директ и **таргет в VK**: настройка, ведение и **аналитика по заявкам**.',
    when: ['clock', 'от 3 дней до заявок'], price: 'от 40 000 ₽/мес' },
  { file: 'smm.html', name: 'SMM и контент', icon: 'chat', tags: ['VK', 'Telegram'],
    text: 'Соцсети, UGC и Reels — **живой контент, который продаёт**, а не собирает лайки.',
    when: ['calendar', '2–4 поста в неделю'], price: 'от 45 000 ₽/мес' },
  { file: 'prodyusirovanie.html', name: 'Продюсирование', icon: 'play', tags: ['Эксперты', 'Школы'],
    text: '**Личный бренд эксперта**, видео и запуск **онлайн-школы под ключ**.',
    when: ['clock', 'старт за 48 ч'], price: 'от 100 000 ₽' },
  { file: 'dizajn.html', name: 'Дизайн и брендинг', icon: 'write', tags: ['Айдентика', 'UX/UI'],
    text: 'Логотип, фирстиль и интерфейсы — **айдентика, за которой видно уровень бизнеса**.',
    when: ['layers', 'от лого до бренда'], price: 'от 30 000 ₽' },
  { file: 'vnedrenie-1c.html', name: 'Внедрение 1С', icon: 'database', tags: ['Учёт', 'Маркетплейсы'],
    text: 'Настройка и доработка 1С, **связка с сайтом, CRM и маркетплейсами**.',
    when: ['clock', 'старт за 48 ч'], price: 'от 50 000 ₽' },
  { file: 'prilozheniya.html', name: 'Приложения и MVP', icon: 'phone', tags: ['iOS', 'Android'],
    text: 'Мобильные и веб-приложения, **MVP для стартапа**, доработка CRM и внутренних систем.',
    when: ['layers', 'дизайн, код, запуск'], price: 'от 300 000 ₽' },
  { file: 'it-autsors.html', name: 'IT-аутсорс', icon: 'server', tags: ['Серверы', 'Поддержка'],
    text: 'Сисадмин, серверы, почта и телефония — **IT-отдел без своего штата**.',
    when: ['shield', 'мониторинг 24/7'], price: 'от 15 000 ₽/мес' },
];
const SVC = Object.fromEntries(SERVICES.map((s) => [s.file, s]));

/* Иконка в пилюле заголовка — по странице */
const PAGE_ICON = {
  ...Object.fromEntries(SERVICES.map((s) => [s.file, s.icon])),
  'potok-izhs.html': 'house', 'partnyoram.html': 'handshake', 'blog.html': 'book',
  'blog-cena-sajta.html': 'percent', 'blog-ii-chat-bot.html': 'sparkles', 'blog-wb-kartochka.html': 'cart',
};

/* Пары свечения (st-glow--*) — по кругу, чтобы соседние плиты и страницы
 * различались. Цвет живёт только в свечении, не в заливке. */
const TINTS = ['blue', 'violet', 'peach', 'mint', 'rose', 'sky'];
const tintOf = (file) => TINTS[[...file].reduce((a, c) => a + c.charCodeAt(0), 0) % TINTS.length];

/* ── блоки, которые повторяются на ручных страницах ───────────────────────── */

const arrow = (dir = 'right') => icon('arrow-' + dir, 'st-i--arrow');

function servicesCarousel() {
  return SERVICES.map((s, i) => `
      <article class="st-svc" data-reveal>
        <a class="st-svc__plate st-glow st-glow--${TINTS[i % TINTS.length]}" href="${s.file}">
          <span class="st-svc__tags">${s.tags.map((t) => `<span>${t}</span>`).join('')}</span>
          <span class="st-svc__ico st-glass">${icon(s.icon)}</span>
          <span class="st-svc__name">${s.name}</span>
          <span class="st-svc__go" aria-hidden="true">${arrow()}</span>
        </a>
        <p class="st-svc__text">${two(s.text)}</p>
        <div class="st-chips"><span class="st-chip">${icon(s.when[0])}${s.when[1]}</span><span class="st-chip st-chip--price">${s.price}</span></div>
      </article>`).join('');
}

function servicesGrid() {
  return SERVICES.map((s) => `
      <a class="st-card st-card--link" href="${s.file}" data-reveal>
        <span class="st-ico">${icon(s.icon)}</span>
        <h3>${s.name}</h3>
        <p>${two(s.text)}</p>
        <span class="st-card__foot"><span class="st-chip st-chip--price">${s.price}</span><span class="st-round" aria-hidden="true">${arrow()}</span></span>
      </a>`).join('');
}

/* «Полный список услуг» — из исходной главной */
export function catalogRows(baseIndex) {
  return [...baseIndex.matchAll(/<div class="row"><span>(.*?)<\/span><span>(.*?)<\/span><\/div>/g)]
    .map((m) => ({ name: m[1], price: m[2] }));
}
function prices(baseIndex) {
  return catalogRows(baseIndex).map((r) => `
        <div class="st-price"><span>${r.name}</span><span class="st-price__dots" aria-hidden="true"></span><b>${r.price}</b></div>`).join('');
}

/* Вопросы — из исходной главной */
function faqFrom(html) {
  return [...html.matchAll(/<details[^>]*><summary>([\s\S]*?)<\/summary>([\s\S]*?)<\/details>/g)]
    .map((m) => ({ q: strip(m[1].replace(/<svg[\s\S]*?<\/svg>/g, '')), a: m[2].trim() }));
}
function faq(items) {
  return `<div class="st-faq" data-reveal>${items.map((x, i) => `
        <details${i === 0 ? ' open' : ''}><summary><span>${x.q}</span><span class="st-faq__pm" aria-hidden="true">${icon('plus')}</span></summary><div class="st-faq__a">${x.a}</div></details>`).join('')}
      </div>`;
}

/* ── шапка, финальный блок, подвал ────────────────────────────────────────── */

const NAV = [
  ['uslugi.html', 'Услуги'], ['cases.html', 'Работы'], ['o-nas.html', 'О нас'], ['blog.html', 'Блог'],
];
function section(file) {
  if (file === 'uslugi.html' || SVC[file] || file === 'potok-izhs.html') return 'uslugi.html';
  if (file === 'cases.html') return 'cases.html';
  if (file === 'o-nas.html' || file === 'partnyoram.html') return 'o-nas.html';
  if (file.startsWith('blog')) return 'blog.html';
  if (file === 'kontakty.html') return 'kontakty.html';
  return '';
}

function nav(file, hasCta) {
  const act = section(file);
  const a = (href, label, extra = '') => {
    const on = act === href;
    return `<a class="st-tile${on ? ' is-active' : ''}" href="${href}"${on ? ' aria-current="page"' : ''}>${extra}${label}</a>`;
  };
  const cta = hasCta ? '#cta' : 'kontakty.html#cta';
  return `
<header class="st-nav">
  <div class="st-nav__in">
    <a class="st-logo" href="index.html" aria-label="Foksten — на главную">foksten</a>
    <nav class="st-nav__links" aria-label="Разделы">
      ${NAV.map(([h, l]) => a(h, l)).join('\n      ')}
      ${a('kontakty.html', 'Контакты', '<span class="st-live" aria-hidden="true"></span>')}
    </nav>
    <a class="st-btn st-btn--line st-nav__cta" href="${cta}">Обсудить проект</a>
    <button class="st-tile st-nav__menu" type="button" aria-expanded="false" aria-controls="st-sheet">${icon('menu')}<span>Меню</span></button>
  </div>
  <div class="st-sheet" id="st-sheet" hidden>
    <a class="st-sheet__a" href="index.html">Главная</a>
    ${NAV.map(([h, l]) => `<a class="st-sheet__a${act === h ? ' is-active' : ''}" href="${h}">${l}</a>`).join('\n    ')}
    <a class="st-sheet__a${act === 'kontakty.html' ? ' is-active' : ''}" href="kontakty.html">Контакты</a>
    <a class="st-btn st-btn--black st-sheet__cta" href="${cta}">Обсудить проект ${arrow()}</a>
  </div>
</header>`;
}

const GENERIC_FIELDS = `
        <div class="lf-row">
          <label>Имя<input type="text" name="name" placeholder="Как к вам обращаться" required></label>
          <label>Телефон или Telegram<input type="text" name="contact" placeholder="+7 … или @username" required></label>
        </div>
        <label>Задача<textarea name="task" placeholder="Пара слов о том, что нужно"></textarea></label>`;

function finalBlock({ title, lead, fields, subject }) {
  return `
<section class="st-final" id="cta">
  <div class="st-wrap">
    <h2 class="st-h2 st-final__h" data-reveal>${title}</h2>
    <div class="st-final__grid">
      <div class="st-final__side" data-reveal>
        <p class="st-lead">${lead}</p>
        <ol class="st-next">
          <li><span class="st-ico st-ico--sm">${icon('clock')}</span><span><b>Ответим в день заявки</b> — на телефон или в Telegram</span></li>
          <li><span class="st-ico st-ico--sm">${icon('doc')}</span><span><b>Пришлём смету</b> — состав работ, вилку цены и сроки</span></li>
          <li><span class="st-ico st-ico--sm">${icon('handshake')}</span><span><b>Работаем по договору</b> и платите за принятые этапы</span></li>
        </ol>
      </div>
      <form class="st-form lead-form" id="leadForm" action="https://formspree.io/f/mzdlnbpw" method="POST" novalidate data-reveal>
        <input type="text" name="_gotcha" tabindex="-1" autocomplete="off" aria-hidden="true" class="st-trap">
        <input type="hidden" name="_subject" value="${subject}">${fields}
        <button class="st-btn st-btn--black st-btn--lg st-form__send" type="submit">Отправить заявку</button>
        <div class="lf-note">Нажимая кнопку, вы соглашаетесь с <a href="politika.html">политикой обработки персональных данных</a>.</div>
        <div class="lf-ok" id="lfOk">Заявка отправлена — ответим в течение дня. Спасибо!</div>
      </form>
    </div>
  </div>
</section>`;
}

function footer(hasCta) {
  const cta = hasCta ? '#cta' : 'kontakty.html#cta';
  return `
<footer class="st-foot">
  <div class="st-wrap">
    <div class="st-foot__top">
      <p class="st-foot__say">Есть задача? <a class="st-link" href="${cta}">Напишите нам</a> — ответим в&nbsp;тот&nbsp;же&nbsp;день.</p>
      <div class="st-foot__cols">
        <div><h4>Услуги</h4>${SERVICES.slice(0, 6).map((s) => `<a href="${s.file}">${s.name}</a>`).join('')}<a href="uslugi.html">Все услуги</a></div>
        <div><h4>Компания</h4><a href="o-nas.html">О нас</a><a href="cases.html">Работы</a><a href="blog.html">Блог</a><a href="partnyoram.html">Стать партнёром</a><a href="potok-izhs.html">Подрядчикам ИЖС</a></div>
        <div><h4>Связь</h4><!--IF:telegram--><a href="{{TELEGRAM_URL}}">Telegram</a><!--/IF:telegram--><!--IF:whatsapp--><a href="{{WHATSAPP_URL}}">WhatsApp</a><!--/IF:whatsapp--><!--IF:phone--><a href="tel:{{PHONE_HREF}}">{{PHONE}}</a><!--/IF:phone--><!--IF:email--><a href="mailto:{{CONTACT_EMAIL}}">{{CONTACT_EMAIL}}</a><!--/IF:email--><a href="kontakty.html">Все контакты</a><a href="politika.html">Политика данных</a></div>
      </div>
    </div>
    <div class="st-foot__mark" aria-hidden="true">foksten</div>
    <div class="st-foot__bottom">
      <span>© 2026 Foksten</span>
      <span>Работаем по договору · Маркировка рекламы (erid)</span>
      <span class="st-foot__live"><span class="st-live" aria-hidden="true"></span>Принимаем заявки</span>
    </div>
  </div>
</footer>`;
}

/* Карточка «ответим сегодня» в углу — вместо видео сотрудника у референса.
 * Фото людей у нас нет, придумывать их нельзя, поэтому — знак и честная фраза. */
function presence(hasCta) {
  return `
<aside class="st-presence" aria-label="Связаться" hidden>
  <button class="st-presence__x" type="button" aria-label="Скрыть">${icon('close')}</button>
  <span class="st-presence__ava" aria-hidden="true">F</span>
  <p><b>Ответим сегодня.</b> Разбор задачи — бесплатно.</p>
  <a class="st-btn st-btn--black st-btn--sm" href="${hasCta ? '#cta' : 'kontakty.html#cta'}">Написать ${arrow('up-right')}</a>
</aside>`;
}

/* Голова страницы — из исходника: title, description, Open Graph и JSON-LD
 * те же. Стили исходника не нужны, у «Студии» свои. */
function headFrom(base) {
  let h = base.match(/<head>([\s\S]*?)<\/head>/)[1];
  h = h.replace(/<style>[\s\S]*?<\/style>/g, '')
       .replace(/<!--IF:skins-->[\s\S]*?<!--\/IF:skins-->/g, '')
       .replace(/<link rel="stylesheet" href="ui\.css">/g, '')
       .replace(/<link rel="icon"[^>]*>/g, '')
       .replace(/\n{3,}/g, '\n\n');
  return h.trim() + `
<meta name="robots" content="noindex, nofollow">
<script>document.documentElement.classList.add('st-js')</script>
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='10' fill='%23000'/%3E%3Ctext x='16' y='22.5' font-family='Arial' font-size='18' font-weight='700' fill='%23fff' text-anchor='middle'%3EF%3C/text%3E%3C/svg%3E">
<link rel="preload" href="fonts/wix-madefor-display-cyrillic.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="studio.css">
<link rel="stylesheet" href="../skins.css">`;
}

function page({ file, base, main, final, hasCta }) {
  return `<!DOCTYPE html>
<html lang="ru" data-studio>
<head>
${headFrom(base)}
</head>
<body class="st">
<a class="st-skip" href="#main">К содержанию</a>
${nav(file, hasCta)}
<main id="main">
${main}
</main>
${final || ''}
${footer(hasCta)}
${presence(hasCta)}
<script src="studio.js" defer></script>
<script src="../form.js" defer></script>
<script src="../analytics.js" defer></script>
<script src="../skins.js" defer></script>
</body>
</html>
`;
}

/* ── преобразование исходной страницы ─────────────────────────────────────── */

const pill = (name, tint, cls = '') =>
  `<span class="st-pill st-glow--${tint}${cls ? ' ' + cls : ''}" aria-hidden="true">${icon(name)}</span>`;

/* Пилюля встаёт после первого слова: «Разработка [·] сайтов, которые…».
 * Если в заголовке меньше трёх слов — в конце, чтобы не разрывать пару слов. */
function withPill(text, p) {
  const words = text.trim().split(/\s+/);
  if (words.length < 3) return `${text.trim()} ${p}`;
  return `${words[0]} ${p} ${words.slice(1).join(' ')}`;
}

export function parseBase(html) {
  const hero = (html.match(/<header class="s-hero">([\s\S]*?)<\/header>/) || [])[1] || '';
  const crumbs = [...((hero.match(/<div class="crumbs[^"]*">([\s\S]*?)<\/div>/) || [])[1] || '')
    .matchAll(/<a href="([^"]+)">(.*?)<\/a>/g)].map((m) => ({ href: m[1], label: m[2] }));
  const crumbLast = strip(((hero.match(/<div class="crumbs[^"]*">([\s\S]*?)<\/div>/) || [])[1] || '').split('</span>').pop());
  const eyebrow = strip(((hero.match(/<div class="s-eyebrow[^"]*">([\s\S]*?)<\/div>/) || [])[1] || ''));
  const h1 = ((hero.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1] || '').trim();
  const lead = ((hero.match(/<p class="lead[^"]*">([\s\S]*?)<\/p>/) || [])[1] || '').trim();
  const ctas = [...((hero.match(/<div class="s-cta[^"]*">([\s\S]*?)<\/div>/) || [])[1] || '')
    .matchAll(/<a class="btn([^"]*)" href="([^"]+)">([\s\S]*?)<\/a>/g)]
    .map((m) => ({ primary: /accent/.test(m[1]), href: m[2], label: strip(m[3].replace(/<svg[\s\S]*?<\/svg>/g, '')) }));
  const metrics = [...hero.matchAll(/<div class="v[^"]*">(.*?)<\/div><div class="k">(.*?)<\/div>/g)]
    .map((m) => ({ v: m[1], k: m[2] }));

  const sections = [...html.matchAll(/<section class="blk sep"(?: id="([^"]+)")?>([\s\S]*?)<\/section>/g)].map((m) => {
    let inner = m[2].trim()
      .replace(/^<div class="wrap(?:-wide)?"[^>]*>/, '')
      .replace(/<\/div>\s*$/, '');
    const hm = inner.match(/<div class="sec-head[^"]*">\s*<div class="kicker">([\s\S]*?)<\/div>\s*<h2>([\s\S]*?)<\/h2>(?:\s*<p>([\s\S]*?)<\/p>)?\s*<\/div>/);
    let head = null;
    if (hm) { head = { kicker: strip(hm[1]), h2: hm[2].trim(), p: (hm[3] || '').trim() }; inner = inner.replace(hm[0], ''); }
    return { id: m[1] || '', head, body: inner.trim() };
  });

  const ctaSec = (html.match(/<section class="cta-blk sep" id="cta">([\s\S]*?)<\/section>/) || [])[1] || '';
  const cta = ctaSec ? {
    h2: strip((ctaSec.match(/<h2[^>]*>([\s\S]*?)<\/h2>/) || [])[1] || ''),
    p: strip((ctaSec.match(/<p class="rv">([\s\S]*?)<\/p>/) || [])[1] || ''),
    subject: (ctaSec.match(/name="_subject" value="([^"]*)"/) || [])[1] || '',
    // поля формы без служебных и без кнопки: кнопку и подписи рисует «Студия»
    fields: ((ctaSec.match(/<input type="hidden" name="_subject"[^>]*>([\s\S]*?)<button/) || [])[1] || '').trimEnd(),
  } : null;
  return { crumbs, crumbLast, eyebrow, h1, lead, ctas, metrics, sections, cta };
}

/* Реплика между разделами — как сообщение в чате. Ставим одну-две на
 * страницу, перед ценой и перед составом работ: там у читателя вопрос. */
function bubbleFor(head) {
  if (!head) return '';
  const k = head.kicker.toLowerCase();
  if (/форматы|цена/.test(k)) return bubble('Цены — **нижние границы**. Точную вилку назовём после бесплатного разбора, **в тот же день**.');
  if (k === 'что входит') return bubble('Смотрите сами — **вот что входит в работу**:');
  return '';
}
export function bubble(text) {
  return `
    <div class="st-bubble-row" data-reveal><p class="st-bubble" data-typing><span class="st-bubble__ava" aria-hidden="true">F</span><span class="st-bubble__t">${two(text)}</span></p></div>`;
}

function transformPage(file, base) {
  const d = parseBase(base);
  const tint = tintOf(file);
  const ic = PAGE_ICON[file];
  const isLegal = file === 'politika.html';
  const isArticle = /^blog-/.test(file);
  const back = d.crumbs.length > 1 ? d.crumbs[d.crumbs.length - 1] : d.crumbs[0];

  const h1 = ic && !isArticle ? withPill(d.h1, pill(ic, tint)) : d.h1;
  const ctas = d.ctas.map((c) => c.primary
    ? `<a class="st-btn st-btn--line st-btn--lg" href="${c.href}">${c.label}</a>`
    : `<a class="st-btn st-btn--white st-btn--lg" href="${c.href}">${c.label} ${arrow(c.href.startsWith('#') ? 'down' : 'right')}</a>`).join('');
  const stickers = d.metrics.length ? `
      <div class="st-stickers" data-reveal-stagger>${d.metrics.map((m, i) =>
        `<div class="st-sticker st-glow st-glow--${TINTS[(TINTS.indexOf(tint) + i + 1) % TINTS.length]}"><b>${strip(m.v)}</b><span>${m.k}</span></div>`).join('')}</div>` : '';

  let main = `
<section class="st-hero st-hero--inner${isArticle || isLegal ? ' st-hero--read' : ''}">
  <div class="st-wrap">
    <div class="st-crumbs"><a class="st-tile st-tile--sm" href="${back.href}">${arrow('left')}${back.label}</a><span>${d.crumbLast}</span></div>
    ${d.eyebrow ? `<p class="st-eyebrow">${d.eyebrow}</p>` : ''}
    <h1 class="st-h1">${h1}</h1>
    ${d.lead ? `<p class="st-lead st-hero__lead">${d.lead}</p>` : ''}
    ${ctas ? `<div class="st-actions">${ctas}</div>` : ''}${stickers}
  </div>
</section>`;

  for (const s of d.sections) {
    const head = s.head ? `
    <div class="st-head" data-reveal>
      <p class="st-kicker">${s.head.kicker}</p>
      <h2 class="st-h2">${s.head.h2}</h2>
      ${s.head.p ? `<p class="st-lead">${s.head.p}</p>` : ''}
    </div>` : '';
    main += `
<section class="st-sec"${s.id ? ` id="${s.id}"` : ''}>
  <div class="st-wrap">${bubbleFor(s.head)}${head}
    <div class="st-body">
${s.body}
    </div>
  </div>
</section>`;
  }

  const hasCta = !isLegal;
  const final = hasCta ? finalBlock({
    title: d.cta?.h2 ? withPill(d.cta.h2.replace(/\.$/, ''), pill('chat', 'peach')) : `Давайте ${pill('chat', 'peach')} обсудим`,
    lead: d.cta?.p || 'Разберём задачу <b>бесплатно</b> и предложим решение <b>с цифрами и сроками</b> — в течение дня.',
    fields: d.cta?.fields || GENERIC_FIELDS,
    subject: d.cta?.subject || `Заявка с сайта Foksten — ${strip(d.h1)}`,
  }) : '';
  return { main, final, hasCta };
}

/* ── ручные страницы ──────────────────────────────────────────────────────── */

/* Пилюля, в которой иконки сменяют друг друга: «сайт, реклама, ИИ, 1С —
 * всё в одном». [[cycle:sun:laptop,cart,sparkles,database]] */
const cyclePill = (tint, list) => `<span class="st-pill st-pill--cycle ${tint === 'silver' ? 'st-chrome' : 'st-glow--' + tint}" aria-hidden="true">${list.split(',')
  .map((n, i) => icon(n.trim(), i === 0 ? 'is-on' : '')).join('')}</span>`;

/* Окно продукта: <!--ST:win файл|подпись в адресной строке|alt--> */
export const win = (img, name, alt, lazy = true) => `<div class="st-win"><div class="st-win__bar" aria-hidden="true"><i></i><i></i><i></i><span>${name}</span></div><img src="../img/${img}.jpg" width="1200" height="806" decoding="async"${lazy ? ' loading="lazy"' : ''} alt="${alt}"></div>`;

function svcCards(list) {
  return list.split(',').map((f) => SVC[f.trim()]).map((s) => {
    if (!s) throw new Error('studio: в подборке услуг неизвестная страница');
    return `
        <a class="st-card st-card--link" href="${s.file}">
          <span class="st-ico">${icon(s.icon)}</span>
          <h3>${s.name}</h3>
          <p>${two(s.text)}</p>
          <span class="st-card__foot"><span class="st-chip st-chip--price">${s.price}</span><span class="st-round" aria-hidden="true">${arrow()}</span></span>
        </a>`;
  }).join('');
}

/* Общие вставки ручных страниц:
 *   [[cycle:подложка:a,b]] — пилюля, где иконки сменяют друг друга
 *   [[иконка:подложка]]   — пилюля с иконкой на пастели
 *   <!--ST:bubble-->…<!--/ST:bubble--> — реплика между разделами
 *   <!--ST:svc:a.html,b.html--> — карточки выбранных услуг
 *   <!--ST:win файл|подпись|alt--> — работа в окне браузера */
function expandHand(html) {
  return html
    .replace(/\[\[cycle:([a-z]+):([a-z,-]+)\]\]/g, (_m, t, l) => cyclePill(t, l))
    .replace(/\[\[([a-z-]+):([a-z]+)\]\]/g, (_m, n, t) => pill(n, t))
    .replace(/<!--ST:bubble-->([\s\S]*?)<!--\/ST:bubble-->/g, (_m, t) => bubble(t.trim()))
    .replace(/<!--ST:svc:([^>]*?)-->/g, (_m, l) => svcCards(l))
    .replace(/<!--ST:win ([^|]+)\|([^|]+)\|([^>]*?)(\|eager)?-->/g, (_m, f, n, a, e) => win(f.trim(), n.trim(), a.trim(), !e));
}

function handPage(file, fragment, baseIndex) {
  // финальный блок ручной страницы задаётся комментарием в её начале:
  // <!--ST:final title="…" lead="…" subject="…"--> — читаем до вставок,
  // иначе пилюля в title принесёт свои кавычки
  const fm = fragment.match(/<!--ST:final title="([^"]*)" lead="([^"]*)" subject="([^"]*)"-->/);
  let main = expandHand(fragment.replace(/<!--ST:final[^>]*-->/, ''))
    .replace('<!--ST:services-->', servicesCarousel())
    .replace('<!--ST:svc-grid-->', servicesGrid())
    .replace('<!--ST:prices-->', prices(baseIndex))
    .replace('<!--ST:faq-->', faq(faqFrom(baseIndex)));
  const final = fm ? finalBlock({ title: expandHand(fm[1]), lead: two(fm[2]), fields: GENERIC_FIELDS, subject: fm[3] }) : '';
  return { main, final, hasCta: !!fm };
}

/* ── сборка ───────────────────────────────────────────────────────────────── */

/* Где «Студия» живёт в сборке:
 *   stand — dist/studio/ рядом с исходными страницами, с переключателем и noindex;
 *   root  — основной дизайн сайта: страницы в корне вместо исходных, без
 *           переключателя, индексируются, стили и скрипт — в dist/studio/. */
function placeAtRoot(html) {
  return html
    .replace(/<meta name="robots" content="noindex, nofollow">\n/, '')
    .replace(/<link rel="stylesheet" href="\.\.\/skins\.css">\n?/, '')
    .replace(/<script src="\.\.\/skins\.js" defer><\/script>\n?/, '')
    .replace(' data-studio>', '>')
    .replace('href="studio.css"', 'href="studio/studio.css"')
    .replace('href="fonts/', 'href="studio/fonts/')
    .replace('src="studio.js"', 'src="studio/studio.js"')
    .replace(/(href|src)="\.\.\//g, '$1="');
}

/* Возвращает [{ rel, text }] — готовые к render() страницы «Студии».
 * Сам render и аудит делает build.mjs, как и для остальных страниц. */
export function studioPages(root, place = 'stand') {
  const pages = readdirSync(root).filter((f) => f.endsWith('.html')).sort();
  const baseIndex = readFileSync(join(root, 'index.html'), 'utf8');
  const out = [];
  for (const file of pages) {
    const base = readFileSync(join(root, file), 'utf8');
    const hand = join(HERE, 'pages', file);
    const parts = existsSync(hand) ? handPage(file, readFileSync(hand, 'utf8'), baseIndex) : transformPage(file, base);
    const html = expandIcons(page({ file, base, ...parts }));
    out.push(place === 'root'
      ? { rel: file, file, text: placeAtRoot(html) }
      : { rel: join('studio', file), file, text: html });
  }
  return out;
}

/* Статика «Студии»: текст проходит через render, шрифты копируются байт в байт */
export const STUDIO_ASSETS = ['studio.css', 'studio.js'];
export const STUDIO_FONTS = readdirSync(join(HERE, 'fonts')).filter((f) => !f.startsWith('.'));
