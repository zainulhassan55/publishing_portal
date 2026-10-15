'use client'

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist'

/**
 * An in-page PDF reader built on PDF.js, bundled with the site.
 *
 * Why not the browser's own viewer in an iframe: it is whatever the reader's
 * browser happens to ship — a full viewer in desktop Chrome, a single
 * non-scrolling page on iOS Safari, and a download prompt where the plugin is
 * disabled — so "does the PDF display" had a different answer on every device.
 * Why not a CDN build: the site's content-security policy allows scripts from
 * its own origin only, which is the right policy and not worth loosening for
 * this. So PDF.js comes from npm and ships in the bundle, loaded on demand the
 * first time an article with a PDF is opened.
 *
 * Pages render to canvases at the device pixel ratio, lazily as they scroll
 * into view, and re-render on zoom. "Fit width" is the default and tracks the
 * container, so the same page is readable on a phone and a monitor.
 */

type Props = {
  /** The portal's same-origin PDF route; the file itself. */
  src: string
  /** Same route with `?download=1`. */
  downloadHref: string
  title: string
}

type Zoom = 'fit' | number

const ZOOM_STEPS = [0.5, 0.75, 1, 1.25, 1.5, 2, 3]

const toolbarButton: CSSProperties = {
  border: '1px solid var(--line-strong, #B9C1C9)',
  background: 'var(--surface, #fff)',
  color: 'var(--ink, #101B27)',
  borderRadius: 3,
  padding: '5px 10px',
  font: 'inherit',
  fontSize: 13,
  lineHeight: 1.2,
  cursor: 'pointer',
  textDecoration: 'none',
  whiteSpace: 'nowrap',
}

export function PdfViewer({ src, downloadHref, title }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const docRef = useRef<PDFDocumentProxy | null>(null)
  const canvases = useRef<(HTMLCanvasElement | null)[]>([])
  const renderTasks = useRef<Map<number, RenderTask>>(new Map())
  const rendered = useRef<Map<number, number>>(new Map()) // page → scale it was rendered at

  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  /** Base (scale 1) size of each page, so placeholders are sized before rendering. */
  const [sizes, setSizes] = useState<{ width: number; height: number }[]>([])
  const [pageCount, setPageCount] = useState(0)
  const [page, setPage] = useState(1)
  const [zoom, setZoom] = useState<Zoom>('fit')
  const [containerWidth, setContainerWidth] = useState(0)

  /* Load the document once. PDF.js is imported here, not at module level, so
     it never lands in the server bundle and is fetched only on this page. */
  useEffect(() => {
    let cancelled = false
    let doc: PDFDocumentProxy | null = null
    const tasks = renderTasks.current
    ;(async () => {
      try {
        const pdfjs = await import('pdfjs-dist')
        pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()
        doc = await pdfjs.getDocument({ url: src }).promise
        if (cancelled) return
        const measured: { width: number; height: number }[] = []
        for (let n = 1; n <= doc.numPages; n++) {
          const p = await doc.getPage(n)
          const v = p.getViewport({ scale: 1 })
          measured.push({ width: v.width, height: v.height })
        }
        if (cancelled) return
        docRef.current = doc
        setSizes(measured)
        setPageCount(doc.numPages)
        setStatus('ready')
      } catch (error) {
        console.error('[pdf-viewer] could not load', src, error)
        if (!cancelled) setStatus('error')
      }
    })()
    return () => {
      cancelled = true
      for (const task of tasks.values()) task.cancel()
      tasks.clear()
      void doc?.destroy()
      docRef.current = null
    }
  }, [src])

  /* Track the container width for fit-to-width. */
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const update = () => setContainerWidth(el.clientWidth)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [status])

  const maxBaseWidth = sizes.reduce((m, s) => Math.max(m, s.width), 0) || 612
  const padding = 24
  const scale = zoom === 'fit' ? Math.max(0.2, (containerWidth - padding * 2) / maxBaseWidth) : zoom

  const renderPage = useCallback(
    async (n: number) => {
      const doc = docRef.current
      const canvas = canvases.current[n - 1]
      if (!doc || !canvas) return
      if (rendered.current.get(n) === scale) return
      renderTasks.current.get(n)?.cancel()

      const pdfPage = await doc.getPage(n)
      const viewport = pdfPage.getViewport({ scale })
      const ratio = Math.min(window.devicePixelRatio || 1, 3)
      canvas.width = Math.floor(viewport.width * ratio)
      canvas.height = Math.floor(viewport.height * ratio)
      canvas.style.width = `${Math.floor(viewport.width)}px`
      canvas.style.height = `${Math.floor(viewport.height)}px`
      const context = canvas.getContext('2d')
      if (!context) return

      const task = pdfPage.render({ canvas, canvasContext: context, viewport, transform: ratio !== 1 ? [ratio, 0, 0, ratio, 0, 0] : undefined })
      renderTasks.current.set(n, task)
      try {
        await task.promise
        rendered.current.set(n, scale)
      } catch {
        /* cancelled by a zoom change or unmount; the next pass re-renders */
      } finally {
        if (renderTasks.current.get(n) === task) renderTasks.current.delete(n)
      }
    },
    [scale],
  )

  /* Render pages as they come into view; re-render on zoom. */
  useEffect(() => {
    if (status !== 'ready') return
    const root = scrollRef.current
    if (!root) return
    rendered.current.clear()

    const visible = new Map<number, number>()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const n = Number((entry.target as HTMLElement).dataset.page)
          if (entry.isIntersecting) {
            visible.set(n, entry.intersectionRatio)
            void renderPage(n)
          } else {
            visible.delete(n)
          }
        }
        if (visible.size) {
          // The page showing the most of itself is "the" current page.
          const [best] = [...visible.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])
          setPage(best[0])
        }
      },
      { root, rootMargin: '200px 0px', threshold: [0, 0.25, 0.5, 0.75, 1] },
    )
    root.querySelectorAll<HTMLElement>('[data-page]').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [status, pageCount, renderPage])

  const goTo = (n: number) => {
    const target = scrollRef.current?.querySelector<HTMLElement>(`[data-page="${n}"]`)
    target?.scrollIntoView({ block: 'start' })
  }

  const zoomIndex = zoom === 'fit' ? ZOOM_STEPS.findIndex((z) => z >= scale) : ZOOM_STEPS.indexOf(zoom)
  const zoomOut = () => setZoom(ZOOM_STEPS[Math.max(0, (zoomIndex === -1 ? ZOOM_STEPS.length : zoomIndex) - 1)])
  const zoomIn = () => setZoom(ZOOM_STEPS[Math.min(ZOOM_STEPS.length - 1, (zoomIndex === -1 ? 0 : zoomIndex) + 1)])

  return (
    <div
      style={{
        border: '1px solid var(--line, #DCE1E6)',
        borderRadius: 3,
        background: 'var(--surface, #fff)',
        overflow: 'hidden',
      }}
    >
      <div
        role="toolbar"
        aria-label="PDF controls"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 8,
          padding: '8px 10px',
          borderBottom: '1px solid var(--line, #DCE1E6)',
          background: 'var(--surface-2, #F5F6F7)',
          fontSize: 13,
          color: 'var(--ink-2, #1F2A36)',
        }}
      >
        <button type="button" style={toolbarButton} onClick={() => goTo(Math.max(1, page - 1))} disabled={page <= 1 || status !== 'ready'} aria-label="Previous page">
          ‹
        </button>
        <span style={{ minWidth: 86, textAlign: 'center' }}>
          {status === 'ready' ? `Page ${page} of ${pageCount}` : status === 'loading' ? 'Loading…' : 'Unavailable'}
        </span>
        <button type="button" style={toolbarButton} onClick={() => goTo(Math.min(pageCount, page + 1))} disabled={page >= pageCount || status !== 'ready'} aria-label="Next page">
          ›
        </button>
        <span aria-hidden="true" style={{ width: 1, height: 20, background: 'var(--line, #DCE1E6)' }} />
        <button type="button" style={toolbarButton} onClick={zoomOut} disabled={status !== 'ready'} aria-label="Zoom out">
          −
        </button>
        <span style={{ minWidth: 44, textAlign: 'center' }}>{Math.round(scale * 100)}%</span>
        <button type="button" style={toolbarButton} onClick={zoomIn} disabled={status !== 'ready'} aria-label="Zoom in">
          +
        </button>
        <button type="button" style={{ ...toolbarButton, fontWeight: zoom === 'fit' ? 600 : 400 }} onClick={() => setZoom('fit')} disabled={status !== 'ready'}>
          Fit width
        </button>
        <span style={{ flex: 1 }} />
        <a href={src} target="_blank" rel="noreferrer" style={toolbarButton}>
          Open in new tab
        </a>
        <a href={downloadHref} download style={toolbarButton}>
          Download
        </a>
      </div>

      <div
        ref={scrollRef}
        style={{
          height: '80vh',
          minHeight: 480,
          overflow: 'auto',
          background: '#DADEE3',
          padding: `${padding}px 0`,
        }}
      >
        {status === 'error' ? (
          <p style={{ margin: 0, padding: 24, fontSize: 14, lineHeight: 1.6, color: 'var(--ink-2, #1F2A36)' }}>
            The PDF could not be displayed here.{' '}
            <a href={src} target="_blank" rel="noreferrer">
              Open it in a new tab
            </a>{' '}
            or{' '}
            <a href={downloadHref} download>
              download it
            </a>
            .
          </p>
        ) : null}
        {status === 'ready'
          ? sizes.map((size, i) => (
              <div
                key={i}
                data-page={i + 1}
                aria-label={`Page ${i + 1} of ${title}`}
                style={{
                  width: Math.floor(size.width * scale),
                  height: Math.floor(size.height * scale),
                  margin: `0 auto ${padding}px`,
                  background: '#fff',
                  boxShadow: '0 1px 4px rgba(16,27,39,.25)',
                }}
              >
                <canvas
                  ref={(el) => {
                    canvases.current[i] = el
                  }}
                  style={{ display: 'block' }}
                />
              </div>
            ))
          : null}
      </div>
    </div>
  )
}
