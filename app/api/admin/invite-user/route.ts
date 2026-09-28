import { NextResponse } from 'next/server'
import { getUserWithProfile } from '@/lib/auth/get-user'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

const InviteUserSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'estimator', 'viewer']),
})

export async function POST(request: Request) {
  try {
    const userContext = await getUserWithProfile()
    if (!userContext) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (userContext.profile.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const validated = InviteUserSchema.parse(body)

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured')
    }

    // Use service role key to invite user
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey
    )

    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(validated.email)

    if (error) throw error

    // Wait, the trigger 'on_auth_user_created' will automatically insert a profile with role='admin'
    // Let's update the profile to the requested role if it's different
    if (data.user && validated.role !== 'admin') {
      await supabaseAdmin
        .from('user_profiles')
        .update({ role: validated.role })
        .eq('id', data.user.id)
    }

    return NextResponse.json({ data, error: null, status: 200 })
  } catch (err: any) {
    return NextResponse.json({ data: null, error: err.message, status: 400 })
  }
}
