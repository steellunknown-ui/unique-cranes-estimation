import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const body = await req.json()
    const { client_company, client_name, client_email, client_phone, source, cloned_from } = body

    // 1. Generate UC-YYYY-NNN ref_number
    const year = new Date().getFullYear()
    const { data: recentJobs, error: maxError } = await supabase
      .from('jobs')
      .select('ref_number')
      .ilike('ref_number', `UC-${year}-%`)
      .order('ref_number', { ascending: false })
      .limit(1)

    if (maxError) throw maxError

    let nextNumber = 1
    if (recentJobs && recentJobs.length > 0) {
      const lastRef = recentJobs[0].ref_number
      const parts = lastRef.split('-')
      if (parts.length === 3) {
        nextNumber = parseInt(parts[2], 10) + 1
      }
    }

    const ref_number = `UC-${year}-${nextNumber.toString().padStart(3, '0')}`

    // 2. Create the job record
    const { data: newJob, error: createError } = await supabase
      .from('jobs')
      .insert([
        {
          ref_number,
          client_company,
          client_name,
          client_email,
          client_phone,
          status: 'draft',
          source,
          cloned_from: cloned_from || null,
          created_by: user.id
        }
      ])
      .select()
      .single()

    if (createError) throw createError

    // 3. If cloned, copy requirements
    if (source === 'cloned' && cloned_from) {
      const { data: sourceReqs } = await supabase
        .from('job_requirements')
        .select('*')
        .eq('job_id', cloned_from)
        .single()

      if (sourceReqs) {
        // Remove id and job_id from source, apply to new job
        const { id, job_id, updated_at, ...reqData } = sourceReqs
        await supabase.from('job_requirements').insert([{ ...reqData, job_id: newJob.id }])
      }
    } else {
      // Create empty requirements record for manual/pdf flow
      await supabase.from('job_requirements').insert([{ job_id: newJob.id }])
    }

    return NextResponse.json({ data: newJob }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
