import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export function useClients(search?: string) {
  return useQuery({
    queryKey: ['clients', search],
    queryFn: async () => {
      const url = new URL('/api/clients', window.location.origin)
      if (search) url.searchParams.set('search', search)
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch clients')
      const data = await res.json()
      return data.data
    }
  })
}

export function useClient(id: string) {
  return useQuery({
    queryKey: ['clients', id],
    queryFn: async () => {
      const res = await fetch(`/api/clients/${id}`)
      if (!res.ok) throw new Error('Failed to fetch client')
      const data = await res.json()
      return data.data
    },
    enabled: !!id
  })
}

export function useCreateClient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (client: { name?: string, company: string, email: string, phone: string, address?: string }) => {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(client)
      })
      if (!res.ok) throw new Error('Failed to create client')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    }
  })
}

export function useUpdateClient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string, data: any }) => {
      const res = await fetch(`/api/clients/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) throw new Error('Failed to update client')
      return res.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      queryClient.invalidateQueries({ queryKey: ['clients', variables.id] })
    }
  })
}

export function useDeleteClient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/clients/${id}`, {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error('Failed to delete client')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    }
  })
}
