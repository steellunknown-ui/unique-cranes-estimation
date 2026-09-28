import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

export function useFormulas() {
  return useQuery({
    queryKey: ['formulas'],
    queryFn: async () => {
      const res = await fetch('/api/admin/formulas')
      const json = await res.json()
      if (!res.ok || json.error) throw new Error(json.error || 'Failed to fetch formulas')
      return json.data
    },
  })
}

export function useCreateFormula() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/admin/formulas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok || json.error) throw new Error(json.error || 'Failed to create formula')
      return json.data
    },
    onSuccess: () => {
      toast.success('Formula created successfully')
      queryClient.invalidateQueries({ queryKey: ['formulas'] })
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to create formula. Please try again.')
    },
  })
}

export function useUpdateFormula() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/admin/formulas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok || json.error) throw new Error(json.error || 'Failed to update formula')
      return json.data
    },
    onSuccess: () => {
      toast.success('Formula updated successfully')
      queryClient.invalidateQueries({ queryKey: ['formulas'] })
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update formula. Please try again.')
    },
  })
}

export function useDeleteFormula() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/formulas/${id}`, {
        method: 'DELETE',
      })
      const json = await res.json()
      if (!res.ok || json.error) throw new Error(json.error || 'Failed to delete formula')
      return json.data
    },
    onSuccess: () => {
      toast.success('Formula deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['formulas'] })
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete formula.')
    },
  })
}
