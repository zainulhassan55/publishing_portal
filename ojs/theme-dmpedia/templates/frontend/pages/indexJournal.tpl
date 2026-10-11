{**
 * plugins/themes/dmpedia/templates/frontend/pages/indexJournal.tpl
 *
 * @brief Journal index page with a DMPedia introduction panel.
 *
 * @uses $currentJournal Journal This journal
 * @uses $homepageImage object Image to be displayed on the homepage
 * @uses $additionalHomeContent string Arbitrary input from HTML text editor
 * @uses $numAnnouncementsHomepage int Number of announcements to display on the homepage
 * @uses $issue Issue Current issue
 *
 * @hook Templates::Index::journal []
 *}
{include file="frontend/components/header.tpl" pageTitleTranslated=$currentJournal->getLocalizedName()}

<div class="page_index_journal">

	<section class="dmp_intro">
		<p class="dmp_eyebrow">{$currentJournal->getLocalizedAcronym()|escape} &middot; Open access &middot; Peer reviewed</p>
		<h2 class="dmp_intro_title">Welcome to {$currentJournal->getLocalizedName()|escape}</h2>
		{if $currentJournal->getLocalizedData('description')}
			<div class="dmp_intro_text">{$currentJournal->getLocalizedData('description')}</div>
		{/if}
		<div class="dmp_actions">
			<a class="dmp_btn dmp_btn_primary" href="{url page="submission"}">Make a submission</a>
			{if $isUserLoggedIn}
				<a class="dmp_btn dmp_btn_outline" href="{url page="submissions"}">My submissions</a>
			{else}
				<a class="dmp_btn dmp_btn_outline" href="{url page="user" op="register"}">Register</a>
			{/if}
			<a class="dmp_btn dmp_btn_link" href="{url page="about" op="submissions"}">Submission guidelines</a>
		</div>
	</section>

	<ul class="dmp_facts">
		<li><span>Access</span><strong>Full open access</strong></li>
		<li><span>Review</span><strong>Peer reviewed</strong></li>
		<li><span>License</span><strong>CC BY 4.0</strong></li>
		<li><span>Charges</span><strong>APC-free</strong></li>
	</ul>

	{call_hook name="Templates::Index::journal"}

	{if $highlights->count()}
		{include file="frontend/components/highlights.tpl" highlights=$highlights}
	{/if}

	{if $activeTheme && !$activeTheme->getOption('useHomepageImageAsHeader') && $homepageImage}
		<div class="homepage_image">
			<img src="{$publicFilesDir}/{$homepageImage.uploadName|escape:"url"}"{if $homepageImage.altText} alt="{$homepageImage.altText|escape}"{/if}>
		</div>
	{/if}

	{include file="frontend/objects/announcements_list.tpl" numAnnouncements=$numAnnouncementsHomepage}

	{if $issue}
		<section class="current_issue">
			<a id="homepageIssue"></a>
			<h2>
				{translate key="journal.currentIssue"}
			</h2>
			<div class="current_issue_title">
				{$issue->getIssueIdentification()|escape}
			</div>
			{include file="frontend/objects/issue_toc.tpl" heading="h3"}
			<a href="{url router=PKP\core\PKPApplication::ROUTE_PAGE page="issue" op="archive"}" class="read_more">
				{translate key="journal.viewAllIssues"}
			</a>
		</section>
	{else}
		<section class="dmp_empty">
			<h2>Current issue</h2>
			<p>The first issue is in preparation. Accepted articles will appear here after peer review and production.</p>
		</section>
	{/if}

	{if $additionalHomeContent}
		<div class="additional_content">
			{$additionalHomeContent}
		</div>
	{/if}
</div><!-- .page -->

{include file="frontend/components/footer.tpl"}
