{**
 * plugins/themes/dmpedia/templates/frontend/components/header.tpl
 *
 * @brief DMPedia frontend header: portal utility bar plus the standard OJS masthead.
 *
 * @uses $isFullWidth bool Should this page be displayed without sidebars?
 *}
{strip}
	{assign var="showingLogo" value=true}
	{if !$displayPageHeaderLogo}
		{assign var="showingLogo" value=false}
	{/if}
	{assign var="portalUrl" value=$activeTheme->getPortalUrl()}
{/strip}
<!DOCTYPE html>
<html lang="{$currentLocale|replace:"_":"-"}" xml:lang="{$currentLocale|replace:"_":"-"}">
{if !$pageTitleTranslated}{capture assign="pageTitleTranslated"}{translate key=$pageTitle}{/capture}{/if}
{include file="frontend/components/headerHead.tpl"}
<body class="pkp_page_{$requestedPage|escape|default:"index"} pkp_op_{$requestedOp|escape|default:"index"}{if $showingLogo} has_site_logo{/if}" dir="{$currentLocaleLangDir|escape|default:"ltr"}">

	<div class="pkp_structure_page">

		<div class="dmp_topbar">
			<div class="dmp_topbar_inner">
				<a class="dmp_topbar_brand" href="{$portalUrl|escape}/">
					<span class="dmp_topbar_mark" aria-hidden="true">NG</span>
					<span>NextGenIQ Press</span>
				</a>
				<nav class="dmp_topbar_links" aria-label="NextGenIQ Press portal">
					<a href="{$portalUrl|escape}/journals">All journals</a>
					<a href="{$portalUrl|escape}/guidelines">Author guidelines</a>
					<a href="{$portalUrl|escape}/contact">Contact</a>
				</nav>
			</div>
		</div>

		<header class="pkp_structure_head" id="headerNavigationContainer" role="banner">
			{include file="frontend/components/skipLinks.tpl"}

			<div class="pkp_head_wrapper">

				<div class="pkp_site_name_wrapper">
					<button class="pkp_site_nav_toggle">
						<span>Open Menu</span>
					</button>
					{if !$requestedPage || $requestedPage === 'index'}
						<h1 class="pkp_screen_reader">
							{if $currentContext}
								{$displayPageHeaderTitle|escape}
							{else}
								{$siteTitle|escape}
							{/if}
						</h1>
					{/if}
					<div class="pkp_site_name">
					{* The masthead logo leads back to the NextGenIQ Press portal — the
					   journal's page there when a journal is active, the portal home
					   otherwise. It used to point at OJS's own index, which dropped
					   readers into the legacy journal pages the portal replaced. *}
					{capture assign="homeUrl"}{if $currentContext}{$portalUrl|escape}/journals/{$currentContext->getPath()|escape}{else}{$portalUrl|escape}/{/if}{/capture}
					{if $currentContext && $currentContext->getLocalizedAcronym()}
						<span class="dmp_journal_acronym">{$currentContext->getLocalizedAcronym()|escape}</span>
					{/if}
					{if $displayPageHeaderLogo}
						<a href="{$homeUrl}" class="is_img">
							<img src="{$publicFilesDir}/{$displayPageHeaderLogo.uploadName|escape:"url"}" width="{$displayPageHeaderLogo.width|escape}" height="{$displayPageHeaderLogo.height|escape}" {if $displayPageHeaderLogo.altText != ''}alt="{$displayPageHeaderLogo.altText|escape}"{/if} />
						</a>
					{elseif $displayPageHeaderTitle}
						<a href="{$homeUrl}" class="is_text">{$displayPageHeaderTitle|escape}</a>
					{else}
						<a href="{$homeUrl}" class="is_img">
							<img src="{$baseUrl}/templates/images/structure/logo.png" alt="{$applicationName|escape}" title="{$applicationName|escape}" width="180" height="90" />
						</a>
					{/if}
					</div>
				</div>

				{capture assign="primaryMenu"}
					{load_menu name="primary" id="navigationPrimary" ulClass="pkp_navigation_primary"}
				{/capture}

				<nav class="pkp_site_nav_menu" aria-label="{translate|escape key="common.navigation.site"}">
					<a id="siteNav"></a>
					<div class="pkp_navigation_primary_row">
						<div class="pkp_navigation_primary_wrapper">
							{$primaryMenu}

							{if $currentContext && $requestedPage !== 'search'}
								<div class="pkp_navigation_search_wrapper">
									<a href="{url page="search"}" class="pkp_search pkp_search_desktop">
										<span class="fa fa-search" aria-hidden="true"></span>
										{translate key="common.search"}
									</a>
								</div>
							{/if}
						</div>
					</div>
					<div class="pkp_navigation_user_wrapper" id="navigationUserWrapper">
						{load_menu name="user" id="navigationUser" ulClass="pkp_navigation_user" liClass="profile"}
					</div>
				</nav>
			</div><!-- .pkp_head_wrapper -->
		</header><!-- .pkp_structure_head -->

		{if $isFullWidth}
			{assign var=hasSidebar value=0}
		{/if}
		<div class="pkp_structure_content{if $hasSidebar} has_sidebar{/if}">
			<div class="pkp_structure_main" role="main">
				<a id="pkp_content_main"></a>
