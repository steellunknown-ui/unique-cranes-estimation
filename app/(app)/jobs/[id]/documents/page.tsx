import { createClient } from '@/lib/supabase/server'
import DocumentsClient from './DocumentsClient'
import { detectMissingFields } from '@/lib/engines/validation/missing-fields-detector'
import { redirect } from 'next/navigation'

export default async function DocumentsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const id = resolvedParams.id
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const { data: profile } = await supabase.from('user_profiles').select('full_name').eq('id', user.id).single()
  
  const { data: job } = await supabase.from('jobs').select('ref_number').eq('id', id).single()
  if (!job) return <div>Job not found</div>

  const { data: reqs } = await supabase.from('job_requirements').select('*').eq('job_id', id).maybeSingle()
  
  let missingCount = 0
  let hasReqs = false
  if (reqs) {
    hasReqs = true
    const { data: configData } = await supabase.from('system_config').select('*')
    const config = (configData || []).reduce((acc: any, row: any) => {
      acc[row.key] = row.value
      return acc
    }, {})
    const missing = detectMissingFields(reqs, config)
    missingCount = missing.filter(f => f.severity === 'blocking').length
  }

  return (
    <div className="p-6">
      <DocumentsClient 
        jobId={id} 
        jobRef={job.ref_number}
        preparedBy={profile?.full_name || 'System User'}
        missingCount={missingCount}
        hasReqs={hasReqs}
      />
    </div>
  )
}
