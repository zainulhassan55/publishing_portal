# OJS artefacts

Version-controlled OJS configuration and theme. OJS itself is not vendored
here — it is installed and upgraded on the server through its own release
process. What lives here is the part we wrote, which must not exist only on one
machine.

## `theme-dmpedia/` — MISSING, needs recovery

**Audit finding F-16.** The custom OJS child theme currently exists only as
files on the production server. It is not in any repository and not in any
backup that has been restored. A server rebuild, a failed OJS upgrade, or a disk
failure loses it with no recovery path, and the journals revert to the stock
theme.

This is the cheapest open finding to close and one of the more damaging to leave
open. To close it:

```bash
# On the server
cd /home/nextgeniq/ojs/plugins/themes
tar -czf /tmp/dmpedia.tar.gz dmpedia

# Locally
scp $HOST:/tmp/dmpedia.tar.gz .
tar -xzf dmpedia.tar.gz -C ojs/ && mv ojs/dmpedia ojs/theme-dmpedia
git add ojs/theme-dmpedia && git commit -m "Add dmpedia OJS theme to version control (F-16)"
```

After that, deploy the theme from here rather than editing it in place on the
server, so the repository stays the source of truth.

## `config/`

Keep a **redacted** copy of `config.inc.php` here — structure and non-secret
settings only, with database credentials, salt and API keys replaced by
placeholders. The point is that the next person can see what settings the
install depends on, not that the file can be used directly.

Settings that matter, and why:

| Setting | Required value | Why |
| --- | --- | --- |
| `base_url` | `https://www.nextgeniqpress.com/ojs` | **F-02.** A development value here makes the OAI repository identifier `oai:localhost:8000:article/1`, and every harvester that reads it caches a broken identity. Fix before the first article publishes; afterwards it needs re-registration with each service. |
| `force_ssl` | `On` | **F-11.** Without it the session cookie ships without `Secure`. |
| `session_cookie_name` | `OJSSID` | The portal reads this cookie by name; see `OJS_SESSION_COOKIE` in `.env.example`. |
| `restful_urls` | `On` | Required for the REST API paths the harvest and session check use. |
| `scheduled_tasks` | `On` | Without it DOI deposits and review reminders never run. |

## Plugins that must be enabled

- **DOI / Crossref** (F-04) — the site advertises DOIs; nothing deposits them
  until this is configured with the publisher's Crossref credentials.
- **PKP Preservation Network** (F-10) — required by DOAJ, and the only thing
  that keeps the content readable if this server disappears.
- **OAI-PMH** — on by default; verify the repository identifier after fixing
  `base_url`.
