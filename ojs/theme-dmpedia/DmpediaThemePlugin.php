<?php

/**
 * @file plugins/themes/dmpedia/DmpediaThemePlugin.php
 *
 * @class DmpediaThemePlugin
 *
 * @brief DMPedia child theme of the OJS default theme, matched to the DMPedia publishing portal.
 */

namespace APP\plugins\themes\dmpedia;

class DmpediaThemePlugin extends \PKP\plugins\ThemePlugin
{
    // The live portal. The old default was the Vite dev server
    // (http://localhost:5173/publishing_portal), which meant an unconfigured
    // theme option sent every header and footer portal link to localhost.
    public const DEFAULT_PORTAL_URL = 'https://www.nextgeniqpress.com';

    public function init()
    {
        $this->setParent('defaultthemeplugin');

        $this->addOption('portalUrl', 'FieldText', [
            'label' => 'NextGenIQ Press portal URL',
            'description' => 'Address of the NextGenIQ Press portal, used by the header and footer links.',
            'default' => self::DEFAULT_PORTAL_URL,
        ]);

        $this->removeStyle('font');
        $this->addStyle(
            'dmpediaFonts',
            'https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&family=Newsreader:opsz,wght@6..72,500;6..72,600;6..72,700&display=swap',
            ['baseUrl' => '']
        );

        $this->modifyStyle('stylesheet', ['addLess' => ['styles/dmpedia.less']]);
    }

    public function getPortalUrl(): string
    {
        $url = trim((string) $this->getOption('portalUrl'));
        return rtrim($url !== '' ? $url : self::DEFAULT_PORTAL_URL, '/');
    }

    public function getDisplayName()
    {
        return 'NextGenIQ Press Theme';
    }

    public function getDescription()
    {
        return 'NextGenIQ Press branding for OJS journals, matched to the NextGenIQ Press portal.';
    }
}

if (!PKP_STRICT_MODE) {
    class_alias('\APP\plugins\themes\dmpedia\DmpediaThemePlugin', '\DmpediaThemePlugin');
}
