'use client'

import { useState, use, useEffect } from 'react'
import { useEstimation, useCalculateEstimation, useSaveOverrides } from '@/lib/hooks/app/useEstimation'
import { formatINR } from '@/lib/utils/format-currency'
import { ChevronDown, ChevronRight, Edit2, Check, X, Printer, RefreshCw, Lock, AlertTriangle, History } from 'lucide-react'
import { toast } from 'sonner'

function AccordionSection({ title, amount, items, onOverride }: { title: string, amount: number, items: any[], onOverride: (idx: number, newRate: number) => void }) {
  const [isOpen, setIsOpen] = useState(true)
  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  const [editVal, setEditVal] = useState('')

  if (!items || items.length === 0) return null

  return (
    <div className="border border-slate-200 rounded-md mb-4 bg-white overflow-hidden shadow-sm">
      <div 
        className="flex items-center justify-between p-4 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2 font-semibold text-slate-800">
          {isOpen ? <ChevronDown className="w-5 h-5 text-slate-500" /> : <ChevronRight className="w-5 h-5 text-slate-500" />}
          {title}
        </div>
        <div className="font-bold text-slate-800">{formatINR(amount)}</div>
      </div>
      
      {isOpen && (
        <div className="p-0 border-t border-slate-200 overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-medium">Component</th>
                <th className="px-4 py-3 font-medium">Model / Spec</th>
                <th className="px-4 py-3 font-medium text-center">Qty</th>
                <th className="px-4 py-3 font-medium text-right">Unit Rate</th>
                <th className="px-4 py-3 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item, idx) => (
                <tr key={idx} className={`hover:bg-slate-50/50 ${item.unit_rate === 0 || item.source === 'manual_override' ? 'bg-amber-50/30' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {item.component}
                      {item.unit_rate === 0 && <span title={item.notes}><AlertTriangle className="w-4 h-4 text-amber-500" /></span>}
                      {item.source === 'manual_override' && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Modified</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{item.model}</td>
                  <td className="px-4 py-3 text-center">{item.quantity}</td>
                  <td className="px-4 py-3 text-right">
                    {editingIdx === idx ? (
                      <div className="flex items-center justify-end gap-1">
                        <input 
                          type="number" 
                          className="w-24 border rounded px-2 py-1 text-right text-sm"
                          value={editVal}
                          onChange={e => setEditVal(e.target.value)}
                          autoFocus
                        />
                        <button onClick={() => { onOverride(idx, parseFloat(editVal) || 0); setEditingIdx(null) }} className="text-green-600 p-1 hover:bg-green-50 rounded"><Check className="w-4 h-4"/></button>
                        <button onClick={() => setEditingIdx(null)} className="text-slate-400 p-1 hover:bg-slate-100 rounded"><X className="w-4 h-4"/></button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-2 group">
                        <span className={item.unit_rate === 0 ? 'text-amber-600 font-medium' : ''}>{formatINR(item.unit_rate)}</span>
                        <button onClick={() => { setEditingIdx(idx); setEditVal(item.unit_rate.toString()) }} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-blue-600 transition-opacity">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">{formatINR(item.total)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 border-t border-slate-200 font-semibold">
              <tr>
                <td colSpan={4} className="px-4 py-3 text-right text-slate-600">Subtotal</td>
                <td className="px-4 py-3 text-right text-slate-800">{formatINR(amount)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}

export default function EstimationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: estData, isLoading, refetch } = useEstimation(id)
  const calculateMutation = useCalculateEstimation(id)
  const saveOverridesMutation = useSaveOverrides(id)
  
  const [includeGst, setIncludeGst] = useState(false)
  const [localData, setLocalData] = useState<any>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  // Sync localData when estData loads
  useEffect(() => {
    if (estData?.data) {
      setLocalData(JSON.parse(JSON.stringify(estData.data)))
    }
  }, [estData])

  const handleRecalculate = () => {
    if (estData?.data) {
      setShowConfirm(true)
    } else {
      doRecalculate()
    }
  }

  const doRecalculate = () => {
    setShowConfirm(false)
    calculateMutation.mutate(undefined, {
      onSuccess: (resData) => {
        if (resData.grand_total === 0) {
          toast.warning('Estimation incomplete — some component rates are missing. Please update catalog.', { duration: 5000 })
        } else {
          toast.success('Estimation calculated successfully!')
        }
      },
      onError: (err: any) => {
        toast.error(err.message)
      }
    })
  }

  const handleOverride = (section: string, idx: number, newRate: number) => {
    if (!localData) return
    const newData = { ...localData }
    const item = newData[section][idx]
    
    item.unit_rate = newRate
    item.total = newRate * item.quantity
    item.source = 'manual_override'
    
    // Recalculate all totals
    const sumMh = newData.mh_breakdown.reduce((s: number, i: any) => s + i.total, 0)
    const sumAh = newData.ah_breakdown.reduce((s: number, i: any) => s + i.total, 0)
    const sumCt = newData.ct_breakdown.reduce((s: number, i: any) => s + i.total, 0)
    const sumLt = newData.lt_breakdown.reduce((s: number, i: any) => s + i.total, 0)
    
    newData.base_total = sumMh + sumAh + sumCt + sumLt + newData.structural_cost
    newData.after_margin = newData.base_total * newData.margin_multiplier
    newData.grand_total = newData.after_margin + newData.painting_cost + newData.misc_cost + newData.crd_cost
    newData.gst_amount = newData.grand_total * (newData.gst_rate / 100)
    newData.grand_total_with_gst = newData.grand_total + newData.gst_amount
    
    // Update summary array
    newData.summary[0].amount = sumMh
    newData.summary[1].amount = sumAh
    newData.summary[2].amount = sumCt
    newData.summary[3].amount = sumLt
    newData.summary[5].amount = newData.base_total
    newData.summary[6].amount = newData.after_margin - newData.base_total
    newData.summary[7].amount = newData.after_margin
    
    setLocalData(newData)
  }

  const handleSaveOverrides = () => {
    saveOverridesMutation.mutate(localData, {
      onSuccess: () => toast.success('Overrides saved! New version created.')
    })
  }

  const handlePrint = () => {
    window.print()
  }

  if (isLoading) return <div className="p-8 text-center text-slate-500">Loading estimation data...</div>

  const data = localData || estData?.data
  const versions = estData?.versions || []
  
  const hasUnsavedChanges = JSON.stringify(data) !== JSON.stringify(estData?.data)

  return (
    <div className="max-w-7xl mx-auto w-full pb-20">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cost Estimation</h1>
          <div className="flex items-center gap-3 mt-1">
            {data && <span className="bg-[#0B2545] text-white text-xs px-2 py-0.5 rounded-full font-medium tracking-wide">Version {data.version}</span>}
            {data && <span className="text-sm text-slate-500">Generated: {new Date(data.created_at).toLocaleString()}</span>}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-md cursor-pointer hover:bg-slate-50">
            <input type="checkbox" checked={includeGst} onChange={e => setIncludeGst(e.target.checked)} className="rounded text-[#0B2545] focus:ring-[#0B2545]" />
            Include GST (18%)
          </label>
          <button onClick={() => setShowHistory(!showHistory)} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-md hover:bg-slate-50 text-sm font-medium transition-colors">
            <History className="w-4 h-4" /> History
          </button>
          <button onClick={handleRecalculate} disabled={calculateMutation.isPending} className="flex items-center gap-2 px-4 py-1.5 bg-[#0B2545] text-white rounded-md hover:bg-[#0B2545]/90 text-sm font-medium transition-colors disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${calculateMutation.isPending ? 'animate-spin' : ''}`} /> 
            {calculateMutation.isPending ? 'Calculating...' : 'Recalculate'}
          </button>
        </div>
      </div>

      {showConfirm && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md flex items-center justify-between print:hidden shadow-sm">
          <div className="text-blue-800 text-sm font-medium">This will run the engine and create Estimation v{(data?.version || 0) + 1}. Previous version will be preserved. Continue?</div>
          <div className="flex gap-2">
            <button onClick={() => setShowConfirm(false)} className="px-3 py-1 text-sm bg-white border border-blue-200 text-blue-700 rounded hover:bg-blue-100 font-medium transition-colors">Cancel</button>
            <button onClick={doRecalculate} className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 font-medium transition-colors">Confirm</button>
          </div>
        </div>
      )}

      {hasUnsavedChanges && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-md flex items-center justify-between print:hidden shadow-sm">
          <div className="text-amber-800 text-sm font-medium">You have unsaved manual overrides.</div>
          <div className="flex gap-2">
            <button onClick={() => setLocalData(JSON.parse(JSON.stringify(estData?.data)))} className="px-3 py-1 text-sm bg-white border border-amber-200 text-amber-700 rounded hover:bg-amber-100 font-medium transition-colors">Reset</button>
            <button onClick={handleSaveOverrides} disabled={saveOverridesMutation.isPending} className="px-3 py-1 text-sm bg-amber-600 text-white rounded hover:bg-amber-700 font-medium transition-colors">
              {saveOverridesMutation.isPending ? 'Saving...' : 'Save Overrides as New Version'}
            </button>
          </div>
        </div>
      )}

      {showHistory && versions.length > 0 && (
        <div className="mb-6 p-4 bg-white border border-slate-200 rounded-md shadow-sm print:hidden">
          <h3 className="font-semibold text-slate-800 mb-3">Version History</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-2">Version</th>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2 text-right">Grand Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {versions.map((v: any) => (
                  <tr key={v.id} className={v.version === data?.version ? 'bg-blue-50/50' : ''}>
                    <td className="px-4 py-2 font-medium">v{v.version} {v.version === data?.version && '(Current)'}</td>
                    <td className="px-4 py-2 text-slate-600">{new Date(v.created_at).toLocaleString()}</td>
                    <td className="px-4 py-2 text-right font-medium">{formatINR(v.grand_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!data ? (
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <RefreshCw className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">No Estimation Generated</h2>
          <p className="text-slate-500 max-w-md mx-auto mb-6">Click recalculate to run the estimation engine. Make sure all blocking requirements are filled first.</p>
          <button onClick={handleRecalculate} className="px-6 py-2 bg-[#0B2545] text-white rounded-md hover:bg-[#0B2545]/90 font-medium transition-colors">
            Run Engine Now
          </button>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6 relative">
          
          {/* LEFT: Accordions */}
          <div className="flex-1 print:hidden">
            <AccordionSection 
              title="Main Hoist Assembly" 
              amount={data.summary?.[0]?.amount || 0} 
              items={data.mh_breakdown} 
              onOverride={(idx, val) => handleOverride('mh_breakdown', idx, val)}
            />
            {data.ah_breakdown && data.ah_breakdown.length > 0 && (
              <AccordionSection 
                title="Auxiliary Hoist Assembly" 
                amount={data.summary?.[1]?.amount || 0} 
                items={data.ah_breakdown} 
                onOverride={(idx, val) => handleOverride('ah_breakdown', idx, val)}
              />
            )}
            <AccordionSection 
              title="Cross Travel Mechanism" 
              amount={data.summary?.[2]?.amount || 0} 
              items={data.ct_breakdown} 
              onOverride={(idx, val) => handleOverride('ct_breakdown', idx, val)}
            />
            <AccordionSection 
              title="Long Travel Mechanism" 
              amount={data.summary?.[3]?.amount || 0} 
              items={data.lt_breakdown} 
              onOverride={(idx, val) => handleOverride('lt_breakdown', idx, val)}
            />
            
            <div className="border border-slate-200 rounded-md mb-4 bg-white overflow-hidden shadow-sm">
              <div className="flex items-center justify-between p-4 bg-slate-50">
                <div className="flex items-center gap-2 font-semibold text-slate-800">
                  <ChevronDown className="w-5 h-5 text-slate-400 opacity-0" />
                  Structural & Fabrication
                </div>
                <div className="font-bold text-slate-800">{formatINR(data.structural_cost)}</div>
              </div>
            </div>
          </div>

          {/* RIGHT: Sticky Summary */}
          <div className="lg:w-96 shrink-0 print:w-full">
            <div className="sticky top-[80px] bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden print:shadow-none print:border-none">
              
              <div className="bg-[#0B2545] p-4 text-white flex justify-between items-center print:hidden">
                <h2 className="font-semibold text-lg">Estimation Summary</h2>
                <button onClick={handlePrint} className="p-1.5 hover:bg-white/20 rounded transition-colors" title="Print Summary">
                  <Printer className="w-5 h-5" />
                </button>
              </div>

              {/* Print Only Header */}
              <div className="hidden print:block mb-6 text-center">
                <h1 className="text-2xl font-bold border-b pb-2">Cost Estimation Summary</h1>
                <p className="mt-2 text-gray-600">Generated on {new Date().toLocaleDateString()}</p>
              </div>

              <div className="p-0">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-slate-100">
                    {data.summary.filter((s:any) => {
                      if (s.label.includes('Auxiliary') && (!data.ah_breakdown || data.ah_breakdown.length === 0)) return false;
                      return true;
                    }).map((item: any, idx: number) => (
                      <tr key={idx} className={item.isBold ? 'bg-slate-50 font-bold text-slate-800' : 'text-slate-600'}>
                        <td className="px-5 py-3">{item.label}</td>
                        <td className="px-5 py-3 text-right">{formatINR(item.amount)}</td>
                      </tr>
                    ))}
                    
                    {/* Final Totals */}
                    <tr className="bg-slate-100 font-bold text-slate-800 text-base border-t-2 border-slate-300">
                      <td className="px-5 py-4">GRAND TOTAL (Ex-GST)</td>
                      <td className="px-5 py-4 text-right text-[#0B2545]">{formatINR(data.grand_total)}</td>
                    </tr>
                    
                    {includeGst && (
                      <>
                        <tr className="text-slate-600 font-medium">
                          <td className="px-5 py-3 text-right">GST @ {data.gst_rate}%</td>
                          <td className="px-5 py-3 text-right text-slate-800">{formatINR(data.gst_amount)}</td>
                        </tr>
                        <tr className="bg-[#0B2545] font-bold text-white text-lg">
                          <td className="px-5 py-4">GRAND TOTAL (Incl. GST)</td>
                          <td className="px-5 py-4 text-right">{formatINR(data.grand_total_with_gst)}</td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>
      )}

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:block, .print\\:block * {
            visibility: visible;
          }
          .sticky {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            visibility: visible;
          }
          .sticky * {
            visibility: visible;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}
