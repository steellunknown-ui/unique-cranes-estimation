'use client'

import { useState } from 'react'
import { Search, Plus, Eye, Copy, Trash2, Filter } from 'lucide-react'
import { useJobs, useDeleteJob } from '@/lib/hooks/app/useJobs'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import { format } from 'date-fns'
import { NewJobDialog } from '@/components/jobs/NewJobDialog'
import { useSearchParams } from 'next/navigation'

export default function JobsPage() {
  const searchParams = useSearchParams()
  const newClientParam = searchParams.get('newClient')
  
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [isDialogOpen, setIsDialogOpen] = useState(!!newClientParam)

  const { data: jobs, isLoading, isError, refetch } = useJobs({ status: statusFilter, search: searchQuery })
  const deleteMutation = useDeleteJob()

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'draft': 
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 uppercase tracking-wider">Draft</span>
      case 'ai_processing': 
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-600 uppercase tracking-wider">
          <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          Processing
        </span>
      case 'review': 
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-600 uppercase tracking-wider">Review</span>
      case 'estimated': 
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-600 uppercase tracking-wider">Estimated</span>
      case 'quoted': 
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-600 uppercase tracking-wider">Quoted</span>
      case 'closed': 
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-800 text-white uppercase tracking-wider">Closed</span>
      default: 
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 uppercase tracking-wider">{status}</span>
    }
  }

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this job? This action cannot be undone.")) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <header className="w-full sticky top-0 z-40 flex justify-between items-center h-16 px-8 bg-[#F9F9FF] border-b border-slate-200">
        <div className="flex items-center space-x-6">
          <h1 className="font-semibold text-2xl text-[#0B2545]">Jobs</h1>
          <div className="flex items-center space-x-2">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input 
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-sm focus:border-[#0B2545] focus:ring-1 focus:ring-[#0B2545] text-sm" 
                placeholder="Search ref number or client..." 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center border border-slate-300 rounded-sm bg-white px-3 py-2 text-sm">
              <Filter className="w-4 h-4 text-slate-400 mr-2" />
              <select 
                className="focus:outline-none bg-transparent font-semibold text-slate-700 uppercase tracking-wider text-[11px]"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="review">Review</option>
                <option value="estimated">Estimated</option>
                <option value="quoted">Quoted</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>
        </div>
        <button 
          onClick={() => setIsDialogOpen(true)}
          className="px-6 py-2.5 bg-[#0B2545] text-white font-bold text-[13px] uppercase tracking-wider rounded-sm hover:opacity-90 transition-opacity flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> New Job
        </button>
      </header>

      <div className="p-8 space-y-4 overflow-y-auto flex-1">
        <div className="bg-white border border-slate-300 shadow-sm rounded-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0B2545] text-white border-b border-slate-300">
                <th className="p-4 text-[12px] font-bold uppercase tracking-widest">Ref Number</th>
                <th className="p-4 text-[12px] font-bold uppercase tracking-widest">Client</th>
                <th className="p-4 text-[12px] font-bold uppercase tracking-widest">Crane Type & Capacity</th>
                <th className="p-4 text-[12px] font-bold uppercase tracking-widest">Span</th>
                <th className="p-4 text-[12px] font-bold uppercase tracking-widest">Status</th>
                <th className="p-4 text-[12px] font-bold uppercase tracking-widest">Created Date</th>
                <th className="p-4 text-[12px] font-bold uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="p-4"><Skeleton className="h-5 w-24" /></td>
                    <td className="p-4"><Skeleton className="h-5 w-32" /></td>
                    <td className="p-4"><Skeleton className="h-5 w-40" /></td>
                    <td className="p-4"><Skeleton className="h-5 w-16" /></td>
                    <td className="p-4"><Skeleton className="h-6 w-24" /></td>
                    <td className="p-4"><Skeleton className="h-5 w-24" /></td>
                    <td className="p-4"><Skeleton className="h-8 w-24 ml-auto" /></td>
                  </tr>
                ))
              ) : isError ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-red-500">
                    Failed to load jobs. <button onClick={() => refetch()} className="underline">Retry</button>
                  </td>
                </tr>
              ) : jobs?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <Copy className="w-12 h-12 text-slate-300" />
                      <p className="text-slate-500 text-lg">No jobs found.</p>
                      <button onClick={() => setIsDialogOpen(true)} className="text-[#0B2545] font-bold hover:underline">
                        + Create your first estimation
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                jobs?.map((job: any) => (
                  <tr key={job.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <Link href={`/jobs/${job.id}/requirements`} className="font-mono font-bold text-[#0B2545] hover:underline">
                        {job.ref_number}
                      </Link>
                    </td>
                    <td className="p-4 text-sm font-semibold text-slate-700">
                      {job.client_company || '-'}
                    </td>
                    <td className="p-4 text-sm text-slate-600">
                      {job.job_requirements?.[0]?.crane_type ? 
                        `${job.job_requirements[0].crane_type} — ${job.job_requirements[0].mh_capacity || '?'}T` : 
                        <span className="text-slate-400 italic">Pending requirements</span>
                      }
                    </td>
                    <td className="p-4 text-sm text-slate-600">
                      {job.job_requirements?.[0]?.span ? `${job.job_requirements[0].span}m` : '-'}
                    </td>
                    <td className="p-4">
                      {getStatusBadge(job.status)}
                    </td>
                    <td className="p-4 text-sm text-slate-500">
                      {format(new Date(job.created_at), 'MMM dd, yyyy')}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <Link href={`/jobs/${job.id}/requirements`} className="inline-flex p-1.5 hover:bg-blue-50 text-[#0B2545] transition-all rounded-sm" title="View">
                        <Eye className="w-4 h-4" />
                      </Link>
                      <button onClick={() => {
                        setIsDialogOpen(true)
                      }} className="inline-flex p-1.5 hover:bg-purple-50 text-purple-600 transition-all rounded-sm" title="Clone">
                        <Copy className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(job.id)} className="inline-flex p-1.5 hover:bg-red-50 text-red-600 transition-all rounded-sm" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <NewJobDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
        defaultClientId={newClientParam || undefined} 
      />
    </div>
  )
}
