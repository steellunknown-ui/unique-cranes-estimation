import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

export function useSystemConfig() {
  return useQuery({
    queryKey: ['system-config'],
    queryFn: async () => {
      const res = await fetch('/api/admin/config')
      const json = await res.json()
      if (!res.ok || json.error) throw new Error(json.error || 'Failed to fetch config')
      return json.data
    },
  })
}

export function useUpdateConfig() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { key: string; value: string; description?: string }) => {
      const res = await fetch('/api/admin/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok || json.error) throw new Error(json.error || 'Failed to update config')
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-config'] })
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update config.')
    },
  })
}
