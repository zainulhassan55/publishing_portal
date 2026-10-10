-- Portal schema, version 1.
--
-- Scope rule: this database holds only entities OJS does not own. Users,
-- submissions, review rounds, reviewer assignments, files, editorial decisions,
-- issues and galleys all live in the OJS database and are never duplicated
-- here. Where a row needs to point at a person, it stores `ojs_user_id` — a
-- reference, not a copy.

CREATE TABLE IF NOT EXISTS journal_proposals (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  title          VARCHAR(300)    NOT NULL,
  subject        VARCHAR(120)    NOT NULL,
  scope          TEXT            NOT NULL,
  rationale      TEXT                NULL,
  expected_volume VARCHAR(60)        NULL,
  eic_name       VARCHAR(200)        NULL,
  eic_affiliation VARCHAR(300)       NULL,
  eic_orcid      VARCHAR(25)         NULL,
  proposer_name  VARCHAR(200)    NOT NULL,
  proposer_email VARCHAR(320)    NOT NULL,
  status         ENUM('received','under_review','accepted','declined') NOT NULL DEFAULT 'received',
  -- Verbatim payload, so a later schema change never loses what was submitted.
  payload        JSON                NULL,
  created_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_proposals_status (status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS alert_signups (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email            VARCHAR(320)    NOT NULL,
  journal_slug     VARCHAR(40)         NULL,
  scope            ENUM('new_issue','cfp','news','digest') NOT NULL DEFAULT 'new_issue',
  -- Double opt-in: a signup is not mailed until it is confirmed.
  verify_token     CHAR(43)        NOT NULL,
  verified_at      DATETIME            NULL,
  unsubscribe_token CHAR(43)       NOT NULL,
  unsubscribed_at  DATETIME            NULL,
  created_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_alerts (email, journal_slug, scope),
  UNIQUE KEY uq_alerts_unsub (unsubscribe_token),
  KEY idx_alerts_verify (verify_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Audit finding F-18: the contact form's submit was href="#" with nothing
-- behind it, so business correspondence was silently dropped.
CREATE TABLE IF NOT EXISTS contact_messages (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name         VARCHAR(200)    NOT NULL,
  email        VARCHAR(320)    NOT NULL,
  journal_slug VARCHAR(40)         NULL,
  topic        VARCHAR(120)        NULL,
  message      TEXT            NOT NULL,
  -- Kept for abuse triage only; purge on the retention schedule in the runbook.
  source_ip    VARBINARY(16)       NULL,
  handled_at   DATETIME            NULL,
  created_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_contact_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Wizard drafts. A draft is portal state: it has no OJS submission yet, which
-- is exactly why OJS cannot hold it. On final submit the payload is handed to
-- OJS and `ojs_submission_id` records where it landed.
CREATE TABLE IF NOT EXISTS submission_drafts (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  ojs_user_id       BIGINT UNSIGNED NOT NULL,
  journal_slug      VARCHAR(40)         NULL,
  current_step      TINYINT UNSIGNED NOT NULL DEFAULT 1,
  payload           JSON            NOT NULL,
  file_manifest     JSON                NULL,
  ojs_submission_id BIGINT UNSIGNED     NULL,
  submitted_at      DATETIME            NULL,
  created_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_drafts_user (ojs_user_id, updated_at),
  KEY idx_drafts_submission (ojs_submission_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Preferences the portal adds on top of the OJS profile. Anything OJS already
-- stores (name, email, affiliation, password) stays in OJS and is edited
-- through its API, not copied here.
CREATE TABLE IF NOT EXISTS user_prefs (
  ojs_user_id        BIGINT UNSIGNED NOT NULL,
  orcid              VARCHAR(25)         NULL,
  orcid_verified_at  DATETIME            NULL,
  research_interests JSON                NULL,
  journal_interests  JSON                NULL,
  available_to_review TINYINT(1)     NOT NULL DEFAULT 0,
  max_concurrent_reviews TINYINT UNSIGNED NOT NULL DEFAULT 2,
  notify_toc         TINYINT(1)      NOT NULL DEFAULT 1,
  notify_cfp         TINYINT(1)      NOT NULL DEFAULT 1,
  notify_news        TINYINT(1)      NOT NULL DEFAULT 0,
  notify_digest      TINYINT(1)      NOT NULL DEFAULT 0,
  updated_at         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (ojs_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Applied-migration ledger, so `npm run db:migrate` is idempotent.
CREATE TABLE IF NOT EXISTS schema_migrations (
  name       VARCHAR(190) NOT NULL,
  applied_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
