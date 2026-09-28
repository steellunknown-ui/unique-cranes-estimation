import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('job_requirements')
      .select('*')
      .eq('job_id', id)
      .single()

    if (error) throw error

    return NextResponse.json({ data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  try {
    const supabase = await createClient()
    const body = await req.json()
    
    // Check if requirement row exists for this job
    const { data: existing } = await supabase
      .from('job_requirements')
      .select('id')
      .eq('job_id', id)
      .maybeSingle()

    let response;
    
    if (!existing) {
      // Insert if no row exists yet
      response = await supabase
        .from('job_requirements')
        .insert({
          job_id: id,
          ...body,
        })
        .select()
        .single()
    } else {
      // Update existing
      response = await supabase
        .from('job_requirements')
        .update({
          ...body,
          updated_at: new Date().toISOString()
        })
        .eq('job_id', id)
        .select()
        .single()
    }

    if (response.error) throw response.error

    return NextResponse.json({ data: response.data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
