import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { PrivyProvider } from '@/components/PrivyProvider'
import { TopNav } from '@/components/TopNav'
import { ClientLayout } from '@/components/ClientLayout'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Maiat - Trust Layer for Agentic Commerce',
  description: 'Review and rate AI agents and DeFi protocols with on-chain verification',
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
      <body className={`${inter.className} bg-[#0a0a0b]`}>
        <PrivyProvider>
          <div className="min-h-screen flex flex-col">
            <TopNav />
            <ClientLayout>
              {children}
            </ClientLayout>
          </div>
        </PrivyProvider>
      </body>
    </html>
  )
}
