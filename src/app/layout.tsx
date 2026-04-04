import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

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
  themeColor: '#C8102E',
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
    <html lang="id" className="light" style={{ colorScheme: 'light' }}>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}
