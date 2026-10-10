import { createTransport, type Transporter } from 'nodemailer'
import { editorialEmail, siteName, siteUrl } from './site'

/**
 * Transactional email.
 *
 * Audit finding F-07: review invitations were going out through a mailbox with
 * DKIM disabled, so they landed in spam and the editorial process stalled
 * silently. The fix is DNS (SPF, DKIM, DMARC) plus a provider that reports
 * delivery — this module is the application side of that.
 *
 * Peer-review and submission mail is sent by OJS, not here. This handles the
 * portal's own mail: proposal acknowledgements, alert confirmations, contact
 * form relays.
 */

export type EmailMessage = {
  to: string
  subject: string
  /** Plain-text paragraphs. An empty string renders as a blank line. */
  lines: string[]
  replyTo?: string
}

let transporter: Transporter | null = null

const smtpConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER)

function getTransporter(): Transporter | null {
  if (!smtpConfigured) return null

  if (!transporter) {
    transporter = createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === '1',
      auth: { user: process.env.SMTP_USER!, pass: process.env.SMTP_PASSWORD! },
    })
  }

  return transporter
}

const fromAddress = () => process.env.SMTP_FROM || `${siteName} <no-reply@nextgeniqpress.com>`

const footer = ['', '—', siteName, siteUrl]

export async function sendTransactionalEmail(message: EmailMessage): Promise<{ sent: boolean; reason?: string }> {
  const mailer = getTransporter()

  if (!mailer) {
    // Logged rather than thrown: in development and before SMTP is configured
    // the caller has already persisted its data, and losing the notification
    // must not look like losing the submission.
    console.warn('[email] SMTP not configured; would have sent:', message.subject, '→', message.to)
    return { sent: false, reason: 'smtp-not-configured' }
  }

  try {
    await mailer.sendMail({
      from: fromAddress(),
      to: message.to,
      replyTo: message.replyTo ?? editorialEmail,
      subject: message.subject,
      text: [...message.lines, ...footer].join('\n'),
    })
    return { sent: true }
  } catch (error) {
    console.error('[email] send failed:', error)
    return { sent: false, reason: error instanceof Error ? error.message : 'unknown' }
  }
}

export const sendEditorialEmail = (message: Omit<EmailMessage, 'to'>) =>
  sendTransactionalEmail({ ...message, to: process.env.EDITORIAL_INBOX || editorialEmail })
