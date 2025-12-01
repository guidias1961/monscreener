'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { ConnectKitButton } from 'connectkit'
import { Menu, X, Search, ExternalLink, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store'

// Twitter/X Icon Component
function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

const navigation = [
  { name: 'DEXScreener', href: '/dex', description: 'Monad tokens on DEXScreener' },
  { name: 'Nad.fun', href: '/nadfun', description: 'Tokens from nad.fun launchpad' },
  { name: 'MonArch', href: '/monarch', description: 'Wallet analytics' },
]

const socialLinks = [
  {
    name: 'Twitter',
    href: 'https://x.com/MonScreener',
    icon: TwitterIcon,
  },
  {
    name: 'GitBook',
    href: 'https://monscreener.gitbook.io/monscreener-docs/',
    icon: BookOpen,
  },
]

export function Header() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { searchQuery, setSearchQuery } = useAppStore()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-dark-border bg-dark-bg/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-[1800px] items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative h-10 w-10 rounded-lg overflow-hidden">
              <Image
                src="/logo.png"
                alt="MonScreener Logo"
                fill
                className="object-cover"
                priority
              />
            </div>
            <span className="text-xl font-bold text-white">
              Mon<span className="text-gradient-monad">Screener</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:gap-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200',
                  pathname === item.href
                    ? 'bg-monad-purple/10 text-monad-purple'
                    : 'text-text-secondary hover:bg-dark-bg-tertiary hover:text-white'
                )}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Search Bar */}
        <div className="hidden flex-1 max-w-md mx-8 lg:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search tokens, addresses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-base pl-10 py-2 text-sm"
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Social Links */}
          <div className="hidden lg:flex items-center gap-1">
            {socialLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center h-9 w-9 rounded-lg text-text-muted hover:text-monad-purple hover:bg-dark-bg-tertiary transition-all duration-200"
                title={link.name}
              >
                <link.icon className="h-5 w-5" />
              </a>
            ))}
            <div className="w-px h-6 bg-dark-border mx-2" />
          </div>

          {/* External Links */}
          <div className="hidden lg:flex items-center gap-2">
            <a
              href="https://monadvision.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-text-muted hover:text-monad-purple transition-colors"
            >
              Explorer <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          {/* Connect Wallet Button */}
          <ConnectKitButton.Custom>
            {({ isConnected, isConnecting, show, address, ensName }) => (
              <button
                onClick={show}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200',
                  isConnected
                    ? 'bg-dark-bg-tertiary border border-dark-border hover:border-monad-purple/50 text-white'
                    : 'btn-primary'
                )}
              >
                {isConnecting ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Connecting...
                  </span>
                ) : isConnected ? (
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-status-success" />
                    {ensName || `${address?.slice(0, 6)}...${address?.slice(-4)}`}
                  </span>
                ) : (
                  'Connect Wallet'
                )}
              </button>
            )}
          </ConnectKitButton.Custom>

          {/* Mobile menu button */}
          <button
            type="button"
            className="md:hidden rounded-lg p-2 text-text-secondary hover:bg-dark-bg-tertiary"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-dark-border bg-dark-bg">
          <div className="space-y-1 px-4 py-3">
            {/* Mobile Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search tokens..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-base pl-10 py-2 text-sm"
              />
            </div>

            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'block rounded-lg px-4 py-3 text-sm font-medium transition-colors',
                  pathname === item.href
                    ? 'bg-monad-purple/10 text-monad-purple'
                    : 'text-text-secondary hover:bg-dark-bg-tertiary hover:text-white'
                )}
              >
                <span className="block">{item.name}</span>
                <span className="block text-xs text-text-muted mt-0.5">{item.description}</span>
              </Link>
            ))}

            {/* Mobile Social Links */}
            <div className="pt-4 mt-4 border-t border-dark-border">
              <div className="flex items-center gap-2">
                {socialLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm text-text-secondary hover:text-monad-purple hover:bg-dark-bg-tertiary transition-all"
                  >
                    <link.icon className="h-4 w-4" />
                    {link.name}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
