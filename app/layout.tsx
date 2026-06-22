import './globals.css'
import type { Metadata, Viewport } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://carelinkaustralia.com.au'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Carelink — Aged Care Staffing Australia',
    template: '%s | Carelink',
  },
  description: 'Carelink helps Australian aged-care facilities fill shifts with document-checked RN, EN, and PCA workers.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Carelink — Aged Care Staffing Australia',
    description: 'Compliance-ready aged-care staffing for facilities and flexible shifts for healthcare workers.',
    url: '/',
    siteName: 'Carelink',
    type: 'website',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Carelink',
  },
}

export const viewport: Viewport = {
  themeColor: '#0d2b5e',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
