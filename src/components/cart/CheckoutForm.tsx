'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useRef, useState, type CSSProperties, type FormEvent } from 'react'
import { Turnstile, captchaRequired, type TurnstileHandle } from '@/components/auth/Turnstile'
import { signInHref } from '@/lib/auth/links'
import { CHECKOUT_KEYS, MAX_LENGTH, countryList, normalizeCheckout, postcodeRequired, validateCheckout } from '@/lib/cart/checkout-fields'
import { cartTotal, formatBoth, formatTwd, formatUsd, itemPrice } from '@/lib/cart/pricing'
import { itemLabel, useCart } from '@/lib/cart/store'
import { OrderSummary } from './OrderSummary'

/**
 * Checkout for a signed-in buyer, laid out after IGI Global's (publisher's
 * reference, November 2026). The page (app/checkout) requires sign-in and
 * passes the account in, so the contact and name fields start filled in.
 *
 * Every field is checked against the rules in src/lib/cart/checkout-fields.ts
 * when the reader leaves it and again on "Place order"; /api/checkout applies
 * the same rules and its field errors are shown the same way. A rejected value
 * stays in its field, marked, for the reader to correct.
 *
 * A Cloudflare Turnstile check ("verify you are human") sits above "Place
 * order" and /api/checkout verifies its token before an order is created; the
 * widget is reset after every answer from the server, since tokens are
 * single-use. With no Turnstile keys configured it is hidden and skipped.
 *
 * "Place order" then posts the cart and billing details to
 * /api/checkout, which creates the order in the payment Worker
 * (workers/chapter-pay) and returns its payment page. While payments are not
 * configured that route answers with PAYMENT_PAGE, the "coming soon" page.
 * There are deliberately no card fields: card details belong only on the
 * payment provider's own page, never on ours.
 */
export const PAYMENT_PAGE = '/checkout/payment'

type Fields = {
  email: string
  phone: string
  firstName: string
  lastName: string
  company: string
  street: string
  unit: string
  city: string
  country: string
  region: string
  postcode: string
  method: 'card' | 'paypal'
}

const EMPTY: Fields = { email: '', phone: '', firstName: '', lastName: '', company: '', street: '', unit: '', city: '', country: '', region: '', postcode: '', method: 'card' }
const REQUIRED: (keyof Fields)[] = ['email', 'firstName', 'lastName', 'street', 'city', 'country']
const LABELS: Record<keyof Fields, string> = {
  email: 'Email',
  phone: 'Phone number (optional)',
  firstName: 'First name',
  lastName: 'Last name',
  company: 'Company name (optional)',
  street: 'Street address',
  unit: 'Apt / suite / unit (optional)',
  city: 'City / town',
  country: 'Country / region',
  region: 'State / province (optional)',
  postcode: 'Postal code',
  method: 'Payment method',
}

let countryCache: { code: string; name: string }[] | null = null
/** countryList(), worked out once per page load. */
const getCountries = () => (countryCache ??= countryList())

type Errors = Partial<Record<keyof Fields, string>>

/** The rules' verdict on the current values, as a field → message map. */
const check = (f: Fields): Errors => Object.fromEntries(validateCheckout(normalizeCheckout(f)).map((e) => [e.field, e.message])) as Errors

const input: CSSProperties = { font: 'inherit', fontSize: 15, padding: '11px 12px', border: '1px solid var(--line-strong,#B9C1C9)', borderRadius: 3, background: 'var(--surface,#fff)', color: 'var(--ink,#101B27)', width: '100%', boxSizing: 'border-box' }
const h2: CSSProperties = { margin: '0 0 14px', fontSize: 20, fontWeight: 600, color: 'var(--ink,#101B27)' }
const section: CSSProperties = { padding: '22px 0', borderTop: '1px solid var(--line,#DCE1E6)' }

/** The signed-in buyer, from the server session; used to fill in the form. */
export type CheckoutAccount = { email: string; givenName: string; familyName: string; fullName: string; affiliation: string }

export function CheckoutForm({ account }: { account: CheckoutAccount }) {
  const items = useCart()
  const router = useRouter()
  const countries = getCountries()
  const [f, setF] = useState<Fields>(() => ({
    ...EMPTY,
    email: account.email,
    firstName: account.givenName,
    lastName: account.familyName,
    company: account.affiliation,
  }))
  const [errors, setErrors] = useState<Errors>({})
  const [busy, setBusy] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const captcha = useRef<TurnstileHandle>(null)

  if (items.length === 0) {
    return (
      <div style={{ padding: '28px 0', borderTop: '1px solid var(--line,#DCE1E6)', fontSize: 16, lineHeight: 1.6, color: 'var(--ink-3,#3C4854)' }}>
        <p style={{ margin: '0 0 14px' }}>Your cart is empty, so there is nothing to check out.</p>
        <Link href="/series" style={{ fontWeight: 600 }}>
          Browse the book series →
        </Link>
      </div>
    )
  }

  const subtotal = cartTotal(items.map((i) => i.id))

  const set = (k: keyof Fields) => (e: { target: { value: string } }) => {
    setF({ ...f, [k]: e.target.value })
    if (errors[k]) setErrors({ ...errors, [k]: undefined })
  }

  /** On leaving a field: show its problem now (an empty field is only flagged on "Place order"). */
  const checkField = (k: keyof Fields) => () => {
    if (!f[k].trim()) return
    setErrors((prev) => ({ ...prev, [k]: check(f)[k] }))
  }

  const field = (k: Exclude<keyof Fields, 'method' | 'country'>, opts: { type?: string; autoComplete?: string; span?: number; inputMode?: 'tel' | 'email' | 'text' } = {}) => {
    const required = REQUIRED.includes(k) || (k === 'postcode' && postcodeRequired(f.country))
    const err = errors[k]
    const label = k === 'postcode' && !required ? 'Postal code (optional)' : LABELS[k]
    return (
      <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 13, fontWeight: 500, color: 'var(--ink-2,#1F2A36)', gridColumn: opts.span ? `span ${opts.span}` : undefined, minWidth: 0 }}>
        {label}
        <input
          id={`co-${k}`}
          type={opts.type ?? 'text'}
          value={f[k]}
          onChange={set(k)}
          onBlur={checkField(k)}
          autoComplete={opts.autoComplete}
          inputMode={opts.inputMode}
          maxLength={MAX_LENGTH[k]}
          required={required}
          aria-invalid={err ? true : undefined}
          aria-describedby={err ? `err-${k}` : undefined}
          style={err ? { ...input, borderColor: '#A52A2A' } : input}
        />
        {err ? (
          <span id={`err-${k}`} style={{ fontSize: 12.5, fontWeight: 400, color: '#A52A2A' }}>
            {err}
          </span>
        ) : null}
      </label>
    )
  }

  const placeOrder = async (e: FormEvent) => {
    e.preventDefault()
    const next = check(f)
    setErrors(next)
    const first = CHECKOUT_KEYS.find((k) => next[k])
    if (first) {
      const n = Object.keys(next).length
      setSubmitError(`Please correct the ${n === 1 ? 'field' : `${n} fields`} marked in red.`)
      document.getElementById(`co-${first}`)?.focus()
      return
    }
    if (captchaRequired && !captchaToken) {
      setSubmitError('Please complete the security check above "Place order".')
      return
    }
    setBusy(true)
    setSubmitError('')
    try {
      const { method, ...rest } = f
      const buyer = normalizeCheckout(rest)
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: items.map(({ id, title, volumeTitle, seriesCode }) => ({ id, title, volumeTitle, seriesCode })), buyer, method, captchaToken }),
      })
      // Field errors (422) are answered before the security check, so that token is still unused.
      if (res.status !== 422) captcha.current?.reset()
      if (res.status === 401) {
        // Signed out in another tab, or the session ended: sign in again, then come back here.
        window.location.assign(signInHref('/checkout'))
        return
      }
      const data = (await res.json().catch(() => ({}))) as { payUrl?: string; error?: string; message?: string; errors?: { field: string; message: string }[] }
      if (res.status === 422 && data.errors?.length) {
        // The server's rules are the same as ours; show its verdict on the fields, keeping what was typed.
        const server = Object.fromEntries(data.errors.map((x) => [x.field, x.message])) as Errors
        setErrors(server)
        setSubmitError('Please correct the fields marked in red.')
        setBusy(false)
        const firstBad = CHECKOUT_KEYS.find((k) => server[k])
        if (firstBad) document.getElementById(`co-${firstBad}`)?.focus()
        return
      }
      if (data.error === 'captcha-failed' || data.error === 'captcha-unavailable') {
        setSubmitError(data.message || 'Please complete the security check, then press "Place order" again.')
        setBusy(false)
        return
      }
      if (!res.ok || !data.payUrl) throw new Error(data.message || (data.error && data.error !== 'validation' ? data.error : '') || 'The order could not be placed.')
      // The Worker's payment page is another origin: a full navigation, not router.push.
      if (data.payUrl.startsWith('/')) router.push(data.payUrl)
      else window.location.assign(data.payUrl)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'The order could not be placed.')
      setBusy(false)
    }
  }

  const placeButton = (
    <>
      <Turnstile
        ref={captcha}
        action="checkout"
        onToken={(t) => {
          setCaptchaToken(t)
          if (t && submitError.startsWith('Please complete the security check')) setSubmitError('')
        }}
      />
      <button type="submit" form="checkout-form" disabled={busy} style={{ width: '100%', border: 0, background: 'var(--accent,#0C8375)', color: '#fff', padding: '13px 16px', borderRadius: 3, font: 'inherit', fontSize: 17, fontWeight: 600, cursor: busy ? 'wait' : 'pointer', opacity: busy ? 0.7 : 1 }}>
        {busy ? 'Placing order…' : 'Place order'}
      </button>
      {submitError ? (
        <p role="alert" style={{ margin: 0, fontSize: 13.5, color: '#A52A2A' }}>
          {submitError}
        </p>
      ) : null}
    </>
  )

  return (
    <div className="co-wrap" style={{ display: 'flex', gap: 40, alignItems: 'flex-start' }}>
      <form id="checkout-form" onSubmit={placeOrder} noValidate style={{ flex: '1 1 auto', minWidth: 0 }}>
        <style>{`.co-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px 16px}@media (max-width:640px){.co-grid{grid-template-columns:1fr}.co-grid>*{grid-column:auto!important}}`}</style>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', padding: '12px 18px', marginBottom: 8, background: 'var(--accent-tint,#F3F9F8)', border: '1px solid var(--accent-soft,#CDF0E7)', borderRadius: 4, fontSize: 14.5, color: 'var(--ink-2,#1F2A36)' }}>
          <span>
            Signed in as <strong style={{ fontWeight: 700, color: 'var(--ink,#101B27)' }}>{account.fullName || account.email}</strong>
            {account.fullName ? <span style={{ color: 'var(--muted,#505C68)' }}> ({account.email})</span> : null}
          </span>
          <span style={{ fontSize: 13, color: 'var(--muted,#505C68)' }}>This order will be saved to your account.</span>
        </div>

        <section style={{ ...section, borderTop: 'none' }}>
          <h2 style={h2}>Contact information</h2>
          <div className="co-grid">
            {field('email', { type: 'email', autoComplete: 'email', span: 2 })}
            {field('phone', { type: 'tel', autoComplete: 'tel', inputMode: 'tel' })}
          </div>
          <p style={{ margin: '10px 0 0', fontSize: 13, color: 'var(--muted,#505C68)' }}>Your receipt and download links will be sent to this address.</p>
        </section>

        <section style={section}>
          <h2 style={h2}>Billing address</h2>
          <div className="co-grid">
            {field('firstName', { autoComplete: 'given-name' })}
            {field('lastName', { autoComplete: 'family-name' })}
            {field('company', { autoComplete: 'organization' })}
            {field('street', { autoComplete: 'address-line1', span: 2 })}
            {field('unit', { autoComplete: 'address-line2' })}
            {field('city', { autoComplete: 'address-level2', span: 3 })}
            <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 13, fontWeight: 500, color: 'var(--ink-2,#1F2A36)', minWidth: 0 }}>
              {LABELS.country}
              <select
                id="co-country"
                value={f.country}
                onChange={(e) => {
                  // A new country changes the postcode rule, so its old verdict no longer applies.
                  setF({ ...f, country: e.target.value })
                  setErrors({ ...errors, country: undefined, postcode: undefined })
                }}
                autoComplete="country"
                required
                aria-invalid={errors.country ? true : undefined}
                aria-describedby={errors.country ? 'err-country' : undefined}
                style={errors.country ? { ...input, borderColor: '#A52A2A' } : input}
              >
                <option value="">Select a country</option>
                {countries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.country ? (
                <span id="err-country" style={{ fontSize: 12.5, fontWeight: 400, color: '#A52A2A' }}>
                  {errors.country}
                </span>
              ) : null}
            </label>
            {field('region', { autoComplete: 'address-level1' })}
            {field('postcode', { autoComplete: 'postal-code' })}
          </div>
        </section>

        <section style={section}>
          <h2 style={h2}>Payment information</h2>
          <fieldset style={{ margin: 0, padding: 0, border: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <legend style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>Payment method</legend>
            {(
              [
                ['card', `Credit or debit card · ${formatTwd(subtotal.twd)}`, 'Charged in New Taiwan dollars through NewebPay. Visa, Mastercard, JCB, UnionPay'],
                ['paypal', `PayPal · ${formatUsd(subtotal.usd)}`, 'Charged in US dollars. Pay with your PayPal account or a card'],
              ] as const
            ).map(([value, label, hint]) => (
              <label key={value} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', border: `1px solid ${f.method === value ? 'var(--accent,#0C8375)' : 'var(--line,#DCE1E6)'}`, borderRadius: 4, background: f.method === value ? 'var(--accent-tint,#F3F9F8)' : 'var(--surface,#fff)', cursor: 'pointer' }}>
                <input type="radio" name="method" value={value} checked={f.method === value} onChange={() => setF({ ...f, method: value })} />
                <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink,#101B27)' }}>{label}</span>
                  <span style={{ fontSize: 13, color: 'var(--muted,#505C68)' }}>{hint}</span>
                </span>
              </label>
            ))}
          </fieldset>
          <p style={{ margin: '12px 0 0', fontSize: 13.5, lineHeight: 1.5, color: 'var(--ink-3,#3C4854)' }}>
            🔒 You will enter your payment details on a secure payment page after you place the order. NextGenIQ Press never sees or stores your card number.
          </p>
        </section>

        <section style={section}>
          <h2 style={h2}>Your order</h2>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {items.map((it) => (
              <li key={it.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '8px 0', fontSize: 14.5, color: 'var(--ink-2,#1F2A36)' }}>
                <span style={{ minWidth: 0 }}>
                  <strong style={{ fontWeight: 700 }}>{itemLabel(it)}:</strong> {it.title} <span style={{ color: 'var(--muted,#505C68)' }}>({it.seriesCode})</span>
                </span>
                <span style={{ flex: '0 0 auto', fontWeight: 600 }}>{formatBoth(itemPrice(it.id) ?? { usd: 0, twd: 0 })}</span>
              </li>
            ))}
          </ul>
          <p style={{ margin: '8px 0 0' }}>
            <Link href="/cart" style={{ fontSize: 14 }}>
              Edit cart
            </Link>
          </p>
        </section>
      </form>
      <OrderSummary subtotal={subtotal}>{placeButton}</OrderSummary>
    </div>
  )
}
