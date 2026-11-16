import type { Metadata } from 'next'
import './globals.css'
import MuiProvider from '@/components/providers/MuiProvider'
import { SupabaseProvider } from '@/components/providers/SupabaseProvider'

export const metadata: Metadata = {
  title: 'Pickspot',
  description: 'Book appointments with ease',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <MuiProvider>
          <SupabaseProvider>{children}</SupabaseProvider>
        </MuiProvider>
      </body>
    </html>
  )
}
