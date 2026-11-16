'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type CSSProperties, type FormEvent } from 'react'
import { useSession } from '@/components/auth/SessionProvider'
import { signInHref } from '@/lib/auth/links'
import { CHAPTER_PRICE_USD, formatUsd } from '@/lib/cart/pricing'
import { useCart } from '@/lib/cart/store'
import { OrderSummary } from './OrderSummary'

/**
 * Guest checkout, laid out after IGI Global's (publisher's reference, November 2026).
 *
 * "Place order" checks the form and moves on to PAYMENT_PAGE, a placeholder
 * until the payment step is built. Nothing typed here is sent or stored yet,
 * and there are deliberately no card fields: card details belong only on the
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
const REQUIRED: (keyof Fields)[] = ['email', 'firstName', 'lastName', 'street', 'city', 'country', 'postcode']
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

/** Every country and territory name the browser knows, in English, A–Z. */
function countryNames(): string[] {
  const names = new Intl.DisplayNames(['en'], { type: 'region' })
  const out: string[] = []
  for (let a = 65; a <= 90; a++) {
    for (let b = 65; b <= 90; b++) {
      const code = String.fromCharCode(a, b)
      // Groupings and reserved codes (EU, UN, QO, XA, ZZ …) are not places to bill.
      if (['EU', 'EZ', 'UN', 'QO', 'ZZ'].includes(code) || code.startsWith('X')) continue
      const name = names.of(code)
      if (name && name !== code) out.push(name)
    }
  }
  return [...new Set(out)].sort((x, y) => x.localeCompare(y))
}

let countryCache: string[] | null = null
/** countryNames(), worked out once per page load. */
const getCountries = () => (countryCache ??= countryNames())

const input: CSSProperties = { font: 'inherit', fontSize: 15, padding: '11px 12px', border: '1px solid var(--line-strong,#B9C1C9)', borderRadius: 3, background: 'var(--surface,#fff)', color: 'var(--ink,#101B27)', width: '100%', boxSizing: 'border-box' }
const h2: CSSProperties = { margin: '0 0 14px', fontSize: 20, fontWeight: 600, color: 'var(--ink,#101B27)' }
const section: CSSProperties = { padding: '22px 0', borderTop: '1px solid var(--line,#DCE1E6)' }

export function CheckoutForm() {
  const items = useCart()
  const { user } = useSession()
  const router = useRouter()
  const countries = getCountries()
  const [f, setF] = useState<Fields>(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<keyof Fields, string>>>({})

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

  const subtotal = items.length * CHAPTER_PRICE_USD

  const set = (k: keyof Fields) => (e: { target: { value: string } }) => {
    setF({ ...f, [k]: e.target.value })
    if (errors[k]) setErrors({ ...errors, [k]: undefined })
  }

  const field = (k: keyof Fields, opts: { type?: string; autoComplete?: string; span?: number } = {}) => {
    const required = REQUIRED.includes(k)
    const err = errors[k]
    return (
      <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 13, fontWeight: 500, color: 'var(--ink-2,#1F2A36)', gridColumn: opts.span ? `span ${opts.span}` : undefined, minWidth: 0 }}>
        {LABELS[k]}
        <input
          id={`co-${k}`}
          type={opts.type ?? 'text'}
          value={f[k]}
          onChange={set(k)}
          autoComplete={opts.autoComplete}
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

  const placeOrder = (e: FormEvent) => {
    e.preventDefault()
    const next: Partial<Record<keyof Fields, string>> = {}
    for (const k of REQUIRED) if (!f[k].trim()) next[k] = `Enter your ${LABELS[k].toLowerCase()}.`
    if (f.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) next.email = 'Enter a valid email address.'
    setErrors(next)
    if (Object.keys(next).length > 0) {
      document.getElementById(`co-${Object.keys(next)[0]}`)?.focus()
      return
    }
    router.push(PAYMENT_PAGE)
  }

  const placeButton = (
    <button type="submit" form="checkout-form" style={{ width: '100%', border: 0, background: 'var(--accent,#0C8375)', color: '#fff', padding: '13px 16px', borderRadius: 3, font: 'inherit', fontSize: 17, fontWeight: 600, cursor: 'pointer' }}>
      Place order
    </button>
  )

  return (
    <div className="co-wrap" style={{ display: 'flex', gap: 40, alignItems: 'flex-start' }}>
      <form id="checkout-form" onSubmit={placeOrder} noValidate style={{ flex: '1 1 auto', minWidth: 0 }}>
        <style>{`.co-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px 16px}@media (max-width:640px){.co-grid{grid-template-columns:1fr}.co-grid>*{grid-column:auto!important}}`}</style>
        {!user ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', padding: '14px 18px', marginBottom: 8, background: 'var(--accent-tint,#F3F9F8)', border: '1px solid var(--accent-soft,#CDF0E7)', borderRadius: 4 }}>
            <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink,#101B27)' }}>Already have an account?</span>
            <Link href={signInHref('/checkout')} style={{ background: 'var(--surface,#fff)', border: '1px solid var(--accent,#0C8375)', color: 'var(--accent-dark,#0A685C)', padding: '8px 16px', borderRadius: 3, fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>
              Sign in
            </Link>
          </div>
        ) : null}

        <section style={{ ...section, borderTop: 'none' }}>
          <h2 style={h2}>Contact information</h2>
          <div className="co-grid">
            {field('email', { type: 'email', autoComplete: 'email', span: 2 })}
            {field('phone', { type: 'tel', autoComplete: 'tel' })}
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
              <select id="co-country" value={f.country} onChange={set('country')} autoComplete="country-name" required aria-invalid={errors.country ? true : undefined} style={errors.country ? { ...input, borderColor: '#A52A2A' } : input}>
                <option value="">Select a country</option>
                {countries.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {errors.country ? <span style={{ fontSize: 12.5, fontWeight: 400, color: '#A52A2A' }}>{errors.country}</span> : null}
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
                ['card', 'Credit or debit card', 'Visa, Mastercard, American Express, Discover'],
                ['paypal', 'PayPal', 'Pay with your PayPal account'],
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
                  <strong style={{ fontWeight: 700 }}>Chapter {it.chapter}:</strong> {it.title} <span style={{ color: 'var(--muted,#505C68)' }}>({it.seriesCode})</span>
                </span>
                <span style={{ flex: '0 0 auto', fontWeight: 600 }}>{formatUsd(CHAPTER_PRICE_USD)}</span>
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
