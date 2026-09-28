import { NextResponse } from 'next/server'
import { getUserWithProfile } from '@/lib/auth/get-user'

export async function GET() {
  const user = await getUserWithProfile()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return NextResponse.json(user.profile)
}
