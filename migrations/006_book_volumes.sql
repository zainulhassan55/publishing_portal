-- Portal schema, version 6: published book series volumes and their chapters.
--
-- Journal articles are OJS's and reach the portal through the harvest. Book
-- series volumes have no OJS equivalent (docs/CONTENT-RESTRUCTURE-PLAN.md), so
-- the portal holds them: an administrator creates a volume, adds its chapters,
-- uploads the final PDFs to object storage, and publishes.
--
-- A volume is public only when published_at is set and hidden = 0. A volume
-- with cfp_open = 1 accepts chapter submissions (book_submissions, 005) whether
-- or not it is published yet, which is how an edited volume collects chapters.

CREATE TABLE IF NOT EXISTS book_volumes (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  series_slug     VARCHAR(80)     NOT NULL,
  -- URL segment within the series: /series/{series_slug}/volumes/{slug}.
  slug            VARCHAR(190)    NOT NULL,
  volume_number   INT UNSIGNED        NULL,
  title           VARCHAR(400)    NOT NULL,
  subtitle        VARCHAR(400)        NULL,
  format          ENUM('monograph', 'edited', 'proceedings') NOT NULL,
  -- [{ name, affiliation, role }] where role is 'author' or 'editor'.
  contributors    JSON            NOT NULL,
  abstract        TEXT                NULL,
  keywords        JSON                NULL,
  isbn_print      VARCHAR(20)         NULL,
  isbn_online     VARCHAR(20)         NULL,
  doi             VARCHAR(190)        NULL,
  licence         VARCHAR(60)     NOT NULL DEFAULT 'CC BY 4.0',
  pages           INT UNSIGNED        NULL,
  published_at    DATE                NULL,
  hidden          TINYINT(1)      NOT NULL DEFAULT 0,
  cfp_open        TINYINT(1)      NOT NULL DEFAULT 0,
  cfp_deadline    DATE                NULL,
  -- Call text shown on the chapter submission page.
  cfp_text        TEXT                NULL,
  pdf_upload_id   CHAR(36)            NULL,
  cover_upload_id CHAR(36)            NULL,
  created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_volume_slug (series_slug, slug),
  KEY idx_volume_public (series_slug, hidden, published_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS book_chapters (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  volume_id      BIGINT UNSIGNED NOT NULL,
  seq            INT UNSIGNED    NOT NULL,
  title          VARCHAR(400)    NOT NULL,
  -- [{ name, affiliation }]
  authors        JSON            NOT NULL,
  abstract       TEXT                NULL,
  page_range     VARCHAR(40)         NULL,
  doi            VARCHAR(190)        NULL,
  pdf_upload_id  CHAR(36)            NULL,
  hidden         TINYINT(1)      NOT NULL DEFAULT 0,
  created_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_chapter_volume (volume_id, seq),
  CONSTRAINT fk_chapter_volume FOREIGN KEY (volume_id) REFERENCES book_volumes (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
