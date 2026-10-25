-- Portal schema, version 5: editorial forms and the files they carry.
--
-- The publisher's October 2026 restructure (docs/CONTENT-RESTRUCTURE-PLAN.md)
-- moved four kinds of request off email and onto the site: applications to
-- review or join a board, special issue proposals, book volume proposals, and
-- book chapter submissions. Journal manuscripts still go to OJS; nothing here
-- touches it.
--
-- Every form stores its full submitted payload as JSON next to the few columns
-- the admin screens filter and sort by — the same convention journal_proposals
-- set in 001 — so a field added to a form later needs no migration.
--
-- Files are not stored in MySQL. They live in object storage (Cloudflare R2,
-- src/lib/storage.ts); `uploads` records who sent what, for which request, and
-- where it is.

CREATE TABLE IF NOT EXISTS uploads (
  -- Random, not sequential: the id appears in the browser between signing and
  -- submitting, and a guessable id would let one visitor attach another's file.
  id            CHAR(36)        NOT NULL,
  purpose       VARCHAR(40)     NOT NULL,
  bucket        VARCHAR(20)     NOT NULL,
  storage_key   VARCHAR(512)    NOT NULL,
  original_name VARCHAR(255)    NOT NULL,
  content_type  VARCHAR(120)    NOT NULL,
  size_bytes    BIGINT UNSIGNED NOT NULL,
  -- pending: signed, maybe uploaded, not yet part of a submitted form.
  -- attached: verified and moved out of pending/. deleted: removed from storage.
  status        ENUM('pending', 'attached', 'deleted') NOT NULL DEFAULT 'pending',
  -- What it belongs to once attached. Loose for the same reason as
  -- admin_audit.target_*: several tables own files.
  owner_type    VARCHAR(40)         NULL,
  owner_id      BIGINT UNSIGNED     NULL,
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  attached_at   DATETIME            NULL,
  PRIMARY KEY (id),
  KEY idx_uploads_owner (owner_type, owner_id),
  -- The cleanup job asks for old pending rows.
  KEY idx_uploads_pending (status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reviewer and editorial board applications.
CREATE TABLE IF NOT EXISTS editorial_applications (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  role           ENUM('reviewer', 'board') NOT NULL,
  -- Journal or series slug from the registry.
  target_slug    VARCHAR(80)     NOT NULL,
  name           VARCHAR(200)    NOT NULL,
  email          VARCHAR(254)    NOT NULL,
  orcid          VARCHAR(19)     NOT NULL,
  status         ENUM('received', 'under_review', 'accepted', 'declined', 'withdrawn') NOT NULL DEFAULT 'received',
  payload        JSON            NOT NULL,
  decided_at     DATETIME            NULL,
  decided_by     BIGINT UNSIGNED     NULL,
  decision_note  TEXT                NULL,
  created_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_app_status (status, created_at),
  KEY idx_app_target (target_slug, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Special issue and book volume proposals. New journal proposals stay in
-- journal_proposals (001), which its own admin screen already reads.
CREATE TABLE IF NOT EXISTS editorial_proposals (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  kind             ENUM('special_issue', 'book_volume') NOT NULL,
  target_slug      VARCHAR(80)     NOT NULL,
  title            VARCHAR(400)    NOT NULL,
  submitter_name   VARCHAR(200)    NOT NULL,
  submitter_email  VARCHAR(254)    NOT NULL,
  status           ENUM('received', 'under_review', 'accepted', 'declined', 'withdrawn') NOT NULL DEFAULT 'received',
  payload          JSON            NOT NULL,
  decided_at       DATETIME            NULL,
  decided_by       BIGINT UNSIGNED     NULL,
  decision_note    TEXT                NULL,
  created_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_prop_kind (kind, status, created_at),
  KEY idx_prop_target (target_slug, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Book chapter submissions and full manuscripts for accepted volume proposals.
-- volume_id refers to the book volumes table that arrives with the books
-- pipeline; it is a plain column until then.
CREATE TABLE IF NOT EXISTS book_submissions (
  id                   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  kind                 ENUM('chapter', 'manuscript') NOT NULL,
  series_slug          VARCHAR(80)     NOT NULL,
  volume_id            BIGINT UNSIGNED     NULL,
  proposal_id          BIGINT UNSIGNED     NULL,
  title                VARCHAR(400)    NOT NULL,
  corresponding_name   VARCHAR(200)    NOT NULL,
  corresponding_email  VARCHAR(254)    NOT NULL,
  status               ENUM('received', 'under_review', 'revisions', 'accepted', 'declined', 'withdrawn') NOT NULL DEFAULT 'received',
  payload              JSON            NOT NULL,
  decided_at           DATETIME            NULL,
  decided_by           BIGINT UNSIGNED     NULL,
  decision_note        TEXT                NULL,
  created_at           DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_book_sub_status (status, created_at),
  KEY idx_book_sub_series (series_slug, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
