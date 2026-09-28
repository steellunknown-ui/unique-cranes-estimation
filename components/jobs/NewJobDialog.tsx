'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { FileUp, ClipboardList, Copy, Search, Building2 } from 'lucide-react'
import { useCreateJob, useJobs } from '@/lib/hooks/app/useJobs'

interface NewJobDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultClientId?: string
}

export function NewJobDialog({ open, onOpenChange, defaultClientId }: NewJobDialogProps) {
  const router = useRouter()
  const createMutation = useCreateJob()
  const { data: pastJobs } = useJobs({ status: 'All' }) // fetch all for cloning
  
  const [step, setStep] = useState<1 | 2>(1)
  const [selectedSource, setSelectedSource] = useState<'pdf_upload' | 'manual' | 'cloned' | null>(null)
  
  const [clientCompany, setClientCompany] = useState('')
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  
  const [selectedCloneJob, setSelectedCloneJob] = useState<string>('')
  const [searchJob, setSearchJob] = useState('')

  const handleSourceSelect = (source: 'pdf_upload' | 'manual' | 'cloned') => {
    setSelectedSource(source)
    setStep(2)
  }

  const handleCreate = () => {
    if (!clientCompany) return alert('Please enter a company name')
    if (selectedSource === 'cloned' && !selectedCloneJob) return alert('Please select a job to clone')

    createMutation.mutate({
      client_company: clientCompany,
      client_name: clientName,
      client_email: clientEmail,
      client_phone: clientPhone,
      source: selectedSource!,
      cloned_from: selectedSource === 'cloned' ? selectedCloneJob : undefined
    }, {
      onSuccess: (res) => {
        const jobId = res.data.id
        onOpenChange(false)
        if (selectedSource === 'pdf_upload') {
          router.push(`/jobs/${jobId}/upload`)
        } else {
          router.push(`/jobs/${jobId}/requirements`)
        }
      }
    })
  }

  const filteredJobs = pastJobs?.filter((j: any) => 
    j.ref_number.toLowerCase().includes(searchJob.toLowerCase()) || 
    (j.client_company && j.client_company.toLowerCase().includes(searchJob.toLowerCase()))
  ) || []

  return (
    <Dialog open={open} onOpenChange={(val) => {
      onOpenChange(val)
      if (!val) { setTimeout(() => { setStep(1); setSelectedSource(null) }, 300) }
    }}>
      <DialogContent className="sm:max-w-[700px] bg-white">
        <DialogHeader>
          <DialogTitle className="text-2xl text-[#0B2545] font-bold">
            {step === 1 ? 'Create New Job' : 'Select Details'}
          </DialogTitle>
          <DialogDescription>
            {step === 1 ? 'Choose how you want to start this estimation job.' : 'Select the client to assign this job to.'}
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
            <button 
              onClick={() => handleSourceSelect('pdf_upload')}
              className="flex flex-col items-center text-center p-6 border border-slate-200 rounded-sm hover:border-[#0B2545] hover:bg-slate-50 transition-all group"
            >
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FileUp className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-[#0B2545] mb-2">Upload Client Document</h3>
              <p className="text-xs text-slate-500 mb-4">Upload a technical PDF or drawing. AI will extract crane requirements automatically.</p>
              <span className="mt-auto text-sm font-bold text-blue-600">Select →</span>
            </button>

            <button 
              onClick={() => handleSourceSelect('manual')}
              className="flex flex-col items-center text-center p-6 border border-slate-200 rounded-sm hover:border-[#0B2545] hover:bg-slate-50 transition-all group"
            >
              <div className="w-12 h-12 bg-orange-100 text-[#E67E22] rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <ClipboardList className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-[#0B2545] mb-2">Manual Entry</h3>
              <p className="text-xs text-slate-500 mb-4">Enter crane requirements manually using our structured form.</p>
              <span className="mt-auto text-sm font-bold text-[#E67E22]">Select →</span>
            </button>

            <button 
              onClick={() => handleSourceSelect('cloned')}
              className="flex flex-col items-center text-center p-6 border border-slate-200 rounded-sm hover:border-[#0B2545] hover:bg-slate-50 transition-all group"
            >
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Copy className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-[#0B2545] mb-2">Clone Existing Job</h3>
              <p className="text-xs text-slate-500 mb-4">Copy a past job and modify the requirements.</p>
              <span className="mt-auto text-sm font-bold text-purple-600">Select →</span>
            </button>
          </div>
        ) : (
          <div className="py-4 space-y-6">
            <div className="space-y-4">
              <h4 className="text-[12px] font-bold text-slate-500 uppercase mb-2">1. Client Details</h4>
              
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Company Name *</label>
                <input 
                  className="w-full px-3 py-2 border border-slate-300 rounded-sm text-sm focus:border-[#0B2545] focus:ring-1 focus:ring-[#0B2545]" 
                  placeholder="e.g. Acme Corp" 
                  value={clientCompany}
                  onChange={e => setClientCompany(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Contact Name</label>
                  <input 
                    className="w-full px-3 py-2 border border-slate-300 rounded-sm text-sm focus:border-[#0B2545] focus:ring-1 focus:ring-[#0B2545]" 
                    placeholder="e.g. John Doe" 
                    value={clientName}
                    onChange={e => setClientName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Phone</label>
                  <input 
                    className="w-full px-3 py-2 border border-slate-300 rounded-sm text-sm focus:border-[#0B2545] focus:ring-1 focus:ring-[#0B2545]" 
                    placeholder="e.g. +1 234 567 890" 
                    value={clientPhone}
                    onChange={e => setClientPhone(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Email</label>
                <input 
                  type="email"
                  className="w-full px-3 py-2 border border-slate-300 rounded-sm text-sm focus:border-[#0B2545] focus:ring-1 focus:ring-[#0B2545]" 
                  placeholder="john@acme.com" 
                  value={clientEmail}
                  onChange={e => setClientEmail(e.target.value)}
                />
              </div>
            </div>

            {selectedSource === 'cloned' && (
              <div className="space-y-3">
                <label className="text-[12px] font-bold text-slate-500 uppercase">2. Select Job to Clone</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input 
                    className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-sm text-sm" 
                    placeholder="Search ref number or client..." 
                    value={searchJob}
                    onChange={e => setSearchJob(e.target.value)}
                  />
                </div>
                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-sm divide-y divide-slate-100">
                  {filteredJobs.map((j: any) => (
                    <label key={j.id} className={`flex items-center justify-between p-3 cursor-pointer hover:bg-slate-50 ${selectedCloneJob === j.id ? 'bg-purple-50' : ''}`}>
                      <div className="flex items-center">
                        <input 
                          type="radio" 
                          name="cloneJob" 
                          className="mr-3" 
                          checked={selectedCloneJob === j.id}
                          onChange={() => setSelectedCloneJob(j.id)}
                        />
                        <div>
                          <div className="font-bold font-mono text-sm text-[#0B2545]">{j.ref_number}</div>
                          <div className="text-xs text-slate-500">{j.client_company}</div>
                        </div>
                      </div>
                      <div className="text-xs font-bold text-slate-400 uppercase">{j.status}</div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
              <button 
                onClick={() => setStep(1)} 
                className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-[#0B2545]"
              >
                Back
              </button>
              <button 
                onClick={handleCreate} 
                disabled={!clientCompany || (selectedSource === 'cloned' && !selectedCloneJob) || createMutation.isPending}
                className="px-6 py-2 bg-[#0B2545] text-white font-bold text-sm uppercase tracking-wider rounded-sm hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
              >
                {createMutation.isPending ? 'Creating...' : 'Create Job'}
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
