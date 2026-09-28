'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Package, FunctionSquare, GitBranch, Settings, Ruler, Users, ArrowLeft, Menu, X } from 'lucide-react'

export function AdminSidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const navItems = [
    { name: 'Component Catalog', href: '/admin/components', icon: Package },
    { name: 'Formulas', href: '/admin/formulas', icon: FunctionSquare },
    { name: 'Rules Engine', href: '/admin/rules', icon: GitBranch },
    { name: 'System Config', href: '/admin/config', icon: Settings },
    { name: 'Drawing Config', href: '/admin/drawing-config', icon: Ruler },
    { name: 'Users', href: '/admin/users', icon: Users },
  ]

  return (
    <>
      {/* Mobile Header & Hamburger */}
      <div className="md:hidden flex items-center justify-between bg-[#0B2545] p-4 text-white">
        <div className="flex flex-col">
          <span className="font-semibold text-white uppercase tracking-widest text-lg">UNIQUE CRANES</span>
          <span className="text-[10px] text-slate-400 opacity-60 font-bold">Admin Panel</span>
        </div>
        <button onClick={() => setIsOpen(!isOpen)} className="p-2 focus:outline-none text-white">
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
        fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-[#0B2545] border-r border-slate-700 transition-transform duration-300 ease-in-out md:static md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="hidden md:flex flex-col p-6 space-y-4">
          <div className="flex flex-col">
            <span className="font-semibold text-white uppercase tracking-widest text-xl">UNIQUE CRANES</span>
            <span className="text-[10px] text-slate-400 opacity-80 font-bold">Admin ERP v2.4</span>
          </div>
          <div className="inline-flex px-3 py-1 bg-[#E67E22] text-white text-[10px] font-black uppercase tracking-tighter w-fit rounded-sm shadow-sm">
            ADMIN PANEL
          </div>
        </div>
        
        <nav className="flex-1 space-y-1 px-4 py-4 md:py-0 overflow-y-auto mt-2">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href)
            const Icon = item.icon
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center px-4 py-3 transition-all duration-150 group rounded-sm ${
                  isActive 
                    ? 'bg-white/10 text-white border-l-4 border-blue-400 font-bold' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-white border-l-4 border-transparent font-medium'
                }`}
              >
                <Icon className={`mr-3 w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                <span className="text-xs uppercase tracking-wider">{item.name}</span>
              </Link>
            )
          })}
        </nav>
        
        <div className="p-4 border-t border-slate-700/50 space-y-1 mt-auto bg-[#0B2545]">
          <Link
            href="/dashboard"
            className="flex items-center px-4 py-3 text-slate-400 hover:bg-white/5 hover:text-white transition-all duration-150 font-medium rounded-sm border-l-4 border-transparent group"
          >
            <ArrowLeft className="mr-3 w-5 h-5 text-slate-400 group-hover:text-white" />
            <span className="text-xs uppercase tracking-wider">Back to App</span>
          </Link>
        </div>
      </aside>
    </>
  )
}
