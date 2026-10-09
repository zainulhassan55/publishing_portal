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
# Usage:  ./scripts/deploy.sh staging|production
set -euo pipefail

TARGET="${1:-}"

case "$TARGET" in
  staging)
    SSH_HOST="${DEPLOY_STAGING_HOST:?DEPLOY_STAGING_HOST is not set}"
    APP_DIR="/home/nextgeniq/staging"
    SERVICE="ngiq-portal-staging"
    ;;
  production)
    SSH_HOST="${DEPLOY_PRODUCTION_HOST:?DEPLOY_PRODUCTION_HOST is not set}"
    APP_DIR="/home/nextgeniq/portal"
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

echo "==> Uploading to $SSH_HOST:$RELEASES_DIR/$RELEASE"
ssh "$SSH_HOST" "mkdir -p '$RELEASES_DIR/$RELEASE'"
rsync -az --delete "$STAGE/" "$SSH_HOST:$RELEASES_DIR/$RELEASE/"

echo "==> Activating"
ssh "$SSH_HOST" bash -s <<REMOTE
set -euo pipefail

# Symlink swap via a temporary name and mv, so there is no instant where
# 'current' does not exist.
ln -sfn '$RELEASES_DIR/$RELEASE' '$CURRENT_LINK.new'
mv -Tf '$CURRENT_LINK.new' '$CURRENT_LINK'

sudo systemctl restart '$SERVICE'

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
  sudo systemctl restart '$SERVICE'
  echo "Rolled back to \$PREVIOUS" >&2
fi
exit 1
REMOTE

echo "==> Pruning old releases (keeping $KEEP)"
ssh "$SSH_HOST" "cd '$RELEASES_DIR' && ls -1dt */ | tail -n +$((KEEP + 1)) | xargs -r rm -rf"

echo "==> Deployed $RELEASE to $TARGET"
