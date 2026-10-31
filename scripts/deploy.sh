#!/usr/bin/env bash
#
# Atomic deploy to the VPS.
#
# Audit finding F-06: production deploys were manual file surgery — zip the
# build, upload through the CloudPanel file manager, delete the old directory,
# unzip — performed in the same parent directory as the live `ojs/` install.
# One mis-click on `ojs/` destroyed the platform, and there was no staging and
# no way back.
#
# This script instead:
#   - uploads to a NEW timestamped release directory,
#   - flips a symlink, which is atomic,
#   - reloads the service,
#   - keeps the previous releases so a rollback is one symlink flip,
#   - and never touches any path outside $RELEASES_DIR.
#
# Paths match the CloudPanel site user (`nextgeniqpress`, home
# /home/nextgeniqpress). The portal sits at ~/portal, outside
# htdocs/www.nextgeniqpress.com, so nginx can never serve the application
# source as static files. Override with DEPLOY_APP_DIR if the layout differs —
# and check with `id nextgeniqpress` before the first deploy, because a wrong
# user here fails late and confusingly.
#
# Usage:  ./scripts/deploy.sh staging|production
set -euo pipefail

TARGET="${1:-}"

case "$TARGET" in
  staging)
    SSH_HOST="${DEPLOY_STAGING_HOST:?DEPLOY_STAGING_HOST is not set}"
    APP_DIR="${DEPLOY_APP_DIR:-/home/nextgeniqpress/staging}"
    SERVICE="ngiq-portal-staging"
    ;;
  production)
    SSH_HOST="${DEPLOY_PRODUCTION_HOST:?DEPLOY_PRODUCTION_HOST is not set}"
    APP_DIR="${DEPLOY_APP_DIR:-/home/nextgeniqpress/portal}"
    SERVICE="ngiq-portal"
    ;;
  *)
    echo "Usage: $0 staging|production" >&2
    exit 64
    ;;
esac

RELEASES_DIR="$APP_DIR/releases"
CURRENT_LINK="$APP_DIR/current"
RELEASE="$(date -u +%Y%m%d%H%M%S)-$(git rev-parse --short HEAD)"
KEEP=5

# A production deploy must be reproducible from a tag, not from whatever happens
# to be in the working tree.
if [ "$TARGET" = "production" ]; then
  if [ -n "$(git status --porcelain)" ]; then
    echo "Working tree is dirty. Commit or stash before deploying to production." >&2
    exit 1
  fi
  if ! git describe --exact-match --tags HEAD >/dev/null 2>&1; then
    echo "HEAD is not tagged. Tag the release before deploying to production." >&2
    exit 1
  fi
fi

echo "==> Building $RELEASE for $TARGET"
npm ci
npm run typecheck
npm run lint
npm test
npm run harvest

# The build must NOT inherit the developer's .env.local.
#
# Next.js inlines every NEXT_PUBLIC_* value at BUILD time — into the server
# bundle as well as the client one. This build runs on a developer's machine,
# where .env.local points at localhost and enables demo fixtures, because that
# is what local development needs. Those values get compiled into the release
# and shipped, and /etc/ngiq/portal.env cannot correct them afterwards: there
# is no runtime lookup left to override.
#
# Exporting them as real environment variables is what fixes it — a real
# variable takes precedence over .env.local, so production gets these values
# and local development is untouched. See deploy/build-env.production for what
# each one does and why it matters.
BUILD_ENV="$(dirname "$0")/../deploy/build-env.$TARGET"
if [ ! -f "$BUILD_ENV" ]; then
  # Refusing is the point. Continuing would build $TARGET from whatever
  # .env.local happens to hold, which is the bug this file exists to prevent;
  # it fails silently and is only visible once the release is serving.
  echo "Missing $BUILD_ENV." >&2
  echo "Copy deploy/build-env.production and set the values for $TARGET." >&2
  exit 1
fi
set -a
. "$BUILD_ENV"
set +a
npm run build

# Fail the deploy rather than ship a development value again. Every one of
# these is invisible when wrong — the site builds, renders and serves 200s,
# it just quietly points at the wrong place — so it has to be caught here
# instead of by a reader hitting it in production.
build_contains() { grep -rqsE "$1" .next/server --include="*.js"; }
offenders() { grep -rlsE "$1" .next/server --include="*.js" >&2; }

# A development origin compiled into any absolute URL the server emits:
# redirects, canonical tags, the sitemap, the OJS session hand-off.
if build_contains 'localhost:[0-9]+'; then
  echo "Build has a localhost origin compiled in; NEXT_PUBLIC_SITE_URL is wrong." >&2
  offenders 'localhost:[0-9]+'
  exit 1
fi

# An absolute OJS prefix. The hand-off decides whether OJS shares the portal's
# origin by asking whether this is relative, and only attaches the OJSSID
# cookie when it is — so an absolute value silently signs every reader out.
#
# The pattern matches the INLINED ASSIGNMENT (`="https://host/ojs"`), not the
# bare hostname. Searching for the hostname alone gives a false positive on
# every build: requireOjsBaseUrl's "OJS_BASE_URL is not set … e.g.
# https://www.nextgeniqpress.com/ojs" error message is a string literal in the
# bundle, and the `="` prefix is what distinguishes a compiled-in value from
# prose that merely mentions the URL. Maps are excluded for the same reason —
# they embed config.ts's doc comment verbatim.
#
# OJS_BASE_URL is not checked: it has no NEXT_PUBLIC_ prefix, so it stays a
# runtime lookup against /etc/ngiq/portal.env and is correctly absolute.
if build_contains '="https?://[^"]+/ojs"'; then
  echo "Build has an absolute OJS path compiled in; NEXT_PUBLIC_OJS_PATH must be /ojs." >&2
  offenders '="https?://[^"]+/ojs"'
  exit 1
fi

# Demo fixtures prerendered as real articles. Checked by artefact rather than
# by grepping for the flag, because `"1"==="1"` is constant-folded away and
# leaves nothing to match — the prerendered page is the durable evidence.
#
# `ls`, not `compgen -G`: compgen is a bash builtin and returns 0 under zsh
# whatever the glob, so the same line silently inverts its meaning if this
# logic is ever run or tested in an interactive zsh. `ls` behaves identically
# in both.
if ls .next/server/app/articles/*rppg-continuous-heart-rate* >/dev/null 2>&1; then
  echo "Build has demo articles prerendered; NEXT_PUBLIC_DEMO_CONTENT must be 0." >&2
  exit 1
fi

# The captcha site key missing from the browser bundle. The server demands a
# token whenever its env holds TURNSTILE_SECRET_KEY, so a bundle without the
# key renders no widget and refuses every sign-in and registration. Checked in
# .next/static, where the client code is, not .next/server.
if [ -z "${NEXT_PUBLIC_TURNSTILE_SITE_KEY:-}" ] || ! grep -rqsF "$NEXT_PUBLIC_TURNSTILE_SITE_KEY" .next/static --include="*.js"; then
  echo "Build has no Turnstile site key compiled in; set NEXT_PUBLIC_TURNSTILE_SITE_KEY in $BUILD_ENV." >&2
  exit 1
fi

# `output: 'standalone'` emits a self-contained server; static and public assets
# are copied in because the standalone output does not include them.
STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT

#
# The standalone output already holds `public/` and `content/` (the files Next
# traced, such as public/brand/logo-mark.png), so these copy the folders'
# *contents* with `/.`. `cp -R public "$STAGE/public"` into an existing folder
# nests it at public/public, and the live site then served only the traced
# logo and 404'd every other image.
cp -R .next/standalone/. "$STAGE/"
mkdir -p "$STAGE/.next/static" "$STAGE/public" "$STAGE/content"
cp -R .next/static/. "$STAGE/.next/static/"
cp -R public/. "$STAGE/public/"
cp -R content/. "$STAGE/content/"

# Migrations ship with the release so the server applies them itself during
# activation. migrate.ts records each file in schema_migrations, so re-running
# on every deploy is a no-op.
cp -R migrations "$STAGE/migrations"
mkdir -p "$STAGE/scripts"
# harvest.ts ships too: the server runs it on a schedule (deploy/harvest.sh),
# which is how a paper published in OJS reaches the site without a deploy.
cp scripts/migrate.ts scripts/harvest.ts scripts/env.ts "$STAGE/scripts/"
# harvest.ts imports the slug ↔ OJS path map from src/, which the release does
# not otherwise contain (the app is compiled into .next). Shipped at the same
# relative path so the import resolves unchanged; without it every scheduled
# harvest fails with ERR_MODULE_NOT_FOUND. A new src/ import in a shipped
# script needs a line here too.
mkdir -p "$STAGE/src/lib/ojs"
cp src/lib/ojs/contexts.ts "$STAGE/src/lib/ojs/contexts.ts"
# The cron wrapper ships alongside so the server-side install is a copy from
# the live release (docs/GO-LIVE.md B10), not a download.
mkdir -p "$STAGE/deploy"
cp deploy/harvest.sh "$STAGE/deploy/"

# migrate.ts needs mysql2 as a resolvable package, and the release bundle
# cannot provide it: Next compiles server dependencies into its own chunks
# rather than shipping them under node_modules. A private install next to the
# script satisfies the import without touching the app's node_modules.
printf '{"private":true,"type":"module"}' > "$STAGE/scripts/package.json"
npm install --prefix "$STAGE/scripts" --no-save --no-audit --no-fund --loglevel=error mysql2 aws4fetch@1.0.20

# The storage check ships too, so the R2 keys can be confirmed on the server
# (`node --experimental-strip-types scripts/storage-check.ts` in the release).
# It reads src/lib/storage.ts, copied beside it with aws4fetch installed above.
cp scripts/storage-check.ts "$STAGE/scripts/"
mkdir -p "$STAGE/scripts/lib"
cp src/lib/storage.ts "$STAGE/scripts/lib/storage.ts"

echo "==> Uploading to $SSH_HOST:$RELEASES_DIR/$RELEASE"
ssh "$SSH_HOST" "mkdir -p '$RELEASES_DIR/$RELEASE'"
rsync -az --delete "$STAGE/" "$SSH_HOST:$RELEASES_DIR/$RELEASE/"

echo "==> Activating"
ssh "$SSH_HOST" bash -s <<REMOTE
set -euo pipefail

# Apply database migrations from the new release BEFORE it goes live. A
# failing migration aborts the deploy here, with the symlink untouched and
# the old release still serving. The env file supplies PORTAL_DATABASE_URL:
# PM2 layouts keep it at \$APP_DIR/.env, systemd layouts at /etc/ngiq.
cd '$RELEASES_DIR/$RELEASE'
if [ -f '$APP_DIR/.env' ]; then
  set -a; . '$APP_DIR/.env'; set +a
elif [ -f /etc/ngiq/portal.env ]; then
  set -a; . /etc/ngiq/portal.env; set +a
fi
node --experimental-strip-types scripts/migrate.ts

# The server reads its snapshot from HARVEST_PATH, outside the release, so the
# scheduled harvest's work survives a deploy. On the very first deploy that
# file does not exist yet; seed it from the build's own harvest so the site is
# not empty until the first cron run. Never overwrite it — it is newer than
# anything the developer's machine harvested.
if [ -n "\${HARVEST_PATH:-}" ] && [ ! -f "\$HARVEST_PATH" ]; then
  mkdir -p "\$(dirname "\$HARVEST_PATH")"
  cp content/harvest.json "\$HARVEST_PATH"
  echo "seeded \$HARVEST_PATH from the build"
fi

# Restart through whichever supervisor this host actually has.
#
# A managed-hosting site user typically cannot use systemd — on CloudPanel,
# \`sudo -l\` for the site user permits only /usr/bin/clpctlWrapper, so
# \`systemctl\` is unavailable and the process is supervised by PM2 from the
# user's own home instead. Detecting it here keeps one deploy path for both
# layouts rather than a second, drifting script.
restart_app() {
  if sudo -n systemctl restart '$SERVICE' 2>/dev/null; then
    echo "restarted via systemd"
  elif command -v pm2 >/dev/null 2>&1; then
    pm2 restart '$SERVICE' --update-env >/dev/null
    echo "restarted via pm2"
  else
    echo "No usable supervisor: systemd needs root and pm2 is not installed." >&2
    echo "See the Plan B appendix in docs/GO-LIVE.md." >&2
    return 1
  fi
}

# Symlink swap via a temporary name and mv, so there is no instant where
# 'current' does not exist.
ln -sfn '$RELEASES_DIR/$RELEASE' '$CURRENT_LINK.new'
mv -Tf '$CURRENT_LINK.new' '$CURRENT_LINK'

restart_app

# Health gate: if the new release does not answer, roll straight back.
for i in \$(seq 1 30); do
  if curl -fsS -o /dev/null http://127.0.0.1:3000/api/health; then
    echo "healthy after \${i}s"
    # The release was built on a machine with no database, so its prerendered
    # pages do not know which papers an administrator has hidden, and they
    # carry whatever snapshot the build harvested. Purging makes the first
    # request to each page re-read both. Without the secret this still
    # converges — the ISR timer is an hour — so it warns rather than fails.
    if [ -n "\${PORTAL_REVALIDATE_SECRET:-}" ]; then
      if curl -fsS -o /dev/null -X POST -H "Authorization: Bearer \$PORTAL_REVALIDATE_SECRET" http://127.0.0.1:3000/api/revalidate; then
        echo "purged the page cache"
      else
        echo "WARNING: cache purge failed; pages refresh within the hour" >&2
      fi
    else
      echo "WARNING: PORTAL_REVALIDATE_SECRET is not set; pages refresh within the hour" >&2
    fi
    exit 0
  fi
  sleep 1
done

echo "New release failed its health check — rolling back." >&2
PREVIOUS=\$(ls -1dt '$RELEASES_DIR'/*/ | sed -n 2p)
if [ -n "\$PREVIOUS" ]; then
  ln -sfn "\${PREVIOUS%/}" '$CURRENT_LINK.new'
  mv -Tf '$CURRENT_LINK.new' '$CURRENT_LINK'
  restart_app
  echo "Rolled back to \$PREVIOUS" >&2
fi
exit 1
REMOTE

echo "==> Pruning old releases (keeping $KEEP)"
ssh "$SSH_HOST" "cd '$RELEASES_DIR' && ls -1dt */ | tail -n +$((KEEP + 1)) | xargs -r rm -rf"

echo "==> Deployed $RELEASE to $TARGET"
