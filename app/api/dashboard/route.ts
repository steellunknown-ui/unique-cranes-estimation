import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Fetch all jobs with estimation value
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('id, ref_number, client_company, status, created_at, job_requirements(crane_type, mh_capacity)')
      .order('created_at', { ascending: false })

    if (error) throw error

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const totalJobs = jobs?.length || 0
    const activeJobs = jobs?.filter(j => j.status === 'active' || j.status === 'review').length || 0
    const inReview = jobs?.filter(j => j.status === 'review').length || 0
    const completedThisMonth = jobs?.filter(j => {
      return j.status === 'completed' && new Date(j.created_at) >= startOfMonth
    }).length || 0
    const draftJobs = jobs?.filter(j => j.status === 'draft').length || 0

    const recentJobs = jobs?.slice(0, 8) || []

    return NextResponse.json({
      data: {
        kpis: { totalJobs, activeJobs, inReview, completedThisMonth, draftJobs },
        recentJobs
      }
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
