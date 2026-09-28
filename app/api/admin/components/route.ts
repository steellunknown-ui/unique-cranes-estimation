import { NextResponse } from 'next/server'
import { getUserWithProfile } from '@/lib/auth/get-user'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const ComponentSchema = z.object({
  category: z.string().min(1),
  model: z.string().min(1),
  unit_price: z.number().min(0),
  unit: z.string().optional().default('piece'),
  specs: z.any().optional(),
})

export async function GET(request: Request) {
  try {
    const userContext = await getUserWithProfile()
    if (!userContext) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (userContext.profile.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    const supabase = await createClient()
    let query = supabase.from('components').select('*').order('created_at', { ascending: false })
    
    // Components table doesn't have created_at, oops! Wait, yes it has updated_at, let's just order by model.
    query = supabase.from('components').select('*').order('model', { ascending: true })

    if (category) {
      query = query.eq('category', category)
    }

    const { data, error } = await query

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
    const validated = ComponentSchema.parse(body)

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('components')
      .insert([{
        ...validated,
        is_active: true,
        updated_by: userContext.user.id
      }])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data, error: null, status: 200 })
  } catch (err: any) {
    return NextResponse.json({ data: null, error: err.message, status: 400 })
  }
}
