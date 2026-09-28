import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await fetch('/api/admin/users')
      const json = await res.json()
      if (!res.ok || json.error) throw new Error(json.error || 'Failed to fetch users')
      return json.data
    },
  })
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { id: string; role: string }) => {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok || json.error) throw new Error(json.error || 'Failed to update role')
      return json.data
    },
    onSuccess: () => {
      toast.success('User role updated successfully')
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update user role.')
    },
  })
}

export function useInviteUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { email: string; role: string }) => {
      const res = await fetch('/api/admin/invite-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok || json.error) throw new Error(json.error || 'Failed to invite user')
      return json.data
    },
    onSuccess: () => {
      toast.success('User invited successfully')
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to invite user.')
    },
  })
}
