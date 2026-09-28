import { getUserWithProfile } from '@/lib/auth/get-user'
import { redirect } from 'next/navigation'
import { AdminSidebar } from '@/components/layout/admin-sidebar'
import { QueryProvider } from '@/lib/query/query-client'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userContext = await getUserWithProfile()

  if (!userContext) {
    redirect('/login')
  }

  if (userContext.profile.role !== 'admin') {
    redirect('/dashboard?error=unauthorized')
  }

  return (
    <div className="flex h-screen w-full flex-col md:flex-row bg-[#F8FAFC] overflow-hidden">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        <QueryProvider>
          {children}
        </QueryProvider>
      </main>
    </div>
  )
}
