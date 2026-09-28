import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export function useRequirements(jobId: string) {
  return useQuery({
    queryKey: ['requirements', jobId],
    queryFn: async () => {
      const res = await fetch(`/api/jobs/${jobId}/requirements`)
      if (!res.ok) throw new Error('Failed to fetch requirements')
      const data = await res.json()
      return data.data
    },
    enabled: !!jobId
  })
}

export function useUpdateRequirements() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ jobId, data }: { jobId: string, data: any }) => {
      const res = await fetch(`/api/jobs/${jobId}/requirements`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) throw new Error('Failed to update requirements')
      return res.json()
    },
    // We don't invalidate on success aggressively because we use optimistic/debounced updates.
    // Instead we can just update the cache directly or invalidate in the background.
    onSuccess: (data, variables) => {
      queryClient.setQueryData(['requirements', variables.jobId], data.data)
    }
  })
}

export function useMissingFields(reqs: any) {
  if (!reqs) return { blocking: [], warnings: [], info: [], percentComplete: 0, isReady: false }

  const blocking: { field: string, message: string }[] = []
  const warnings: { field: string, message: string }[] = []
  const info: { field: string, message: string }[] = []
  let totalFields = 0
  let filledFields = 0

  const track = (value: any, isCritical: boolean = false, warningMsg?: string, infoMsg?: string, fieldName: string = '') => {
    totalFields++
    const filled = value !== null && value !== undefined && value !== ''
    if (filled) {
      filledFields++
    } else {
      if (isCritical) blocking.push({ field: fieldName, message: 'Required for estimation' })
      else if (warningMsg) warnings.push({ field: fieldName, message: warningMsg })
      else if (infoMsg) info.push({ field: fieldName, message: infoMsg })
    }
  }

  // Required blocking fields for estimation
  track(reqs.crane_type, true, undefined, undefined, 'Crane Type')
  track(reqs.mh_capacity, true, undefined, undefined, 'MH Capacity')
  track(reqs.span, true, undefined, undefined, 'Span')
  track(reqs.mh_lift, true, undefined, undefined, 'MH Lift')

  // Warnings (Assumed defaults)
  track(reqs.duty_class, false, 'Assumed M5 per IS:3177', undefined, 'Duty Class')
  track(reqs.ambient_temp, false, 'Assumed 45°C', undefined, 'Ambient Temp')
  track(reqs.rail_size, false, 'Will be determined by engineer', undefined, 'Rail Size')
  
  // Conditional Info (AH)
  if (reqs.ah_capacity !== null && reqs.ah_capacity !== undefined) {
    track(reqs.ah_lift, false, undefined, 'AH Lift missing but AH Capacity specified', 'AH Lift')
    track(reqs.ah_speed, false, undefined, 'AH Speed missing but AH Capacity specified', 'AH Speed')
  }

  // Speeds
  track(reqs.mh_speed, false, 'Standard speed assumed', undefined, 'MH Speed')
  track(reqs.ct_speed, false, 'Standard speed assumed', undefined, 'CT Speed')
  track(reqs.lt_speed, false, 'Standard speed assumed', undefined, 'LT Speed')

  const percentComplete = totalFields === 0 ? 0 : Math.round((filledFields / totalFields) * 100)
  const isReady = blocking.length === 0

  return { blocking, warnings, info, percentComplete, isReady }
}
