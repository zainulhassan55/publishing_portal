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
npm run build

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
