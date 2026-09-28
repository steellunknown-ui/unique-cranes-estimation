import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params
    const id = resolvedParams.id
    
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabase
      .from('documents')
      .select(`
        id, type, storage_path, version, created_at,
        user_profiles ( full_name )
      `)
      .eq('job_id', id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(data)

  } catch (error: any) {
    console.error('Documents GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
