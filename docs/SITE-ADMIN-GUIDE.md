# Site administrator's guide

For the person looking after NextGenIQ Press day to day. No technical knowledge
is assumed. Nothing in this guide requires a developer.

You are the **Site Administrator**: the most powerful account on the site. You
create journals, appoint the people who run them, and are the last resort when
someone is locked out.

---

## 1. The two halves of the site

There are two pieces of software, and knowing which one you are looking at
saves a lot of confusion.

| | **The portal** | **The editorial system** |
| --- | --- | --- |
| Address | `www.nextgeniqpress.com` | `www.nextgeniqpress.com/ojs` |
| Looks like | The new site | An older, plainer interface |
| What it is for | Readers: journals, articles, search, policies | Running peer review |
| Who uses it | Everybody | Authors, reviewers, editors |

The editorial system is called **OJS**. It is where every user account,
manuscript, review and editorial decision actually lives. The portal is the
public face — it reads from OJS and shows it attractively.

**The plainer-looking screens are not broken and not leftovers.** They are the
peer-review software doing its job. You will spend most of your administrative
time there, and that is expected.

> **One account, two halves.** Signing in on the portal signs you into both. You
> should never have to type your password twice.

---

## 2. Signing in

Always start here:

**https://www.nextgeniqpress.com/sign-in**

Enter your username or email and your password. You land on your dashboard.

Once signed in, you can go straight to any editorial system address and you will
already be signed in there.

### If you want an administration page

Sign in on the portal **first**, then paste the address you need. Going to an
administration address while signed out sends you to the sign-in page, and after
signing in you land on your dashboard rather than the page you originally
wanted — so you would have to paste it again. Signing in first avoids that.

### If you are asked to sign in a second time

Nearly always stale data in your browser. Fix it once:

1. Sign out on the portal (top-right menu → **Sign out**)
2. Close the tab, open a new one
3. Sign in again at the address above

If it still happens, clear the saved site data: click the icon at the left of
the address bar → **Cookies and site data** → **Manage on-device site data** →
delete → reload.

---

## 3. The roles, in plain English

| Role | What this person does |
| --- | --- |
| **Reader** | Nothing special. Everyone who registers is one. |
| **Author** | Submits manuscripts. Granted automatically on a person's first submission when the journal allows it — see "Letting authors register themselves" below. |
| **Reviewer** | Reviews other people's manuscripts when invited. Also self-service at registration, and editors can enroll people. |
| **Editor** | Runs peer review for a journal: assigns reviewers, records accept/reject decisions, moves manuscripts through to publication. |
| **Journal Manager** | Owns one journal. Does everything an editor does, plus appoints that journal's editors and reviewers and changes its settings. |
| **Site Administrator** | You. Creates journals, site-wide settings, appoints Journal Managers. |

### Letting authors register themselves

Every new account is a **Reader** at first, however it was created. That is
how OJS 3.5 works: its registration form grants Reader and Reviewer only, and
the Author role is granted automatically the first time a person starts a
submission — provided the journal allows it. The switch is per journal:

1. In the journal, open **Settings → Users & Roles → Roles**. Signed in as an
   administrator this is
   `https://www.nextgeniqpress.com/ojs/index.php/<journal>/management/settings/access`
   for `ijdh`, `ijdm`, `ijds`, `ijei`, `ijic`, `ijis`, `ijmc`, `ijmr`,
   `ijqt` and `ijse`.
2. Click the small arrow beside **Author**, then **Edit**.
3. Under **Role Options**, tick **Allow user self-registration**. Check that
   **Submission** is ticked under **Stage Assignment** too. Save.

With that on, "Start submission" on the portal opens the OJS wizard for any
signed-in account, and the account becomes an author of that journal on its
first submission. With it off, OJS refuses the wizard, and the portal keeps
the person on its dashboard with a notice that says so instead of showing
OJS's refusal page (the portal asks OJS before every hand-off, so a change
here takes effect on the next click). Nothing on the portal side can grant
the role: OJS 3.5 has no API for it, and the portal's API key is not an
administrator's.

To make someone an author without them submitting first, or in a journal
that keeps self-registration off: **Users & Roles → Users** → the person →
**Edit User** → tick Author.

### There is no "Publisher" role

People often ask for one. The equivalents are:

- Running **the press** (all ten journals) = Site Administrator — you
- Running **one journal** = Journal Manager

### Roles are granted per journal

This is the single most important thing to understand. Someone can be an Editor
of *Digital Health* and merely a Reader of the other nine. Granting a role in
one journal grants **nothing** anywhere else.

So appointing an editor across three journals means doing it three times. OJS
has no bulk option. This is tedious and there is no way around it.

---

## 4. Who can appoint whom

```
Site Administrator  (you)
        │  creates journals, appoints…
        ▼
Journal Manager     (owns one journal)
        │  appoints…
        ▼
Editor              (runs peer review)
        │  invites…
        ▼
Reviewer            (reviews manuscripts)
```

| Action | Who can do it |
| --- | --- |
| Register an account; choose Author or Reviewer | Anybody, by themselves |
| Invite a reviewer to a specific manuscript | Editor, Journal Manager |
| Grant roles inside a journal | Journal Manager, Site Administrator |
| Create a journal; appoint Journal Managers | Site Administrator only |

**Delegate.** Once a journal has a real Journal Manager, they handle their own
editors and reviewers and you stop being the bottleneck. That is the intended
end state — you should not be approving routine role changes for ten journals.

---

## 5. The ten journals

Each has a short code used in web addresses.

| Code | Code in addresses | Journal |
| --- | --- | --- |
| IJDH | `ijdh` | International Journal of Digital Health |
| IJDM | `ijdm` | International Journal of Digital Management |
| IJDS | `ijds` | International Journal of Digital Society |
| IJEI | `ijei` | International Journal of Entrepreneurship and Innovation |
| IJIC | `ijic` | International Journal of Intelligent Computing |
| IJIS | `ijis` | International Journal of Interdisciplinary Science |
| IJMC | `ijmc` | International Journal of Mathematical Computing |
| IJMR | `ijmr` | International Journal of Multidisciplinary Research |
| IJQT | `ijqt` | International Journal of Quantum Technologies |
| IJSE | `ijse` | International Journal of Smart Electronics |

Wherever this guide shows `ijdh` in an address, swap in the code of the journal
you mean.

---

## 6. How to give somebody a role

The job you will do most often. **Make sure the person has registered first** —
you can only give a role to an account that exists.

### Step by step

1. Sign in at **https://www.nextgeniqpress.com/sign-in**

2. Go to the journal's user list — paste this, swapping in the journal code:

   ```
   https://www.nextgeniqpress.com/ojs/index.php/ijdh/management/settings/access
   ```

3. Open the **Users** tab and search for the person by name or email

4. Click their name, then **Edit User**

5. Find the **Roles** section and tick the role you want to give them

6. **Save**

7. **Repeat for each journal** they need the role in — step 2 again with a
   different code

### Does it work?

Ask them to sign out and sign back in on the portal. Their new role appears in
their account menu — an editor will see **Editorial queues** there, which they
did not have before.

New roles can take up to **15 minutes** to appear if they stay signed in. Signing
out and back in makes it immediate.

---

### ⚠️ Set the start date to today

Every role has a **start date**, and OJS treats a role that has not started as
though it does not exist. The person will not appear when an editor tries to
assign them, and nothing anywhere explains why — the role is listed on their
record, looking perfectly normal.

OJS does **not** reliably default this to today. Check it every time.

If somebody has a role but cannot be assigned, look at the date first. It is
the most likely answer by a wide margin, and the symptom gives no hint of the
cause.

To correct one: **⋮ More Actions** on their row → **Edit User** → change the
date on that role → save. If it cannot be edited in place, remove the role and
add it again with today's date.

### Use "Edit User", not "Invite to a role"

The Users & Roles page offers both. **Prefer Edit User.**

Inviting sends an email the person must receive, holding a link they must
click, before any role is granted. Each of those can fail, and on this install
all of them have. Until they click Accept, the role exists only inside the
invitation — which is why it can look assigned while being impossible to use
or to delete.

Editing the user grants the role immediately, with nothing in between. The only
thing you give up is the automatic notification email, which you can send
yourself.

---

## 7. Common jobs

### Appoint a Journal Manager (handing over a journal)

The most valuable thing you can do. Same steps as section 6, ticking **Journal
Manager**. From then on they appoint their own editors and reviewers.

Tell them: they are now responsible for that journal's editors, reviewers and
settings, and section 6 of this guide is how they do it.

### Appoint an Editor

Section 6, ticking **Editor**. Normally the Journal Manager's job rather than
yours — if the journal has one, ask them.

### Somebody wants to review

Usually nothing for you to do. People can tick "reviewer" when registering, and
editors can enroll a reviewer while assigning a manuscript. Only step in if an
editor says they cannot find someone in the reviewer list.

### Somebody has forgotten their password

Send them to **https://www.nextgeniqpress.com/sign-in** → **Forgot password?**
They get an email with a reset link.

If no email arrives, check with your developer whether the site's email settings
are finished — unverified email is a common cause and has nothing to do with the
person's account.

### An editor says somebody is missing from the list

When an editor cannot find a person in **Assign Editor** or **Add Reviewer**,
work through these in order. The first is the cause far more often than the
rest combined.

1. **Is the role's start date in the future?** See the warning in section 6.
   This is the usual answer.
2. **Do they hold that role in *this* journal?** Roles do not carry across
   journals. Check the journal's own user list.
3. **Was it an invitation they never accepted?** Pending invitations appear
   under **Invitations** on the Users & Roles page, separately from current
   users. An unaccepted invitation grants nothing. Cancel it and use Edit User
   instead.
4. **Does the account exist at all?** If not, create it — section 6.

### Somebody cannot sign in at all

In order:

1. Are they using the right address? It must be `/sign-in` on the portal.
2. Have them clear their browser's saved site data (section 2).
3. Check the account exists and is not disabled: journal user list, section 6
   step 2, search for them.
4. If the account was never activated, resend the activation from their user
   record.

### Create a new journal

Site Administrator only:

```
https://www.nextgeniqpress.com/ojs/index.php/index/admin/contexts
```

⚠️ **Tell your developer before you do this.** A new journal needs matching
pages on the portal and a web-address rule, neither of which happens
automatically. The journal will exist in the editorial system but not appear
properly on the public site until that is done.

---

## 8. Things to avoid

| Do not | Why |
| --- | --- |
| Turn on **PageSpeed** in the hosting control panel | It rewrites the site's code in transit and silently breaks the public pages |
| Delete anything in the `ojs` folder via a file manager | That folder is the entire editorial system, including every manuscript |
| Change the setting named `api_key_secret` | It would break the link between the portal and the editorial system |
| Share the Site Administrator account | Give people their own accounts with the roles they need. Shared logins make it impossible to tell who did what |
| Create a second account for yourself to "test as an author" | Use a private browsing window instead; duplicate accounts get confusing fast |

---

## 9. Quick reference

Swap `ijdh` for whichever journal you mean.

| What you want | Address |
| --- | --- |
| Sign in | `https://www.nextgeniqpress.com/sign-in` |
| Your dashboard | `https://www.nextgeniqpress.com/dashboard` |
| A journal's users and roles | `https://www.nextgeniqpress.com/ojs/index.php/ijdh/management/settings/access` |
| A journal's editorial queue | `https://www.nextgeniqpress.com/ojs/index.php/ijdh/dashboard/editorial` |
| A journal's settings | `https://www.nextgeniqpress.com/ojs/index.php/ijdh/management/settings/context` |
| Create or edit journals | `https://www.nextgeniqpress.com/ojs/index.php/index/admin/contexts` |
| Your own profile and password | `https://www.nextgeniqpress.com/profile` |

---

## 10. When to call a developer

Handle yourself: roles, users, passwords, journal settings, editorial workflow.

Call a developer for:

- Anything on the public portal being wrong — missing pages, wrong journal
  information, broken links
- Creating a new journal (see the warning in section 7)
- Emails not sending
- The site being down or very slow
- Any screen showing a code error rather than a normal message
- Any request to change settings in a file, or anything mentioning a server,
  database or control panel

A useful rule: if the task is about **people and manuscripts**, it is yours. If
it is about **how the site is built or hosted**, it is theirs.

---

## 11. Worth doing in your first week

1. **Change your password** if you were given one — profile page, section 9.
2. **Appoint a Journal Manager for each journal** that has a real editor lined
   up. Ten journals run by one person does not scale.
3. **Replace `admin` as the editor of record** on each journal's settings page.
   Reviewers and indexing services see that name, and it looks unfinished.
4. **Write down who holds which role**, in a spreadsheet. OJS cannot show you
   "every role this person has across all ten journals" in one place, so your
   own list is the only complete record.
