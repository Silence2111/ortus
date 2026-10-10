#!/usr/bin/env bash
# Выкатка сайта Foksten на lerti (201.34.159.41, Timeweb, РФ).
#
#   деплой/выкатить.sh            — собрать и выложить новый выпуск
#   деплой/выкатить.sh --nginx    — то же + поставить/обновить конфиг nginx
#   деплой/выкатить.sh --откат    — вернуть предыдущий выпуск
#
# Собирает из закоммиченного состояния (git archive HEAD), а не из рабочей
# папки: незакоммиченные правки — свои или параллельной сессии — на прод не
# уезжают. В выпуск входят два слоя:
#   /        — сайт для клиентов в основном дизайне (site.config.json → design)
#   /stend/  — все варианты дизайна с переключателем, закрыт от индексации
# Выпуски лежат в /var/www/a3/releases/, current — ссылка на действующий,
# хранятся последние пять.
set -euo pipefail

cd "$(dirname "$0")/.."
HOST="${HOST:-lerti}"
ORIGIN="${SITE_ORIGIN:-$(node -p "require('./site.config.json').origin" 2>/dev/null || true)}"
[[ -n "$ORIGIN" ]] || { echo "адрес сайта не задан: site.config.json → origin"; exit 1; }
NAME="${ORIGIN#https://}"
BASE=/var/www/a3

if [[ "${1:-}" == "--откат" ]]; then
  ssh "$HOST" "set -e; cd $BASE/releases; prev=\$(ls -1t | sed -n 2p); [ -n \"\$prev\" ] || { echo 'предыдущего выпуска нет'; exit 1; }
    ln -sfn $BASE/releases/\$prev $BASE/current.tmp && mv -T $BASE/current.tmp $BASE/current && echo \"откат на \$prev\""
  exit 0
fi

REV=$(git rev-parse --short HEAD)
[[ -z "$(git status --porcelain -- . ':!dist')" ]] || echo "· есть незакоммиченные правки — в выпуск они не попадут (собираю $REV)"

TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT
mkdir -p "$TMP/src"
git archive HEAD | tar -x -C "$TMP/src"
(
  cd "$TMP/src"
  npm test --silent >/dev/null 2>&1 || { echo "тесты не прошли — выкатка остановлена"; npm test; exit 1; }
  SITE_ORIGIN="$ORIGIN" SITE_DIST="$TMP/site" node build.mjs
  SITE_ORIGIN="$ORIGIN" SITE_SKINS=1 SITE_DIST="$TMP/site/stend" node build.mjs >/dev/null
)

if [[ "${1:-}" == "--nginx" ]]; then
  scp -q деплой/foksten.nginx.conf "$HOST:/etc/nginx/sites-available/a3.conf"
  ssh "$HOST" "ln -sfn /etc/nginx/sites-available/a3.conf /etc/nginx/sites-enabled/a3.conf && nginx -t && systemctl reload nginx"
fi

REL="$(date -u +%Y%m%d-%H%M%S)-$REV"
COPYFILE_DISABLE=1 tar --no-xattrs -C "$TMP/site" -czf - . | ssh "$HOST" "set -e; mkdir -p $BASE/releases/$REL; tar --no-same-owner -xzf - -C $BASE/releases/$REL
  ln -sfn $BASE/releases/$REL $BASE/current.tmp && mv -T $BASE/current.tmp $BASE/current
  cd $BASE/releases && ls -1t | tail -n +6 | xargs -r rm -rf"

# Проверка с самой коробки: с мака nip.io идёт через VPN и врёт.
ssh "$HOST" "for p in / /cases.html /uslugi.html /studio/studio.css /stend/ /stend/studio/index.html; do
  printf '%-28s %s\n' \"\$p\" \"\$(curl -s -o /dev/null -w '%{http_code} %{size_download}Б %{time_total}с' https://$NAME\$p)\"; done"
echo "выпуск $REL → https://$NAME/  ·  стенд: https://$NAME/stend/"
