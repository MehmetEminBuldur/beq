import './globals.css'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'BeQ - AI-powered Life Management',
  description: 'Efficient life management through intelligent design',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}