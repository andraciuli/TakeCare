import type { Metadata } from 'next'
import { Inter, Quicksand } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/lib/AuthContext'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter'
})

const quicksand = Quicksand({ 
  subsets: ['latin'],
  variable: '--font-quicksand'
})

export const metadata: Metadata = {
  title: 'TakeCare - Pet Adoption',
  description: 'Find your perfect companion from local shelters',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${quicksand.variable} ${inter.className}`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
