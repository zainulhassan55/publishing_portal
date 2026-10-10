#!/usr/bin/env bash
#
# Nightly offsite backup. Run from cron on the VPS:
#   15 2 * * * /home/nextgeniqpress/portal/current/scripts/backup.sh >> /var/log/ngiq-backup.log 2>&1
#
# Audit finding F-05: everything — accounts, submissions, peer reviews,
# manuscript files — sat on one MySQL instance on one VPS, with manual weekly
# backups that had never been restored.
#
# What is backed up here is everything that cannot be rebuilt:
#   - both databases
#   - the OJS files directory (manuscripts and galleys live on disk, NOT in the
#     database; losing these loses the submissions themselves)
#   - the configuration needed to stand the service up again
#
# Deliberately NOT backed up: node_modules, build output, and
# content/harvest.json — all reproducible, and including them would bloat every
# snapshot with data that is already safe in OJS.
#
# This script only proves a backup was *written*. It does not prove it can be
# restored. Run the restore drill in docs/RUNBOOK.md quarterly and record the
# date, or this is still a hypothesis.
set -euo pipefail

: "${B2_BUCKET:?B2_BUCKET is not set}"
: "${MYSQL_ROOT_PASSWORD:?MYSQL_ROOT_PASSWORD is not set}"

# CloudPanel layout: the site user is `nextgeniqpress` and the document root is
# ~/htdocs/www.nextgeniqpress.com, so OJS and its config sit under there.
#
# OJS_FILES_DIR must be the `files_dir` from config.inc.php — confirm it rather
# than trusting this default. It holds the manuscripts themselves, so backing up
# the wrong path means backing up no submissions while appearing to succeed:
#   grep files_dir "$OJS_CONFIG"
SITE_ROOT="${SITE_ROOT:-/home/nextgeniqpress/htdocs/www.nextgeniqpress.com}"
OJS_CONFIG="${OJS_CONFIG:-$SITE_ROOT/ojs/config.inc.php}"
# Confirmed on the server: ~/ojs_files (underscore), a sibling of htdocs, not
# ojs-files and not inside the document root. Being outside htdocs is correct —
# manuscripts must never be reachable over HTTP.
OJS_FILES_DIR="${OJS_FILES_DIR:-/home/nextgeniqpress/ojs_files}"
RETAIN_DAYS="${RETAIN_DAYS:-30}"

if [ ! -f "$OJS_CONFIG" ]; then
  echo "OJS_CONFIG does not exist: $OJS_CONFIG" >&2
  echo "Set SITE_ROOT or OJS_CONFIG. Refusing to run a backup that would silently" >&2
  echo "omit the OJS configuration." >&2
  exit 1
fi

if [ ! -d "$OJS_FILES_DIR" ]; then
  echo "OJS_FILES_DIR does not exist: $OJS_FILES_DIR" >&2
  echo "Find the real path with: grep files_dir '$OJS_CONFIG'" >&2
  echo "Refusing to run a backup that would contain no manuscripts." >&2
  exit 1
fi

STAMP="$(date -u +%Y-%m-%dT%H%M%SZ)"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

log() { printf '[%s] %s\n' "$(date -u +%H:%M:%S)" "$1"; }

log "backup $STAMP starting"

# --single-transaction keeps InnoDB consistent without locking tables, so a
# nightly dump does not stall the editorial system mid-review.
for DB in ojs portal; do
  log "dumping $DB"
  mysqldump \
    --user=root --password="$MYSQL_ROOT_PASSWORD" \
    --single-transaction --quick --routines --triggers --events \
    --default-character-set=utf8mb4 \
    "$DB" | gzip -9 > "$WORK/$DB-$STAMP.sql.gz"

  # A dump that gzip cannot read is worse than no dump, because it looks like
  # one. Verify before it is the only copy.
  gzip -t "$WORK/$DB-$STAMP.sql.gz"
  SIZE=$(du -h "$WORK/$DB-$STAMP.sql.gz" | cut -f1)
  log "  $DB → $SIZE (gzip verified)"
done

if [ -d "$OJS_FILES_DIR" ]; then
  log "archiving OJS files directory"
  tar -czf "$WORK/ojs-files-$STAMP.tar.gz" -C "$(dirname "$OJS_FILES_DIR")" "$(basename "$OJS_FILES_DIR")"
  tar -tzf "$WORK/ojs-files-$STAMP.tar.gz" > /dev/null
  log "  files → $(du -h "$WORK/ojs-files-$STAMP.tar.gz" | cut -f1) (archive verified)"
else
  # Not a warning to scroll past: without this directory the backup does not
  # contain the manuscripts.
  log "ERROR: $OJS_FILES_DIR not found — submission files are NOT in this backup"
  exit 1
fi

log "archiving configuration"
tar -czf "$WORK/config-$STAMP.tar.gz" \
  --ignore-failed-read \
  "$OJS_CONFIG" \
  /etc/nginx/sites-available \
  /etc/systemd/system/ngiq-portal.service \
  /etc/ngiq/portal.env 2>/dev/null || true

log "uploading to b2://$B2_BUCKET/$STAMP/"
for FILE in "$WORK"/*; do
  b2 file upload --quiet "$B2_BUCKET" "$FILE" "$STAMP/$(basename "$FILE")"
done

log "pruning snapshots older than $RETAIN_DAYS days"
CUTOFF="$(date -u -d "$RETAIN_DAYS days ago" +%Y-%m-%d 2>/dev/null || date -u -v-"${RETAIN_DAYS}"d +%Y-%m-%d)"
b2 ls "$B2_BUCKET" | awk -F/ '{print $1}' | sort -u | while read -r DIR; do
  [ -z "$DIR" ] && continue
  if [[ "$DIR" < "$CUTOFF" ]]; then
    log "  removing $DIR"
    b2 rm --recursive --quiet "$B2_BUCKET/$DIR" || true
  fi
done

log "backup $STAMP complete"
