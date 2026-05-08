import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond, Jost, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { LanguageCurrencyProvider } from '@/components/LanguageCurrencySwitcher'

const cormorantGaramond = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  display: 'swap',
})

const jost = Jost({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600'],
  display: 'swap',
})

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500'],
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
      className={`light ${cormorantGaramond.variable} ${jost.variable} ${mono.variable}`}
      style={{ colorScheme: 'light' }}
    >
      <body className="font-sans antialiased">
        <LanguageCurrencyProvider>{children}</LanguageCurrencyProvider>
      </body>
    </html>
  )
}
