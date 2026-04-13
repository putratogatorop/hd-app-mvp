import type { Metadata, Viewport } from 'next'
import { Fraunces, Instrument_Sans, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  axes: ['opsz', 'SOFT', 'WONK'],
  display: 'swap',
})

const instrumentSans = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Häagen-Dazs | Loyalty & Order',
  description: 'Order your favourite Häagen-Dazs and earn loyalty rewards',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Häagen-Dazs',
  },
}

export const viewport: Viewport = {
  themeColor: '#650A30',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="id"
      className={`light ${fraunces.variable} ${instrumentSans.variable} ${mono.variable}`}
      style={{ colorScheme: 'light' }}
    >
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
