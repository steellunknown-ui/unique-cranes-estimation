import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export function useExtraction(jobId: string) {
  return useQuery({
    queryKey: ['extractions', jobId],
    queryFn: async () => {
      const res = await fetch(`/api/jobs/${jobId}/extractions`)
      if (!res.ok) throw new Error('Failed to fetch extractions')
      const json = await res.json()
      return json.data
    },
    enabled: !!jobId
  })
}

export function useUploadAndExtract() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      jobId, 
      file,
      onProgress
    }: { 
      jobId: string, 
      file: File,
      onProgress?: (step: number) => void
    }) => {
      
      // Step 1: Upload
      onProgress?.(1)
      const formData = new FormData()
      formData.append('file', file)

      const uploadRes = await fetch(`/api/jobs/${jobId}/upload`, {
        method: 'POST',
        body: formData
      })

      if (!uploadRes.ok) {
        throw new Error('Upload failed')
      }
      const uploadData = await uploadRes.json()

      // Step 2-4 handled mostly on the server but we mock the progress feeling
      onProgress?.(2) // "AI is reading..."
      await new Promise(r => setTimeout(r, 1500))
      
      onProgress?.(3) // "Extracting crane specifications..."
      const extractRes = await fetch(`/api/jobs/${jobId}/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storage_path: uploadData.data.storage_path })
      })

      if (!extractRes.ok) {
        const errorData = await extractRes.json()
        throw new Error(errorData.error || 'AI extraction failed')
      }
      
      onProgress?.(4) // "Validating..."
      await new Promise(r => setTimeout(r, 800))
      
      onProgress?.(5) // "Complete"
      return await extractRes.json()
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      queryClient.invalidateQueries({ queryKey: ['requirements', variables.jobId] })
      queryClient.invalidateQueries({ queryKey: ['extractions', variables.jobId] })
    }
  })
}
