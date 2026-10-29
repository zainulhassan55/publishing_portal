# API reference

All handlers are in `src/app/api/**/route.ts`. Most are wrapped in `handler()`
(`src/lib/api.ts`), which maps errors to status codes:

| Error | Status |
| --- | --- |
| `ValidationError` | 422, with per-field errors |
| Rate limited | 429, with `Retry-After` |
| Database or storage not configured | 503 |
| Anything else | 500 |

Auth levels used in the tables below:

- **Public:** no session needed.
- **Session:** any signed-in portal session (`getSession`).
- **Member:** a signed-in member. `requireMember()` answers 401 otherwise.
- **Admin:** the OJS `site-admin` role. `requireAdminApi()` answers 401 or 403,
  and every refusal is logged.
- **Admin + CSRF:** admin, plus a same-origin `Origin` header and an
  `x-ngiq-csrf` header carrying the session-derived token.

Rate limits are in-memory, per process, per client IP.

## Auth and session

| Route | Method | Auth | Purpose | Touches |
| --- | --- | --- | --- | --- |
| `/api/auth/sign-in` | POST | Public; 5/min; Turnstile; needs `PORTAL_NATIVE_SIGNIN=1` (503 otherwise) | Relay a login to OJS and create a session | OJS login/profile, `portal_sessions`; sets `ngiq_session` + `OJSSID` |
| `/api/auth/register` | POST | Public; 3/min; Turnstile | Create an OJS account (Reader), then sign in | OJS register/login, `portal_sessions` |
| `/api/auth/sign-out` | POST | Cookie | End the portal and OJS sessions; 303 to `/` | OJS signOut, `portal_sessions` |
| `/api/auth/ojs-handoff?to=` | GET | Optional session | Check the role for the OJS target, set `OJSSID`, 302 into OJS | `portal_sessions`, OJS probes |
| `/api/session` | GET | None | Current user, or `null` | `portal_sessions` |
| `/api/profile/prefs` | GET, POST | Session | Portal-only user prefs | `user_prefs` |
| `/api/submissions?scope=mine\|all` | GET | Session; `all` needs site-admin or manager | The user's (or everyone's) OJS submissions across the portfolio | OJS REST, called as the user |

## Public forms

| Route | Method | Auth | Purpose | Touches |
| --- | --- | --- | --- | --- |
| `/api/uploads/sign` | POST | Member; 20 per 10 min | Presign a form upload, creating a `pending` row | `uploads`, R2 submissions bucket |
| `/api/forms/editorial-application` | POST | Member; shared `forms:` limit of 5 per 10 min; honeypot | Reviewer or editorial board application | `editorial_applications`, `uploads`, R2, email |
| `/api/forms/special-issue` | POST | Same | Special issue proposal | `editorial_proposals` (special_issue) |
| `/api/forms/book-proposal` | POST | Same | Book volume proposal | `editorial_proposals` (book_volume) |
| `/api/forms/book-chapter` | POST | Same; 410 once the call is closed | Chapter submission to an open call | `book_volumes`, `book_submissions` |
| `/api/proposals` | POST | Member; 3 per 10 min | New-journal proposal | `journal_proposals`, email |
| `/api/contact` | POST | Member; 4 per 5 min; honeypot | Contact relay | `contact_messages`; email to `EDITORIAL_INBOX` with Reply-To set to the sender |
| `/api/alerts` | POST | Member; 5 per 5 min | Alert signup (double opt-in) | `alert_signups`, email |
| `/api/alerts/confirm?token=` | GET | Token | Confirm the alert signup | `alert_signups` |
| `/api/ror?query=` | GET | Public; 60/min | Proxy to the ROR affiliation search | api.ror.org |

## Operations

| Route | Method | Auth | Purpose |
| --- | --- | --- | --- |
| `/api/health` | GET | Public | Always 200. Reports `status: ok\|degraded`, uptime, harvest age and counts, database ping, and OJS reachability (OAI Identify, 3 s timeout) |
| `/api/revalidate` | POST | `Authorization: Bearer $PORTAL_REVALIDATE_SECRET` (503 if the secret is unset, 403 if it is wrong) | Run `purgePublicContent()`. Called by `harvest.sh` and `deploy.sh` |

## Admin

| Route | Method | Auth | Purpose | Touches |
| --- | --- | --- | --- | --- |
| `/api/admin/activity` | GET | Admin | Audit log (up to 200 rows, IPs withheld) | `admin_audit` |
| `/api/admin/articles` | GET | Admin | Harvested papers with their hidden state | harvest, `article_display` |
| `/api/admin/articles/[id]` | PATCH | Admin + CSRF | Hide or show a paper | `article_display`, audit, purge |
| `/api/admin/proposals` | GET | Admin | Journal proposal queue | `journal_proposals` |
| `/api/admin/proposals/[id]` | PATCH | Admin + CSRF | Set the status and decision note (no email is sent) | `journal_proposals`, audit |
| `/api/admin/forms` | GET | Admin | Every editorial form record | the three form tables, `uploads` |
| `/api/admin/forms/[kind]/[id]` | PATCH | Admin + CSRF | Set the status and note | form tables, audit |
| `/api/admin/uploads/[id]` | GET | Admin | 302 to a 5-minute presigned download link (audited) | `uploads`, R2 |
| `/api/admin/uploads/sign` | POST | Admin + CSRF | Presign a `final_pdf` (≤ 300 MB) or `cover` (≤ 5 MB) | `uploads`, R2 publications bucket |
| `/api/admin/volumes` | GET, POST | Admin (+ CSRF on POST) | List or create book volumes | `book_volumes`, audit, purge |
| `/api/admin/volumes/[id]` | PATCH, DELETE | Admin + CSRF | Edit or delete a volume (its chapters cascade) | `book_volumes`, audit, purge |
| `/api/admin/volumes/[id]/chapters` | POST | Admin + CSRF | Add a chapter | `book_chapters`, audit, purge |
| `/api/admin/chapters/[id]` | PATCH, DELETE | Admin + CSRF | Edit or delete a chapter | `book_chapters`, audit, purge |

## Non-API route handlers

| Route | Purpose |
| --- | --- |
| `/go/article/[journal]/[id]` | The OJS article URL (rewritten by nginx) → 302 to `/articles/{slug}`, or back to OJS with `?portal=0` |
| `/go/issue/[journal]/[id]` | The OJS issue URL → the current issue page or the archive |
| `/articles/[slug]/pdf` | Streams the OJS galley inline (`?download=1` to save). 404 if the paper is hidden or outside the portfolio |
| `/series/[s]/volumes/[v]/pdf`, `/cover`, `/chapters/[n]/pdf` | Streams published book files from the private R2 bucket |
| `/sitemap.xml`, `/robots.txt`, `/opengraph-image` | SEO |
