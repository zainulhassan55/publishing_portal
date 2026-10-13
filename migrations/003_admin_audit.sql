-- Portal schema, version 3: the admin audit trail.
--
-- The admin panel can approve a journal proposal, hold a paper back from the
-- public site and hide a journal. Those are consequential and contested
-- decisions, and someone will eventually ask who made one and when. There is no
-- answering that after the fact, which is why this table lands in the same
-- migration as the panel's foundations rather than "later" — a log added after
-- six months of decisions explains none of them.
--
-- Scope rule unchanged: this records what the *portal* did. Actions taken in OJS
-- are logged by OJS in its own event log, and duplicating them here would mean
-- two incomplete histories instead of one. A row here means "an administrator
-- used the portal to do this".

CREATE TABLE IF NOT EXISTS admin_audit (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  -- Who. A reference into OJS, never a copy of the account — the same rule the
  -- rest of the schema follows. `actor_name` is denormalised alongside it
  -- because a log that renders as "user 22" is not a log anyone can read, and
  -- the name at the time of the action is the historically correct one even if
  -- it changes in OJS later.
  actor_user_id BIGINT UNSIGNED NOT NULL,
  actor_name    VARCHAR(255)        NULL,
  -- What, as a stable machine-readable verb: 'proposal.status_changed',
  -- 'journal.visibility_changed', 'article.display_changed'.
  action        VARCHAR(80)     NOT NULL,
  -- Which thing it happened to. Deliberately loose: the panel acts on portal
  -- rows, OJS submissions and journal slugs, and a foreign key to any one of
  -- them would exclude the others.
  target_type   VARCHAR(40)     NOT NULL,
  target_id     VARCHAR(190)    NOT NULL,
  -- Enough to reconstruct the decision. `before`/`after` rather than a free-text
  -- description so a change can be read precisely and, if it was wrong, undone.
  before_state  JSON                NULL,
  after_state   JSON                NULL,
  -- Operator-supplied reason, where the UI asks for one. A declined journal
  -- proposal without a recorded reason is an argument waiting to happen.
  note          TEXT                NULL,
  -- Abuse and incident triage only, same retention schedule as
  -- contact_messages.source_ip in 001.
  source_ip     VARBINARY(16)       NULL,
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  -- The activity screen reads newest-first across everything.
  KEY idx_audit_created (created_at),
  -- "What has this administrator been doing" and "what happened to this thing"
  -- are the two questions actually asked of an audit log.
  KEY idx_audit_actor (actor_user_id, created_at),
  KEY idx_audit_target (target_type, target_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Journal proposals gained a decision trail of their own. The status column in
-- 001 records where a proposal *is*; these record how it got there and why,
-- which is what an applicant asking "why was mine declined" needs.
ALTER TABLE journal_proposals
  ADD COLUMN decided_at DATETIME NULL AFTER status,
  ADD COLUMN decided_by BIGINT UNSIGNED NULL AFTER decided_at,
  ADD COLUMN decision_note TEXT NULL AFTER decided_by;
