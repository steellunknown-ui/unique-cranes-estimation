import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error

    return NextResponse.json({ data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  try {
    const supabase = await createClient()

    // Remove foreign key dependencies first
    await supabase.from('job_requirements').delete().eq('job_id', id)
    await supabase.from('ai_extractions').delete().eq('job_id', id)
    await supabase.from('estimations').delete().eq('job_id', id)
    await supabase.from('documents').delete().eq('job_id', id)
    
    // Clear cloned_from references if any other jobs were cloned from this one
    await supabase.from('jobs').update({ cloned_from: null }).eq('cloned_from', id)

    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ data: { success: true } })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
