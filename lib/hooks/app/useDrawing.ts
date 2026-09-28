import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

export function useDrawing(jobId: string) {
  return useQuery({
    queryKey: ['drawing', jobId],
    queryFn: async () => {
      const res = await fetch(`/api/jobs/${jobId}/drawing/generate`)
      if (!res.ok) throw new Error(await res.text())
      return res.json()
    }
  })
}

export function useGenerateDrawing(jobId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/jobs/${jobId}/drawing/generate`, {
        method: 'POST'
      })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'An unknown error occurred' }))
        throw new Error(errorData.error || errorData.message || 'Failed to generate drawing')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drawing', jobId] })
      toast.success('Drawing generated successfully!')
    },
    onError: (err: any) => {
      toast.error(err.message)
    }
  })
}

export function useDrawingPDF(jobId: string) {
  return () => {
    window.open(`/api/jobs/${jobId}/drawing/pdf`, '_blank')
  }
}
