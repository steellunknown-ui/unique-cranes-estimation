'use client'

import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { 
  Briefcase, ClipboardCheck, CheckCircle2, FileEdit, 
  ArrowRight, Plus, TrendingUp, Activity
} from 'lucide-react'

function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard')
      if (!res.ok) throw new Error('Failed to fetch dashboard')
      const json = await res.json()
      return json.data
    }
  })
}

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  draft:     { label: 'Draft',       color: 'bg-slate-100 text-slate-600',    dot: 'bg-slate-400' },
  active:    { label: 'Active',      color: 'bg-blue-100 text-blue-700',      dot: 'bg-blue-500' },
  review:    { label: 'AI Review',   color: 'bg-amber-100 text-amber-700',    dot: 'bg-amber-500' },
  completed: { label: 'Completed',   color: 'bg-green-100 text-green-700',    dot: 'bg-green-500' },
  cancelled: { label: 'Cancelled',   color: 'bg-red-100 text-red-600',        dot: 'bg-red-400' },
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

function KPICard({ title, value, icon: Icon, sub }: { title: string; value: number; icon: any; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
        <p className="text-4xl font-extrabold text-[#0B2545] mt-2 tabular-nums">{value}</p>
        {sub && <p className="text-xs mt-1 text-slate-400">{sub}</p>}
      </div>
      <div className="p-3 rounded-xl bg-[#0B2545]/8 border border-[#0B2545]/10">
        <Icon className="w-5 h-5 text-[#0B2545]" />
      </div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border bg-white p-6 animate-pulse">
      <div className="h-4 bg-slate-200 rounded w-1/2 mb-3" />
      <div className="h-10 bg-slate-200 rounded w-1/3" />
    </div>
  )
}

export default function AppDashboardPage() {
  const router = useRouter()
  const { data, isLoading } = useDashboard()

  const kpis = data?.kpis
  const recentJobs = data?.recentJobs || []

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  })()

  return (
    <div className="min-h-full bg-[#F7F8FC] p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <p className="text-sm text-slate-500 font-medium">{greeting} 👋</p>
          <h1 className="text-3xl font-extrabold text-[#0B2545] tracking-tight">Operations Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Live overview of all crane estimation jobs</p>
        </div>
        <button
          onClick={() => router.push('/jobs')}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#0B2545] text-white rounded-xl font-semibold text-sm shadow-md hover:bg-[#0B2545]/90 transition-all hover:shadow-lg hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4" />
          New Job
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        {isLoading ? (
          <>
            <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
          </>
        ) : (
          <>
            <KPICard
              title="Total Jobs"
              value={kpis?.totalJobs ?? 0}
              icon={Briefcase}
              sub="All time"
            />
            <KPICard
              title="Active / In Review"
              value={kpis?.activeJobs ?? 0}
              icon={Activity}
              sub="Currently processing"
            />
            <KPICard
              title="Pending AI Review"
              value={kpis?.inReview ?? 0}
              icon={ClipboardCheck}
              sub="Needs engineer sign-off"
            />
            <KPICard
              title="Completed (this month)"
              value={kpis?.completedThisMonth ?? 0}
              icon={CheckCircle2}
              sub={new Date().toLocaleString('default', { month: 'long' })}
            />
          </>
        )}
      </div>

      {/* Status Summary bar */}
      {!isLoading && kpis && (
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { label: 'Drafts', value: kpis.draftJobs, color: 'border-l-slate-400' },
            { label: 'In Review', value: kpis.inReview, color: 'border-l-amber-400' },
            { label: 'Completed', value: kpis.completedThisMonth, color: 'border-l-green-500' },
          ].map(item => (
            <div key={item.label} className={`bg-white rounded-xl p-4 border border-slate-200 border-l-4 ${item.color} shadow-sm`}>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{item.label}</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{item.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Recent Jobs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#0B2545]" />
            <h2 className="font-bold text-[#0B2545] text-base">Recent Jobs</h2>
          </div>
          <button
            onClick={() => router.push('/jobs')}
            className="flex items-center gap-1 text-sm text-[#0B2545] font-semibold hover:underline"
          >
            View all <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-slate-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : recentJobs.length === 0 ? (
          <div className="text-center py-16 px-8">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileEdit className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-500 font-medium">No jobs yet</p>
            <p className="text-slate-400 text-sm mt-1">Create your first job to see it here</p>
            <button
              onClick={() => router.push('/jobs')}
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-[#0B2545] text-white rounded-xl font-semibold text-sm"
            >
              <Plus className="w-4 h-4" /> Create Job
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentJobs.map((job: any) => {
              const reqs = Array.isArray(job.job_requirements) ? job.job_requirements[0] : job.job_requirements
              return (
                <div
                  key={job.id}
                  onClick={() => router.push(`/jobs/${job.id}`)}
                  className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-[#0B2545]/10 flex items-center justify-center shrink-0">
                      <Briefcase className="w-4 h-4 text-[#0B2545]" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 text-sm group-hover:text-[#0B2545] transition-colors">
                        {job.ref_number}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {job.client_company || 'Unknown Client'}
                        {reqs?.crane_type && ` · ${reqs.crane_type}`}
                        {reqs?.mh_capacity && ` · ${reqs.mh_capacity}T`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <p className="text-xs text-slate-400 hidden sm:block">
                      {new Date(job.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    <StatusBadge status={job.status} />
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#0B2545] transition-colors" />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
