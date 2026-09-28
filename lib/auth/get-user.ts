import { createClient } from '@/lib/supabase/server'
import { User } from '@supabase/supabase-js'
import { Database } from '@/lib/database/schema'

type UserProfile = Database['public']['Tables']['user_profiles']['Row']

export async function getUserWithProfile(): Promise<{ user: User; profile: UserProfile } | null> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }
  
  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()
    
  if (error || !profile) {
    console.warn("Could not fetch user profile (table might not exist). Falling back to mock admin profile.")
    const mockProfile: UserProfile = {
      id: user.id,
      full_name: user.email || 'Test Admin',
      role: 'admin',
      created_at: new Date().toISOString()
    }
    return { user, profile: mockProfile }
  }
  
  return { user, profile }
}
