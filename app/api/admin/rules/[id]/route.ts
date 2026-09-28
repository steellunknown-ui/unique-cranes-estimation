import { NextResponse } from 'next/server'
import { getUserWithProfile } from '@/lib/auth/get-user'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const UpdateRuleSchema = z.object({
  name: z.string().min(1).optional(),
  condition: z.any().optional(),
  action: z.any().optional(),
  priority: z.number().optional(),
  is_active: z.boolean().optional(),
})

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userContext = await getUserWithProfile()
    if (!userContext) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (userContext.profile.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const id = (await params).id
    const body = await request.json()
    const validated = UpdateRuleSchema.parse(body)

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('rules')
      .update(validated)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data, error: null, status: 200 })
  } catch (err: any) {
    return NextResponse.json({ data: null, error: err.message, status: 400 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userContext = await getUserWithProfile()
    if (!userContext) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (userContext.profile.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const id = (await params).id

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('rules')
      .delete()
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data, error: null, status: 200 })
  } catch (err: any) {
    return NextResponse.json({ data: null, error: err.message, status: 500 })
  }
}
