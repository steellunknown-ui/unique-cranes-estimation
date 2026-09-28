import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

export function useDocuments(jobId: string) {
  return useQuery({
    queryKey: ['documents', jobId],
    queryFn: async () => {
      const res = await fetch(`/api/jobs/${jobId}/documents`)
      if (!res.ok) throw new Error('Failed to fetch documents')
      return res.json()
    }
  })
}

export function useGenerateQuotation(jobId: string, jobRef: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ preparedBy, includeGST }: { preparedBy: string, includeGST: boolean }) => {
      const res = await fetch(`/api/jobs/${jobId}/pdf/quotation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preparedBy, includeGST })
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to generate quotation')
      }
      return res.blob()
    },
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${jobRef}-Quotation.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      queryClient.invalidateQueries({ queryKey: ['documents', jobId] })
      toast.success('Quotation generated successfully')
    },
    onError: (err: any) => {
      toast.error(err.message)
    }
  })
}

export function useGenerateJobCard(jobId: string, jobRef: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ preparedBy }: { preparedBy: string }) => {
      const res = await fetch(`/api/jobs/${jobId}/pdf/jobcard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preparedBy })
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to generate job card')
      }
      return res.blob()
    },
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${jobRef}-JobCard.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      queryClient.invalidateQueries({ queryKey: ['documents', jobId] })
      toast.success('Job Card generated successfully')
    },
    onError: (err: any) => {
      toast.error(err.message)
    }
  })
}

export function useDownloadMissingPDF(jobId: string, jobRef: string) {
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/jobs/${jobId}/pdf/missing`, {
        method: 'POST',
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to generate missing info PDF')
      }
      return res.blob()
    },
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${jobRef}-MissingInfo.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('Missing Info PDF downloaded')
    },
    onError: (err: any) => {
      toast.error(err.message)
    }
  })
}
