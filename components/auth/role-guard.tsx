'use client'

import { useEffect, useState } from 'react'

export function RoleGuard({ 
  children, 
  allowedRoles, 
  fallback = null 
}: { 
  children: React.ReactNode
  allowedRoles: string[]
  fallback?: React.ReactNode 
}) {
  const [role, setRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => {
        if (!res.ok) throw new Error('Unauthorized')
        return res.json()
      })
      .then(data => {
        setRole(data.role)
        setLoading(false)
      })
      .catch(() => {
        setRole(null)
        setLoading(false)
      })
  }, [])

  if (loading) return null

  if (role && allowedRoles.includes(role)) {
    return <>{children}</>
  }

  return <>{fallback}</>
}
