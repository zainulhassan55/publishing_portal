import { redirect } from 'next/navigation'
import { jsonError } from '@/lib/api'
import { signInHref } from './links'
import { getSession, type SessionUser } from './session'

/**
 * Every form on the site is for members only: a person signs in before they
 * can open a form or send one. Two gates, because they do different jobs.
 *
 * - `requireMemberPage` on each form page sends a signed-out visitor to
 *   sign-in and back to the form afterwards. That is the courtesy.
 * - `requireMember` in each form's API route refuses the request outright.
 *   That is the enforcement: the page gate alone would let anyone post to the
 *   endpoint directly.
 */
export async function requireMemberPage(path: string): Promise<SessionUser> {
  const { user } = await getSession()
  if (!user) redirect(signInHref(path))
  return user
}

/** The signed-in member, or a 401 response to return as-is. */
export async function requireMember(): Promise<SessionUser | Response> {
  const { user } = await getSession()
  if (user) return user
  return jsonError('sign-in-required', 401, {
    message: 'Please sign in to send this form. Your session may have ended; sign in again in another tab, then send it again from here.',
  })
}

/** Who sent a form, stored alongside its payload. A reference into OJS, not a copy of the account. */
export const submittedBy = (user: SessionUser) => ({ ojsUserId: user.id, userName: user.userName })
