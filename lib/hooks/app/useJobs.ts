import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export function useJobs(filters?: { status?: string, search?: string, client_id?: string }) {
  return useQuery({
    queryKey: ['jobs', filters],
    queryFn: async () => {
      const url = new URL('/api/jobs', window.location.origin)
      if (filters?.status && filters.status !== 'All') url.searchParams.set('status', filters.status)
      if (filters?.search) url.searchParams.set('search', filters.search)
      if (filters?.client_id) url.searchParams.set('client_id', filters.client_id)
      
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch jobs')
      const data = await res.json()
      return data.data
    }
  })
}

export function useJob(id: string) {
  return useQuery({
    queryKey: ['jobs', id],
    queryFn: async () => {
      const res = await fetch(`/api/jobs/${id}`)
      if (!res.ok) throw new Error('Failed to fetch job')
      const data = await res.json()
      return data.data
    },
    enabled: !!id
  })
}

export function useCreateJob() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { client_id: string, source: 'pdf_upload' | 'manual' | 'cloned', cloned_from?: string }) => {
      const res = await fetch('/api/jobs/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error('Failed to create job')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
    }
  })
}

export function useUpdateJobStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const res = await fetch(`/api/jobs/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      if (!res.ok) throw new Error('Failed to update job status')
      return res.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      queryClient.invalidateQueries({ queryKey: ['jobs', variables.id] })
    }
  })
}

export function useDeleteJob() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/jobs/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete job')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
    }
  })
}
