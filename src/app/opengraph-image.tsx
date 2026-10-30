import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { siteName, siteTagline } from '@/lib/site'

/**
 * The default link-preview image. Served at /opengraph-image and referenced
 * explicitly by every page through withSharing (src/lib/metadata.ts), because
 * a page that sets its own openGraph would otherwise drop the file-based image.
 */
export const alt = `${siteName} — ${siteTagline}`
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  const logo = await readFile(join(process.cwd(), 'public/brand/logo-horizontal.png'))
  const logoSrc = `data:image/png;base64,${logo.toString('base64')}`

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          background: 'linear-gradient(135deg,#F3F9F8 30%,#CDF0E7)',
          borderBottom: '16px solid #0C8375',
          color: '#101B27',
        }}
      >
        <img src={logoSrc} width={577} height={120} alt={siteName} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <span style={{ fontSize: 54, fontWeight: 600, lineHeight: 1.15, maxWidth: 980 }}>{siteTagline}</span>
          <span style={{ fontSize: 28, color: '#3C4854' }}>Independent, peer-reviewed and open access</span>
        </div>
      </div>
    ),
    size,
  )
}
