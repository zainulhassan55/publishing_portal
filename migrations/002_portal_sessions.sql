-- Portal schema, version 2: portal-owned sessions.
--
-- Scope rule unchanged: this is a SESSION store, not an account store. OJS
-- still owns every user, password and role. A row here is a mapping from a
-- cookie the portal issued to an `ojs_user_id` and the OJS session behind it,
-- and it holds nothing OJS does not already know about the person.
--
-- Why this table exists at all, given OJS has sessions of its own:
--
--   * OJS 3.5 has no `/api/v1/users/me`, so a session cannot be resolved by
--     asking OJS "who is this cookie". Identity is read once at sign-in and
--     cached here instead.
--   * OJS scopes `OJSSID` to `path=/ojs/`, so the browser never presents it to
--     portal routes. Re-issuing a copy at `path=/` would leave two cookies of
--     the same name whose precedence is browser-dependent — an intermittent
--     session-mixing bug. The portal issues its own cookie instead and keeps
--     the OJS session id server-side, where the browser never sees it.
--   * It makes expiry a decidable server-side fact rather than a hope.

CREATE TABLE IF NOT EXISTS portal_sessions (
  -- sha256 of the token in the cookie, hex. The token itself is never stored:
  -- a leaked database read must not yield usable session cookies.
  token_hash     CHAR(64)        NOT NULL,
  ojs_user_id    BIGINT UNSIGNED NOT NULL,
  -- The OJS session id this portal session is backed by. A credential at rest,
  -- which is why it is server-side only and why `purgeExpired` matters.
  ojs_sid        VARCHAR(128)    NOT NULL,
  -- Denormalised from OJS at sign-in so routes do not make an outbound call
  -- per request. Refreshed on revalidation; OJS remains the source of truth.
  user_name      VARCHAR(190)    NOT NULL,
  full_name      VARCHAR(255)        NULL,
  email          VARCHAR(320)        NULL,
  -- Lowercased OJS role names, e.g. ["author","reviewer"]. OJS role ids are
  -- mapped through ROLE_NAMES in src/lib/auth/session.ts.
  roles          JSON                NULL,
  -- OJS's own CSRF token for this session. Required on mutating API calls;
  -- without it OJS answers 403 "You may have been logged out".
  ojs_csrf_token VARCHAR(190)        NULL,
  created_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  -- Drives lazy revalidation: past a threshold the session is re-checked
  -- against OJS rather than trusted indefinitely.
  last_seen_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at     DATETIME        NOT NULL,
  PRIMARY KEY (token_hash),
  -- Sign-out everywhere, and a cap on concurrent sessions per user if ever
  -- needed.
  KEY idx_sessions_user (ojs_user_id),
  -- Lets the purge scan only what has actually expired.
  KEY idx_sessions_expiry (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
