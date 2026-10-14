-- Portal schema, version 4: the publish-to-public gate.
--
-- OJS decides whether a paper is *published*; this table decides whether a
-- published paper is *shown on the portal website*. Those are different
-- decisions (docs/ADMIN-PANEL-PLAN.md, Phase 4) and the portal is the only
-- place the second one can live, because OJS has no notion of "published but
-- not displayed here".
--
-- The default is to mirror OJS: a paper with no row here is shown. A row with
-- hidden = 1 holds it back. Rows are never deleted when a paper is shown again
-- — `hidden` flips to 0 and the admin_audit row records why — so the table
-- doubles as the list of papers an administrator has ever touched.
--
-- Scope rule unchanged: the portal never writes OJS tables. `article_id` is the
-- harvest's own identifier (`ojs-<submissionId>`, see scripts/harvest.ts),
-- which keys the snapshot and the audit trail alike, and `journal_slug` is
-- denormalised so the activity screen can say which journal without a lookup.
CREATE TABLE IF NOT EXISTS article_display (
  article_id      VARCHAR(190)    NOT NULL,
  journal_slug    VARCHAR(80)     NOT NULL,
  hidden          TINYINT(1)      NOT NULL DEFAULT 0,
  -- Why it was held back. Optional, because "not yet" is a legitimate reason;
  -- the audit row carries the same text so it survives the row being flipped.
  note            TEXT                NULL,
  -- Who last changed it. A reference into OJS plus the name at the time, the
  -- same convention as admin_audit.actor_user_id / actor_name.
  updated_by      BIGINT UNSIGNED NOT NULL,
  updated_by_name VARCHAR(255)        NULL,
  updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (article_id),
  -- The public pages ask one question of this table: which ids are hidden.
  KEY idx_display_hidden (hidden)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
