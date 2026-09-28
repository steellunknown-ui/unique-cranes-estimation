import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  try {
    const supabase = await createClient()
    const body = await req.json()
    
    // body contains the overridden breakdowns and new totals
    const { data: latest, error: getErr } = await supabase
      .from('estimations')
      .select('version')
      .eq('job_id', id)
      .order('version', { ascending: false })
      .limit(1)
      .single()

    if (getErr) throw new Error('No existing estimation found to override')

    const newVersion = (latest?.version || 0) + 1

    const { summary, gst_rate, after_margin, ...dataToSave } = body
    
    const estimationData = {
      job_id: id,
      ...dataToSave,
      version: newVersion,
      created_at: new Date().toISOString()
    }

    const { error: insErr } = await supabase.from('estimations').insert(estimationData as any)
    if (insErr) throw insErr

    return NextResponse.json({ data: { ...estimationData, summary, gst_rate, after_margin } }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
