import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import MaintenanceCheck from '@/components/MaintenanceCheck'

export const metadata: Metadata = {
  title: 'LineLogic - Queue Testing & Optimization',
  description: 'Advanced Ticketmaster queue analysis and optimization platform',
  generator: 'v0.dev',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <MaintenanceCheck enabled={true} />
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
