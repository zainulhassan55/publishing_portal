-- Portal schema, version 8: one-time codes that prove an email address.
--
-- Registration now emails a six-digit code and creates the OJS account only
-- once it is typed back (src/lib/auth/email-otp.ts). OJS's own email
-- validation stays off (`require_validation = Off`): it would break the
-- portal's register-then-sign-in relay, so the portal does the check instead.
--
-- One live code per address and purpose; requesting another replaces it.
-- Only a salted hash is stored. Rows are short-lived and pruned as new codes
-- are issued.

CREATE TABLE IF NOT EXISTS email_otps (
  email       VARCHAR(254)     NOT NULL,
  purpose     VARCHAR(20)      NOT NULL,
  code_hash   CHAR(64)         NOT NULL,
  salt        CHAR(32)         NOT NULL,
  -- Wrong guesses against this code. At the limit the code is dead.
  attempts    TINYINT UNSIGNED NOT NULL DEFAULT 0,
  expires_at  DATETIME         NOT NULL,
  created_at  DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (email, purpose),
  KEY idx_otp_expiry (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
