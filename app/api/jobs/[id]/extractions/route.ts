import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const jobId = resolvedParams.id

    // Fetch the latest extraction for this job
    const { data: extraction, error } = await supabase
      .from('ai_extractions')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is no rows returned, which is fine
      console.error('Failed to fetch extractions:', error)
      return NextResponse.json({ error: 'Failed to fetch extractions' }, { status: 500 })
    }

    return NextResponse.json({ data: extraction || null })

  } catch (error) {
    console.error('Extractions GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
