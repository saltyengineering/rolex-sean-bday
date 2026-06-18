import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Rolex Fund',
  description: 'Tracking my Submariner savings via QQQ',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
