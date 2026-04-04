import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '../globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'HD Analytics — Haagen-Dazs Indonesia',
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children
}
