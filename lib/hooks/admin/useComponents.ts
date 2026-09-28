import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

export function useComponents(category?: string) {
  return useQuery({
    queryKey: ['components', category],
    queryFn: async () => {
      const url = category ? `/api/admin/components?category=${category}` : '/api/admin/components'
      const res = await fetch(url)
      const json = await res.json()
      if (!res.ok || json.error) throw new Error(json.error || 'Failed to fetch components')
      return json.data
    },
  })
}

export function useCreateComponent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/admin/components', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok || json.error) throw new Error(json.error || 'Failed to create component')
      return json.data
    },
    onSuccess: () => {
      toast.success('Component created successfully')
      queryClient.invalidateQueries({ queryKey: ['components'] })
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to create component. Please try again.')
    },
  })
}

export function useUpdateComponent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/admin/components/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok || json.error) throw new Error(json.error || 'Failed to update component')
      return json.data
    },
    onSuccess: () => {
      toast.success('Component updated successfully')
      queryClient.invalidateQueries({ queryKey: ['components'] })
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update component. Please try again.')
    },
  })
}

export function useToggleComponent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const res = await fetch(`/api/admin/components/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active }),
      })
      const json = await res.json()
      if (!res.ok || json.error) throw new Error(json.error || 'Failed to toggle component status')
      return json.data
    },
    onSuccess: () => {
      toast.success('Component status updated')
      queryClient.invalidateQueries({ queryKey: ['components'] })
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update component status.')
    },
  })
}

export function useDeleteComponent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/components/${id}`, {
        method: 'DELETE',
      })
      const json = await res.json()
      if (!res.ok || json.error) throw new Error(json.error || 'Failed to delete component')
      return json.data
    },
    onSuccess: () => {
      toast.success('Component deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['components'] })
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete component.')
    },
  })
}

export function useInlineUpdatePrice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, unit_price }: { id: string; unit_price: number }) => {
      const res = await fetch(`/api/admin/components/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unit_price }),
      })
      const json = await res.json()
      if (!res.ok || json.error) throw new Error(json.error || 'Failed to update price')
      return json.data
    },
    onMutate: async ({ id, unit_price }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['components'] })
      const previousComponents = queryClient.getQueryData(['components'])
      queryClient.setQueriesData({ queryKey: ['components'] }, (old: any) => {
        if (!old) return old
        return old.map((c: any) => (c.id === id ? { ...c, unit_price } : c))
      })
      return { previousComponents }
    },
    onSuccess: () => {
      toast.success('Price updated successfully')
    },
    onError: (err: any, variables, context) => {
      toast.error(err.message || 'Failed to update price.')
      if (context?.previousComponents) {
        queryClient.setQueriesData({ queryKey: ['components'] }, context.previousComponents)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['components'] })
    },
  })
}
