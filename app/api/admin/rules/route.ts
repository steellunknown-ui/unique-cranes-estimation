import { NextResponse } from 'next/server'
import { getUserWithProfile } from '@/lib/auth/get-user'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const RuleSchema = z.object({
  name: z.string().min(1),
  condition: z.any(),
  action: z.any(),
  priority: z.number().optional().default(10),
  is_active: z.boolean().optional().default(true),
})

const ReorderSchema = z.array(
  z.object({
    id: z.string(),
    priority: z.number(),
  })
)

export async function GET(request: Request) {
  try {
    const userContext = await getUserWithProfile()
    if (!userContext) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (userContext.profile.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const supabase = await createClient()
    const { data, error } = await supabase.from('rules').select('*').order('priority', { ascending: true })

    if (error) throw error

    return NextResponse.json({ data, error: null, status: 200 })
  } catch (err: any) {
    return NextResponse.json({ data: null, error: err.message, status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const userContext = await getUserWithProfile()
    if (!userContext) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (userContext.profile.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const validated = RuleSchema.parse(body)

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('rules')
      .insert([validated])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data, error: null, status: 200 })
  } catch (err: any) {
    return NextResponse.json({ data: null, error: err.message, status: 400 })
  }
}

export async function PUT(request: Request) {
  try {
    const userContext = await getUserWithProfile()
    if (!userContext) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (userContext.profile.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const validated = ReorderSchema.parse(body)

    const supabase = await createClient()
    // Upsert multiple rules to update priorities
    // Note: upsert in Supabase needs all required fields or they should just be an update.
    // Since it's a reorder, it's better to update them individually or use a database function.
    // We'll update them sequentially in a Promise.all for simplicity.
    await Promise.all(
      validated.map((item) =>
        supabase.from('rules').update({ priority: item.priority }).eq('id', item.id)
      )
    )

    return NextResponse.json({ data: true, error: null, status: 200 })
  } catch (err: any) {
    return NextResponse.json({ data: null, error: err.message, status: 400 })
  }
}
