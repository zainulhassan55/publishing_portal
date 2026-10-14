#!/usr/bin/env bash
#
# Scheduled harvest: OJS → snapshot → purge the page cache.
#
# This is what makes publishing automatic. An editor publishes an issue in OJS;
# within one run of this script the papers are on the portal website, with no
# tag, no build and no deploy. Install it as ~/portal/harvest.sh on the server
# and run it from cron every fifteen minutes (docs/GO-LIVE.md, B10):
#
#   */15 * * * * /home/nextgeniqpress/portal/harvest.sh >> /home/nextgeniqpress/portal/harvest.log 2>&1
#
# It reads the same settings file the portal runs from, so OJS_BASE_URL,
# OJS_API_KEY, HARVEST_PATH and PORTAL_REVALIDATE_SECRET are set once. The
# harvest itself refuses to replace a good snapshot with an empty or partial
# one (scripts/harvest.ts), so an OJS outage during a run changes nothing.
set -euo pipefail

APP_DIR="${APP_DIR:-$HOME/portal}"

# Settings: ~/portal/.env on a PM2 host, /etc/ngiq/portal.env under systemd.
if [ -f "$APP_DIR/.env" ]; then
  set -a; . "$APP_DIR/.env"; set +a
elif [ -f /etc/ngiq/portal.env ]; then
  set -a; . /etc/ngiq/portal.env; set +a
fi

# cron runs with a bare PATH and never loads nvm. Find the newest Node that
# nvm installed rather than hardcoding a version that an upgrade silently
# invalidates.
if ! command -v node >/dev/null 2>&1 && [ -d "$HOME/.nvm/versions/node" ]; then
  NODE_BIN="$(ls -d "$HOME"/.nvm/versions/node/*/bin 2>/dev/null | sort -V | tail -1)"
  [ -n "$NODE_BIN" ] && PATH="$NODE_BIN:$PATH"
fi

# One run at a time. A slow OJS must not stack up overlapping harvests, each
# racing to rename the same snapshot into place.
exec 9>"$APP_DIR/harvest.lock"
if ! flock -n 9; then
  echo "$(date -u +%FT%TZ) harvest already running; skipping"
  exit 0
fi

cd "$APP_DIR/current"

echo "$(date -u +%FT%TZ) harvest starting"
node --experimental-strip-types scripts/harvest.ts

# Tell the running site the snapshot changed. Without this the pages refresh on
# their own timer (an hour); with it, on the next request.
if [ -n "${PORTAL_REVALIDATE_SECRET:-}" ]; then
  curl -fsS -X POST -H "Authorization: Bearer $PORTAL_REVALIDATE_SECRET" "http://127.0.0.1:${PORT:-3000}/api/revalidate"
  echo
else
  echo "PORTAL_REVALIDATE_SECRET is not set; the site will pick the snapshot up within the hour" >&2
fi
echo "$(date -u +%FT%TZ) harvest finished"
