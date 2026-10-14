# Go-live: step by step (CloudPanel)

Written for the actual server: **CloudPanel**, site user `nextgeniqpress`,
document root `/home/nextgeniqpress/htdocs/www.nextgeniqpress.com`, PHP 8.3,
one VPS at `201.18.214.5` serving both OJS and (soon) the portal.

Every step says **where** to go, **what** to do, and **how to check**.

- 🌐 **CloudPanel** — a tab in the panel at `https://201.18.214.5:8443`
- 📖 **OJS** — a page in OJS at `https://www.nextgeniqpress.com/ojs`
- 💻 **Terminal** — CloudPanel → **SSH/FTP**, or your own SSH client
- 🧑‍💻 **Developer** — hand a value over

Two facts, so nothing is ambiguous:

- **OJS is already hosted and working.** You are not reinstalling or moving it.
  You will only change settings.
- **The portal has never been on the server.** `www.nextgeniqpress.com` still
  shows the old site. **Step 9** is what switches it over.

---

## STEP 0 🌐 — Lock down the control panel (5 minutes, do it now)

Your CloudPanel admin is reachable from the open internet — port 8443 answers
from outside. It can create users, read every file and reach both databases, so
it is the highest-value target on the box.

**CloudPanel → Admin Area → Security**

Restrict access to your own IP address. If your IP changes often, close 8443 at
the firewall and reach the panel through an SSH tunnel instead:

```bash
ssh -L 8443:127.0.0.1:8443 nextgeniqpress@201.18.214.5
# then browse to https://127.0.0.1:8443
```

Also rotate the CloudPanel password — the panel address has been shared in a
chat log.

✅ **Check:** from a different network or your phone on mobile data,
`https://201.18.214.5:8443` should now time out.

---

## STEP 1 — Server layout (already confirmed ✅)

Verified on the box, so nothing here needs re-checking:

| | |
| --- | --- |
| SSH | `ssh nextgeniqpress@201.18.214.5` — password from CloudPanel → Settings → Site User Settings. (The **SSH/FTP** tab showing "No users found" is normal; that tab is for *extra* accounts. The site user already has access.) |
| Home | `~/` contains `backups  htdocs  logs  ojs_files  tmp` |
| OJS | `~/htdocs/www.nextgeniqpress.com/ojs` |
| Config | `~/htdocs/www.nextgeniqpress.com/ojs/config.inc.php` |
| Manuscripts | `~/ojs_files` — `files_dir` in the config. Note the **underscore**, and that it sits outside `htdocs` so manuscripts are not reachable over HTTP. Correct as-is |
| PHP-FPM | **TCP**, not a Unix socket — `ls /run/php/` shows only `.pid` files. The vhost uses `fastcgi_pass 127.0.0.1:{{php_fpm_port}}` |
| Front end | nginx(443) → **Varnish** → nginx(8080) → PHP-FPM |

### ⚠️ No root on this server — use Plan B for steps 6–8

`sudo -l` returns exactly one permitted command:

```
User nextgeniqpress may run the following commands on srv2027928:
    (ALL) NOPASSWD: /usr/bin/clpctlWrapper
```

That is CloudPanel's own CLI wrapper and nothing else. So `/etc/systemd`,
`/etc/nginx`, `/etc/ngiq` and a system-wide Node install are all out of reach.

**Steps 6, 7 and 8 below do not apply to this server.** Use **Plan B** in the
appendix instead — Node via nvm, settings in `~/portal/.env`, PM2 instead of
systemd. Steps 0–5 and 9 are unaffected, because the one genuinely
root-flavoured action (changing nginx) happens through CloudPanel's Vhost tab.

---

## STEP 2 📖 — Create the two OJS accounts

Log into OJS as **site administrator**:
https://www.nextgeniqpress.com/ojs/index.php/index/login

### 2a. The service account

**Go to:** https://www.nextgeniqpress.com/ojs/index.php/ijdh/management/settings/access

1. **Users** tab → **Add User**
2. Username `portal-service`, a real email you control, strong password
3. Untick "Must change password on next login"
4. Save → click the user → **Edit User** → **Roles** → add **Journal Manager**
5. **Repeat step 4 on all ten journals** by changing `ijdh` in the URL to each
   of: `ijdm`, `ijds`, `ijei`, `ijic`, `ijis`, `ijmc`, `ijmr`, `ijqt`, `ijse`

> Ten journals means ten role grants. OJS has no bulk option. It is tedious and
> there is no way around it.

### 2b. Generate its API key

1. Log out, log back in **as `portal-service`**
2. **Go to:** https://www.nextgeniqpress.com/ojs/index.php/index/user/profile
3. **API Key** tab → tick **Enable external applications…** → **Generate new
   key** → **Save**
4. Copy the long key

⚠️ The key will not work until step 3b. Copy it anyway.

### 2c. The test account

Same **Add User** form, on `ijdh` only: username `spike-author`, role
**Author**. Note the password.

This exists so I can test whether signing in from the portal is possible at
all — the one open question in the whole integration. **Delete it afterwards.**

✅ **Check:** `portal-service` appears in the Users list of each journal, and
you have the API key copied somewhere safe.

---

## STEP 3 — Edit the OJS config (the most important step)

**Ignore section headings like `[general]` and `[oai]`.** Which section each
setting lives in varies between OJS releases — `api_key_secret` is usually under
`[security]`, not `[general]`. Search for the **setting name** and change the
line where it already is. That is correct regardless of layout.

### 3-GUI 🌐 — The point-and-click route (no terminal)

**CloudPanel → Sites → www.nextgeniqpress.com → File Manager**

Navigate down: `htdocs/` → `www.nextgeniqpress.com/` → `ojs/`

1. **Back up first:** right-click `config.inc.php` → Copy → Paste in the same
   folder. That copy is your undo.
2. Right-click `config.inc.php` → **Edit**.
3. Use **`Ctrl+F`** in the editor for each of the four settings below.
4. **Save.** That is usually all that is needed — see "Clearing the cache".

### 3-CLI 💻 — The terminal route

**No `sudo` anywhere.** These files live under `/home/nextgeniqpress/` and the
site user owns them, which is also why File Manager can edit them.

```bash
CFG=~/htdocs/www.nextgeniqpress.com/ojs/config.inc.php
cp "$CFG" "$CFG.bak"
openssl rand -base64 48          # the secret for 3b — copy the output
nano "$CFG"                      # Ctrl+W to search, Ctrl+O Enter Ctrl+X to save
```

### Clearing the cache — usually unnecessary, and never by hand

OJS reads `config.inc.php` on every request and renders the OAI identifier live,
so **check first; the edit normally takes effect on its own.**

If a change does not appear, use OJS's own admin pages rather than deleting
files. Signed in as site administrator:

```
https://www.nextgeniqpress.com/ojs/index.php/index/admin/clearDataCache
https://www.nextgeniqpress.com/ojs/index.php/index/admin/clearTemplateCache
```

(The same two actions appear as buttons under **Administration**.)

**Do not hand-delete inside `ojs/cache/`.** On this install it holds compiled
CSS (`*-stylesheet-*.css`) and Smarty directories (`t_cache/`, `t_compile/`,
`t_config/`, plus `opcache/`, `HTML/`, `URI/`) — and **no `.php` files at all**,
contrary to the generic advice that used to be here. OJS regenerates all of it,
so deleting the wrong thing is not fatal, but the admin routes are supported,
faster, and cannot clear something you did not intend.

### The four changes

| Search for | Change it to | Why |
| --- | --- | --- |
| `repository_id` | `www.nextgeniqpress.com` (currently `localhost:8000`) | **3a — the urgent one.** See below |
| `api_key_secret` | any 64 random characters, in quotes | **3b.** Without it OJS cannot validate *any* API key, including the one from step 2b. Nothing automated works. **Set once, never change** — changing it invalidates every key ever issued |
| `force_ssl` | `On` | **3c.** Otherwise login sessions can leak over an unencrypted connection. Note there may also be a `force_login_ssl` line — you want the one spelled exactly `force_ssl` |
| `restful_urls`, `scheduled_tasks` | confirm both are `On` | **3d.** If `scheduled_tasks` is `Off`, review reminder emails never send |

If a setting is missing entirely, add it on its own line at the end of the file.

**Why 3a is urgent:** `repository_id` is what forms the public identity of every
article — `oai:localhost:8000:article/1` today. Google Scholar, DOAJ and BASE
remember the first identity they see for a record and do not update it. **You
have published zero articles, so this is a free fix today**; after your first one
it means re-applying to each service individually.

### ✅ Check

Open in a browser:
https://www.nextgeniqpress.com/ojs/index.php/index/oai?verb=Identify

It must now show `<repositoryIdentifier>www.nextgeniqpress.com</repositoryIdentifier>`.
Still `localhost:8000` → hit the two `clearDataCache` / `clearTemplateCache`
admin URLs above and reload.

Or from the project folder, which checks all four at once:

```bash
# One-time setup so you never pass the URL again — .env.local is gitignored
# and is read by spike, harvest and db:migrate alike.
echo "OJS_BASE_URL=https://www.nextgeniqpress.com/ojs" >> .env.local

npm run spike
```

"Check 0" must show five green PASS lines.

Then click around OJS — open a journal, log in — to confirm nothing broke.

🔄 **If OJS breaks:** restore the backup copy over `config.inc.php` (rename it
back in File Manager, or `cp "$CFG.bak" "$CFG"` — no sudo needed, you own it).

---

## STEP 4 🧑‍💻 — Send me two things

1. The **API key** from 2b
2. The **`spike-author`** username and password from 2c

Use a password manager share link or a private channel — **never a git commit**.

With these I can finish the testing and tell you definitively whether users can
sign in on the portal itself or always get handed to OJS, which decides how
much of the remaining work exists.

---

## STEP 5 🌐 — Create the portal database

The portal needs a small database of its own for things OJS has no concept of:
saved submission drafts, journal proposals, contact messages, alert signups.
**It never stores user accounts or manuscripts** — OJS keeps those.

**CloudPanel → Databases → Add Database**

- Database name: `portal`
- Database user name: `portal`
- Password: generate and **save it** — you need it in step 7

✅ **Check:** `portal` appears in the Databases list.

> CloudPanel grants its database users rights on their own database only, which
> is exactly what is wanted. The portal must never hold credentials that can
> reach the `ojs` database.

---

## STEP 6 💻 — Check Node  ❌ NOT ON THIS SERVER — see Plan B / B6

```bash
node --version
```

Must be **22.13.0 or higher**. If it is older or missing:

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version
```

✅ **Check:** prints `v22.x` or higher.

---

## STEP 7 💻 — Create the settings file  ❌ NOT ON THIS SERVER — see Plan B / B7

Holds the keys and passwords the portal needs. Root-owned so no other user on
the server can read it.

```bash
sudo install -d -m 0755 /etc/ngiq
sudo nano /etc/ngiq/portal.env
```

Paste this, filling in the three placeholders:

```ini
NEXT_PUBLIC_SITE_URL=https://www.nextgeniqpress.com
NEXT_PUBLIC_DOI_PREFIX=10.63521
NEXT_PUBLIC_DEMO_CONTENT=0
NEXT_PUBLIC_OJS_PATH=/ojs

OJS_BASE_URL=https://www.nextgeniqpress.com/ojs
OJS_API_KEY=<the API key from step 2b>
OJS_SESSION_COOKIE=OJSSID
PORTAL_NATIVE_SIGNIN=0

PORTAL_DATABASE_URL=mysql://portal:<password from step 5>@127.0.0.1:3306/portal

SMTP_HOST=<your mail host>
SMTP_PORT=587
SMTP_SECURE=0
SMTP_USER=<mail username>
SMTP_PASSWORD=<mail password>
SMTP_FROM=NextGenIQ Press <no-reply@nextgeniqpress.com>
EDITORIAL_INBOX=contact@nextgeniqpress.com
```

Then:

```bash
sudo chmod 600 /etc/ngiq/portal.env
```

> `NEXT_PUBLIC_DEMO_CONTENT=0` matters. The site ships with ~12 realistic but
> **invented** sample articles for design work. This keeps them off the live
> site.

✅ **Check:** `sudo ls -l /etc/ngiq/portal.env` shows `-rw-------`.

---

## STEP 8 💻 — Install the portal service  ❌ NOT ON THIS SERVER — see Plan B / B8

```bash
sudo install -d -o nextgeniqpress -g nextgeniqpress /home/nextgeniqpress/portal/releases
sudo cp deploy/ngiq-portal.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable ngiq-portal
```

Let the deploy restart it without a password prompt:

```bash
echo 'nextgeniqpress ALL=(root) NOPASSWD: /bin/systemctl restart ngiq-portal' | \
  sudo tee /etc/sudoers.d/ngiq-portal
sudo chmod 440 /etc/sudoers.d/ngiq-portal
```

**Do not start it yet** — there is nothing to run until step 9.

> The portal lives at `/home/nextgeniqpress/portal`, deliberately **outside**
> `htdocs/www.nextgeniqpress.com`. Anything inside htdocs can be served as a
> static file by nginx, and the portal directory contains application source and
> the standalone bundle. It must not be web-reachable.

✅ **Check:** `systemctl is-enabled ngiq-portal` prints `enabled`.

---

## STEP 9 — Deploy, then switch the site over

The step where the new site becomes visible.

### 9a. 💻 Deploy the application

Merging into `main` on GitHub deploys automatically: the "Deploy portal"
workflow tags the release and runs the deploy script. Watch it under the
repository's **Actions** tab. To deploy from your laptop instead:

```bash
git tag -a v1.0.0 -m "First portal release"
git push origin v1.0.0
DEPLOY_PRODUCTION_HOST=nextgeniqpress@201.18.214.5 \
DEPLOY_APP_DIR=/home/nextgeniqpress/portal \
./scripts/deploy.sh production
```

The script tests, builds, uploads to a new dated folder, flips a pointer,
restarts the service, and **rolls back automatically** if the new version does
not answer within 30 seconds. It never touches the `ojs/` directory.

✅ **Check:**

```bash
ssh nextgeniqpress@201.18.214.5 'curl -fsS http://127.0.0.1:3000/api/health'
```

JSON starting `{"status":` means the portal is running — just not yet public.

### 9b. 🌐 Point the website at it

**CloudPanel owns this site's vhost**, so the portal is merged *into* it rather
than added as a competing nginx file — two vhosts claiming
`www.nextgeniqpress.com` produces intermittent behaviour that is miserable to
debug.

The merged vhost is ready at **`deploy/cloudpanel-vhost.conf`**, built from your
actual vhost with the portal added. It keeps every `{{placeholder}}` and leaves
the whole OJS path untouched.

1. **CloudPanel → Sites → www.nextgeniqpress.com → Vhost**
2. **Copy the current contents into a text file first** — that is your undo
3. Replace with the contents of `deploy/cloudpanel-vhost.conf`
4. Save. CloudPanel runs `nginx -t` itself and refuses to save a broken config

What it does:

| Path | Goes to | Changed? |
| --- | --- | --- |
| `/ojs/index.php/` | Varnish → nginx:8080 → PHP-FPM | **No — untouched** |
| `/ojs/*` static files | disk | **No — untouched** |
| `/_next/static/` | portal, cached 1 year | new |
| `/_next/` | portal | new |
| `/api/health` | portal, out of the access log | new |
| everything else | portal on `127.0.0.1:3000` | was Varnish → old Vite site |
| `*.css`/`*.js`/images | disk, **falling back to the portal** | fallback is new |

Three things about this server that the merge has to respect, and that are easy
to get wrong:

- **The stack is nginx(443) → Varnish → nginx(8080) → PHP-FPM over TCP.** There
  are no PHP Unix sockets (`ls /run/php/` shows only `.pid` files), so any
  config written against `unix:/run/php/*.sock` is wrong for this host.
- **The portal bypasses Varnish deliberately.** Next.js sets its own
  `Cache-Control` per route — `immutable` for hashed assets, `no-store` for
  session and form endpoints. A shared cache in front of it would serve stale
  HTML and could hand one signed-in reader's response to someone else.
- **`location ^~ /_next/static/` must outrank the `~* \.(css|js|…)$` regex.**
  That regex serves from disk with no `proxy_pass`, so without the `^~` prefix
  every JavaScript bundle 404s and the site renders but is completely
  dead — no navigation, no forms. The `try_files $uri @portal` fallback on that
  regex is what keeps OJS theme assets on disk while letting the portal's own
  `/public` files through.

**PageSpeed:** your Settings tab configures filters (`remove_quotes`,
`collapse_whitespace`, `lazyload_images`, `sprite_images`,
`inline_preview_images`) but never issues `pagespeed on`, which is why live
responses carry no `X-Page-Speed` header. It is therefore inactive and harmless
today. **Do not enable it.** Those filters rewrite HTML and JavaScript in
flight, which breaks React — server-rendered markup stops matching what the
browser expects, hydration fails, pages go silently dead. Next.js already does
all of it properly.

✅ **Check** — from your laptop:

```bash
curl -s https://www.nextgeniqpress.com/ | grep -c _next
```

Must print **1 or more**. It prints `0` today. That one number is the whole
difference between the old site and the new one.

Then confirm OJS still works — click into a journal and log in:
https://www.nextgeniqpress.com/ojs/

🔄 **If OJS breaks:** paste your saved copy back into the Vhost tab.

> Keeping OJS at `/ojs` on this origin is preferred for unified URLs, but it is
> not required by the auth design — the portal reaches OJS server to server. A
> subdomain would work; it just reads less like one product.

---

## STEP 10 — After it is live

| What | 🌐 Where | Why |
| --- | --- | --- |
| Copy the `dmpedia` theme into git | Terminal — commands in `ojs/README.md` | **It exists only on this server.** One disk failure loses your journal styling permanently |
| SPF, DKIM, DMARC DNS records | Your DNS provider | **Without these, OJS review invitations go to spam and peer review stalls with no error** |
| Uptime monitor on `/api/health` | UptimeRobot or similar | You have no alerting at all today |
| Nightly backups, then **one test restore** | CloudPanel → Cron Jobs, `scripts/backup.sh` | An untested backup is a hypothesis |
| Replace `admin` as editor of record | OJS, each journal | Looks unprofessional to reviewers and indexers |

**Publishing an article currently needs a redeploy** (`./scripts/deploy.sh
production`). Automating it is small follow-up work that needs the step 2b API
key to exist first — see `RUNBOOK.md`.

Start these now, they take weeks: **ten ISSN applications** (blocks DOAJ),
**Crossref membership** (needed before DOIs work), **COPE membership**.

---

## If something goes wrong

| Symptom | Cause | Fix |
| --- | --- | --- |
| Spike still reports `localhost:8000` | OJS cache not cleared | Re-run the `rm -rf` in step 3 |
| Spike says "has not configured a secret key" | `api_key_secret` not saved | Look for a duplicate line elsewhere in the config |
| OJS broke after step 3 | Config typo | `cp "$CFG.bak" "$CFG"`, clear cache |
| `502 Bad Gateway` on the portal | Node not running | `pm2 status` — restart with `pm2 restart ngiq-portal` |
| Portal loads, forms say unavailable | Database or `~/portal/.env` wrong | `pm2 logs ngiq-portal --lines 50` |
| OJS 404s after the vhost change | `/ojs` not matched first | Send me the vhost; `location ^~ /ojs` must precede `location /` |
| Pages load but nothing is clickable | PageSpeed rewriting the JS | Confirm `pagespeed off` applies to the portal locations |

Logs: `pm2 logs ngiq-portal` for the portal, CloudPanel → **Logs** tab for nginx
and PHP.

---

## Appendix — Plan B: running without root

Steps 6–8 as written need root: `/etc/systemd/system`, a system-wide Node, and
`/etc/ngiq`. If `sudo -l` says `nextgeniqpress` is not in the sudoers file,
everything still works — it just lives in the home directory instead. Nothing
about the portal actually requires root; the systemd route is simply tidier.

Confirmed about this server either way: site user `nextgeniqpress`, OJS at
`~/htdocs/www.nextgeniqpress.com/ojs`, manuscripts at `~/ojs_files`
(`files_dir` in `config.inc.php`), PHP-FPM over TCP, Varnish in front.

### B6 — Node, user-local, via nvm

```bash
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
exec $SHELL -l
nvm install 22
nvm alias default 22
node --version          # must be v22.13.0 or higher
command -v node         # note this full path — B8 needs it
```

### B7 — Settings file in the home directory

`/etc/ngiq/portal.env` is not writable, so use `~/portal/.env` instead. It holds
the database password and the OJS API key, so permissions are the whole point:

```bash
mkdir -p ~/portal
nano ~/portal/.env          # same contents as step 7
chmod 600 ~/portal/.env
```

`chmod 600` is not optional here. Unlike `/etc/ngiq`, this path sits under a
home directory that other processes on the box can traverse.

### B8 — Keep the process alive with PM2

No systemd, so PM2 supervises it and a `@reboot` cron job starts PM2 itself.

```bash
npm install -g pm2
```

Create `~/portal/start.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail
cd "$HOME/portal/current"
set -a; . "$HOME/portal/.env"; set +a
export NODE_ENV=production PORT=3000 HOSTNAME=127.0.0.1
exec node server.js
```

```bash
chmod +x ~/portal/start.sh
pm2 start ~/portal/start.sh --name ngiq-portal
pm2 save
```

Then **CloudPanel → Sites → www.nextgeniqpress.com → Cron Jobs → Add**, so it
survives a reboot:

```
@reboot /home/nextgeniqpress/.nvm/versions/node/v22.*/bin/pm2 resurrect
```

Use the real path from `command -v pm2` — the glob is illustrative, cron does
not expand it.

Useful afterwards: `pm2 logs ngiq-portal`, `pm2 restart ngiq-portal`,
`pm2 status`.

### B9 — Deploy

`scripts/deploy.sh` now detects the supervisor: it tries `systemctl` and falls
back to PM2 when that needs root it does not have. No manual restart step, and
the automatic rollback still works on both paths.

```bash
DEPLOY_PRODUCTION_HOST=nextgeniqpress@201.18.214.5 \
DEPLOY_APP_DIR=/home/nextgeniqpress/portal \
./scripts/deploy.sh production
```

It prints `restarted via pm2` on this server. If it reports
`No usable supervisor`, PM2 was not installed — go back to B8.

Put those two variables in your shell profile so you cannot forget them:

```bash
echo 'export DEPLOY_PRODUCTION_HOST=nextgeniqpress@201.18.214.5' >> ~/.zshrc
echo 'export DEPLOY_APP_DIR=/home/nextgeniqpress/portal'          >> ~/.zshrc
```

### B10 — Scheduled harvest, so publishing needs no deploy

Without this step a paper published in OJS reaches the website only at the
next deploy. With it, within fifteen minutes.

Add three lines to `~/portal/.env` (the deploy and the cron both read them):

```bash
HARVEST_PATH=/home/nextgeniqpress/portal/shared/harvest.json
PORTAL_REVALIDATE_SECRET=$(openssl rand -hex 32)    # paste the value, not the command
OJS_API_KEY=…                                        # already there if the harvest has ever run at full fidelity
```

Install the script, which ships inside every release from v1.3.9 on (deploy
first, then copy):

```bash
cp ~/portal/current/deploy/harvest.sh ~/portal/harvest.sh
chmod +x ~/portal/harvest.sh
~/portal/harvest.sh            # run it once by hand; it prints what it wrote
```

Then **CloudPanel → Sites → www.nextgeniqpress.com → Cron Jobs → Add**:

```
*/15 * * * * /home/nextgeniqpress/portal/harvest.sh >> /home/nextgeniqpress/portal/harvest.log 2>&1
```

✅ **Check:** `tail ~/portal/harvest.log` shows `wrote N article(s)` and a JSON
line from `/api/revalidate` with `"ok":true`. `curl -s http://127.0.0.1:3000/api/health`
shows `harvest.ageHours` under 1 once the job has run.

Restart the portal once after adding the variables (`pm2 restart ngiq-portal`)
so the running process sees `HARVEST_PATH`. After that, deploys pick it up on
their own.

### B — what still needs root, and the way round it

| Needs root | Workaround |
| --- | --- |
| The vhost change (step 9b) | **None needed** — CloudPanel's Vhost tab writes it for you, which is why the portal is merged into CloudPanel's own vhost rather than a new file |
| Reading `/var/log/nginx` | CloudPanel → **Logs** tab |
| `systemctl` anything | PM2, above |
| Restricting port 8443 (step 0) | CloudPanel → **Admin Area → Security**, no shell required |

So the only genuinely root-flavoured step — changing nginx — is already handled
through the panel. Plan B costs you a slightly less tidy process manager and
nothing else.

## What you are *not* doing

- ❌ Reinstalling, moving or re-hosting OJS — it is live and fine
- ❌ Moving to AWS EC2 — see the reasoning; not before the theme is in git
- ❌ Buying a second server — the portal runs beside OJS on this VPS
- ❌ Setting up a second database server — it uses the existing MySQL
- ❌ Anything to make peer review work — OJS already does it
- ❌ Migrating users — OJS keeps every account, permanently
