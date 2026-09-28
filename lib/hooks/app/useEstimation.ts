import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { EstimationResult } from '@/lib/engines/estimation'

export function useEstimation(jobId: string) {
  return useQuery({
    queryKey: ['estimation', jobId],
    queryFn: async () => {
      const res = await fetch(`/api/jobs/${jobId}/estimation/calculate`)
      if (!res.ok) throw new Error('Failed to fetch estimation')
      const json = await res.json()
      return { data: json.data as EstimationResult | null, versions: json.versions || [] }
    }
  })
}

export function useCalculateEstimation(jobId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/jobs/${jobId}/estimation/calculate`, {
        method: 'POST'
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Calculation failed')
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimation', jobId] })
      queryClient.invalidateQueries({ queryKey: ['job', jobId] })
    }
  })
}

export function useSaveOverrides(jobId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<EstimationResult>) => {
      const res = await fetch(`/api/jobs/${jobId}/estimation/overrides`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to save overrides')
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimation', jobId] })
    }
  })
}
