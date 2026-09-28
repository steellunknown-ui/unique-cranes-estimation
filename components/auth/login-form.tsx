'use client'

import { useState } from 'react'
import { Eye, EyeOff, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    
    if (error) {
      setError('Invalid email or password. Please try again.')
      setLoading(false)
      return
    }
    
    router.push('/dashboard')
  }

  return (
    <div className="w-full max-w-md bg-white border border-slate-300 shadow-sm flex flex-col">
      {/* Card Header */}
      <div className="bg-[#0B2545] p-6 border-b-2 border-[#0B2545]">
        <h1 className="font-bold text-3xl text-white tracking-tight">UNIQUE CRANES</h1>
        <p className="font-bold text-xs uppercase text-slate-400 mt-2 tracking-widest">
          Estimation & Quotation System
        </p>
      </div>

      {/* Card Body */}
      <div className="p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-100 text-red-900 text-sm font-medium border border-red-200">
              {error}
            </div>
          )}
          
          {/* Email Field */}
          <div className="space-y-2">
            <label className="block font-bold text-xs uppercase text-slate-600 tracking-wider" htmlFor="email">
              Email Address
            </label>
            <div className="relative flex items-center border border-slate-300 bg-white transition-all focus-within:border-[#0B2545] focus-within:border-2">
              <Mail className="absolute left-3 text-slate-500 w-5 h-5" />
              <input 
                className="w-full pl-10 pr-4 py-3 bg-transparent border-none focus:ring-0 font-medium text-slate-900 placeholder-slate-400 outline-none" 
                id="email" 
                name="email" 
                placeholder="user@uniquecranes.com" 
                required 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label className="block font-bold text-xs uppercase text-slate-600 tracking-wider" htmlFor="password">
              Password
            </label>
            <div className="relative flex items-center border border-slate-300 bg-white transition-all group focus-within:border-[#0B2545] focus-within:border-2">
              <Lock className="absolute left-3 text-slate-500 w-5 h-5" />
              <input 
                className="w-full pl-10 pr-12 py-3 bg-transparent border-none focus:ring-0 font-medium text-slate-900 placeholder-slate-400 outline-none" 
                id="password" 
                name="password" 
                placeholder="••••••••" 
                required 
                type={showPassword ? 'text' : 'password'} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button 
                className="absolute right-3 text-slate-500 hover:text-[#0B2545] transition-colors focus:outline-none" 
                onClick={() => setShowPassword(!showPassword)} 
                type="button"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-4">
            <button 
              className="w-full bg-[#0B2545] text-white font-semibold text-lg py-3 hover:bg-[#001026] transition-colors focus:outline-none focus:ring-2 focus:ring-[#0B2545] focus:ring-offset-2 flex justify-center items-center gap-2 disabled:opacity-50" 
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Signing In...</>
              ) : (
                <>Sign In <ArrowRight className="w-5 h-5" /></>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
