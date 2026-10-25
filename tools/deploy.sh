#!/usr/bin/env bash
# Publishes the guide to the varon server, at https://mylotopi.varon.gr. Runs from the office PC
# (Git Bash), from anywhere:
#
#   bash tools/deploy.sh
#
# Only committed files go up (git archive HEAD), and only the public ones: the entry pages, the
# language pages and assets/ without the content sources. The full-quality originals/ never go up. The Caddy site file lives in the varon
# repository (server/caddy/sites/mylotopi.caddy) and goes up with its push-caddy.sh.
# The new files land next to the old ones and replace them in one move, so nothing deleted here
# lingers on the server and no visitor sees half an upload.
set -euo pipefail
host="${1:-varon}"
root="$(cd "$(dirname "$0")/.." && pwd)"
target=/srv/sites/mylotopi

cd "$root"
npm run check --silent

if ! git diff --quiet HEAD -- .; then
  echo "Uncommitted changes: only the last commit is deployed. Commit first." >&2
  exit 1
fi

languages=$(node -e 'process.stdout.write(require("./assets/content/meta.json").languages.join(" "))')
# shellcheck disable=SC2086
git archive --format=tar HEAD -- index.html qr-guide.html sw.js $languages \
  assets/css assets/js assets/fonts assets/icons assets/logo assets/images assets/maps assets/audio |
  ssh "$host" "set -e
    sudo rm -rf '$target.new' '$target.old'
    sudo mkdir -p '$target.new'
    sudo tar -C '$target.new' --no-same-owner --no-same-permissions -xf -
    sudo find '$target.new' -type d -exec chmod 755 {} +
    sudo find '$target.new' -type f -exec chmod 644 {} +
    if [ -d '$target' ]; then sudo mv '$target' '$target.old'; fi
    sudo mv '$target.new' '$target'
    sudo rm -rf '$target.old'"

echo "Deployed $(git rev-parse --short HEAD) to $target."

# Checked on the server itself, over HTTPS, so the origin certificate is tested too.
ssh "$host" 'for path in / /qr-guide.html?lang=el /el/ /en/ /assets/js/guide.js /assets/audio/el/section-01-64k.mp3; do printf "%-36s -> " "$path"; curl -sk -o /dev/null -m 10 -w "%{http_code}\n" --resolve mylotopi.varon.gr:443:127.0.0.1 "https://mylotopi.varon.gr$path"; done'
