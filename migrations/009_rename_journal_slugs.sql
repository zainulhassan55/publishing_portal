-- Portal schema, version 9: journal slugs follow the October 2026 renames.
--
-- On 2026-11-01 the portal's URLs moved to the titles' new codes, which are
-- also their OJS paths: ijic → ticr, ijdm → jdmie, jqcs → tqcis,
-- jaise → jaaise, sst → dtcr. Rows written before then still name the old
-- slug. The code resolves old slugs too (legacySlugs in
-- src/lib/ojs/contexts.ts), so this is tidying rather than a fix, but it keeps
-- admin lists, alert sends and the hide-a-paper gate on one spelling.
--
-- Only rows still on an old slug change, so running this twice is harmless.
-- No new slug could have been stored before this release (the forms only
-- accept slugs in the registry), so the alert_signups unique key cannot clash.
-- admin_audit is history and keeps the slugs it recorded.

UPDATE alert_signups SET journal_slug = CASE journal_slug WHEN 'ijic' THEN 'ticr' WHEN 'ijdm' THEN 'jdmie' WHEN 'jqcs' THEN 'tqcis' WHEN 'jaise' THEN 'jaaise' WHEN 'sst' THEN 'dtcr' END WHERE journal_slug IN ('ijic', 'ijdm', 'jqcs', 'jaise', 'sst');

UPDATE contact_messages SET journal_slug = CASE journal_slug WHEN 'ijic' THEN 'ticr' WHEN 'ijdm' THEN 'jdmie' WHEN 'jqcs' THEN 'tqcis' WHEN 'jaise' THEN 'jaaise' WHEN 'sst' THEN 'dtcr' END WHERE journal_slug IN ('ijic', 'ijdm', 'jqcs', 'jaise', 'sst');

UPDATE submission_drafts SET journal_slug = CASE journal_slug WHEN 'ijic' THEN 'ticr' WHEN 'ijdm' THEN 'jdmie' WHEN 'jqcs' THEN 'tqcis' WHEN 'jaise' THEN 'jaaise' WHEN 'sst' THEN 'dtcr' END WHERE journal_slug IN ('ijic', 'ijdm', 'jqcs', 'jaise', 'sst');

UPDATE article_display SET journal_slug = CASE journal_slug WHEN 'ijic' THEN 'ticr' WHEN 'ijdm' THEN 'jdmie' WHEN 'jqcs' THEN 'tqcis' WHEN 'jaise' THEN 'jaaise' WHEN 'sst' THEN 'dtcr' END WHERE journal_slug IN ('ijic', 'ijdm', 'jqcs', 'jaise', 'sst');

UPDATE editorial_applications SET target_slug = CASE target_slug WHEN 'ijic' THEN 'ticr' WHEN 'ijdm' THEN 'jdmie' WHEN 'jqcs' THEN 'tqcis' WHEN 'jaise' THEN 'jaaise' WHEN 'sst' THEN 'dtcr' END WHERE target_slug IN ('ijic', 'ijdm', 'jqcs', 'jaise', 'sst');

UPDATE editorial_proposals SET target_slug = CASE target_slug WHEN 'ijic' THEN 'ticr' WHEN 'ijdm' THEN 'jdmie' WHEN 'jqcs' THEN 'tqcis' WHEN 'jaise' THEN 'jaaise' WHEN 'sst' THEN 'dtcr' END WHERE target_slug IN ('ijic', 'ijdm', 'jqcs', 'jaise', 'sst');
