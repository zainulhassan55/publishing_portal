/**
 * The OJS registration relay.
 *
 * Same shape, and the same reasoning, as the login relay next door: OJS 3.5
 * has no registration API an anonymous visitor can reach, so the portal drives
 * the web form server-side. Creating the account through the REST API instead
 * would mean doing it with the service key, which would record every member of
 * the site as having been created by an administrator and would hand the
 * portal a user-creation credential it has no other reason to hold.
 *
 * The flow, verified against the live instance:
 *
 *   1. GET  /index.php/index/user/register  → scrape `csrfToken` and the
 *                                             per-journal checkbox names
 *   2. POST /index.php/index/user/register  → 3xx on success, 200 re-rendering
 *                                             the form with errors on failure
 *
 * Two facts about this install shape the design, both read from
 * config.inc.php rather than assumed:
 *
 *   - `recaptcha = off`, and the rendered form carries no captcha markup. A
 *     captcha would make server-side relaying impossible, and if one is ever
 *     switched on this module stops working and the portal must fall back to
 *     linking out. `captcha_on_register = on` is a red herring; it does
 *     nothing while recaptcha itself is off.
 *   - `require_validation = Off`, so an account works the moment it is
 *     created. That is what lets the caller sign the new member straight in
 *     rather than sending them to an inbox — which matters more than usual
 *     here, because site email is not yet configured and a validation message
 *     would never arrive.
 *
 * Password rules, duplicate usernames and anything else OJS objects to are
 * left to OJS and its wording passed through. Reimplementing its rules here
 * would mean two sets of rules drifting apart, and the portal losing an
 * argument it cannot win about what OJS will accept.
 */

import { ojsRegisterPageUrl } from '../ojs/config.ts'
import { OJS_SESSION_COOKIE } from './roles.ts'

const TIMEOUT_MS = 15_000

/**
 * One journal as the registration form presents it.
 *
 * The checkbox names carry OJS user-group ids — `reviewerGroup[16]` — which
 * differ per journal and per install. They are read from the live form every
 * time rather than written down: a group recreated in OJS gets a new id, and
 * a stale constant here would silently enrol people into nothing.
 */
export type RegisterContext = {
  /** Journal name as OJS renders it. */
  name: string
  /** Checkbox field name granting the Reader role, if offered. */
  readerGroup?: string
  /**
   * There is no Author checkbox, and that is OJS's design rather than a
   * setting: the site-level form (`RegistrationForm.php`, stable-3_5_0) reads
   * `readerGroup` and `reviewerGroup` only. Authorship is granted on first
   * submission instead — the wizard opens to any account for which the
   * journal's Author role permits self-registration, and enrols it then.
   * So a freshly registered account is a Reader, and that is normal; what
   * matters is that each journal's Author role has "Allow user
   * self-registration" ticked. See docs/SITE-ADMIN-GUIDE.md.
   */
  /** Checkbox field name granting the Reviewer role, if offered. */
  reviewerGroup?: string
  /** Per-journal privacy consent checkbox, required when enrolling. */
  privacyConsent?: string
}

export type RegisterForm = {
  sid: string
  csrfToken: string
  contexts: RegisterContext[]
}

export type RegisterInput = {
  givenName: string
  familyName: string
  email: string
  username: string
  password: string
  affiliation?: string
  country?: string
  /** Journal names to enrol in, matched against RegisterContext.name. */
  journals: string[]
  /** Also request the Reviewer role in those journals. */
  asReviewer: boolean
}

export type RegisterResult =
  | { ok: true }
  | { ok: false; reason: 'rejected' | 'ojs-unreachable'; message?: string }

const firstCookie = (response: Response): string | null => {
  const match = (response.headers.getSetCookie?.() ?? []).find((c) => c.startsWith(`${OJS_SESSION_COOKIE}=`))
  return match ? match.split(';')[0].split('=').slice(1).join('=') : null
}

const withUserAgent = (headers: Record<string, string>, userAgent?: string | null) =>
  userAgent ? { ...headers, 'User-Agent': userAgent } : headers

/* -------------------------------- parsers --------------------------------- */

export function parseCsrfToken(html: string): string {
  return (
    html.match(/name="csrfToken"\s+value="([^"]*)"/)?.[1] ??
    html.match(/<meta\s+name="csrf-token"\s+content="([^"]*)"/)?.[1] ??
    ''
  )
}

/**
 * Reads the per-journal enrolment blocks out of the registration form.
 *
 * Each journal is one `<li class="context">` holding its name and up to three
 * checkboxes. Splitting on the list item rather than scanning the whole
 * document is what keeps a journal's name attached to *its* group ids — a flat
 * scan would pair the first name with every id on the page.
 */
export function parseRegisterContexts(html: string): RegisterContext[] {
  const section = html.match(/<fieldset[^>]*name="contexts"[\s\S]*?<\/fieldset>\s*<\/div>|<ul[^>]*class="contexts"[\s\S]*?<\/ul>/)?.[0]
  if (!section) return []

  const contexts: RegisterContext[] = []

  for (const block of section.split(/<li[^>]*class="context"[^>]*>/).slice(1)) {
    const name = block
      .match(/<div[^>]*class="name"[^>]*>([\s\S]*?)<\/div/)?.[1]
      ?.replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim()

    if (!name) continue

    contexts.push({
      name,
      readerGroup: block.match(/name="(readerGroup\[\d+\])"/)?.[1],
      reviewerGroup: block.match(/name="(reviewerGroup\[\d+\])"/)?.[1],
      privacyConsent: block.match(/name="(privacyConsent\[\d+\])"/)?.[1],
    })
  }

  return contexts
}

const stripTags = (html: string) => html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()

/**
 * OJS's own complaint when it re-renders the form instead of registering.
 *
 * Passed through to the caller verbatim: "that username is already taken" and
 * "the password must be at least 6 characters" need different things from the
 * person, and collapsing them into one generic failure would leave them
 * guessing which.
 *
 * Which is exactly what this did until the structure of the rejected page was
 * read properly. OJS 3.5 renders a `#formErrors` block holding *two* things:
 *
 *   <div id="formErrors">
 *     <div class="pkp_form_error">There were errors processing this form…</div>
 *     <ul class="pkp_form_error_list">
 *       <li><a href="#username">This username is already in use.</a></li>
 *     </ul>
 *   </div>
 *
 * Taking the first `.pkp_form_error` therefore returned the generic banner
 * every single time, and the specific reason sitting in the list right beneath
 * it was thrown away. A taken username, a duplicate email address and a short
 * password all reached the person as the same sentence — one that tells them
 * nothing to change, so the next attempt fails the same way. The list is read
 * first now, and the banner is kept only as a last resort.
 *
 * Both class names are checked against the live install's own stylesheet
 * (`.page_register #formErrors .pkp_form_error_list`), not inferred.
 */
export function parseRegisterError(html: string): string | null {
  const list = html.match(/class="[^"]*pkp_form_error_list[^"]*"[^>]*>([\s\S]*?)<\/(?:ul|ol)>/)?.[1]

  // Every item, not just the first: OJS validates the whole form at once, and
  // a person told only about their username will hit the password rule next.
  const items = list ? [...list.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)].map((m) => stripTags(m[1])).filter(Boolean) : []
  if (items.length) return items.join(' ')

  // Field-level errors, which OJS renders beside the input as `.error` rather
  // than in the list, and the generic banner behind them. Vague beats silent:
  // reporting no reason at all sends the caller to its own "please try again",
  // which is worse than OJS's wording however general.
  const fallback = [
    ...html.matchAll(/<(\w+)[^>]*class="[^"]*(?:pkp_form_error|\berror\b)[^"]*"[^>]*>([\s\S]*?)<\/\1>/g),
  ]
    .map((m) => stripTags(m[2]))
    .filter(Boolean)

  return fallback[0] ?? null
}

/* --------------------------------- steps ---------------------------------- */

/** Step 1: an anonymous session, the CSRF token, and the journal list. */
export async function fetchRegisterForm(userAgent?: string | null): Promise<RegisterForm | null> {
  try {
    const response = await fetch(ojsRegisterPageUrl(), {
      headers: withUserAgent({ Accept: 'text/html' }, userAgent),
      redirect: 'manual',
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })

    const sid = firstCookie(response)
    if (!sid) return null

    const html = await response.text()
    return { sid, csrfToken: parseCsrfToken(html), contexts: parseRegisterContexts(html) }
  } catch {
    return null
  }
}

/**
 * Step 2: create the account.
 *
 * Success is a redirect; failure re-renders the form with an error. Both are
 * checked rather than trusting the status alone, for the same reason the login
 * relay does: a release that changed the redirect would otherwise turn every
 * rejected registration into a reported success, and the person would be sent
 * to a sign-in page for an account that does not exist.
 */
export async function postRegister(
  form: RegisterForm,
  input: RegisterInput,
  userAgent?: string | null,
): Promise<RegisterResult> {
  const body = new URLSearchParams({
    givenName: input.givenName,
    familyName: input.familyName,
    email: input.email,
    username: input.username,
    password: input.password,
    password2: input.password,
    affiliation: input.affiliation ?? '',
    country: input.country ?? '',
    ...(form.csrfToken ? { csrfToken: form.csrfToken } : {}),
  })

  const wanted = new Set(input.journals)

  for (const context of form.contexts) {
    if (!wanted.has(context.name)) continue

    // Reader is what makes the person a member of the journal at all; without
    // it OJS records the registration but enrols them nowhere.
    if (context.readerGroup) body.append(context.readerGroup, 'on')
    if (input.asReviewer && context.reviewerGroup) body.append(context.reviewerGroup, 'on')
    // Required by OJS for every journal being joined, and separately per
    // journal because each may publish its own privacy statement.
    if (context.privacyConsent) body.append(context.privacyConsent, '1')
  }

  let response: Response
  try {
    response = await fetch(ojsRegisterPageUrl(), {
      method: 'POST',
      headers: withUserAgent(
        {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'text/html',
          Cookie: `${OJS_SESSION_COOKIE}=${form.sid}`,
        },
        userAgent,
      ),
      body,
      redirect: 'manual',
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch {
    return { ok: false, reason: 'ojs-unreachable' }
  }

  if (response.status >= 300 && response.status < 400) return { ok: true }

  const html = response.status === 200 ? await response.text() : ''
  const message = html ? parseRegisterError(html) : null

  return { ok: false, reason: 'rejected', ...(message ? { message } : {}) }
}


/* --------------------------- availability check --------------------------- */

/** The fields an availability check can report on, as OJS anchors them in its error list. */
const AVAILABILITY_FIELDS = ['username', 'email'] as const

export type AvailabilityError = { field: (typeof AVAILABILITY_FIELDS)[number]; message: string }

/**
 * The username and email complaints in a rejected registration page, by field.
 *
 * OJS links each item in its error list to the input it is about
 * (`<a href="#username">`), which is what lets these be shown beside the right
 * box instead of as one sentence above the form.
 */
export function parseAvailabilityErrors(html: string): AvailabilityError[] {
  const list = html.match(/class="[^"]*pkp_form_error_list[^"]*"[^>]*>([\s\S]*?)<\/(?:ul|ol)>/)?.[1]
  if (!list) return []
  const errors: AvailabilityError[] = []
  for (const [, href, text] of list.matchAll(/<a[^>]*href="#([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)) {
    const field = AVAILABILITY_FIELDS.find((f) => f === href)
    const message = stripTags(text)
    if (field && message) errors.push({ field, message })
  }
  return errors
}

/**
 * Asks OJS whether a username and email address are free, before the person
 * is sent a code.
 *
 * OJS has no "is this taken" endpoint an anonymous visitor can reach, so this
 * submits its registration form with the real username and address and two
 * passwords that cannot match. OJS validates the whole form at once and
 * re-renders it with every problem listed, so the list says whether the
 * username or the address is taken, and the mismatch guarantees no account is
 * ever created. The final registration still runs OJS's full check; this only
 * moves the common failures to before the email rather than after it.
 *
 * Returns null when OJS could not be asked, so the caller carries on and
 * leaves the verdict to the real registration.
 */
export async function checkAvailability(
  input: { email: string; username: string },
  userAgent?: string | null,
): Promise<AvailabilityError[] | null> {
  const form = await fetchRegisterForm(userAgent)
  if (!form) return null

  // Two different passwords, each long enough to pass any length rule, so the
  // mismatch is the reason OJS refuses and nothing else about them is.
  const body = new URLSearchParams({
    givenName: 'Availability',
    familyName: 'Check',
    email: input.email,
    username: input.username,
    password: crypto.randomUUID(),
    password2: crypto.randomUUID(),
    ...(form.csrfToken ? { csrfToken: form.csrfToken } : {}),
  })

  try {
    const response = await fetch(ojsRegisterPageUrl(), {
      method: 'POST',
      headers: withUserAgent(
        {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'text/html',
          Cookie: `${OJS_SESSION_COOKIE}=${form.sid}`,
        },
        userAgent,
      ),
      body,
      redirect: 'manual',
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })

    if (response.status >= 300 && response.status < 400) {
      // Cannot happen while OJS checks that the passwords match. If it ever
      // does, an account was created by this check: say so loudly.
      console.error(`[register] availability check was ACCEPTED by OJS for username=${JSON.stringify(input.username)}; OJS no longer rejects mismatched passwords`)
      return null
    }
    if (response.status !== 200) return null

    return parseAvailabilityErrors(await response.text())
  } catch {
    return null
  }
}
