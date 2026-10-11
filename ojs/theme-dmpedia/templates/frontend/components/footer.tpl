{**
 * plugins/themes/dmpedia/templates/frontend/components/footer.tpl
 *
 * @brief DMPedia frontend footer.
 *
 * @hook Templates::Common::Sidebar []
 * @hook Templates::Common::Footer::PageFooter []
 *}
{assign var="portalUrl" value=$activeTheme->getPortalUrl()}

	</div><!-- pkp_structure_main -->

	{if empty($isFullWidth)}
		{capture assign="sidebarCode"}{call_hook name="Templates::Common::Sidebar"}{/capture}
		{if $sidebarCode}
			<div class="pkp_structure_sidebar left" role="complementary">
				{$sidebarCode}
			</div><!-- pkp_sidebar.left -->
		{/if}
	{/if}
</div><!-- pkp_structure_content -->

<div class="pkp_structure_footer_wrapper" role="contentinfo">
	<a id="pkp_content_footer"></a>

	<div class="pkp_structure_footer">

		<div class="dmp_footer_grid">
			<div class="dmp_footer_brand">
				<a class="dmp_footer_logo" href="{$portalUrl|escape}/">
					<span class="dmp_topbar_mark" aria-hidden="true">NG</span>
					<span>NextGenIQ Press</span>
				</a>
				<p>Peer-reviewed, APC-free open-access journals published by NextGenIQ Press.</p>
			</div>

			<div class="dmp_footer_col">
				<h2>{if $currentContext}{$currentContext->getLocalizedAcronym()|default:"Journal"|escape}{else}Journals{/if}</h2>
				<ul>
					{* Portal pages, not OJS's own — the portal is the public face of
					   every journal, and these used to lead readers back into the
					   legacy OJS pages. Register stays in OJS: accounts live there. *}
					{if $currentContext}
						<li><a href="{$portalUrl|escape}/journals/{$currentContext->getPath()|escape}">About the journal</a></li>
						<li><a href="{$portalUrl|escape}/submit">Submissions</a></li>
						<li><a href="{$portalUrl|escape}/journals/{$currentContext->getPath()|escape}/issues">Archives</a></li>
						<li><a href="{$portalUrl|escape}/contact">Contact</a></li>
					{else}
						<li><a href="{$portalUrl|escape}/journals">All journals</a></li>
						<li><a href="{$portalUrl|escape}/sign-in">Login</a></li>
						<li><a href="{url page="user" op="register"}">Register</a></li>
					{/if}
				</ul>
			</div>

			<div class="dmp_footer_col">
				<h2>NextGenIQ Press</h2>
				<ul>
					<li><a href="{$portalUrl|escape}/journals">Journal portfolio</a></li>
					<li><a href="{$portalUrl|escape}/guidelines">Author guidelines</a></li>
					<li><a href="{$portalUrl|escape}/policies">Policies</a></li>
					<li><a href="{$portalUrl|escape}/about">About NextGenIQ Press</a></li>
				</ul>
			</div>
		</div>

		{if $pageFooter}
			<div class="pkp_footer_content">
				{$pageFooter}
			</div>
		{/if}

		<div class="dmp_footer_bottom">
			<p>&copy; NextGenIQ Press. All rights reserved.</p>
			<div class="pkp_brand_footer">
				<a href="{url page="about" op="aboutThisPublishingSystem"}">
					<img alt="{translate key="about.aboutThisPublishingSystem"}" src="{$baseUrl}/{$brandImage}">
				</a>
			</div>
		</div>
	</div>
</div><!-- pkp_structure_footer_wrapper -->

</div><!-- pkp_structure_page -->

{load_script context="frontend"}

{call_hook name="Templates::Common::Footer::PageFooter"}
</body>
</html>
