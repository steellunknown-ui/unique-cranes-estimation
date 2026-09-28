import { NextResponse } from 'next/server'
import { getUserWithProfile } from '@/lib/auth/get-user'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const DrawingConfigArraySchema = z.array(
  z.object({
    parameter: z.string().min(1),
    value: z.string(),
    unit: z.string().optional(),
    description: z.string().optional(),
  })
)

export async function GET(request: Request) {
  try {
    const userContext = await getUserWithProfile()
    if (!userContext) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (userContext.profile.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const supabase = await createClient()
    const { data, error } = await supabase.from('drawing_config').select('*').order('parameter', { ascending: true })

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
    const validated = DrawingConfigArraySchema.parse(body)

    const supabase = await createClient()
    // Upsert multiple rows
    const { data, error } = await supabase
      .from('drawing_config')
      .upsert(validated, { onConflict: 'parameter' })
      .select()

    if (error) throw error

    return NextResponse.json({ data, error: null, status: 200 })
  } catch (err: any) {
    return NextResponse.json({ data: null, error: err.message, status: 400 })
  }
}
