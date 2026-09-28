import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

export function useDrawingConfig() {
  return useQuery({
    queryKey: ['drawing-config'],
    queryFn: async () => {
      const res = await fetch('/api/admin/drawing-config')
      const json = await res.json()
      if (!res.ok || json.error) throw new Error(json.error || 'Failed to fetch drawing config')
      return json.data
    },
  })
}

export function useUpdateAllDrawingConfig() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { parameter: string; value: string; unit?: string; description?: string }[]) => {
      const res = await fetch('/api/admin/drawing-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok || json.error) throw new Error(json.error || 'Failed to update drawing config')
      return json.data
    },
    onSuccess: () => {
      toast.success('Drawing configuration saved successfully')
      queryClient.invalidateQueries({ queryKey: ['drawing-config'] })
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to save drawing configuration. Please try again.')
    },
  })
}
