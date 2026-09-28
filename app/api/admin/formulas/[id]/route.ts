import { NextResponse } from 'next/server'
import { getUserWithProfile } from '@/lib/auth/get-user'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const UpdateFormulaSchema = z.object({
  name: z.string().min(1).optional(),
  expression: z.string().min(1).optional(),
  variables: z.any().optional(),
  description: z.string().optional(),
})

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userContext = await getUserWithProfile()
    if (!userContext) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (userContext.profile.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const id = (await params).id
    const body = await request.json()
    const validated = UpdateFormulaSchema.parse(body)

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('formulas')
      .update({
        ...validated,
        updated_by: userContext.user.id,
        updated_at: new Date().toISOString()
      })
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
      .from('formulas')
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
