'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { HONEYPOT } from '@/lib/forms/options'
import { acceptAttribute, checkUpload, formatBytes, PURPOSES, type UploadPurpose } from '@/lib/uploads/policy'
import { editorialEmail } from '@/lib/site'

/**
 * Building blocks for the editorial forms (reviewer and board applications,
 * special issue and book proposals). Styling follows ContactForm, which follows
 * the mockup: 1px borders, radius 3, 14px controls.
 */

export type Values = Record<string, unknown>
export type Errors = Record<string, string>

export const control = (invalid?: boolean): React.CSSProperties => ({
  font: 'inherit',
  fontSize: 14,
  padding: '9px 12px',
  border: `1px solid ${invalid ? '#A52A2A' : 'var(--line-strong,#B9C1C9)'}`,
  borderRadius: 3,
  background: 'var(--surface,#fff)',
  boxSizing: 'border-box',
  width: '100%',
})

const labelStyle: React.CSSProperties = { fontSize: 14, fontWeight: 600, color: 'var(--ink,#101B27)' }
const hintStyle: React.CSSProperties = { fontSize: 12, lineHeight: 1.45, color: 'var(--muted,#505C68)' }
const errorStyle: React.CSSProperties = { fontSize: 13, color: '#A52A2A' }

export const grid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,240px),1fr))', gap: 18 }

const domId = (name: string) => `f-${name.replace(/[^\w-]/g, '-')}`

export function Field({ name, label, hint, error, required, children }: { name: string; label: string; hint?: string; error?: string; required?: boolean; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label htmlFor={domId(name)} style={labelStyle}>
        {label}
        {required ? <span aria-hidden="true" style={{ color: '#A52A2A' }}> *</span> : null}
      </label>
      {hint ? <span id={`${domId(name)}-hint`} style={hintStyle}>{hint}</span> : null}
      {children}
      {error ? <span id={`${domId(name)}-err`} style={errorStyle}>{error}</span> : null}
    </div>
  )
}

type InputProps = {
  name: string
  label: string
  values: Values
  errors: Errors
  set: (name: string, value: unknown) => void
  hint?: string
  required?: boolean
  type?: string
  placeholder?: string
}

const describedBy = (name: string, hint?: string, error?: string) =>
  [hint ? `${domId(name)}-hint` : '', error ? `${domId(name)}-err` : ''].filter(Boolean).join(' ') || undefined

export function TextInput({ name, label, values, errors, set, hint, required, type = 'text', placeholder }: InputProps) {
  const error = errors[name]
  return (
    <Field name={name} label={label} hint={hint} error={error} required={required}>
      <input id={domId(name)} type={type} value={String(values[name] ?? '')} onChange={(e) => set(name, e.target.value)} placeholder={placeholder} aria-invalid={error ? 'true' : 'false'} aria-describedby={describedBy(name, hint, error)} required={required} style={control(!!error)} />
    </Field>
  )
}

export function TextArea({ name, label, values, errors, set, hint, required, rows = 5 }: InputProps & { rows?: number }) {
  const error = errors[name]
  return (
    <Field name={name} label={label} hint={hint} error={error} required={required}>
      <textarea id={domId(name)} rows={rows} value={String(values[name] ?? '')} onChange={(e) => set(name, e.target.value)} aria-invalid={error ? 'true' : 'false'} aria-describedby={describedBy(name, hint, error)} required={required} style={{ ...control(!!error), resize: 'vertical', lineHeight: 1.5 }} />
    </Field>
  )
}

export function Select({ name, label, values, errors, set, hint, required, options }: InputProps & { options: { value: string; label: string }[] }) {
  const error = errors[name]
  return (
    <Field name={name} label={label} hint={hint} error={error} required={required}>
      <select id={domId(name)} value={String(values[name] ?? '')} onChange={(e) => set(name, e.target.value)} aria-invalid={error ? 'true' : 'false'} aria-describedby={describedBy(name, hint, error)} required={required} style={control(!!error)}>
        <option value="">Choose…</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  )
}

export function Checkbox({ name, label, values, errors, set }: Omit<InputProps, 'hint' | 'type' | 'placeholder'>) {
  const error = errors[name]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 14, lineHeight: 1.5, color: 'var(--ink-2,#1F2A36)' }}>
        <input id={domId(name)} type="checkbox" checked={values[name] === true} onChange={(e) => set(name, e.target.checked)} aria-invalid={error ? 'true' : 'false'} style={{ marginTop: 4, accentColor: 'var(--accent,#1D5DA8)' }} />
        <span>{label}</span>
      </label>
      {error ? <span style={errorStyle}>{error}</span> : null}
    </div>
  )
}

/** Hidden from people and assistive technology; a bot that fills every input fills this too. */
export function Honeypot({ values, set }: { values: Values; set: (name: string, value: unknown) => void }) {
  return (
    <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}>
      <label>
        Website
        <input tabIndex={-1} autoComplete="off" value={String(values[HONEYPOT] ?? '')} onChange={(e) => set(HONEYPOT, e.target.value)} />
      </label>
    </div>
  )
}

export function Fieldset({ legend, intro, children }: { legend: string; intro?: string; children: ReactNode }) {
  return (
    <fieldset style={{ border: 0, borderTop: '2px solid var(--ink,#101B27)', margin: 0, padding: '16px 0 0', display: 'flex', flexDirection: 'column', gap: 18, minWidth: 0 }}>
      <legend style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 600, color: 'var(--ink,#101B27)', padding: '0 12px 0 0' }}>{legend}</legend>
      {intro ? <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: 'var(--ink-3,#3C4854)' }}>{intro}</p> : null}
      {children}
    </fieldset>
  )
}

/* --------------------------------- Files ---------------------------------- */

type FileItem = { key: string; name: string; size: number; progress: number; id?: string; error?: string }

/** PUTs a file to the presigned URL, reporting progress. fetch() cannot report upload progress, so this is XHR. */
function put(url: string, headers: Record<string, string>, file: File, onProgress: (pct: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', url)
    for (const [k, v] of Object.entries(headers)) xhr.setRequestHeader(k, v)
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100))
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`upload ${xhr.status}`)))
    xhr.onerror = () => reject(new Error('network'))
    xhr.send(file)
  })
}

/**
 * Uploads straight to object storage: asks /api/uploads/sign for a URL, then
 * PUTs the file there, so large manuscripts never pass through the web server.
 * Reports the finished upload ids, and whether anything is still in flight.
 */
export function FileField({ name, label, purpose, hint, required, max = 1, error, onChange, signEndpoint = '/api/uploads/sign', signHeaders = {} }: { name: string; label: string; purpose: UploadPurpose; hint?: string; required?: boolean; max?: number; error?: string; onChange: (ids: string[], busy: boolean) => void; signEndpoint?: string; signHeaders?: Record<string, string> }) {
  const [items, setItems] = useState<FileItem[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const rule = PURPOSES[purpose]

  const report = useRef(onChange)
  useEffect(() => {
    report.current = onChange
  })
  useEffect(() => {
    report.current(
      items.filter((i) => i.id && !i.error).map((i) => i.id!),
      items.some((i) => !i.id && !i.error),
    )
  }, [items])

  const update = (key: string, patch: Partial<FileItem>) => setItems((list) => list.map((i) => (i.key === key ? { ...i, ...patch } : i)))

  const add = async (files: FileList | null) => {
    if (!files) return
    const room = max - items.filter((i) => !i.error).length
    for (const file of Array.from(files).slice(0, Math.max(0, room))) {
      const key = `${file.name}-${file.size}-${Math.random().toString(36).slice(2)}`
      const check = checkUpload(purpose, file.name, file.type, file.size)
      if (!check.ok) {
        setItems((list) => [...list, { key, name: file.name, size: file.size, progress: 0, error: check.message }])
        continue
      }
      setItems((list) => [...list, { key, name: file.name, size: file.size, progress: 0 }])
      try {
        const res = await fetch(signEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...signHeaders },
          body: JSON.stringify({ purpose, filename: file.name, contentType: file.type, size: file.size }),
        })
        const data = (await res.json().catch(() => ({}))) as { id?: string; url?: string; headers?: Record<string, string>; message?: string; errors?: { message: string }[] }
        if (!res.ok || !data.url || !data.id) throw new Error(data.errors?.[0]?.message ?? data.message ?? 'Could not start the upload')
        await put(data.url, data.headers ?? {}, file, (pct) => update(key, { progress: pct }))
        update(key, { id: data.id, progress: 100 })
      } catch (e) {
        const message = e instanceof Error && !/^(upload \d+|network)$/.test(e.message) ? e.message : `Upload failed. Try again, or email the file to ${editorialEmail}.`
        update(key, { error: message })
      }
    }
    if (inputRef.current) inputRef.current.value = ''
  }

  const active = items.filter((i) => !i.error).length
  const types = rule.types.map((t) => t.toUpperCase()).join(', ')

  return (
    <Field name={`files.${name}`} label={label} hint={hint ?? `${types}, up to ${formatBytes(rule.maxBytes)}${max > 1 ? ` each, up to ${max} files` : ''}.`} error={error} required={required}>
      <input
        ref={inputRef}
        id={domId(`files.${name}`)}
        type="file"
        accept={acceptAttribute(purpose)}
        multiple={max > 1}
        disabled={active >= max}
        onChange={(e) => void add(e.target.files)}
        aria-invalid={error ? 'true' : 'false'}
        style={{ ...control(!!error), padding: 8 }}
      />
      {items.length > 0 ? (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {items.map((i) => (
            <li key={i.key} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, padding: '6px 10px', border: '1px solid var(--line,#DCE1E6)', borderRadius: 3, background: i.error ? '#FBEAEA' : 'var(--surface-3,#FAFBFB)' }}>
              <span style={{ flex: 1, minWidth: 0, overflowWrap: 'anywhere' }}>
                {i.name} <span style={{ color: 'var(--muted,#505C68)' }}>· {formatBytes(i.size)}</span>
                {i.error ? <span style={{ display: 'block', color: '#A52A2A' }}>{i.error}</span> : null}
              </span>
              <span aria-live="polite" style={{ color: i.id ? '#1E6B3A' : 'var(--muted,#505C68)', whiteSpace: 'nowrap' }}>
                {i.error ? '' : i.id ? 'Uploaded' : `${i.progress}%`}
              </span>
              <button type="button" onClick={() => setItems((list) => list.filter((x) => x.key !== i.key))} aria-label={`Remove ${i.name}`} style={{ border: 0, background: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--ink-3,#3C4854)' }}>
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </Field>
  )
}

/* -------------------------------- Repeater -------------------------------- */

export type Person = Record<string, string>

export function Repeater({ name, legend, items, setItems, errors, min = 1, max, blank, render, addLabel }: { name: string; legend: (i: number) => string; items: Person[]; setItems: (items: Person[]) => void; errors: Errors; min?: number; max: number; blank: Person; render: (item: Person, set: (field: string, value: string) => void, prefix: string) => ReactNode; addLabel: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {errors[name] ? <span style={errorStyle}>{errors[name]}</span> : null}
      {items.map((item, i) => (
        <div key={i} style={{ border: '1px solid var(--line,#DCE1E6)', borderRadius: 3, padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontWeight: 600, fontSize: 15 }}>{legend(i)}</span>
            {items.length > min ? (
              <button type="button" onClick={() => setItems(items.filter((_, k) => k !== i))} style={{ border: 0, background: 'none', color: 'var(--accent,#1D5DA8)', cursor: 'pointer', font: 'inherit', fontSize: 13 }}>
                Remove
              </button>
            ) : null}
          </div>
          {render(item, (field, value) => setItems(items.map((x, k) => (k === i ? { ...x, [field]: value } : x))), `${name}.${i}`)}
        </div>
      ))}
      {items.length < max ? (
        <button type="button" onClick={() => setItems([...items, { ...blank }])} style={{ alignSelf: 'flex-start', border: '1px solid var(--line-strong,#B9C1C9)', background: 'var(--surface,#fff)', borderRadius: 3, padding: '8px 14px', font: 'inherit', fontSize: 14, cursor: 'pointer' }}>
          + {addLabel}
        </button>
      ) : null}
    </div>
  )
}

/** A text field bound to one entry of a repeater. */
export function PersonInput({ item, set, prefix, field, label, errors, required, type = 'text', textarea, hint }: { item: Person; set: (field: string, value: string) => void; prefix: string; field: string; label: string; errors: Errors; required?: boolean; type?: string; textarea?: boolean; hint?: string }) {
  const name = `${prefix}.${field}`
  const error = errors[name]
  return (
    <Field name={name} label={label} error={error} required={required} hint={hint}>
      {textarea ? (
        <textarea id={domId(name)} rows={4} value={item[field] ?? ''} onChange={(e) => set(field, e.target.value)} aria-invalid={error ? 'true' : 'false'} style={{ ...control(!!error), resize: 'vertical', lineHeight: 1.5 }} />
      ) : (
        <input id={domId(name)} type={type} value={item[field] ?? ''} onChange={(e) => set(field, e.target.value)} aria-invalid={error ? 'true' : 'false'} style={control(!!error)} />
      )}
    </Field>
  )
}

/* --------------------------------- Submit --------------------------------- */

/**
 * Posts the form as JSON. Field errors from the server come back keyed by
 * field name and are shown next to their inputs and in a focused summary.
 * Every failure ends at a working email address, never a dead end.
 */
export function useSubmit(endpoint: string) {
  const [errors, setErrors] = useState<Errors>({})
  const [summary, setSummary] = useState<{ field: string; message: string }[]>([])
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)
  const [reference, setReference] = useState<string | null>(null)

  const submit = async (payload: Values) => {
    setBusy(true)
    setFailure(null)
    try {
      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = (await res.json().catch(() => ({}))) as { reference?: string; errors?: { field: string; message: string }[]; message?: string; error?: string }
      if (res.ok && data.reference) {
        setReference(data.reference)
        setErrors({})
        setSummary([])
        return
      }
      if (data.errors?.length) {
        setErrors(Object.fromEntries(data.errors.map((e) => [e.field, e.message])))
        setSummary(data.errors)
        return
      }
      setFailure(
        res.status === 429
          ? 'Too many submissions from this connection. Please wait a few minutes and try again.'
          : (data.message ?? `Something went wrong and your form was not sent. Please try again, or email ${editorialEmail}.`),
      )
    } catch {
      setFailure(`Your form could not be sent. Check your connection and try again, or email ${editorialEmail}.`)
    } finally {
      setBusy(false)
    }
  }

  return { errors, summary, busy, failure, reference, submit }
}

export function ErrorSummary({ summary }: { summary: { field: string; message: string }[] }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (summary.length > 0) ref.current?.focus()
  }, [summary])
  if (summary.length === 0) return null
  return (
    <div ref={ref} tabIndex={-1} role="alert" style={{ border: '1px solid #E3B3B3', background: '#FBEAEA', borderRadius: 3, padding: '12px 16px', fontSize: 14, color: '#5C1414', lineHeight: 1.5, outline: 'none' }}>
      <strong>Please correct the following:</strong>
      <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
        {summary.map((e) => (
          <li key={e.field + e.message}>
            <a href={`#${domId(e.field)}`} style={{ color: '#5C1414', textDecoration: 'underline' }}>
              {e.message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function Failure({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <div role="alert" style={{ border: '1px solid #E3B3B3', background: '#FBEAEA', borderRadius: 3, padding: '12px 16px', fontSize: 14, lineHeight: 1.5, color: '#5C1414' }}>
      {message}
    </div>
  )
}

export function Received({ reference, children }: { reference: string; children: ReactNode }) {
  return (
    <div role="status" style={{ border: '1px solid #B9DCC4', background: '#E7F3EB', borderRadius: 3, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <h2 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 600, color: '#1E6B3A' }}>Received</h2>
      <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: 'var(--ink-2,#1F2A36)' }}>
        Your reference is <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{reference}</span>. A confirmation has been sent to your email address.
      </p>
      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: 'var(--ink-3,#3C4854)' }}>{children}</p>
    </div>
  )
}

export function SubmitButton({ busy, uploading, label }: { busy: boolean; uploading: boolean; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
      <button type="submit" disabled={busy || uploading} style={{ background: 'var(--accent,#1D5DA8)', color: '#fff', border: 0, borderRadius: 3, padding: '11px 20px', font: 'inherit', fontSize: 15, fontWeight: 500, cursor: busy || uploading ? 'progress' : 'pointer', opacity: busy || uploading ? 0.75 : 1 }}>
        {busy ? 'Sending…' : label}
      </button>
      {uploading ? <span style={{ fontSize: 13, color: 'var(--muted,#505C68)' }}>Waiting for uploads to finish…</span> : null}
    </div>
  )
}

/** Tracks each file field's ids and in-flight state for the payload and the submit button. */
export function useFiles() {
  const [files, setFiles] = useState<Record<string, { ids: string[]; busy: boolean }>>({})
  const onChange = (field: string) => (ids: string[], busy: boolean) =>
    setFiles((f) => (f[field]?.ids.join() === ids.join() && f[field]?.busy === busy ? f : { ...f, [field]: { ids, busy } }))
  const payload = Object.fromEntries(Object.entries(files).map(([k, v]) => [k, v.ids]))
  const uploading = Object.values(files).some((v) => v.busy)
  return { onChange, payload, uploading }
}
