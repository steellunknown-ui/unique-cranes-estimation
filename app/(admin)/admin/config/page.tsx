'use client'

import { useSystemConfig, useUpdateConfig } from '@/lib/hooks/admin/useConfig'
import { Skeleton } from '@/components/ui/skeleton'
import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'

export default function SystemConfig() {
  const { data: config, isLoading, isError, refetch } = useSystemConfig()
  const updateMutation = useUpdateConfig()

  const [savedKeys, setSavedKeys] = useState<Record<string, boolean>>({})

  const handleBlur = (key: string, value: string, description?: string) => {
    // Only update if it actually changed, but for simplicity we can just upsert on blur
    updateMutation.mutate({ key, value, description }, {
      onSuccess: () => {
        setSavedKeys(prev => ({ ...prev, [key]: true }))
        setTimeout(() => {
          setSavedKeys(prev => ({ ...prev, [key]: false }))
        }, 2000)
      }
    })
  }

  // Pre-defined keys for the system
  const defaultKeys = [
    { key: 'COMPANY_NAME', desc: 'Company name for quotations' },
    { key: 'COMPANY_ADDRESS', desc: 'Company address for quotations' },
    { key: 'GST_RATE', desc: 'Default GST percentage' },
    { key: 'MARGIN_MULTIPLIER', desc: 'Default profit margin multiplier' },
    { key: 'SUPPORT_EMAIL', desc: 'Support contact email' },
  ]

  // Merge default keys with fetched config
  const displayConfig = defaultKeys.map(dk => {
    const found = config?.find((c: any) => c.key === dk.key)
    return {
      key: dk.key,
      description: found?.description || dk.desc,
      value: found?.value || ''
    }
  })

  // Add any extra keys from DB that are not in defaults
  if (config) {
    config.forEach((c: any) => {
      if (!displayConfig.find(d => d.key === c.key)) {
        displayConfig.push(c)
      }
    })
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F9F9FF]">
      <header className="w-full sticky top-0 z-40 flex justify-between items-center h-16 px-8 bg-white border-b border-slate-200">
        <h1 className="font-semibold text-2xl text-[#0B2545]">System Configuration</h1>
      </header>
      <div className="p-8 overflow-y-auto flex-1">
        <div className="max-w-4xl mx-auto bg-white border border-slate-300 shadow-sm rounded-sm p-8">
          <div className="mb-8">
            <h3 className="text-xl font-bold text-[#0B2545] mb-2">Global Parameters</h3>
            <p className="text-sm text-slate-500">Edit key-value pairs that govern system-wide behavior. Changes autosave on blur.</p>
          </div>
          
          <div className="space-y-6">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-10 w-1/3" />
                  <Skeleton className="h-10 flex-1" />
                </div>
              ))
            ) : isError ? (
              <div className="text-red-500 text-sm">Failed to load config. <button className="underline" onClick={() => refetch()}>Retry</button></div>
            ) : (
              displayConfig.map((item) => (
                <div key={item.key} className="flex items-start gap-4 border-b border-slate-100 pb-4">
                  <div className="w-1/3 flex flex-col">
                    <label className="text-xs font-bold text-[#0B2545] uppercase">{item.key}</label>
                    <span className="text-[10px] text-slate-500">{item.description}</span>
                  </div>
                  <div className="flex-1 relative">
                    <input 
                      className="w-full border border-slate-300 p-2 text-sm focus:border-[#0B2545] focus:ring-1 focus:ring-[#0B2545] outline-none rounded-sm" 
                      type="text" 
                      defaultValue={item.value}
                      onBlur={(e) => handleBlur(item.key, e.target.value, item.description)}
                    />
                    {savedKeys[item.key] && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-green-600 text-xs font-bold animate-in fade-in zoom-in duration-300">
                        <CheckCircle2 className="w-4 h-4" /> Saved ✓
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
