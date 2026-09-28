import { getUserWithProfile } from '@/lib/auth/get-user'
import { redirect } from 'next/navigation'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { QueryProvider } from '@/lib/query/query-client'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userContext = await getUserWithProfile()

  if (!userContext) {
    redirect('/login')
  }

  return (
    <div className="flex h-screen w-full flex-col md:flex-row bg-[#F8FAFC]">
      <AppSidebar profile={userContext.profile} />
      <main className="flex-1 overflow-auto p-4 md:p-8">
        <QueryProvider>
          {children}
        </QueryProvider>
      </main>
    </div>
  )
}
