'use client'

import { useState } from 'react'
import { Save, ArrowDown, GripVertical, ChevronRight, ChevronDown, Plus, Trash2 } from 'lucide-react'
import { useRules, useCreateRule, useUpdateRule, useDeleteRule, useReorderRules } from '@/lib/hooks/admin/useRules'
import { Skeleton } from '@/components/ui/skeleton'

export default function RulesEngine() {
  const [isRulesListOpen, setIsRulesListOpen] = useState(true)
  const { data: rules, isLoading, refetch } = useRules()
  
  const createMutation = useCreateRule()
  const updateMutation = useUpdateRule()
  const deleteMutation = useDeleteRule()
  const reorderMutation = useReorderRules()

  const [activeRuleId, setActiveRuleId] = useState<string | null>(null)
  
  const [ruleName, setRuleName] = useState('New Rule')
  const [conditionVar, setConditionVar] = useState('Span')
  const [conditionOp, setConditionOp] = useState('>')
  const [conditionVal, setConditionVal] = useState('20m')
  
  const [actionCategory, setActionCategory] = useState('MOTOR')
  const [actionModel, setActionModel] = useState('HEAVY-DUTY AC-450')
  const [actionMultiplier, setActionMultiplier] = useState('1x')

  const handleSelectRule = (rule: any) => {
    setActiveRuleId(rule.id)
    setRuleName(rule.name)
    setConditionVar(rule.condition?.var || 'Span')
    setConditionOp(rule.condition?.op || '>')
    setConditionVal(rule.condition?.val || '')
    setActionCategory(rule.action?.category || 'MOTOR')
    setActionModel(rule.action?.model || '')
    setActionMultiplier(rule.action?.multiplier || '1x')
  }

  const handleNewRule = () => {
    setActiveRuleId(null)
    setRuleName('New Rule')
    setConditionVar('Span')
    setConditionOp('>')
    setConditionVal('')
    setActionCategory('MOTOR')
    setActionModel('')
    setActionMultiplier('1x')
  }

  const handleSave = () => {
    const payload = {
      name: ruleName,
      condition: { var: conditionVar, op: conditionOp, val: conditionVal },
      action: { category: actionCategory, model: actionModel, multiplier: actionMultiplier },
      is_active: true
    }

    if (activeRuleId) {
      updateMutation.mutate({ id: activeRuleId, data: payload })
    } else {
      createMutation.mutate(payload, {
        onSuccess: (data) => setActiveRuleId(data.id)
      })
    }
  }

  // Basic Drag and Drop
  const [draggedId, setDraggedId] = useState<string | null>(null)

  const handleDragStart = (id: string) => {
    setDraggedId(id)
  }

  const handleDrop = (targetId: string) => {
    if (!draggedId || draggedId === targetId || !rules) return
    
    const items = [...rules]
    const draggedIdx = items.findIndex(r => r.id === draggedId)
    const targetIdx = items.findIndex(r => r.id === targetId)
    
    const [draggedItem] = items.splice(draggedIdx, 1)
    items.splice(targetIdx, 0, draggedItem)
    
    // update priorities
    const reordered = items.map((r, idx) => ({ id: r.id, priority: idx + 1 }))
    reorderMutation.mutate(reordered)
    setDraggedId(null)
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F9F9FF]">
      <header className="w-full sticky top-0 z-40 flex justify-between items-center h-16 px-8 bg-white border-b border-slate-200">
        <h1 className="font-semibold text-2xl text-[#0B2545]">Rules Engine</h1>
        <button 
          onClick={handleNewRule}
          className="bg-[#0B2545] text-white px-6 py-2.5 font-bold uppercase text-[13px] tracking-wider rounded-sm hover:opacity-90 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> New Rule
        </button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Canvas Area */}
        <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center">
          
          <section className="w-full max-w-3xl flex flex-col gap-4 border border-slate-300 p-4 bg-white mb-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex-1">
                <h2 className="text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">CURRENT RULE</h2>
                <input 
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  className="text-xl font-bold text-[#0B2545] uppercase border-b border-dashed border-slate-400 focus:border-[#E67E22] outline-none bg-transparent w-full pb-1"
                />
              </div>
              <div className="flex gap-2">
                {activeRuleId && (
                  <button 
                    onClick={() => {
                      if (confirm('Delete rule?')) deleteMutation.mutate(activeRuleId, { onSuccess: handleNewRule })
                    }}
                    className="bg-red-50 text-red-600 px-4 py-3 font-bold flex items-center justify-center hover:bg-red-100 transition-all rounded-sm border border-red-200"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
                <button 
                  onClick={handleSave}
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="bg-[#0B2545] text-white px-6 py-3 font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all border-b-4 border-[#071830] rounded-sm disabled:opacity-50"
                >
                  <Save className="w-5 h-5" />
                  {createMutation.isPending || updateMutation.isPending ? 'SAVING...' : 'SAVE RULE'}
                </button>
              </div>
            </div>
          </section>

          {/* Visual Rule Builder Canvas */}
          <div className="w-full max-w-3xl flex flex-col items-center">
            
            <div className="relative w-full bg-white border-2 border-[#0B2545] p-6 mb-12 shadow-sm rounded-sm">
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-[#0B2545] text-white font-bold px-2 py-1 text-xs rounded-sm">IF</span>
                <span className="text-sm font-bold text-slate-500 uppercase">Condition Alpha</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-[#0B2545] uppercase">VARIABLE</label>
                  <input 
                    className="w-full border border-slate-300 p-2 text-sm focus:border-[#0B2545] focus:ring-1 focus:ring-[#0B2545] outline-none rounded-sm"
                    value={conditionVar}
                    onChange={(e) => setConditionVar(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-[#0B2545] uppercase">OPERATOR</label>
                  <select 
                    className="w-full border border-slate-300 p-2 text-sm focus:border-[#0B2545] focus:ring-1 focus:ring-[#0B2545] outline-none rounded-sm"
                    value={conditionOp}
                    onChange={(e) => setConditionOp(e.target.value)}
                  >
                    <option value=">">&gt;</option>
                    <option value="<">&lt;</option>
                    <option value="==">==</option>
                    <option value=">=">&gt;=</option>
                    <option value="<=">&lt;=</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-[#0B2545] uppercase">VALUE</label>
                  <input 
                    className="w-full border border-slate-300 p-2 text-sm focus:border-[#0B2545] focus:ring-1 focus:ring-[#0B2545] outline-none rounded-sm" 
                    type="text" 
                    value={conditionVal}
                    onChange={(e) => setConditionVal(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="mb-12 flex justify-center items-center h-8 relative">
              <div className="absolute left-1/2 w-0.5 h-12 bg-slate-400 -top-12 -translate-x-1/2 -z-10"></div>
              <ArrowDown className="text-[#0B2545] w-8 h-8 animate-bounce bg-[#F9F9FF]" />
            </div>

            <div className="relative w-full bg-orange-50/50 border-2 border-[#E67E22] p-6 shadow-sm rounded-sm">
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-[#E67E22] text-white font-bold px-2 py-1 text-xs rounded-sm">THEN</span>
                <span className="text-sm font-bold text-[#E67E22] uppercase">Resulting Action</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-[#E67E22] uppercase">CATEGORY</label>
                  <input 
                    className="w-full border border-orange-200 p-2 text-sm focus:border-[#E67E22] focus:ring-1 focus:ring-[#E67E22] outline-none rounded-sm"
                    value={actionCategory}
                    onChange={(e) => setActionCategory(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-[#E67E22] uppercase">MODEL</label>
                  <input 
                    className="w-full border border-orange-200 p-2 text-sm focus:border-[#E67E22] focus:ring-1 focus:ring-[#E67E22] outline-none rounded-sm"
                    value={actionModel}
                    onChange={(e) => setActionModel(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-[#E67E22] uppercase">MULTIPLIER</label>
                  <input 
                    className="w-full border border-orange-200 p-2 text-sm focus:border-[#E67E22] focus:ring-1 focus:ring-[#E67E22] outline-none rounded-sm" 
                    type="text" 
                    value={actionMultiplier}
                    onChange={(e) => setActionMultiplier(e.target.value)}
                  />
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Right Sidebar: Rules List */}
        <div className="w-80 border-l border-slate-300 bg-slate-50 flex flex-col">
          <button 
            className="w-full p-4 flex items-center justify-between bg-[#0B2545] text-white" 
            onClick={() => setIsRulesListOpen(!isRulesListOpen)}
          >
            <h3 className="text-xs font-bold uppercase tracking-wider">SAVED RULES ({rules?.length || 0})</h3>
            {isRulesListOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
          
          {isRulesListOpen && (
            <div className="flex-1 overflow-y-auto">
              <div className="flex flex-col">
                {isLoading ? (
                  <div className="p-4"><Skeleton className="h-12 w-full" /></div>
                ) : rules?.length === 0 ? (
                  <div className="p-4 text-center text-slate-500 text-sm">No rules saved.</div>
                ) : (
                  rules?.map((rule: any, idx: number) => (
                    <div 
                      key={rule.id}
                      draggable
                      onDragStart={() => handleDragStart(rule.id)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => handleDrop(rule.id)}
                      onClick={() => handleSelectRule(rule)}
                      className={`flex items-center gap-3 p-4 border-b border-slate-200 group cursor-pointer transition-colors
                        ${activeRuleId === rule.id ? 'bg-slate-100 border-l-4 border-l-[#E67E22]' : 'bg-white hover:bg-slate-50 border-l-4 border-l-transparent'}`}
                    >
                      <GripVertical className="text-slate-400 w-5 h-5 cursor-grab active:cursor-grabbing" />
                      <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-bold text-[#0B2545] truncate">{rule.name}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">
                          PRIORITY: {rule.priority || idx + 1} • <span className={rule.is_active ? "text-green-600" : "text-slate-400"}>{rule.is_active ? 'ACTIVE' : 'INACTIVE'}</span>
                        </p>
                      </div>
                      <ChevronRight className="text-slate-400 w-4 h-4" />
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
