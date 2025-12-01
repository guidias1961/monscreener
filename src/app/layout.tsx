import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Web3Provider } from '@/providers/Web3Provider'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'MonScreener - Monad Token Dashboard',
  description: 'Enterprise-grade dashboard for Monad tokens. Track DEXScreener tokens, nad.fun launches, and wallet analytics.',
  keywords: ['Monad', 'cryptocurrency', 'token', 'DEXScreener', 'nad.fun', 'blockchain', 'dashboard'],
  authors: [{ name: 'MonScreener' }],
  openGraph: {
    title: 'MonScreener - Monad Token Dashboard',
    description: 'Enterprise-grade dashboard for Monad tokens',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <Web3Provider>
          <div className="min-h-screen bg-dark-bg">
            <Header />
            <div className="flex">
              <Sidebar />
              {/* Main content area - responsive margin based on sidebar */}
              <main className="flex-1 ml-0 md:ml-16 lg:ml-64 min-h-[calc(100vh-4rem)] p-4 md:p-6 transition-all duration-300">
                {children}
              </main>
            </div>
          </div>
        </Web3Provider>
      </body>
    </html>
  )
}
