'use client'

import { useCallback, useEffect, useState } from 'react'
import { CSRF_HEADER } from '@/lib/auth/csrf'
import type { BookChapter, BookVolume } from '@/lib/books/volumes'
import { VOLUME_FORMATS } from '@/lib/forms/options'
import {
  Checkbox,
  ErrorSummary,
  FileField,
  Fieldset,
  grid,
  PersonInput,
  Repeater,
  Select,
  TextArea,
  TextInput,
  useFiles,
  type Errors,
  type Person,
  type Values,
} from '@/components/forms/FormKit'

type SeriesOption = { value: string; label: string }

const button = (primary = false): React.CSSProperties => ({
  background: primary ? 'var(--accent,#1D5DA8)' : 'var(--surface,#fff)',
  color: primary ? '#fff' : 'var(--ink,#101B27)',
  border: primary ? 0 : '1px solid var(--line-strong,#B9C1C9)',
  borderRadius: 3,
  padding: '8px 14px',
  font: 'inherit',
  fontSize: 14,
  cursor: 'pointer',
})

const today = () => new Date().toISOString().slice(0, 10)

const statusOf = (v: BookVolume) =>
  v.hidden ? 'Hidden' : v.publishedAt && v.publishedAt <= today() ? 'Published' : v.publishedAt ? `Scheduled ${v.publishedAt}` : 'Draft'

type LoadResult = { volumes: BookVolume[] } | { error: string }

async function fetchVolumes(): Promise<LoadResult> {
  const res = await fetch('/api/admin/volumes', { cache: 'no-store' })
  const data = (await res.json().catch(() => ({}))) as { volumes?: BookVolume[]; message?: string }
  return res.ok ? { volumes: data.volumes ?? [] } : { error: data.message ?? 'Could not load the volumes.' }
}

/** Sends a JSON request with the CSRF header; returns field errors keyed by name, or null on success. */
async function send(method: string, url: string, csrfToken: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', [CSRF_HEADER]: csrfToken },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const data = (await res.json().catch(() => ({}))) as { errors?: { field: string; message: string }[]; message?: string; id?: number }
  if (res.ok) return { ok: true as const, id: data.id }
  const errors = data.errors ?? [{ field: 'form', message: data.message ?? `Save failed (HTTP ${res.status})` }]
  return { ok: false as const, errors }
}

function CurrentFile({ id, label }: { id: string | null; label: string }) {
  if (!id) return null
  return (
    <span style={{ fontSize: 13 }}>
      Current {label}: <a href={`/api/admin/uploads/${id}`}>download</a>. Choose a new file below to replace it.
    </span>
  )
}

/* --------------------------------- Chapters -------------------------------- */

function ChapterEditor({ volume, chapter, csrfToken, onDone }: { volume: BookVolume; chapter: BookChapter | null; csrfToken: string; onDone: () => void }) {
  const [values, setValues] = useState<Values>({
    seq: String(chapter?.seq ?? volume.chapters.length + 1),
    title: chapter?.title ?? '',
    abstract: chapter?.abstract ?? '',
    pageRange: chapter?.pageRange ?? '',
    doi: chapter?.doi ?? '',
    hidden: chapter?.hidden ?? false,
  })
  const [authors, setAuthors] = useState<Person[]>(chapter?.authors.length ? chapter.authors.map((a) => ({ ...a })) : [{ name: '', affiliation: '' }])
  const [errors, setErrors] = useState<Errors>({})
  const [summary, setSummary] = useState<{ field: string; message: string }[]>([])
  const [busy, setBusy] = useState(false)
  const files = useFiles()
  const set = (name: string, value: unknown) => setValues((v) => ({ ...v, [name]: value }))
  const field = { values, errors, set }

  const save = async () => {
    setBusy(true)
    const body = { ...values, authors, pdfUploadId: files.payload.pdf?.[0] ?? chapter?.pdfUploadId ?? null }
    const result = chapter ? await send('PATCH', `/api/admin/chapters/${chapter.id}`, csrfToken, body) : await send('POST', `/api/admin/volumes/${volume.id}/chapters`, csrfToken, body)
    setBusy(false)
    if (result.ok) onDone()
    else {
      setErrors(Object.fromEntries(result.errors.map((e) => [e.field, e.message])))
      setSummary(result.errors)
    }
  }

  return (
    <div style={{ border: '1px solid var(--line,#DCE1E6)', borderRadius: 3, padding: 16, display: 'flex', flexDirection: 'column', gap: 14, background: 'var(--surface,#fff)' }}>
      <ErrorSummary summary={summary} />
      <div style={grid}>
        <TextInput name="seq" label="Chapter number" required {...field} />
        <TextInput name="pageRange" label="Pages" hint="For example 1–24" {...field} />
        <TextInput name="doi" label="DOI" {...field} />
      </div>
      <TextInput name="title" label="Chapter title" required {...field} />
      <Repeater
        name="authors"
        legend={(i) => `Author ${i + 1}`}
        items={authors}
        setItems={setAuthors}
        errors={errors}
        max={30}
        blank={{ name: '', affiliation: '' }}
        addLabel="Add an author"
        render={(item, setItem, prefix) => (
          <div style={grid}>
            <PersonInput item={item} set={setItem} prefix={prefix} field="name" label="Name" required errors={errors} />
            <PersonInput item={item} set={setItem} prefix={prefix} field="affiliation" label="Affiliation" errors={errors} />
          </div>
        )}
      />
      <TextArea name="abstract" label="Abstract" rows={4} {...field} />
      <CurrentFile id={chapter?.pdfUploadId ?? null} label="chapter PDF" />
      <FileField name="pdf" label="Chapter PDF" purpose="final_pdf" error={errors.pdfUploadId} onChange={files.onChange('pdf')} signEndpoint="/api/admin/uploads/sign" signHeaders={{ [CSRF_HEADER]: csrfToken }} />
      <Checkbox name="hidden" label="Hide this chapter from the public volume page" {...field} />
      <div style={{ display: 'flex', gap: 10 }}>
        <button type="button" onClick={save} disabled={busy || files.uploading} style={button(true)}>
          {busy ? 'Saving…' : chapter ? 'Save chapter' : 'Add chapter'}
        </button>
        <button type="button" onClick={onDone} style={button()}>
          Cancel
        </button>
      </div>
    </div>
  )
}

/* ---------------------------------- Volume --------------------------------- */

function VolumeEditor({ volume, series, csrfToken, onSaved, onClose }: { volume: BookVolume | null; series: SeriesOption[]; csrfToken: string; onSaved: (id?: number) => void; onClose: () => void }) {
  const [values, setValues] = useState<Values>({
    seriesSlug: volume?.seriesSlug ?? series[0]?.value ?? '',
    title: volume?.title ?? '',
    subtitle: volume?.subtitle ?? '',
    slug: volume?.slug ?? '',
    volumeNumber: volume?.volumeNumber ? String(volume.volumeNumber) : '',
    format: volume?.format ?? 'edited',
    abstract: volume?.abstract ?? '',
    keywords: volume?.keywords.join(', ') ?? '',
    isbnPrint: volume?.isbnPrint ?? '',
    isbnOnline: volume?.isbnOnline ?? '',
    doi: volume?.doi ?? '',
    licence: volume?.licence ?? 'CC BY 4.0',
    pages: volume?.pages ? String(volume.pages) : '',
    publishedAt: volume?.publishedAt ?? '',
    hidden: volume?.hidden ?? false,
    cfpOpen: volume?.cfpOpen ?? false,
    cfpDeadline: volume?.cfpDeadline ?? '',
    cfpText: volume?.cfpText ?? '',
  })
  const [contributors, setContributors] = useState<Person[]>(
    volume?.contributors.length ? volume.contributors.map((c) => ({ ...c })) : [{ name: '', affiliation: '', role: 'editor' }],
  )
  const [errors, setErrors] = useState<Errors>({})
  const [summary, setSummary] = useState<{ field: string; message: string }[]>([])
  const [busy, setBusy] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [chapterEdit, setChapterEdit] = useState<BookChapter | 'new' | null>(null)
  const files = useFiles()
  const set = (name: string, value: unknown) => setValues((v) => ({ ...v, [name]: value }))
  const field = { values, errors, set }

  const save = async () => {
    setBusy(true)
    const body = {
      ...values,
      contributors,
      pdfUploadId: files.payload.pdf?.[0] ?? volume?.pdfUploadId ?? null,
      coverUploadId: files.payload.cover?.[0] ?? volume?.coverUploadId ?? null,
    }
    const result = volume ? await send('PATCH', `/api/admin/volumes/${volume.id}`, csrfToken, body) : await send('POST', '/api/admin/volumes', csrfToken, body)
    setBusy(false)
    if (result.ok) {
      setErrors({})
      setSummary([])
      onSaved(result.id)
    } else {
      setErrors(Object.fromEntries(result.errors.map((e) => [e.field, e.message])))
      setSummary(result.errors)
    }
  }

  const remove = async () => {
    if (!volume) return
    const result = await send('DELETE', `/api/admin/volumes/${volume.id}`, csrfToken)
    if (result.ok) onClose()
  }

  const removeChapter = async (c: BookChapter) => {
    const result = await send('DELETE', `/api/admin/chapters/${c.id}`, csrfToken)
    if (result.ok) onSaved(volume?.id)
  }

  return (
    <div style={{ border: '1px solid var(--line-strong,#B9C1C9)', borderRadius: 3, padding: 20, display: 'flex', flexDirection: 'column', gap: 22, background: 'var(--surface-3,#FAFBFB)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
        <h3 style={{ margin: 0, fontSize: 18 }}>{volume ? `Edit: ${volume.title}` : 'New volume'}</h3>
        <button type="button" onClick={onClose} style={button()}>
          Close
        </button>
      </div>
      <ErrorSummary summary={summary} />
      <Fieldset legend="Volume">
        <div style={grid}>
          <Select name="seriesSlug" label="Series" required options={series} {...field} />
          <Select name="format" label="Format" required options={VOLUME_FORMATS.map((f) => ({ ...f }))} {...field} />
          <TextInput name="volumeNumber" label="Volume number" {...field} />
        </div>
        <TextInput name="title" label="Title" required {...field} />
        <TextInput name="subtitle" label="Subtitle" {...field} />
        <TextInput name="slug" label="URL segment" hint="Left empty, it is made from the title. Changing it changes the volume's address." {...field} />
        <Repeater
          name="contributors"
          legend={(i) => `Contributor ${i + 1}`}
          items={contributors}
          setItems={setContributors}
          errors={errors}
          max={30}
          blank={{ name: '', affiliation: '', role: 'editor' }}
          addLabel="Add a contributor"
          render={(item, setItem, prefix) => (
            <div style={grid}>
              <PersonInput item={item} set={setItem} prefix={prefix} field="name" label="Name" required errors={errors} />
              <PersonInput item={item} set={setItem} prefix={prefix} field="affiliation" label="Affiliation" errors={errors} />
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14, fontWeight: 600 }}>
                Role
                <select value={item.role ?? 'editor'} onChange={(e) => setItem('role', e.target.value)} style={{ font: 'inherit', fontSize: 14, padding: '9px 12px' }}>
                  <option value="editor">Editor</option>
                  <option value="author">Author</option>
                </select>
              </label>
            </div>
          )}
        />
        <TextArea name="abstract" label="Abstract" rows={6} hint="Blank lines separate paragraphs." {...field} />
        <TextInput name="keywords" label="Keywords" hint="Separated by commas." {...field} />
      </Fieldset>
      <Fieldset legend="Identifiers and licence">
        <div style={grid}>
          <TextInput name="isbnOnline" label="ISBN (online)" {...field} />
          <TextInput name="isbnPrint" label="ISBN (print)" {...field} />
          <TextInput name="doi" label="DOI" hint="For example 10.63521/aiisc.1" {...field} />
          <TextInput name="licence" label="Licence" required {...field} />
          <TextInput name="pages" label="Pages" {...field} />
        </div>
      </Fieldset>
      <Fieldset legend="Files">
        <CurrentFile id={volume?.pdfUploadId ?? null} label="volume PDF" />
        <FileField name="pdf" label="Volume PDF" purpose="final_pdf" error={errors.pdfUploadId} onChange={files.onChange('pdf')} signEndpoint="/api/admin/uploads/sign" signHeaders={{ [CSRF_HEADER]: csrfToken }} />
        <CurrentFile id={volume?.coverUploadId ?? null} label="cover" />
        <FileField name="cover" label="Cover image" purpose="cover" error={errors.coverUploadId} onChange={files.onChange('cover')} signEndpoint="/api/admin/uploads/sign" signHeaders={{ [CSRF_HEADER]: csrfToken }} />
      </Fieldset>
      <Fieldset legend="Publishing" intro="A volume is public once it has a publication date on or before today and is not hidden. A future date schedules it.">
        <div style={grid}>
          <TextInput name="publishedAt" label="Publication date" type="date" {...field} />
        </div>
        <Checkbox name="hidden" label="Hide this volume from the public site" {...field} />
      </Fieldset>
      <Fieldset legend="Call for chapters" intro="While open, the volume appears under Calls for chapters on the series' Published Volumes page, with a submission form.">
        <Checkbox name="cfpOpen" label="Accept chapter submissions for this volume" {...field} />
        <div style={grid}>
          <TextInput name="cfpDeadline" label="Submission deadline" type="date" {...field} />
        </div>
        <TextArea name="cfpText" label="Call text" rows={6} hint="Shown above the submission form. Falls back to the abstract." {...field} />
      </Fieldset>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <button type="button" onClick={save} disabled={busy || files.uploading} style={button(true)}>
          {busy ? 'Saving…' : files.uploading ? 'Waiting for uploads…' : 'Save volume'}
        </button>
        {volume ? (
          confirmDelete ? (
            <>
              <span style={{ fontSize: 14 }}>Delete this volume and its chapters?</span>
              <button type="button" onClick={remove} style={{ ...button(), color: '#A52A2A', borderColor: '#A52A2A' }}>
                Yes, delete
              </button>
              <button type="button" onClick={() => setConfirmDelete(false)} style={button()}>
                Keep it
              </button>
            </>
          ) : (
            <button type="button" onClick={() => setConfirmDelete(true)} style={button()}>
              Delete volume
            </button>
          )
        ) : null}
      </div>

      {volume ? (
        <Fieldset legend={`Chapters (${volume.chapters.length})`}>
          {volume.chapters.map((c) =>
            chapterEdit !== 'new' && chapterEdit?.id === c.id ? (
              <ChapterEditor key={c.id} volume={volume} chapter={c} csrfToken={csrfToken} onDone={() => { setChapterEdit(null); onSaved(volume.id) }} />
            ) : (
              <div key={c.id} style={{ display: 'flex', gap: 12, alignItems: 'baseline', padding: '8px 0', borderBottom: '1px solid var(--line,#DCE1E6)', flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, width: 28 }}>{c.seq}</span>
                <span style={{ flex: 1, minWidth: 200, fontSize: 14 }}>
                  {c.title}
                  <span style={{ display: 'block', fontSize: 12, color: 'var(--muted,#505C68)' }}>
                    {c.authors.map((a) => a.name).join(', ')}
                    {c.pdfUploadId ? ' · PDF' : ' · no PDF'}
                    {c.hidden ? ' · hidden' : ''}
                  </span>
                </span>
                <button type="button" onClick={() => setChapterEdit(c)} style={button()}>
                  Edit
                </button>
                <button type="button" onClick={() => removeChapter(c)} style={button()}>
                  Remove
                </button>
              </div>
            ),
          )}
          {chapterEdit === 'new' ? (
            <ChapterEditor volume={volume} chapter={null} csrfToken={csrfToken} onDone={() => { setChapterEdit(null); onSaved(volume.id) }} />
          ) : (
            <button type="button" onClick={() => setChapterEdit('new')} style={{ ...button(), alignSelf: 'flex-start' }}>
              + Add a chapter
            </button>
          )}
        </Fieldset>
      ) : null}
    </div>
  )
}

/* ---------------------------------- Screen --------------------------------- */

export function AdminVolumes({ csrfToken, series }: { csrfToken: string; series: SeriesOption[] }) {
  const [volumes, setVolumes] = useState<BookVolume[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<number | 'new' | null>(null)

  // Fetching is kept apart from state-setting so the effect sets state only after an await.
  const apply = useCallback((result: LoadResult) => {
    if ('error' in result) setError(result.error)
    else {
      setError(null)
      setVolumes(result.volumes)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const result = await fetchVolumes()
      if (!cancelled) apply(result)
    })()
    return () => {
      cancelled = true
    }
  }, [apply])

  const reload = async (keepOpen?: number) => {
    apply(await fetchVolumes())
    setEditing(keepOpen ?? null)
  }

  const current = typeof editing === 'number' ? volumes?.find((v) => v.id === editing) ?? null : null

  return (
    <section style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ margin: '0 0 6px', fontSize: 20 }}>Book volumes</h2>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--ink-3,#3C4854)', maxWidth: '72ch' }}>
            Volumes and chapters of the book series. PDFs and covers are stored privately and served from the volume page. Every change is recorded in Activity.
          </p>
        </div>
        {editing === null ? (
          <button type="button" onClick={() => setEditing('new')} style={button(true)}>
            New volume
          </button>
        ) : null}
      </div>
      {error ? <p role="alert" style={{ color: '#A52A2A' }}>{error}</p> : null}
      {volumes === null && !error ? <p>Loading…</p> : null}

      {editing === 'new' ? <VolumeEditor volume={null} series={series} csrfToken={csrfToken} onSaved={(id) => reload(id)} onClose={() => setEditing(null)} /> : null}
      {current ? (
        <VolumeEditor key={current.id + current.chapters.length} volume={current} series={series} csrfToken={csrfToken} onSaved={(id) => reload(id)} onClose={() => reload()} />
      ) : null}

      {volumes && editing === null ? (
        volumes.length === 0 ? (
          <p style={{ color: 'var(--ink-3,#3C4854)' }}>No volumes yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr>
                {['Series', 'Title', 'Chapters', 'Status', 'Call', ''].map((h) => (
                  <th key={h} scope="col" style={{ textAlign: 'left', padding: '8px 12px 8px 0', fontSize: 12, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--muted,#505C68)', borderBottom: '1px solid var(--line-strong,#B9C1C9)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {volumes.map((v) => (
                <tr key={v.id}>
                  <td style={{ padding: '10px 12px 10px 0', borderBottom: '1px solid var(--line,#DCE1E6)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>{v.seriesSlug.toUpperCase()}</td>
                  <td style={{ padding: '10px 12px 10px 0', borderBottom: '1px solid var(--line,#DCE1E6)' }}>
                    {v.title}
                    {statusOf(v) === 'Published' ? (
                      <a href={`/series/${v.seriesSlug}/volumes/${v.slug}`} style={{ display: 'block', fontSize: 12 }}>
                        View on site
                      </a>
                    ) : null}
                  </td>
                  <td style={{ padding: '10px 12px 10px 0', borderBottom: '1px solid var(--line,#DCE1E6)' }}>{v.chapters.length}</td>
                  <td style={{ padding: '10px 12px 10px 0', borderBottom: '1px solid var(--line,#DCE1E6)' }}>{statusOf(v)}</td>
                  <td style={{ padding: '10px 12px 10px 0', borderBottom: '1px solid var(--line,#DCE1E6)' }}>{v.cfpOpen ? `Open${v.cfpDeadline ? ` to ${v.cfpDeadline}` : ''}` : '—'}</td>
                  <td style={{ padding: '10px 0', borderBottom: '1px solid var(--line,#DCE1E6)' }}>
                    <button type="button" onClick={() => setEditing(v.id)} style={button()}>
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      ) : null}
    </section>
  )
}
