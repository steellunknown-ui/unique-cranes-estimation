'use client'

import { useState } from 'react'
import { useFormulas, useCreateFormula, useUpdateFormula, useDeleteFormula } from '@/lib/hooks/admin/useFormulas'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Edit2, Trash2, X } from 'lucide-react'

export default function FormulasEditor() {
  const { data: formulas, isLoading, isError, refetch } = useFormulas()
  const createMutation = useCreateFormula()
  const updateMutation = useUpdateFormula()
  const deleteMutation = useDeleteFormula()

  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  
  const [formName, setFormName] = useState('')
  const [formExpression, setFormExpression] = useState('')
  const [formDescription, setFormDescription] = useState('')

  const openSheet = (formula?: any) => {
    if (formula) {
      setEditId(formula.id)
      setFormName(formula.name)
      setFormExpression(formula.expression)
      setFormDescription(formula.description || '')
    } else {
      setEditId(null)
      setFormName('')
      setFormExpression('')
      setFormDescription('')
    }
    setIsSheetOpen(true)
  }

  const handleSave = () => {
    const payload = {
      name: formName,
      expression: formExpression,
      description: formDescription,
    }

    if (editId) {
      updateMutation.mutate({ id: editId, data: payload }, {
        onSuccess: () => setIsSheetOpen(false)
      })
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => setIsSheetOpen(false)
      })
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F9F9FF]">
      <header className="w-full sticky top-0 z-40 flex justify-between items-center h-16 px-8 bg-white border-b border-slate-200">
        <h1 className="font-semibold text-2xl text-[#0B2545]">Formulas Editor</h1>
        <button 
          onClick={() => openSheet()}
          className="bg-[#0B2545] text-white px-6 py-2.5 font-bold uppercase text-[13px] tracking-wider rounded-sm hover:opacity-90 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add New Formula
        </button>
      </header>
      
      <div className="p-8 flex-1 overflow-y-auto">
        <div className="bg-white border border-slate-300 shadow-sm rounded-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0B2545] text-white border-b border-slate-300">
                <th className="p-4 text-[12px] font-bold uppercase tracking-widest w-1/4">Name</th>
                <th className="p-4 text-[12px] font-bold uppercase tracking-widest w-2/4">Expression</th>
                <th className="p-4 text-[12px] font-bold uppercase tracking-widest text-right w-1/4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="p-4"><Skeleton className="h-5 w-32" /></td>
                    <td className="p-4"><Skeleton className="h-5 w-full max-w-md" /></td>
                    <td className="p-4 text-right"><Skeleton className="h-8 w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : isError ? (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-red-500">
                    Failed to load formulas. <button onClick={() => refetch()} className="underline">Retry</button>
                  </td>
                </tr>
              ) : formulas?.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-slate-500">
                    No formulas found. Create your first one!
                  </td>
                </tr>
              ) : (
                formulas?.map((formula: any) => (
                  <tr key={formula.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-[#0B2545]">{formula.name}</span>
                        {formula.description && (
                          <span className="text-xs text-slate-500">{formula.description}</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <code className="text-sm bg-slate-100 text-slate-800 px-2 py-1 rounded-sm font-mono border border-slate-200">
                        {formula.expression}
                      </code>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button 
                        onClick={() => openSheet(formula)}
                        className="p-1.5 hover:bg-blue-50 text-[#0B2545] transition-all rounded-sm"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => {
                          if (confirm('Delete this formula?')) {
                            deleteMutation.mutate(formula.id)
                          }
                        }}
                        className="p-1.5 hover:bg-red-50 text-red-600 transition-all rounded-sm"
                      >
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

      {isSheetOpen && (
        <div 
          className="fixed inset-0 bg-[#0B2545]/40 backdrop-blur-sm z-[60] transition-opacity duration-300" 
          onClick={() => setIsSheetOpen(false)}
        />
      )}

      <div 
        className={`fixed top-0 right-0 h-screen w-[450px] bg-white z-[70] shadow-2xl transition-transform duration-300 flex flex-col border-l border-slate-300 ${isSheetOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-semibold text-[#0B2545] uppercase tracking-wider">{editId ? 'Edit Formula' : 'Add Formula'}</h2>
          <button className="text-[#0B2545] hover:rotate-90 transition-transform" onClick={() => setIsSheetOpen(false)}>
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-[#0B2545] uppercase">Formula Name</label>
            <input 
              className="w-full border border-slate-300 p-3 text-sm focus:border-[#0B2545] focus:ring-1 focus:ring-[#0B2545] outline-none rounded-sm"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Total Weight"
            />
          </div>
          
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-[#0B2545] uppercase">Mathematical Expression</label>
            <textarea 
              className="w-full border border-slate-300 p-3 text-sm focus:border-[#0B2545] focus:ring-1 focus:ring-[#0B2545] outline-none rounded-sm font-mono h-32"
              value={formExpression}
              onChange={(e) => setFormExpression(e.target.value)}
              placeholder="(Span * 2) + 10"
            />
          </div>
          
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-[#0B2545] uppercase">Description (Optional)</label>
            <input 
              className="w-full border border-slate-300 p-3 text-sm focus:border-[#0B2545] focus:ring-1 focus:ring-[#0B2545] outline-none rounded-sm"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Used to calculate the girder weight"
            />
          </div>
        </div>

        <div className="p-6 border-t border-slate-200 flex space-x-3 bg-white">
          <button 
            className="flex-1 py-3 border border-slate-300 font-bold text-[#0B2545] uppercase text-[12px] tracking-wider hover:bg-slate-50 transition-colors rounded-sm" 
            onClick={() => setIsSheetOpen(false)}
          >
            Cancel
          </button>
          <button 
            className="flex-1 py-3 bg-[#E67E22] text-white font-bold uppercase text-[12px] tracking-wider hover:brightness-110 transition-all shadow-sm rounded-sm disabled:opacity-50" 
            onClick={handleSave}
            disabled={createMutation.isPending || updateMutation.isPending || !formName || !formExpression}
          >
            {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Formula'}
          </button>
        </div>
      </div>

    </div>
  )
}
