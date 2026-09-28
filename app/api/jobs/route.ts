import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const clientId = searchParams.get('client_id')

    let query = supabase
      .from('jobs')
      .select('*, job_requirements(crane_type, mh_capacity, span)')

    if (status && status !== 'All') {
      query = query.eq('status', status.toLowerCase() as any)
    }

    if (clientId) {
      // clientId doesn't apply anymore since clients is flat, we could ignore it or filter by client_name
    }

    if (search) {
      query = query.or(`ref_number.ilike.%${search}%,client_company.ilike.%${search}%`)
    }

    const { data: jobs, error } = await query.order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ data: jobs })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
