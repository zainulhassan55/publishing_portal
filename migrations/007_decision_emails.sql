-- Portal schema, version 7: record when a decision was emailed.
--
-- Accepting or declining in the admin panel now offers to email the submitter
-- an editable letter. The panel shows whether that letter went out, so an
-- editor neither forgets to send it nor sends it twice. The letter itself is
-- in admin_audit; this column is only the "has it been sent" flag the list
-- screens read.

ALTER TABLE journal_proposals ADD COLUMN decision_emailed_at DATETIME NULL AFTER decision_note;

ALTER TABLE editorial_applications ADD COLUMN decision_emailed_at DATETIME NULL AFTER decision_note;

ALTER TABLE editorial_proposals ADD COLUMN decision_emailed_at DATETIME NULL AFTER decision_note;

ALTER TABLE book_submissions ADD COLUMN decision_emailed_at DATETIME NULL AFTER decision_note;
