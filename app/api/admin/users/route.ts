import { NextResponse } from 'next/server'
import { getUserWithProfile } from '@/lib/auth/get-user'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const UpdateRoleSchema = z.object({
  id: z.string().uuid(),
  role: z.enum(['admin', 'estimator', 'viewer']),
})

export async function GET(request: Request) {
  try {
    const userContext = await getUserWithProfile()
    if (!userContext) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (userContext.profile.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ data, error: null, status: 200 })
  } catch (err: any) {
    return NextResponse.json({ data: null, error: err.message, status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const userContext = await getUserWithProfile()
    if (!userContext) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (userContext.profile.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const validated = UpdateRoleSchema.parse(body)

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ role: validated.role })
      .eq('id', validated.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data, error: null, status: 200 })
  } catch (err: any) {
    return NextResponse.json({ data: null, error: err.message, status: 400 })
  }
}
