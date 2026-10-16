/* Дизайн «Воздух» — основной дизайн foksten.ru с 16.10.2026.
 *
 * Выбор владельца: каркас и стиль варианта «Воздух» (варианты/2-vozduh —
 * референсы blancvpn + rollypay) плюс бесплатные первые шаги из варианта
 * «Сначала ясность» (варианты/sekcii). Тексты — под разработку как основу
 * (слова владельца 12.10: «основа Foksten — разработка, а не реклама»).
 *
 * Как и «Студия», это отдельный набор страниц поверх тех же исходников:
 *   — главная, услуги, работы, «О нас» и контакты собраны здесь руками;
 *   — 19 остальных страниц (12 услуг, оффер ИЖС, блог и статьи, партнёрам,
 *     политика) получаются преобразованием исходной: тексты, тарифы, вопросы
 *     и форма берутся из неё, правка исходника сама доезжает сюда.
 *
 * Цены: единственный источник — тарифы на страницах услуг (div.tier). Карточки
 * услуг, прайс на главной и смета читают их при сборке, поэтому разойтись с
 * страницами не могут. Тест: тесты/воздух.test.mjs. */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseBase } from '../studio/studio.mjs';

export const HERE = dirname(fileURLToPath(import.meta.url));
const ICON_DIR = join(HERE, '..', 'studio', 'icons');   // тот же линейный набор, что у «Студии»

/* ── мелочи ───────────────────────────────────────────────────────────────── */

const iconCache = new Map();
export function icon(name, cls = '') {
  if (!iconCache.has(name)) {
    const p = join(ICON_DIR, name + '.svg');
    if (!existsSync(p)) throw new Error(`vozduh: нет иконки «${name}»`);
    iconCache.set(name, readFileSync(p, 'utf8').trim()
      .replace(/^<svg[^>]*>/, (tag) => tag.replace(/\s(width|height|stroke-width)="[\d.]+"/g, '')));
  }
  return iconCache.get(name).replace('<svg ', `<svg class="vz-i${cls ? ' ' + cls : ''}" aria-hidden="true" focusable="false" `);
}
const two = (s) => s.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
const strip = (s) => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const arrow = (d = 'right') => icon('arrow-' + d, 'vz-i--arrow');
const rub = (n) => n.toLocaleString('ru-RU').replace(/ /g, ' ') + ' ₽';
export const priceNum = (s) => Number((s.match(/\d[\d\s]*/) || ['0'])[0].replace(/\s/g, ''));

/* ── тарифы со страниц услуг ──────────────────────────────────────────────── */

export function tiersOf(html) {
  return [...html.matchAll(/<div class="tier[^"]*">([\s\S]*?)<\/ul>/g)].map((m) => {
    const b = m[1];
    return {
      name: strip((b.match(/class="tname">([\s\S]*?)<\/div>/) || [])[1] || ''),
      price: strip((b.match(/class="price">([\s\S]*?)<\/div>/) || [])[1] || '').replace(/\s+\/\s*/, '/'),
      desc: strip((b.match(/class="desc">([\s\S]*?)<\/div>/) || [])[1] || ''),
    };
  });
}

/* Порядок — разработка первой. Тексты карточек короткие, цены — из тарифов. */
export const SERVICES = [
  { file: 'razrabotka-sajtov.html', name: 'Сайты и магазины', icon: 'laptop', group: 'dev', text: 'Лендинги, корпоративные сайты и магазины — **на заявки**, а не на красоту.' },
  { file: 'ii-avtomatizaciya.html', name: 'Боты и ИИ-ассистенты', icon: 'sparkles', group: 'dev', text: 'Боты и ассистенты **по вашей базе знаний**, автоматизация рутины.' },
  { file: 'prilozheniya.html', name: 'Приложения и MVP', icon: 'phone', group: 'dev', text: 'Прототип, первая версия и продукт под ключ — **iOS, Android и веб**.' },
  { file: 'vnedrenie-1c.html', name: 'Внедрение 1С', icon: 'database', group: 'dev', text: 'Настройка, внедрение и **связка с сайтом, CRM и маркетплейсами**.' },
  { file: 'dizajn.html', name: 'Дизайн и брендинг', icon: 'write', group: 'dev', text: 'Логотип, фирстиль и **интерфейсы** продукта.' },
  { file: 'it-autsors.html', name: 'IT-аутсорс', icon: 'server', group: 'dev', text: 'Серверы, почта, телефония — **IT-отдел без своего штата**.' },
  { file: 'seo.html', name: 'SEO и GEO', icon: 'search', group: 'promo', text: 'Трафик **из поиска и нейросетей** вдолгую.' },
  { file: 'reklama-marketplace.html', name: 'Реклама на WB и Ozon', icon: 'cart', group: 'promo', text: 'Кампании и карточки. **Отчёт по ДРР каждую неделю**.' },
  { file: 'telegram-ads.html', name: 'Telegram Ads', icon: 'send', group: 'promo', text: 'Реклама и посевы. **Маркировка erid — на нас**.' },
  { file: 'kontekst-target.html', name: 'Директ и таргет', icon: 'target', group: 'promo', text: 'Яндекс Директ и VK **с аналитикой по заявкам**.' },
  { file: 'smm.html', name: 'SMM и контент', icon: 'chat', group: 'promo', text: 'Соцсети, UGC и Reels, **которые продают**.' },
  { file: 'prodyusirovanie.html', name: 'Продюсирование', icon: 'play', group: 'promo', text: '**Личный бренд** эксперта и запуск онлайн-школы.' },
];
const SVC = Object.fromEntries(SERVICES.map((s) => [s.file, s]));

/* Сроки — из ответов «Сколько времени займёт?» на страницах услуг. Где на
 * странице срока нет, его нет и здесь: «срок — в смете». */
const DURATION = {
  'razrabotka-sajtov.html': ['5–7 дней', '2–3 недели', 'от месяца'],
  'prilozheniya.html': ['', '1–2 месяца', 'от 3 месяцев'],
};

/* Группы прайса на главной: тарифы четырёх страниц разработки + продвижение */
const MENU = [
  { id: 'sites', title: 'Сайты', icon: 'laptop', file: 'razrabotka-sajtov.html' },
  { id: 'ai', title: 'Боты и ИИ', icon: 'sparkles', file: 'ii-avtomatizaciya.html' },
  { id: 'apps', title: 'Приложения', icon: 'phone', file: 'prilozheniya.html' },
  { id: 'onec', title: '1С', icon: 'database', file: 'vnedrenie-1c.html' },
  { id: 'promo', title: 'Продвижение', icon: 'chart-up' },
];

/* Смета на первом экране: по одному выбору в строке, сумма нижних границ.
 * Берём тарифы из тех же страниц; продукт под ключ (от 1 млн) в смету не
 * ставим — на первом экране он только пугает, он есть в прайсе. */
const CALC = [
  { title: 'Сайт', file: 'razrabotka-sajtov.html', take: [0, 1, 2], pick: 1 },
  { title: 'Бот или ИИ', file: 'ii-avtomatizaciya.html', take: [0, 1, 2], pick: -1 },
  { title: 'Приложение', file: 'prilozheniya.html', take: [0, 1], pick: -1 },
  { title: '1С', file: 'vnedrenie-1c.html', take: [0, 1], pick: -1 },
];

/* Свои продукты — доказательство, что делаем то, что продаём. Факты сверены
 * с кодом и прод-сайтами 16.10.2026 (CRM — по app/services/crm.py RateSpot). */
const PRODUCTS = [
  { name: 'RateSpot', url: 'https://ratespot.ru', host: 'ratespot.ru', what: 'Отзывы с Яндекс Карт и 2ГИС в одном кабинете для кафе, салонов и клиник.',
    did: ['Кабинет владельца со входом по SMS', 'Связали 7 CRM: YCLIENTS, Altegio, amoCRM, Битрикс24, iiko, RetailCRM, МойСклад'] },
  { name: 'Первый счёт', url: 'https://pervyschet.ru', host: 'pervyschet.ru', what: 'Справочник для предпринимателей: банки, ОКВЭД, курсы, вклады.',
    did: ['108 тыс. страниц на открытых данных ЦБ, ФНС и Росстата', 'Курсы ЦБ обновляются по расписанию'] },
  { name: 'НаймСпот', url: 'https://naimspot.ru', host: 'naimspot.ru', what: 'Архив вакансий с историей: подсказывает, куда откликаться бессмысленно.',
    did: ['Ежедневный архив вакансий', 'Оплата через ЮKassa с проверкой суммы'] },
];

const WORKS = [
  { img: 'a3stats', host: 'Мерпи · кабинет продавца', tags: ['Свой продукт', 'Веб-сервис'], title: 'Мерпи — один экран вместо десяти вкладок',
    text: 'Кабинет продавца WB, Ozon и Я.Маркета: оборот, прибыль, ДРР, возвраты и отзывы в одной сводке. Интерфейс и логика расчётов — наши.',
    nums: [['3', 'площадки в сводке'], ['1 400+', 'автотестов'], ['60', 'дней истории']], alt: 'Сводка Мерпи: оборот, прибыль, ДРР и структура выручки' },
  { img: 'yuanmost', host: 'ЮаньМост', tags: ['ВЭД', 'Лендинг'], title: 'ЮаньМост — расчёт до заявки',
    text: 'Посетитель считает сумму инвойса в рублях на первом экране и оставляет заявку уже с цифрой.', alt: 'Лендинг ЮаньМост с калькулятором платежа в Китай' },
  { img: 'kubolab', host: 'КубоЛаб', tags: ['Онлайн-школа', 'Лендинг'], title: 'КубоЛаб — запись на пробный урок',
    text: 'Курс по Roblox для детей 8–16 лет: программа, цены и запись без предоплаты.', alt: 'Лендинг КубоЛаб: курс Roblox для детей' },
  { img: 'traffic-suite', host: 'Traffic Suite', tags: ['SaaS', 'Витрина и кабинет'], title: 'Traffic Suite — витрина плюс кабинет',
    text: 'Лендинг сервиса и рабочий дашборд: аккаунты, кампании, очередь задач. Одна система, два слоя.', alt: 'Дашборд Traffic Suite: аккаунты, кампании и задачи' },
];

/* ── данные из исходников ─────────────────────────────────────────────────── */

function loadData(root) {
  for (const s of SERVICES) {
    s.tiers = tiersOf(readFileSync(join(root, s.file), 'utf8'));
    if (!s.tiers.length) throw new Error(`vozduh: на ${s.file} нет тарифов`);
    s.from = s.tiers[0];
  }
}

function faqFrom(html) {
  return [...html.matchAll(/<details[^>]*><summary>([\s\S]*?)<\/summary>([\s\S]*?)<\/details>/g)]
    .map((m) => ({ q: strip(m[1].replace(/<svg[\s\S]*?<\/svg>/g, '')), a: m[2].trim() }));
}

/* ── повторяющиеся блоки ──────────────────────────────────────────────────── */

const badge = (t, dark = false) => `<span class="vz-badge${dark ? ' vz-badge--dark' : ''}">${t}</span>`;
const fromLabel = (s) => `<span class="vz-from"><small>${s.from.name}</small>${s.from.price}</span>`;

function tile(s, main = false) {
  return `
        <a class="vz-tile${main ? ' vz-tile--main' : ''}" href="${s.file}" data-reveal>
          <span class="vz-tile__ico">${icon(s.icon)}</span>
          <h3 class="vz-h3">${s.name}</h3>
          <p>${two(s.text)}</p>
          <span class="vz-tile__foot">${fromLabel(s)}<span class="vz-round" aria-hidden="true">${arrow()}</span></span>
        </a>`;
}

function menuPanels() {
  const tabs = MENU.map((g, i) => `<button class="vz-seg__b" role="tab" id="mt-${g.id}" aria-controls="mp-${g.id}" aria-selected="${i === 0}"${i ? ' tabindex="-1"' : ''}>${icon(g.icon)}${g.title}</button>`).join('');
  const panels = MENU.map((g, i) => {
    let rows;
    if (g.file) {
      const s = SVC[g.file];
      const dur = DURATION[g.file] || [];
      rows = s.tiers.map((t, j) => `
          <div class="vz-row"><div class="vz-row__name"><b>${t.name}</b><span>${t.desc}</span></div><span class="vz-row__when">${icon('clock')}${dur[j] || 'срок — в смете'}</span><span class="vz-row__price">${t.price}</span></div>`).join('') + `
          <a class="vz-link" href="${g.file}">Подробнее: ${s.name.toLowerCase()} ${arrow()}</a>`;
    } else {
      rows = SERVICES.filter((s) => s.group === 'promo').map((s) => `
          <a class="vz-row vz-row--link" href="${s.file}"><div class="vz-row__name"><b>${s.name}</b><span>${strip(two(s.text))}</span></div><span class="vz-row__when">${s.from.name}</span><span class="vz-row__price">${s.from.price}</span></a>`).join('');
    }
    return `
        <div class="vz-menu__panel" role="tabpanel" id="mp-${g.id}" aria-labelledby="mt-${g.id}"${i ? ' hidden' : ''}>${rows}
        </div>`;
  }).join('');
  return `
      <div class="vz-seg" role="tablist" aria-label="Разделы прайса">${tabs}</div>
      <div class="vz-menu">${panels}
      </div>`;
}

function calc() {
  const rows = CALC.map((r, i) => {
    const s = SVC[r.file];
    const opts = [{ name: 'Не нужно', price: '' }, ...r.take.map((j) => s.tiers[j])];
    return `
          <fieldset class="vz-calc__row"><legend>${r.title}</legend><div class="vz-opts">${opts.map((t, k) => {
      const checked = (r.pick === -1 && k === 0) || (r.pick >= 0 && k === r.pick + 1);
      return `<label class="vz-opt${k === 0 ? ' vz-opt--none' : ''}"><input type="radio" name="calc-${i}" value="${t.price ? priceNum(t.price) : 0}" data-name="${esc(t.name)}"${checked ? ' checked' : ''}><span>${t.name}</span></label>`;
    }).join('')}</div></fieldset>`;
  }).join('');
  const start = CALC.reduce((sum, r) => sum + (r.pick >= 0 ? priceNum(SVC[r.file].tiers[r.take[r.pick]].price) : 0), 0);
  return `
      <form class="vz-calc" id="vzCalc" aria-labelledby="calc-title">
        <div class="vz-calc__head"><h2 class="vz-h3" id="calc-title">Соберите смету</h2><span>нижние границы</span></div>${rows}
        <div class="vz-total" aria-live="polite">
          <div><span class="vz-total__k">Итого</span><b class="vz-total__v" id="vzSum">от ${rub(start)}</b></div>
          <div><span class="vz-total__k">До старта, 50%</span><b class="vz-total__v vz-total__v--soft" id="vzHalf">от ${rub(start / 2)}</b></div>
          <p class="vz-total__note">Точную сумму и срок пришлём в смете за сутки — бесплатно. Если задача укладывается в нижнюю границу, платите её.</p>
        </div>
        <a class="vz-btn vz-btn--primary vz-btn--block" id="vzCalcGo" href="#cta">Получить смету бесплатно</a>
      </form>`;
}

/* Бесплатные первые шаги — из варианта «Сначала ясность» */
const freeSteps = () => `
    <div class="vz-tickets" data-reveal-stagger>
      <div class="vz-ticket"><span class="vz-ticket__k">Шаг 1 · созвон</span><h3 class="vz-h3">Разбор задачи за 30 минут</h3><p>Поймём, что вам нужно на самом деле, и назовём вилку цены прямо на звонке.</p><span class="vz-ticket__price"><b>0 ₽</b>30 минут</span></div>
      <div class="vz-ticket"><span class="vz-ticket__k">Шаг 2 · письменно</span><h3 class="vz-h3">Смета по этапам</h3><p>Что делаем, в каком порядке, сколько стоит каждый этап и когда будет готово.</p><span class="vz-ticket__price"><b>0 ₽</b>за сутки</span></div>
      <p class="vz-tickets__note">${icon('check-circle')}Ни к чему не обязывает. Смета остаётся у вас.</p>
    </div>`;

const STEPS = [
  ['День 0 · бесплатно', 'Разбор', '30 минут: задача, сроки, вилка цены.'],
  ['День 1 · бесплатно', 'Смета', 'Этапы, срок и цена каждого этапа — письменно.'],
  ['День 2–3', 'Договор', 'Фиксируем объём, срок и сумму. Обычно 50% до старта.'],
  ['Каждую неделю', 'Показ работы', 'Ссылка на живую версию, а не отчёт словами.'],
  ['Запуск', 'Сдача', 'Передаём код, доступы и инструкцию. Вторая половина оплаты.'],
];
const steps = () => `
    <div class="vz-plan" data-reveal>
      <ol class="vz-plan__steps">${STEPS.map((s, i) => `
        <li class="vz-pstep${i < 2 ? ' is-free' : ''}"><span class="vz-pstep__n">${i + 1}</span><span class="vz-pstep__when">${s[0]}</span><h3 class="vz-h3">${s[1]}</h3><p>${s[2]}</p></li>`).join('')}
      </ol>
      <div class="vz-plan__chips"><span>${icon('wallet')}Обычно 50% до старта и 50% после сдачи</span><span>${icon('layers')}Большие проекты — по этапам</span><span>${icon('key')}Код и доступы — ваши</span><span>${icon('doc')}Договор с ИП, без НДС</span></div>
    </div>`;

function products() {
  return `
      <div class="vz-products" data-reveal-stagger>${PRODUCTS.map((p) => `
        <article class="vz-product">
          <a class="vz-product__host" href="${p.url}" rel="noopener" target="_blank">${p.host}${arrow('up-right')}</a>
          <h3 class="vz-h3">${p.name}</h3>
          <p>${p.what}</p>
          <ul>${p.did.map((d) => `<li>${d}</li>`).join('')}</ul>
        </article>`).join('')}
      </div>`;
}

function win(w, lazy = true) {
  return `<div class="vz-shot"><div class="vz-shot__bar" aria-hidden="true"><i></i><i></i><i></i><span>${w.host}</span></div><img src="../img/${w.img}.jpg" width="1200" height="806" decoding="async"${lazy ? ' loading="lazy"' : ''} alt="${w.alt}"></div>`;
}
function works(list = WORKS) {
  return `
      <div class="vz-works">${list.map((w, i) => `
        <article class="vz-work${i === 0 ? ' vz-work--wide' : ''}${i === 3 ? ' vz-work--wide vz-work--flip' : ''}" data-reveal>
          ${win(w)}
          <div class="vz-work__body">
            <div class="vz-work__tags">${w.tags.map((t) => `<span>${t}</span>`).join('')}</div>
            <h3 class="vz-h3">${w.title}</h3>
            <p>${w.text}</p>${w.nums ? `
            <div class="vz-nums">${w.nums.map(([b, s]) => `<div><b>${b}</b><span>${s}</span></div>`).join('')}</div>` : ''}
          </div>
        </article>`).join('')}
      </div>`;
}

function compare() {
  const rows = [
    ['Договор', 'С ИП, без НДС', 'Как договоритесь', 'Трудовой'],
    ['Цена', 'Смета до старта, бесплатно', 'Договариваетесь сами', 'Зарплата и налоги каждый месяц'],
    ['Если человек заболел или ушёл', 'Замена внутри команды', 'Проект ждёт', 'Ищете нового'],
    ['Код и доступы', 'Ваши с первого дня', 'Как договоритесь', 'Ваши'],
  ];
  const col = (title, i, us = false) => `
        <div class="vz-cmp__col${us ? ' vz-cmp__col--us' : ''}">
          <div>${us ? icon('check-circle') : ''}${title}</div>${rows.map((r) => `<div data-k="${r[0]}">${r[i]}</div>`).join('')}
        </div>`;
  return `
      <div class="vz-cmp" data-reveal>
        <div class="vz-cmp__col vz-cmp__col--k"><div></div>${rows.map((r) => `<div>${r[0]}</div>`).join('')}</div>${col('Foksten', 1, true)}${col('Фрилансер', 2)}${col('Свой разработчик', 3)}
      </div>`;
}

function faqBlock(items) {
  return `
      <div class="vz-faq" data-reveal>${items.map((x) => `
        <details><summary>${x.q}</summary><div class="vz-faq__a">${x.a}</div></details>`).join('')}
      </div>`;
}

/* ── шапка, финал, подвал ─────────────────────────────────────────────────── */

const NAV = [['uslugi.html', 'Услуги'], ['index.html#ceny', 'Цены'], ['cases.html', 'Работы'], ['o-nas.html', 'О нас'], ['blog.html', 'Блог']];
function section(file) {
  if (file === 'uslugi.html' || SVC[file] || file === 'potok-izhs.html') return 'uslugi.html';
  if (file === 'cases.html') return 'cases.html';
  if (file === 'o-nas.html' || file === 'partnyoram.html') return 'o-nas.html';
  if (file.startsWith('blog')) return 'blog.html';
  return '';
}
function nav(file, hasCta) {
  const act = section(file);
  const cta = hasCta ? '#cta' : 'kontakty.html#cta';
  const link = ([h, l]) => `<a href="${h}"${act === h ? ' aria-current="page"' : ''}>${l}</a>`;
  return `
<header class="vz-top">
  <div class="vz-top__in">
    <a class="vz-logo" href="index.html" aria-label="Foksten — на главную">foksten</a>
    <nav class="vz-nav" aria-label="Разделы">${NAV.map(link).join('')}<a href="kontakty.html"${file === 'kontakty.html' ? ' aria-current="page"' : ''}>Контакты</a></nav>
    <a class="vz-btn vz-btn--primary vz-btn--sm vz-top__cta" href="${cta}">Получить смету</a>
    <button class="vz-burger" type="button" aria-label="Открыть меню" aria-controls="vz-menu" aria-expanded="false">${icon('menu')}</button>
  </div>
</header>
<div class="vz-sheet" id="vz-menu" hidden role="dialog" aria-label="Меню">
  <div class="vz-sheet__top"><a class="vz-logo" href="index.html">foksten</a><button class="vz-burger" type="button" data-close aria-label="Закрыть меню">${icon('close')}</button></div>
  <a href="index.html">Главная</a>${NAV.map(link).join('')}<a href="kontakty.html">Контакты</a>
  <a class="vz-btn vz-btn--primary vz-btn--block" href="${cta}">Получить смету бесплатно</a>
</div>`;
}

const GENERIC_FIELDS = `
        <div class="lf-row">
          <label>Имя<input type="text" name="name" placeholder="Как к вам обращаться" autocomplete="name" required></label>
          <label>Телефон или Telegram<input type="text" name="contact" placeholder="+7 999 000-00-00 или @nick" autocomplete="tel" required></label>
        </div>
        <label>Что нужно сделать<textarea name="task" placeholder="Например: сайт для студии ремонта с калькулятором и заявками в Telegram"></textarea></label>
        <label>Бюджет<select name="budget"><option>Пока не знаем — подскажите</option><option>До 100 тысяч</option><option>100–300 тысяч</option><option>Больше 300 тысяч</option></select></label>`;

function finalBlock({ title, lead, fields, subject }) {
  return `
<section class="vz-final" id="cta">
  <div class="vz-wrap vz-final__grid">
    <div data-reveal>
      ${badge('Бесплатно', true)}
      <h2 class="vz-h2">${title}</h2>
      <p class="vz-lead">${lead}</p>
      <ul class="vz-final__facts">
        <li>${icon('clock')}Ответим в течение рабочего дня</li>
        <li>${icon('doc')}Смета по этапам — за сутки, без обязательств</li>
        <li>${icon('handshake')}Договор с ИП, без НДС</li>
      </ul>
    </div>
    <div class="vz-formcard" data-reveal>
      <form class="vz-form lead-form" id="leadForm" action="https://formspree.io/f/mzdlnbpw" method="POST" novalidate>
        <input type="text" name="_gotcha" tabindex="-1" autocomplete="off" aria-hidden="true" class="vz-trap">
        <input type="hidden" name="_subject" value="${subject}">${fields}
        <button class="vz-btn vz-btn--primary vz-btn--block" type="submit">Получить смету</button>
        <div class="lf-note">Нажимая кнопку, вы соглашаетесь с <a href="politika.html">политикой обработки персональных данных</a>.</div>
        <div class="lf-ok" id="lfOk">Заявка отправлена — ответим в течение рабочего дня.</div>
      </form>
    </div>
  </div>
</section>`;
}

function footer(hasCta) {
  const cta = hasCta ? '#cta' : 'kontakty.html#cta';
  return `
<footer class="vz-foot">
  <div class="vz-wrap">
    <div class="vz-foot__grid">
      <div><a class="vz-logo vz-logo--light" href="index.html">foksten</a><p>Студия разработки: сайты, боты, ИИ-ассистенты, приложения и 1С. Цену и срок называем до договора.</p><a class="vz-btn vz-btn--ghost vz-btn--sm" href="${cta}">Получить смету</a></div>
      <div><h4>Разработка</h4>${SERVICES.filter((s) => s.group === 'dev').map((s) => `<a href="${s.file}">${s.name}</a>`).join('')}</div>
      <div><h4>Продвижение</h4>${SERVICES.filter((s) => s.group === 'promo').map((s) => `<a href="${s.file}">${s.name}</a>`).join('')}</div>
      <div><h4>Студия</h4><a href="o-nas.html">О нас</a><a href="cases.html">Работы</a><a href="blog.html">Блог</a><a href="partnyoram.html">Партнёрам</a><a href="potok-izhs.html">Подрядчикам ИЖС</a><a href="kontakty.html">Контакты</a><!--IF:telegram--><a href="{{TELEGRAM_URL}}">Telegram</a><!--/IF:telegram--><!--IF:email--><a href="mailto:{{CONTACT_EMAIL}}">{{CONTACT_EMAIL}}</a><!--/IF:email--><a href="politika.html">Политика данных</a></div>
    </div>
    <div class="vz-foot__legal"><span>© 2026 Foksten</span><!--IF:legal--><span>{{LEGAL}}</span><!--/IF:legal--><span>ИП · УСН · работаем по договору</span></div>
  </div>
</footer>`;
}

function headFrom(base) {
  let h = base.match(/<head>([\s\S]*?)<\/head>/)[1];
  h = h.replace(/<style>[\s\S]*?<\/style>/g, '')
       .replace(/<!--IF:skins-->[\s\S]*?<!--\/IF:skins-->/g, '')
       .replace(/<link rel="stylesheet" href="ui\.css">/g, '')
       .replace(/<link rel="icon"[^>]*>/g, '')
       .replace(/\n{3,}/g, '\n\n');
  return h.trim() + `
<meta name="robots" content="noindex, nofollow">
<script>document.documentElement.classList.add('vz-js')</script>
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='10' fill='%23151e30'/%3E%3Ctext x='16' y='22.5' font-family='Arial' font-size='18' font-weight='700' fill='%23fff' text-anchor='middle'%3EF%3C/text%3E%3C/svg%3E">
<link rel="preload" href="fonts/golos-text-cyrillic-400-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="vozduh.css">`;
}

function page({ file, base, main, final, hasCta }) {
  return `<!DOCTYPE html>
<html lang="ru" data-vozduh>
<head>
${headFrom(base)}
</head>
<body class="vz">
<a class="vz-skip" href="#main">К содержанию</a>
${nav(file, hasCta)}
<main id="main">
${main}
</main>
${final || ''}
${footer(hasCta)}
<script src="vozduh.js" defer></script>
<script src="../form.js" defer></script>
<script src="../analytics.js" defer></script>
</body>
</html>
`;
}

/* ── преобразование исходной страницы ─────────────────────────────────────── */

function transformPage(file, base) {
  const d = parseBase(base);
  const isLegal = file === 'politika.html';
  const isRead = isLegal || /^blog-/.test(file);
  const back = d.crumbs.length > 1 ? d.crumbs[d.crumbs.length - 1] : d.crumbs[0];
  const ctas = d.ctas.map((c) => `<a class="vz-btn ${c.primary ? 'vz-btn--primary' : 'vz-btn--soft'}" href="${c.href}">${c.label}${c.primary ? ' ' + arrow(c.href.startsWith('#') ? 'down' : 'right') : ''}</a>`).join('');
  const chips = d.metrics.length ? `
      <div class="vz-chips">${d.metrics.map((m) => `<span><b>${strip(m.v)}</b>${m.k}</span>`).join('')}</div>` : '';
  const s = SVC[file];

  let main = `
<section class="vz-hero vz-hero--inner${isRead ? ' vz-hero--read' : ''}">
  <div class="vz-wrap">
    <nav class="vz-crumbs" aria-label="Вы здесь"><a href="index.html">Главная</a>${back && back.href !== 'index.html' ? `<span aria-hidden="true">›</span><a href="${back.href}">${back.label}</a>` : ''}<span aria-hidden="true">›</span><span>${d.crumbLast}</span></nav>
    <div class="vz-phero">
      <div>
        ${d.eyebrow ? badge(d.eyebrow) : ''}
        <h1 class="vz-h1">${d.h1}</h1>
        ${d.lead ? `<p class="vz-lead">${d.lead}</p>` : ''}${chips}
        ${ctas ? `<div class="vz-actions">${ctas}</div>` : ''}
      </div>${s ? `
      <aside class="vz-pcard" data-reveal>
        <div class="vz-pcard__head"><span class="vz-tile__ico">${icon(s.icon)}</span><span>Тарифы — нижние границы</span></div>${s.tiers.map((t, j) => `
        <div class="vz-pcard__row"><span>${t.name}${DURATION[file]?.[j] ? `<small>${DURATION[file][j]}</small>` : ''}</span><b>${t.price}</b></div>`).join('')}
        <a class="vz-btn vz-btn--primary vz-btn--block" href="#cta">Смета за сутки — бесплатно</a>
      </aside>` : ''}
    </div>
  </div>
</section>`;

  for (const sec of d.sections) {
    const head = sec.head ? `
    <div class="vz-head" data-reveal>
      ${badge(sec.head.kicker)}
      <h2 class="vz-h2">${sec.head.h2}</h2>
      ${sec.head.p ? `<p class="vz-lead">${sec.head.p}</p>` : ''}
    </div>` : '';
    main += `
<section class="vz-sec${isRead ? ' vz-sec--read' : ''}"${sec.id ? ` id="${sec.id}"` : ''}>
  <div class="vz-wrap">${head}
    <div class="vz-body">
${sec.body}
    </div>
  </div>
</section>`;
  }

  const hasCta = !isLegal;
  const final = hasCta ? finalBlock({
    title: d.cta?.h2 ? d.cta.h2.replace(/\.$/, '') : 'Расскажите задачу — смету пришлём за сутки',
    lead: d.cta?.p || 'Разберём задачу бесплатно и пришлём смету по этапам: что делаем, сколько стоит и когда будет готово.',
    fields: d.cta?.fields || GENERIC_FIELDS,
    subject: d.cta?.subject || `Заявка с сайта Foksten — ${strip(d.h1)}`,
  }) : '';
  return { main, final, hasCta };
}

/* ── ручные страницы ──────────────────────────────────────────────────────── */

function homePage(baseIndex) {
  const dev = SERVICES.filter((s) => s.group === 'dev');
  const main = `
<section class="vz-hero">
  <div class="vz-wrap vz-hero__grid">
    <div>
      <div class="vz-status"><span class="vz-status__pill">Отвечаем в течение рабочего дня</span><span>разбор и смета — бесплатно</span></div>
      <h1 class="vz-h1">Сайты, боты и ИИ-агенты. Цену и срок называем до договора</h1>
      <p class="vz-lead">Студия разработки для малого и среднего бизнеса. Сначала разбираем задачу и присылаем смету по этапам — <b>бесплатно</b>. Дальше договор, показы каждую неделю и код, который остаётся у вас.</p>
      <div class="vz-actions">
        <a class="vz-btn vz-btn--primary" href="#cta">Получить смету бесплатно ${arrow()}</a>
        <a class="vz-btn vz-btn--soft" href="#ceny">Цены и сроки</a>
      </div>
      <div class="vz-chips"><span><b>5–7 дней</b>лендинг</span><span><b>2–3 недели</b>корпоративный сайт</span><span><b>50 / 50</b>оплата до и после</span></div>
    </div>${calc()}
  </div>
</section>

<section class="vz-sec vz-sec--tight">
  <div class="vz-wrap">
    <div class="vz-head" data-reveal>${badge('С чего начать')}<h2 class="vz-h2">Первые два шага — бесплатно</h2></div>${freeSteps()}
  </div>
</section>

<section class="vz-sec" id="ceny">
  <div class="vz-wrap">
    <div class="vz-head vz-head--split" data-reveal>
      <div>${badge('Цены и сроки')}<h2 class="vz-h2">Цена «от» — нижняя граница, а не приманка</h2></div>
      <p class="vz-lead">Точную сумму и срок фиксируем в договоре после сметы. Если задача укладывается в нижнюю границу — платите её.</p>
    </div>${menuPanels()}
  </div>
</section>

<section class="vz-sec" style="padding-top:0">
  <div class="vz-wrap">
    <div class="vz-head" data-reveal>${badge('Как работаем')}<h2 class="vz-h2">Пять шагов. Платить начинаете только на третьем</h2></div>${steps()}
  </div>
</section>

<section class="vz-dark">
  <div class="vz-wrap">
    <div class="vz-head" data-reveal>${badge('Наши продукты', true)}<h2 class="vz-h2">Делаем для себя так же, как для клиентов</h2><p class="vz-lead">Свои сервисы — лучшее доказательство: они работают каждый день, у них живые пользователи и настоящая нагрузка.</p></div>${products()}
    <div class="vz-head" style="margin-top:clamp(56px,7vw,96px)" data-reveal>${badge('Работы', true)}<h2 class="vz-h2">Проекты, которые можно открыть</h2><p class="vz-lead">Цифры клиентов публикуем только с их согласия.</p></div>${works()}
  </div>
</section>

<div class="vz-sheetover">
<section class="vz-sec">
  <div class="vz-wrap">
    <div class="vz-head vz-head--center" data-reveal>${badge('Разработка')}<h2 class="vz-h2">Что делаем</h2><p class="vz-lead">Шесть направлений разработки и шесть — продвижения, если сайту нужен поток клиентов.</p></div>
    <div class="vz-tiles">${dev.map((s, i) => tile(s, i === 0)).join('')}
    </div>
    <p class="vz-more"><a class="vz-link" href="uslugi.html">Все услуги, включая продвижение ${arrow()}</a></p>
  </div>
</section>

<section class="vz-sec" style="padding-top:0">
  <div class="vz-wrap">
    <div class="vz-head vz-head--center" data-reveal>${badge('Почему мы')}<h2 class="vz-h2">Студия против фрилансера и своего разработчика</h2></div>${compare()}
  </div>
</section>

<section class="vz-sec" style="padding-top:0">
  <div class="vz-wrap">
    <div class="vz-head vz-head--center" data-reveal>${badge('Вопросы')}<h2 class="vz-h2">Частые вопросы</h2></div>${faqBlock(faqFrom(baseIndex))}
  </div>
</section>
</div>`;
  return { main, final: finalBlock({ title: 'Хорошему проекту нужна ясность до старта', lead: 'Опишите задачу — пришлём этапы, срок и цену письменно. <b>Бесплатно и без обязательств.</b>', fields: GENERIC_FIELDS, subject: 'Заявка с сайта Foksten — главная' }), hasCta: true };
}

function servicesPage() {
  const g = (grp) => SERVICES.filter((s) => s.group === grp).map((s, i) => tile(s, grp === 'dev' && i === 0)).join('');
  const main = `
<section class="vz-hero vz-hero--inner">
  <div class="vz-wrap">
    <nav class="vz-crumbs" aria-label="Вы здесь"><a href="index.html">Главная</a><span aria-hidden="true">›</span><span>Услуги</span></nav>
    ${badge('Услуги')}
    <h1 class="vz-h1">Разработка — основа. Продвижение — когда нужен поток клиентов</h1>
    <p class="vz-lead">У каждого направления своя страница: состав работ, тарифы, сроки и частые вопросы. Цены — нижние границы из тарифов.</p>
    <div class="vz-actions"><a class="vz-btn vz-btn--primary" href="#cta">Получить смету бесплатно ${arrow()}</a><a class="vz-btn vz-btn--soft" href="index.html#ceny">Прайс по тарифам</a></div>
  </div>
</section>
<section class="vz-sec vz-sec--tight">
  <div class="vz-wrap">
    <div class="vz-head" data-reveal>${badge('Разработка')}<h2 class="vz-h2">Сайты, боты, приложения и 1С</h2></div>
    <div class="vz-tiles">${g('dev')}
    </div>
  </div>
</section>
<section class="vz-sec" style="padding-top:0">
  <div class="vz-wrap">
    <div class="vz-head" data-reveal>${badge('Продвижение')}<h2 class="vz-h2">Поиск, реклама и соцсети</h2></div>
    <div class="vz-tiles">${g('promo')}
    </div>
  </div>
</section>
<section class="vz-sec" style="padding-top:0">
  <div class="vz-wrap">
    <a class="vz-offer" href="potok-izhs.html" data-reveal>
      <span class="vz-tile__ico">${icon('house')}</span>
      <div><span class="vz-offer__k">Отдельный оффер</span><h2 class="vz-h3">Подрядчикам ИЖС — заявки, доведённые до замера</h2><p>Реклама, лендинг под ваш тип дома и прозвон каждой заявки в первые пять минут. Один город — один подрядчик.</p></div>
      <span class="vz-round" aria-hidden="true">${arrow()}</span>
    </a>
  </div>
</section>`;
  return { main, final: finalBlock({ title: 'Не нашли своё — спросите', lead: 'Скорее всего, мы это делаем. Опишите задачу — ответим в течение рабочего дня.', fields: GENERIC_FIELDS, subject: 'Заявка с сайта Foksten — услуги' }), hasCta: true };
}

function casesPage() {
  const main = `
<section class="vz-hero vz-hero--inner">
  <div class="vz-wrap">
    <nav class="vz-crumbs" aria-label="Вы здесь"><a href="index.html">Главная</a><span aria-hidden="true">›</span><span>Работы</span></nav>
    ${badge('Работы')}
    <h1 class="vz-h1">Свои продукты и проекты клиентов</h1>
    <p class="vz-lead">Всё можно открыть и потрогать. Цифры клиентов публикуем только с их согласия — поэтому их здесь пока нет.</p>
  </div>
</section>
<section class="vz-dark vz-dark--first">
  <div class="vz-wrap">
    <div class="vz-head" data-reveal>${badge('Наши продукты', true)}<h2 class="vz-h2">Работают каждый день</h2></div>${products()}
    <div class="vz-head" style="margin-top:clamp(56px,7vw,96px)" data-reveal>${badge('Проекты', true)}<h2 class="vz-h2">Сайты и кабинеты</h2></div>${works()}
  </div>
</section>`;
  return { main, final: finalBlock({ title: 'Нужна похожая работа?', lead: 'Расскажите о задаче — покажем, как сделали бы её мы, и пришлём смету за сутки.', fields: GENERIC_FIELDS, subject: 'Заявка с сайта Foksten — работы' }), hasCta: true };
}

function aboutPage() {
  const main = `
<section class="vz-hero vz-hero--inner">
  <div class="vz-wrap">
    <nav class="vz-crumbs" aria-label="Вы здесь"><a href="index.html">Главная</a><span aria-hidden="true">›</span><span>О нас</span></nav>
    ${badge('О нас')}
    <h1 class="vz-h1">Небольшая студия, которая отвечает за результат</h1>
    <p class="vz-lead">Делаем сайты, ботов, ИИ-ассистентов, приложения и 1С. Один ведущий на связи, специалисты под задачу и договор, где записаны объём, срок и цена.</p>
  </div>
</section>
<section class="vz-sec vz-sec--tight">
  <div class="vz-wrap vz-team">
    <div class="vz-team__card" data-reveal>
      <div class="vz-ring" aria-hidden="true"><span>F</span><span>${icon('laptop')}</span><span>${icon('sparkles')}</span><span>${icon('phone')}</span><span>${icon('database')}</span></div>
      <h2 class="vz-h2">Один ведущий и специалисты под задачу</h2>
      <p class="vz-lead">Мы молодая студия и не прячем это. Вместо отдела из двадцати человек — ведущий, который знает проект целиком, и специалист по направлению, которого <b>называем до договора</b>.</p>
    </div>
    <div class="vz-team__card" data-reveal>
      <ul class="vz-checks">
        <li><span><b>Не пересказываете задачу дважды</b>Ведущий отвечает за проект от сметы до сдачи.</span></li>
        <li><span><b>Сроки — в договоре</b>Фиксируем до старта. Начинаем в течение 48 часов после согласования.</span></li>
        <li><span><b>Показ каждую неделю</b>Ссылка на живую версию, а не отчёт словами.</span></li>
        <li><span><b>Со всей России, онлайн</b>Общение в удобном мессенджере, отчёты и доступы — по расписанию.</span></li>
      </ul>
    </div>
  </div>
</section>
<section class="vz-sec" style="padding-top:0">
  <div class="vz-wrap">
    <div class="vz-head" data-reveal>${badge('Как работаем')}<h2 class="vz-h2">Каждый шаг вы видите и принимаете</h2></div>${steps()}
  </div>
</section>
<section class="vz-sec" style="padding-top:0">
  <div class="vz-wrap">
    <a class="vz-offer" href="partnyoram.html" data-reveal>
      <span class="vz-tile__ico">${icon('handshake')}</span>
      <div><span class="vz-offer__k">Партнёрам</span><h2 class="vz-h3">Вы специалист по своему направлению?</h2><p>Даём проекты и берём на себя продажи, договоры и общение с клиентом. Вы делаете то, что умеете лучше всего.</p></div>
      <span class="vz-round" aria-hidden="true">${arrow()}</span>
    </a>
  </div>
</section>`;
  return { main, final: finalBlock({ title: 'Обсудим вашу задачу', lead: 'Разберём бесплатно и пришлём смету по этапам за сутки.', fields: GENERIC_FIELDS, subject: 'Заявка с сайта Foksten — о нас' }), hasCta: true };
}

function contactsPage() {
  const main = `
<section class="vz-hero vz-hero--inner">
  <div class="vz-wrap">
    <nav class="vz-crumbs" aria-label="Вы здесь"><a href="index.html">Главная</a><span aria-hidden="true">›</span><span>Контакты</span></nav>
    ${badge('Контакты')}
    <h1 class="vz-h1">Расскажите о задаче</h1>
    <p class="vz-lead">Ответим в течение рабочего дня. Выберите удобный способ связи или оставьте заявку — форма ниже.</p>
<!--IF:channels-->    <div class="vz-contacts">
<!--IF:telegram-->      <a class="vz-contact" href="{{TELEGRAM_URL}}"><span class="vz-tile__ico">${icon('send')}</span><span><b>Telegram</b>{{TELEGRAM_HANDLE}} — быстрее всего</span></a>
<!--/IF:telegram--><!--IF:whatsapp-->      <a class="vz-contact" href="{{WHATSAPP_URL}}"><span class="vz-tile__ico">${icon('chat')}</span><span><b>WhatsApp</b>Напишите в мессенджере</span></a>
<!--/IF:whatsapp--><!--IF:phone-->      <a class="vz-contact" href="tel:{{PHONE_HREF}}"><span class="vz-tile__ico">${icon('call')}</span><span><b>{{PHONE}}</b>с 10 до 19 по Москве</span></a>
<!--/IF:phone--><!--IF:email-->      <a class="vz-contact" href="mailto:{{CONTACT_EMAIL}}"><span class="vz-tile__ico">${icon('mail')}</span><span><b>{{CONTACT_EMAIL}}</b>для писем и документов</span></a>
<!--/IF:email-->    </div>
<!--/IF:channels--><!--IFNOT:channels-->    <p class="vz-note">${icon('chat')}Прямых контактов пока не публикуем — рабочий способ связи один: форма ниже. Ответ придёт на телефон или в Telegram, который вы укажете.</p>
<!--/IFNOT:channels--><!--IF:legal-->    <p class="vz-note">{{LEGAL}}</p>
<!--/IF:legal-->
  </div>
</section>`;
  return { main, final: finalBlock({ title: 'Оставьте заявку', lead: 'Разберём задачу и пришлём смету по этапам — в течение суток.', fields: GENERIC_FIELDS, subject: 'Новая заявка с сайта — Контакты' }), hasCta: true };
}

const HAND = { 'index.html': homePage, 'uslugi.html': servicesPage, 'cases.html': casesPage, 'o-nas.html': aboutPage, 'kontakty.html': contactsPage };

/* ── сборка ───────────────────────────────────────────────────────────────── */

const expandIcons = (html) => html.replace(/<i data-i="([a-z-]+)"(?: class="([^"]*)")?><\/i>/g, (_m, n, c) => icon(n, c));

/* stand — dist/vozduh/ рядом с остальными страницами, с noindex;
 * root  — основной дизайн: страницы в корне, стили и шрифты в dist/vozduh/. */
function placeAtRoot(html) {
  return html
    .replace(/<meta name="robots" content="noindex, nofollow">\n/, '')
    .replace(' data-vozduh>', '>')
    .replace('href="vozduh.css"', 'href="vozduh/vozduh.css"')
    .replace('href="fonts/', 'href="vozduh/fonts/')
    .replace('src="vozduh.js"', 'src="vozduh/vozduh.js"')
    .replace(/(href|src)="\.\.\//g, '$1="');
}

export function vozduhPages(root, place = 'stand') {
  loadData(root);
  const files = readdirSync(root).filter((f) => f.endsWith('.html')).sort();
  const baseIndex = readFileSync(join(root, 'index.html'), 'utf8');
  const out = [];
  for (const file of files) {
    const base = readFileSync(join(root, file), 'utf8');
    const parts = HAND[file] ? HAND[file](baseIndex) : transformPage(file, base);
    const html = expandIcons(page({ file, base, ...parts }));
    out.push(place === 'root' ? { rel: file, file, text: placeAtRoot(html) } : { rel: join('vozduh', file), file, text: html });
  }
  return out;
}

export const VOZDUH_ASSETS = ['vozduh.css', 'vozduh.js'];
export const VOZDUH_FONTS = readdirSync(join(HERE, 'fonts')).filter((f) => f.endsWith('.woff2'));
export { SERVICES as VOZDUH_SERVICES };
