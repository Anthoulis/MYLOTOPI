#!/usr/bin/env bash
# Publishes the guide to the varon server, at https://mylotopi.varon.gr. Runs from the office PC
# (Git Bash), from anywhere:
#
#   bash tools/deploy.sh
#
# Only committed files of the develop branch go up (git archive HEAD), and only the public ones: the
# entry pages, the language pages, sw.js and assets/ without the content sources. The full-quality
# originals/ never go up. The Caddy site file lives in the varon repository
# (server/caddy/sites/mylotopi.caddy) and goes up with its push-caddy.sh.
# The new files are unpacked next to the old ones and swapped in with two renames a moment apart,
# so nothing deleted here lingers on the server and no visitor sees half an upload.
set -euo pipefail
host="${1:-varon}"
root="$(cd "$(dirname "$0")/.." && pwd)"
target=/srv/sites/mylotopi

cd "$root"

# mylotopi.varon.gr shows develop; production stays on Netlify for the business (AGENTS.md).
branch=$(git rev-parse --abbrev-ref HEAD)
if [ "$branch" != "develop" ]; then
  echo "On '$branch': mylotopi.varon.gr is deployed only from develop." >&2
  exit 1
fi

npm run check --silent

languages=$(node -e 'process.stdout.write(require("./assets/content/meta.json").languages.join(" "))')
# shellcheck disable=SC2086
public="index.html qr-guide.html sw.js $languages assets/css assets/js assets/fonts assets/icons assets/logo assets/images assets/maps assets/audio"

if ! git diff --quiet HEAD -- .; then
  echo "Uncommitted changes: only the last commit is deployed. Commit first." >&2
  exit 1
fi
# A media copy that was made but never added would pass the check above and be missing online.
# shellcheck disable=SC2086
untracked=$(git ls-files --others --exclude-standard -- $public)
if [ -n "$untracked" ]; then
  printf 'Files not in git would be missing online; add or remove them first:\n%s\n' "$untracked" >&2
  exit 1
fi

# LF line endings, whatever this checkout uses.
# shellcheck disable=SC2086
git -c core.autocrlf=false archive --format=tar HEAD -- $public |
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

# Checked on the server itself, over HTTPS, so the origin certificate is tested too. Any answer
# other than 200 fails the deploy.
ssh "$host" 'failed=0
for path in / /qr-guide.html?lang=el /el/ /en/ /sw.js /assets/js/guide.js /assets/audio/el/section-01-64k.mp3; do
  code=$(curl -sk -o /dev/null -m 10 -w "%{http_code}" --resolve mylotopi.varon.gr:443:127.0.0.1 "https://mylotopi.varon.gr$path")
  printf "%-36s -> %s\n" "$path" "$code"
  [ "$code" = 200 ] || failed=1
done
exit $failed'
