import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { PrivyProvider } from '@/components/PrivyProvider'
import { ScarabWidget } from '@/components/ScarabWidget'
import { TopNav } from '@/components/TopNav'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Maat - Trust Layer for Agentic Commerce',
  description: 'Review and rate projects across OpenClaw skills, AI agents, memecoins, and DeFi',
  other: {
    'base:app_id': '698f75b47ca07f5750bbd889',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <PrivyProvider>
          <TopNav />
          {children}
          <ScarabWidget />
        </PrivyProvider>
      </body>
    </html>
  )
}
