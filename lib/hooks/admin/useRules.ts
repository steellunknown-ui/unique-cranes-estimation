import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

export function useRules() {
  return useQuery({
    queryKey: ['rules'],
    queryFn: async () => {
      const res = await fetch('/api/admin/rules')
      const json = await res.json()
      if (!res.ok || json.error) throw new Error(json.error || 'Failed to fetch rules')
      return json.data
    },
  })
}

export function useCreateRule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/admin/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok || json.error) throw new Error(json.error || 'Failed to create rule')
      return json.data
    },
    onSuccess: () => {
      toast.success('Rule created successfully')
      queryClient.invalidateQueries({ queryKey: ['rules'] })
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to create rule.')
    },
  })
}

export function useUpdateRule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/admin/rules/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok || json.error) throw new Error(json.error || 'Failed to update rule')
      return json.data
    },
    onSuccess: () => {
      toast.success('Rule updated successfully')
      queryClient.invalidateQueries({ queryKey: ['rules'] })
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update rule.')
    },
  })
}

export function useDeleteRule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/rules/${id}`, {
        method: 'DELETE',
      })
      const json = await res.json()
      if (!res.ok || json.error) throw new Error(json.error || 'Failed to delete rule')
      return json.data
    },
    onSuccess: () => {
      toast.success('Rule deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['rules'] })
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete rule.')
    },
  })
}

export function useReorderRules() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { id: string; priority: number }[]) => {
      const res = await fetch('/api/admin/rules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok || json.error) throw new Error(json.error || 'Failed to reorder rules')
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rules'] })
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to reorder rules.')
    },
  })
}
