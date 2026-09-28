'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, LayoutDashboard, Briefcase, Users, Settings } from 'lucide-react'
import { LogoutButton } from '@/components/auth/logout-button'

interface UserProfile {
  full_name: string | null
  role: string | null
}

const getRoleColor = (role: string | null) => {
  switch (role) {
    case 'admin': return 'bg-[#0B2545] text-white'
    case 'estimator': return 'bg-[#16A34A] text-white'
    case 'viewer': return 'bg-[#6B7280] text-white'
    default: return 'bg-slate-500 text-white'
  }
}

export function AppSidebar({ profile }: { profile: UserProfile }) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Jobs', href: '/jobs', icon: Briefcase },
  ]
  
  if (profile.role === 'admin') {
    navItems.push({ name: 'Admin Panel', href: '/admin-dashboard', icon: Settings })
  }

  return (
    <>
      {/* Mobile Header & Hamburger */}
      <div className="md:hidden flex items-center justify-between bg-[#0B2545] p-4 text-white">
        <h1 className="text-xl font-bold tracking-tight">UNIQUE CRANES</h1>
        <button onClick={() => setIsOpen(!isOpen)} className="p-2 focus:outline-none">
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Content */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-white border-r border-slate-200 transition-transform duration-300 ease-in-out md:static md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="hidden md:block p-6">
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#0B2545' }}>
            UNIQUE CRANES
          </h1>
        </div>
        
        <nav className="flex-1 space-y-1 px-4 py-4 md:py-0 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-[#0B2545] text-white' 
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <item.icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                {item.name}
              </Link>
            )
          })}
        </nav>
        
        <div className="mt-auto p-4 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center space-x-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-[#0B2545] flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-white">
                {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'}
              </span>
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-slate-900 truncate">
                {profile.full_name || 'User'}
              </p>
              <div className="mt-1">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getRoleColor(profile.role)}`}>
                  {profile.role || 'viewer'}
                </span>
              </div>
            </div>
          </div>
          <LogoutButton />
        </div>
      </aside>
    </>
  )
}
