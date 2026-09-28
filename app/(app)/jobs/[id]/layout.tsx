'use client'

import React from 'react'
import { useJob, useUpdateJobStatus } from '@/lib/hooks/app/useJobs'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowLeft, ClipboardList, Calculator, Ruler, FileText } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { format } from 'date-fns'

const STATUS_FLOW = ['draft', 'review', 'estimated', 'quoted', 'closed']

export default function JobWorkspaceLayout({
  children,
  params
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = React.use(params)
  const pathname = usePathname()
  const { data: job, isLoading } = useJob(id)
  const updateStatus = useUpdateJobStatus()

  const tabs = [
    { name: 'PDF Uploads', path: `/jobs/${id}/upload`, icon: FileText, disabled: false },
    { name: 'Technical Verification', path: `/jobs/${id}/requirements`, icon: ClipboardList, disabled: job?.status === 'draft' },
  ]

  const getAvailableNextStatuses = (currentStatus: string) => {
    if (currentStatus === 'ai_processing') return [] // Handled by system
    const currentIndex = STATUS_FLOW.indexOf(currentStatus)
    if (currentIndex === -1 || currentIndex === STATUS_FLOW.length - 1) return []
    return [STATUS_FLOW[currentIndex + 1]]
  }

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value
    if (newStatus && newStatus !== job?.status) {
      if (confirm(`Are you sure you want to change the status to ${newStatus}?`)) {
        updateStatus.mutate({ id: id, status: newStatus })
      }
    }
  }

  if (isLoading) {
    return <div className="p-8"><Skeleton className="h-24 w-full mb-8" /></div>
  }

  if (!job) {
    return <div className="p-8 text-red-500">Job not found</div>
  }

  const availableStatuses = getAvailableNextStatuses(job.status)

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden">
      {/* Breadcrumb */}
      <div className="px-8 py-3 bg-[#F9F9FF] border-b border-slate-200 flex items-center text-xs font-bold text-slate-500 uppercase tracking-wider">
        <Link href="/jobs" className="hover:text-[#0B2545] flex items-center gap-1">
          <ArrowLeft className="w-3 h-3" /> Jobs
        </Link>
        <span className="mx-2">/</span>
        <span className="text-[#0B2545] font-mono">{job.ref_number}</span>
      </div>

      {/* Header */}
      <header className="px-8 py-6 bg-white border-b border-slate-200 flex justify-between items-center shadow-sm z-10">
        <div>
          <div className="flex items-center gap-4 mb-1">
            <h1 className="font-mono font-bold text-3xl text-[#0B2545]">{job.ref_number}</h1>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              job.status === 'draft' ? 'bg-gray-100 text-gray-600' :
              job.status === 'ai_processing' ? 'bg-blue-100 text-blue-600' :
              job.status === 'review' ? 'bg-orange-100 text-orange-600' :
              job.status === 'estimated' ? 'bg-purple-100 text-purple-600' :
              job.status === 'quoted' ? 'bg-green-100 text-green-600' :
              'bg-slate-800 text-white'
            }`}>
              {job.status === 'ai_processing' ? 'AI Processing' : job.status}
            </span>
          </div>
          <p className="text-sm text-slate-500 font-medium">
            <span className="text-[#0B2545] font-bold">
              {job.client_company || 'Unknown Client'}
            </span>
            {' • '} Created {format(new Date(job.created_at), 'MMM dd, yyyy')}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Change Status</label>
            <select 
              className="border border-slate-300 rounded-sm py-1.5 px-3 bg-white text-sm font-bold text-[#0B2545] uppercase tracking-wider focus:ring-1 focus:ring-[#0B2545]"
              value={job.status}
              onChange={handleStatusChange}
              disabled={job.status === 'ai_processing' || availableStatuses.length === 0}
            >
              <option value={job.status}>{job.status}</option>
              {availableStatuses.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="px-8 bg-white border-b border-slate-200 flex space-x-1">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = pathname === tab.path || pathname.startsWith(`${tab.path}/`)
          
          if (tab.disabled) {
            return (
              <div key={tab.name} className="flex items-center gap-2 px-4 py-3 text-sm font-bold text-slate-300 cursor-not-allowed uppercase tracking-wider border-b-2 border-transparent">
                <Icon className="w-4 h-4" /> {tab.name}
              </div>
            )
          }

          return (
            <Link 
              key={tab.name} 
              href={tab.path}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors ${
                isActive ? 'border-[#E67E22] text-[#E67E22]' : 'border-transparent text-slate-500 hover:text-[#0B2545] hover:border-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" /> {tab.name}
            </Link>
          )
        })}
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
