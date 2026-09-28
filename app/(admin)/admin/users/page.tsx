'use client'

import { useState } from 'react'
import { useUsers, useUpdateUserRole, useInviteUser } from '@/lib/hooks/admin/useUsers'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, UserCog, Mail } from 'lucide-react'

export default function UsersManagement() {
  const { data: users, isLoading, isError, refetch } = useUsers()
  const updateRoleMutation = useUpdateUserRole()
  const inviteMutation = useInviteUser()

  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('estimator')

  const handleInvite = () => {
    if (!inviteEmail) return
    inviteMutation.mutate({ email: inviteEmail, role: inviteRole }, {
      onSuccess: () => {
        setIsInviteOpen(false)
        setInviteEmail('')
      }
    })
  }

  const roleColors: Record<string, string> = {
    admin: 'bg-[#0B2545] text-white',
    estimator: 'bg-[#16A34A] text-white',
    viewer: 'bg-[#6B7280] text-white',
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F9F9FF]">
      <header className="w-full sticky top-0 z-40 flex justify-between items-center h-16 px-8 bg-white border-b border-slate-200">
        <h1 className="font-semibold text-2xl text-[#0B2545]">User Management</h1>
        <button 
          onClick={() => setIsInviteOpen(true)}
          className="bg-[#0B2545] text-white px-6 py-2.5 font-bold uppercase text-[13px] tracking-wider rounded-sm hover:opacity-90 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Invite User
        </button>
      </header>

      <div className="p-8 flex-1 overflow-y-auto">
        <div className="bg-white border border-slate-300 shadow-sm rounded-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0B2545] text-white border-b border-slate-300">
                <th className="p-4 text-[12px] font-bold uppercase tracking-widest">User ID / Email</th>
                <th className="p-4 text-[12px] font-bold uppercase tracking-widest">Role</th>
                <th className="p-4 text-[12px] font-bold uppercase tracking-widest">Joined At</th>
                <th className="p-4 text-[12px] font-bold uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="p-4"><Skeleton className="h-5 w-48" /></td>
                    <td className="p-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
                    <td className="p-4"><Skeleton className="h-5 w-32" /></td>
                    <td className="p-4 text-right"><Skeleton className="h-8 w-32 ml-auto" /></td>
                  </tr>
                ))
              ) : isError ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-red-500">
                    Failed to load users. <button onClick={() => refetch()} className="underline">Retry</button>
                  </td>
                </tr>
              ) : (
                users?.map((user: any) => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-[#0B2545]">{user.email || user.id}</span>
                        <span className="text-xs text-slate-500 font-mono">{user.id}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-full ${roleColors[user.role] || 'bg-slate-200 text-slate-600'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-slate-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <UserCog className="w-4 h-4 text-slate-400" />
                        <select 
                          className="border border-slate-300 rounded-sm p-1 text-xs font-bold uppercase focus:ring-1 focus:ring-[#0B2545] outline-none"
                          value={user.role}
                          onChange={(e) => updateRoleMutation.mutate({ id: user.id, role: e.target.value })}
                          disabled={updateRoleMutation.isPending}
                        >
                          <option value="admin">Admin</option>
                          <option value="estimator">Estimator</option>
                          <option value="viewer">Viewer</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isInviteOpen && (
        <div className="fixed inset-0 bg-[#0B2545]/40 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-sm shadow-2xl w-[400px] border border-slate-300">
            <h2 className="text-xl font-bold text-[#0B2545] mb-4 uppercase tracking-wider">Invite New User</h2>
            
            <div className="space-y-4 mb-6">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#0B2545] uppercase">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    className="w-full border border-slate-300 p-2 pl-9 text-sm focus:border-[#0B2545] focus:ring-1 focus:ring-[#0B2545] outline-none rounded-sm"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="user@uniquecranes.com"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#0B2545] uppercase">Assign Role</label>
                <select 
                  className="w-full border border-slate-300 p-2 text-sm focus:border-[#0B2545] focus:ring-1 focus:ring-[#0B2545] outline-none rounded-sm font-bold uppercase"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                >
                  <option value="estimator">Estimator (Default)</option>
                  <option value="admin">Admin</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setIsInviteOpen(false)}
                className="flex-1 py-2 border border-slate-300 font-bold text-[#0B2545] uppercase text-[12px] tracking-wider hover:bg-slate-50 transition-colors rounded-sm"
              >
                Cancel
              </button>
              <button 
                onClick={handleInvite}
                disabled={inviteMutation.isPending || !inviteEmail}
                className="flex-1 py-2 bg-[#E67E22] text-white font-bold uppercase text-[12px] tracking-wider hover:brightness-110 transition-all shadow-sm rounded-sm disabled:opacity-50"
              >
                {inviteMutation.isPending ? 'Sending...' : 'Send Invite'}
              </button>
            </div>
            {/* Note about Service Role Key */}
            <p className="mt-4 text-[10px] text-slate-500 text-center">
              Note: Inviting users requires SUPABASE_SERVICE_ROLE_KEY to be configured in your .env.local file.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
