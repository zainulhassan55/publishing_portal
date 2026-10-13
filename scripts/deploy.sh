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

# NEXT_PUBLIC_OJS_PATH is pinned here, and the pin is load-bearing.
#
# Next.js inlines every NEXT_PUBLIC_* value at BUILD time — into the server
# bundle as well as the client one. This build runs on a developer's machine,
# where .env.local sets the variable to the absolute
# https://www.nextgeniqpress.com/ojs so localhost can develop against the live
# OJS. Without this override that absolute value is compiled into the release
# and shipped, and /etc/ngiq/portal.env cannot undo it: there is no runtime
# lookup left to override.
#
# The consequence is not cosmetic. src/lib/auth/ojs-cookie.ts decides whether
# OJS shares the portal's origin by asking whether the prefix is relative, and
# the session hand-off only attaches OJSSID when it does. An absolute value
# silently turns the cookie off, so every "Open in the editorial system" link
# lands the reader in OJS logged out — at its front page, with no sign of why.
#
# A real environment variable takes precedence over .env.local, so production
# gets the same-origin path and local development is untouched.
NEXT_PUBLIC_OJS_PATH=/ojs npm run build

# Fail the deploy rather than ship that bug again. The hand-off is invisible
# when it breaks — the link still works, it just quietly stops authenticating —
# so it has to be caught here instead of by someone clicking it in production.
#
# The pattern matches the INLINED ASSIGNMENT (`="https://host/ojs"`), not the
# bare hostname. Searching for the hostname alone gives a false positive on
# every build: requireOjsBaseUrl's "OJS_BASE_URL is not set … e.g.
# https://www.nextgeniqpress.com/ojs" error message is a string literal in the
# bundle, and the `="` prefix is what distinguishes a compiled-in value from
# prose that merely mentions the URL. Maps are excluded for the same reason —
# they embed config.ts's doc comment verbatim.
#
# OJS_BASE_URL is not checked here: it has no NEXT_PUBLIC_ prefix, so it stays
# a runtime lookup against /etc/ngiq/portal.env and is correctly absolute.
if grep -rqsE '="https?://[^"]+/ojs"' .next/server --include="*.js"; then
  echo "Build has an absolute OJS path compiled in; NEXT_PUBLIC_OJS_PATH must be /ojs." >&2
  echo "Offending chunks:" >&2
  grep -rlsE '="https?://[^"]+/ojs"' .next/server --include="*.js" >&2
  exit 1
fi

# `output: 'standalone'` emits a self-contained server; static and public assets
# are copied in because the standalone output does not include them.
STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT

cp -R .next/standalone/. "$STAGE/"
mkdir -p "$STAGE/.next"
cp -R .next/static "$STAGE/.next/static"
cp -R public "$STAGE/public"
cp -R content "$STAGE/content"

# Migrations ship with the release so the server applies them itself during
# activation. migrate.ts records each file in schema_migrations, so re-running
# on every deploy is a no-op.
cp -R migrations "$STAGE/migrations"
mkdir -p "$STAGE/scripts"
cp scripts/migrate.ts scripts/env.ts "$STAGE/scripts/"

# migrate.ts needs mysql2 as a resolvable package, and the release bundle
# cannot provide it: Next compiles server dependencies into its own chunks
# rather than shipping them under node_modules. A private install next to the
# script satisfies the import without touching the app's node_modules.
printf '{"private":true,"type":"module"}' > "$STAGE/scripts/package.json"
npm install --prefix "$STAGE/scripts" --no-save --no-audit --no-fund --loglevel=error mysql2

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
