'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Rocket,
  Wallet,
  TrendingUp,
  Activity,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store'

const mainNavigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'DEXScreener', href: '/dex', icon: TrendingUp },
  { name: 'Nad.fun', href: '/nadfun', icon: Rocket },
  { name: 'MonArch', href: '/monarch', icon: Wallet },
]

const secondaryNavigation = [
  { name: 'Activity', href: '/activity', icon: Activity },
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Help', href: '/help', icon: HelpCircle },
]

export function Sidebar() {
  const pathname = usePathname()
  const { sidebarOpen, setSidebarOpen } = useAppStore()

  // Auto-collapse sidebar on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [setSidebarOpen])

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] border-r border-dark-border bg-dark-bg transition-all duration-300',
          'hidden md:block',
          sidebarOpen ? 'w-64' : 'w-16'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Toggle Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="absolute -right-3 top-6 flex h-6 w-6 items-center justify-center rounded-full border border-dark-border bg-dark-bg-secondary text-text-muted hover:text-white transition-colors z-50"
          >
            {sidebarOpen ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>

          {/* Main Navigation */}
          <nav className="flex-1 space-y-1 px-2 py-4">
            {mainNavigation.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== '/' && pathname.startsWith(item.href))

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-monad-purple/10 text-monad-purple'
                      : 'text-text-secondary hover:bg-dark-bg-tertiary hover:text-white'
                  )}
                  title={!sidebarOpen ? item.name : undefined}
                >
                  <item.icon className={cn('h-5 w-5 flex-shrink-0', isActive && 'text-monad-purple')} />
                  {sidebarOpen && <span>{item.name}</span>}
                </Link>
              )
            })}
          </nav>

          {/* Secondary Navigation */}
          <div className="border-t border-dark-border px-2 py-4">
            {secondaryNavigation.map((item) => {
              const isActive = pathname === item.href

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-monad-purple/10 text-monad-purple'
                      : 'text-text-secondary hover:bg-dark-bg-tertiary hover:text-white'
                  )}
                  title={!sidebarOpen ? item.name : undefined}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {sidebarOpen && <span>{item.name}</span>}
                </Link>
              )
            })}
          </div>

          {/* Network Status */}
          {sidebarOpen && (
            <div className="border-t border-dark-border p-4">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-success opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-status-success"></span>
                </span>
                <span className="text-xs text-text-muted">Monad Mainnet</span>
              </div>
              <div className="mt-2 text-xs text-text-muted">
                Chain ID: 143
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
