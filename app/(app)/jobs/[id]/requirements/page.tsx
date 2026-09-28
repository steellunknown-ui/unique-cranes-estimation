'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRequirements, useUpdateRequirements } from '@/lib/hooks/app/useRequirements'
import { useExtraction } from '@/lib/hooks/app/useExtraction'
import { detectMissingFields } from '@/lib/engines/validation/missing-fields-detector'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Bot, Check, AlertCircle, AlertTriangle, Info, Download, Calculator, Loader2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { useRouter } from 'next/navigation'
import { useCalculateEstimation } from '@/lib/hooks/app/useEstimation'
import { toast } from 'sonner'

interface AIContext {
  extractedFields: Record<string, { 
    confidence: number, 
    source: 'ai' | 'manual' 
  }>
}

import { use } from 'react';

export default function RequirementsPage({ params, }: { params: Promise<{ id: string }>, }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const { data: requirements, isLoading } = useRequirements(id)
  const updateMutation = useUpdateRequirements()
  
  const [formData, setFormData] = useState<any>({})
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [aiContext, setAiContext] = useState<AIContext | null>(null)
  
  const { data: aiExtraction } = useExtraction(id)

  const [verifiedFields, setVerifiedFields] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (aiExtraction && aiExtraction.raw_extraction) {
      const extractedFields: any = {}
      Object.entries(aiExtraction.raw_extraction).forEach(([key, data]: any) => {
        if (data && typeof data === 'object') {
          extractedFields[key] = {
            confidence: Math.round((data.confidence || 0) * 100),
            source: data.confidence > 0 ? 'ai' : 'manual',
            citation: data.citation || null
          }
        }
      })
      setAiContext({ extractedFields })
    }
  }, [aiExtraction])

  const missingFieldsList = detectMissingFields(formData, formData.ah_required)
  const blocking = missingFieldsList.filter(f => f.severity === 'blocking')
  const warnings = missingFieldsList.filter(f => f.severity === 'warning')
  const info = missingFieldsList.filter(f => f.severity === 'info')
  const totalFields = 18 + (formData.ah_required ? 3 : 0)
  const percentComplete = totalFields === 0 ? 0 : Math.min(100, Math.max(0, Math.round(((totalFields - missingFieldsList.length) / totalFields) * 100)))
  
  // Strict Gating: All AI fields must be verified
  const unverifiedFields = Object.entries(aiContext?.extractedFields || {})
    .filter(([key, data]) => data.source === 'ai' && !verifiedFields[key] && formData[key] !== null && formData[key] !== undefined && formData[key] !== '')
    .map(([key]) => key)

  const isReady = blocking.length === 0 && unverifiedFields.length === 0

  // Initialize form data when data loads
  useEffect(() => {
    if (requirements && Object.keys(formData).length === 0) {
      // Sanitize: replace null with '' for all fields so inputs are always controlled
      const sanitized: any = {}
      Object.entries(requirements as Record<string, any>).forEach(([key, val]) => {
        sanitized[key] = val === null ? '' : val
      })
      setFormData(sanitized)
    }
  }, [requirements])

  // Debounced Auto-save
  useEffect(() => {
    if (Object.keys(formData).length === 0 || !requirements) return

    const hasChanges = Object.keys(formData).some(
      key => formData[key] !== requirements[key]
    )

    if (hasChanges) {
      setSaveStatus('saving')
      const handler = setTimeout(() => {
        updateMutation.mutate({ jobId: id, data: formData }, {
          onSuccess: () => setSaveStatus('saved')
        })
      }, 1500)

      return () => clearTimeout(handler)
    }
  }, [formData])

  const updateField = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }))
  }

  const toggleVerify = (field: string) => {
    setVerifiedFields(prev => ({ ...prev, [field]: !prev[field] }))
  }

  const renderField = (label: string, field: string, type: 'text' | 'number' | 'select' | 'toggle' | 'radio' = 'text', options?: string[], suffix?: string) => {
    const aiData = aiContext?.extractedFields[field]
    const isAI = aiData?.source === 'ai' && formData[field] !== null && formData[field] !== undefined && formData[field] !== ''
    const isVerified = verifiedFields[field]
    
    // Visually highlight unverified AI fields
    const wrapperClass = isAI 
      ? (isVerified ? 'bg-green-50 p-3 rounded-sm border border-green-200 relative group' : 'bg-[#EFF6FF] p-3 rounded-sm border-2 border-blue-300 relative group shadow-sm') 
      : 'flex flex-col relative group'

    const renderInput = () => {
      switch (type) {
        case 'number':
        case 'text':
          return (
            <div className="relative">
              <input 
                type={type} 
                className="w-full border border-slate-300 rounded-sm p-2.5 bg-white text-sm focus:ring-1 focus:ring-[#0B2545] focus:border-[#0B2545]" 
                value={formData[field] ?? ''}
                onChange={e => {
                  updateField(field, e.target.value === '' ? null : e.target.value)
                  if (isAI && verifiedFields[field]) toggleVerify(field) // Unverify if changed
                }}
              />
              {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">{suffix}</span>}
            </div>
          )
        case 'select':
          return (
            <select 
              className="w-full border border-slate-300 rounded-sm p-2.5 bg-white text-sm focus:ring-1 focus:ring-[#0B2545] focus:border-[#0B2545]"
              value={formData[field] ?? ''}
              onChange={e => {
                updateField(field, e.target.value)
                if (isAI && verifiedFields[field]) toggleVerify(field)
              }}
            >
              <option value="">Select...</option>
              {options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          )
        case 'toggle':
          return (
            <label className="relative inline-flex items-center cursor-pointer mt-2">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={!!formData[field]}
                onChange={e => {
                  updateField(field, e.target.checked)
                  if (isAI && verifiedFields[field]) toggleVerify(field)
                }}
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0B2545]"></div>
            </label>
          )
        case 'radio':
          return (
            <div className="flex space-x-4 mt-2">
              {options?.map(opt => (
                <label key={opt} className="flex items-center cursor-pointer">
                  <input 
                    type="radio" 
                    name={field}
                    className="mr-2"
                    checked={formData[field] === opt}
                    onChange={() => {
                      updateField(field, opt)
                      if (isAI && verifiedFields[field]) toggleVerify(field)
                    }}
                  />
                  <span className="text-sm text-slate-700">{opt}</span>
                </label>
              ))}
            </div>
          )
      }
    }

    return (
      <div className={wrapperClass}>
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <label className="text-[12px] font-bold text-slate-600 uppercase tracking-wide">{label}</label>
          {isAI && (
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${aiData.confidence < 70 ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-700'}`} title={aiData.confidence < 70 ? `Low confidence: ${aiData.confidence}%` : `${aiData.confidence}% confident`}>
                <Bot className="w-3 h-3 mr-1" /> {aiData.confidence}%
              </span>
            </div>
          )}
        </div>
        
        {isAI && aiData.citation && (
          <div className="mb-2 text-[11px] text-slate-500 bg-white/50 p-1 rounded border border-blue-100 italic flex items-start gap-1">
            <Info className="w-3 h-3 shrink-0 mt-0.5" /> Source: {aiData.citation}
          </div>
        )}

        {renderInput()}

        {isAI && (
          <label className="flex items-center gap-2 mt-3 cursor-pointer p-1.5 bg-white border border-slate-200 rounded-sm hover:bg-slate-50">
            <input 
              type="checkbox" 
              className="w-4 h-4 text-[#0B2545] rounded border-gray-300 focus:ring-[#0B2545]"
              checked={isVerified}
              onChange={() => toggleVerify(field)}
            />
            <span className={`text-xs font-bold ${isVerified ? 'text-green-600' : 'text-slate-600'}`}>
              {isVerified ? '✓ Verified by Engineer' : 'Requires Verification'}
            </span>
          </label>
        )}
      </div>
    )
  }

  const router = useRouter()

  const handleGenerateClick = () => {
    if (unverifiedFields.length > 0) return
    if (missingFieldsList.length > 0) {
      if (!confirm(`WARNING: You have ${missingFieldsList.length} missing/default fields. Are you sure you want to proceed and generate the final inputs?`)) {
        return
      }
    }
    // Proceed to generate final excel
    window.open(`/api/jobs/${id}/export/excel`)
  }

  const SPECIAL_FEATURESList = [
    "Anti-collision system", "Load limiter", "Data logger", 
    "Under-bridge flood lights", "Anti-sway lock on hook", 
    "Centralized lubrication", "Full-span maintenance platform", 
    "Explosion-proof motors"
  ]

  const toggleSpecialFeature = (feature: string) => {
    const current = Array.isArray(formData.special_features) ? formData.special_features : []
    if (current.includes(feature)) {
      updateField('special_features', current.filter((f: string) => f !== feature))
    } else {
      updateField('special_features', [...current, feature])
    }
  }

  if (isLoading) return <div className="p-8"><Skeleton className="h-[500px] w-full" /></div>

  return (
    <div className="flex h-full">
      {/* LEFT COLUMN: Form */}
      <div className="w-[60%] border-r border-slate-200 overflow-y-auto bg-white p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-[#0B2545]">Crane Requirements</h2>
          <div className="h-6 flex items-center">
            {saveStatus === 'saving' && <span className="text-sm font-bold text-slate-400 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Saving...</span>}
            {saveStatus === 'saved' && <span className="text-sm font-bold text-green-600 flex items-center gap-1"><Check className="w-4 h-4" /> All changes saved</span>}
          </div>
        </div>

        <Accordion className="w-full space-y-4">
          <AccordionItem value="sec-1" className="border border-slate-200 rounded-sm px-4 bg-slate-50">
            <AccordionTrigger className="text-[#0B2545] font-bold uppercase tracking-wider text-sm hover:no-underline">1. Basic Information</AccordionTrigger>
            <AccordionContent className="pt-4 pb-6 grid grid-cols-2 gap-6 bg-white -mx-4 px-4 border-t border-slate-200">
              {renderField('Crane Type', 'crane_type', 'select', ['EOT', 'HOT', 'Gantry', 'Jib', 'Semi-Gantry'])}
              {renderField('Quantity', 'quantity', 'number')}
              <div className="col-span-2">
                {renderField('Location', 'location_type', 'radio', ['Indoor', 'Outdoor', 'Semi-Outdoor'])}
              </div>
              <div className="col-span-2">
                {renderField('Control Type', 'control_type', 'select', ['Open Cabin', 'Closed Cabin A/C', 'Floor Pendant', 'Radio Remote'])}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="sec-2" className="border border-slate-200 rounded-sm px-4 bg-slate-50">
            <AccordionTrigger className="text-[#0B2545] font-bold uppercase tracking-wider text-sm hover:no-underline">2. Lifting Capacity</AccordionTrigger>
            <AccordionContent className="pt-4 pb-6 grid grid-cols-2 gap-6 bg-white -mx-4 px-4 border-t border-slate-200">
              {renderField('MH Capacity', 'mh_capacity', 'number', undefined, 'Tonnes')}
              <div className="flex flex-col justify-center">
                {renderField('AH Required?', 'ah_required', 'toggle')}
              </div>
              {formData.ah_required && renderField('AH Capacity', 'ah_capacity', 'number', undefined, 'Tonnes')}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="sec-3" className="border border-slate-200 rounded-sm px-4 bg-slate-50">
            <AccordionTrigger className="text-[#0B2545] font-bold uppercase tracking-wider text-sm hover:no-underline">3. Dimensions</AccordionTrigger>
            <AccordionContent className="pt-4 pb-6 grid grid-cols-2 gap-6 bg-white -mx-4 px-4 border-t border-slate-200">
              {renderField('Span', 'span', 'number', undefined, 'm')}
              {renderField('Bay Length', 'bay_length', 'number', undefined, 'm')}
              {renderField('MH Lift', 'mh_lift', 'number', undefined, 'm')}
              {formData.ah_required && renderField('AH Lift', 'ah_lift', 'number', undefined, 'm')}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="sec-4" className="border border-slate-200 rounded-sm px-4 bg-slate-50">
            <AccordionTrigger className="text-[#0B2545] font-bold uppercase tracking-wider text-sm hover:no-underline">4. Speeds</AccordionTrigger>
            <AccordionContent className="pt-4 pb-6 grid grid-cols-2 gap-6 bg-white -mx-4 px-4 border-t border-slate-200">
              {renderField('MH Speed', 'mh_speed', 'number', undefined, 'm/min')}
              {formData.ah_required && renderField('AH Speed', 'ah_speed', 'number', undefined, 'm/min')}
              {renderField('CT Speed', 'ct_speed', 'number', undefined, 'm/min')}
              {renderField('LT Speed', 'lt_speed', 'number', undefined, 'm/min')}
              <div className="col-span-2">
                {renderField('Micro Speed Required', 'micro_speed', 'toggle')}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="sec-5" className="border border-slate-200 rounded-sm px-4 bg-slate-50">
            <AccordionTrigger className="text-[#0B2545] font-bold uppercase tracking-wider text-sm hover:no-underline">5. Environment & Duty</AccordionTrigger>
            <AccordionContent className="pt-4 pb-6 grid grid-cols-2 gap-6 bg-white -mx-4 px-4 border-t border-slate-200">
              {renderField('Ambient Temperature', 'ambient_temp', 'number', undefined, '°C')}
              {renderField('Duty Class', 'duty_class', 'select', ['M3', 'M4', 'M5', 'M6'])}
              {renderField('VVVF Required', 'vvvf_required', 'toggle')}
              {renderField('Power Supply', 'power_supply', 'text')}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="sec-6" className="border border-slate-200 rounded-sm px-4 bg-slate-50">
            <AccordionTrigger className="text-[#0B2545] font-bold uppercase tracking-wider text-sm hover:no-underline">6. Civil & Structural</AccordionTrigger>
            <AccordionContent className="pt-4 pb-6 grid grid-cols-2 gap-6 bg-white -mx-4 px-4 border-t border-slate-200">
              {renderField('Rail Size', 'rail_size', 'select', ['CR-60', 'CR-80', 'CR-100', 'UIC-60'])}
              {renderField('DSL Type', 'dsl_type', 'select', ['Copper Shrouded', 'Festoon Cable', 'G.I. Pipe'])}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="sec-7" className="border border-slate-200 rounded-sm px-4 bg-slate-50">
            <AccordionTrigger className="text-[#0B2545] font-bold uppercase tracking-wider text-sm hover:no-underline">7. Special Features</AccordionTrigger>
            <AccordionContent className="pt-4 pb-6 bg-white -mx-4 px-4 border-t border-slate-200">
              <div className="grid grid-cols-2 gap-4">
                {SPECIAL_FEATURESList.map(feature => (
                  <label key={feature} className="flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="mr-3"
                      checked={(formData.special_features || []).includes(feature)}
                      onChange={() => toggleSpecialFeature(feature)}
                    />
                    <span className="text-sm text-slate-700">{feature}</span>
                  </label>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* RIGHT COLUMN: Missing Fields Panel */}
      <div className="w-[40%] bg-slate-50 p-8 flex flex-col h-full overflow-y-auto">
        <h3 className="text-lg font-bold text-[#0B2545] mb-4">Requirements Status</h3>
        
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Completion</span>
            <span className={`text-sm font-bold ${percentComplete === 100 ? 'text-green-600' : percentComplete > 60 ? 'text-orange-500' : 'text-red-500'}`}>
              {percentComplete}%
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${percentComplete === 100 ? 'bg-green-500' : percentComplete > 60 ? 'bg-orange-500' : 'bg-red-500'}`} 
              style={{ width: `${percentComplete}%` }}
            ></div>
          </div>
        </div>

        <div className="space-y-4 flex-1">
          {blocking.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-sm p-4">
              <h4 className="text-red-800 font-bold text-sm uppercase tracking-wider flex items-center gap-2 mb-3">
                <AlertCircle className="w-4 h-4" /> Missing Fields
              </h4>
              <ul className="space-y-2">
                {blocking.map((b, i) => (
                  <li key={i} className="text-sm text-red-700">
                    <span className="font-bold">{b.field}:</span> {b.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {unverifiedFields.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-sm p-4">
              <h4 className="text-[#0B2545] font-bold text-sm uppercase tracking-wider flex items-center gap-2 mb-3">
                <Bot className="w-4 h-4" /> AI Verification Required
              </h4>
              <p className="text-sm text-blue-800 mb-2">You must manually verify the AI-extracted fields before proceeding:</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {unverifiedFields.map((field) => (
                  <span key={field} className="px-2 py-1 bg-white border border-blue-200 text-blue-800 text-xs rounded shadow-sm font-mono">
                    {field}
                  </span>
                ))}
              </div>
            </div>
          )}

          {warnings.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-sm p-4">
              <h4 className="text-orange-800 font-bold text-sm uppercase tracking-wider flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4" /> Warnings (Defaults Assumed)
              </h4>
              <ul className="space-y-2">
                {warnings.map((w, i) => (
                  <li key={i} className="text-sm text-orange-700">
                    <span className="font-bold">{w.field}:</span> {w.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {info.length > 0 && (
            <div className="bg-slate-100 border border-slate-200 rounded-sm p-4">
              <h4 className="text-slate-700 font-bold text-sm uppercase tracking-wider flex items-center gap-2 mb-3">
                <Info className="w-4 h-4" /> Information
              </h4>
              <ul className="space-y-2">
                {info.map((info, i) => (
                  <li key={i} className="text-sm text-slate-600">
                    <span className="font-bold">{info.field}:</span> {info.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {unverifiedFields.length === 0 && percentComplete === 100 && (
             <div className="bg-green-50 border border-green-200 rounded-sm p-4 text-center text-green-800">
              <Check className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <p className="font-bold">All Requirements Met & Verified!</p>
              <p className="text-sm mt-1">You are ready to generate the final inputs.</p>
             </div>
          )}
        </div>

        <div className="mt-8 space-y-3 pt-6 border-t border-slate-200">
          <button 
            onClick={handleGenerateClick}
            disabled={unverifiedFields.length > 0}
            className={`w-full py-3 font-bold text-sm uppercase tracking-wider rounded-sm transition-all flex items-center justify-center gap-2 shadow-sm
              ${unverifiedFields.length === 0 
                ? 'bg-[#0B2545] text-white hover:opacity-90' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
          >
            <Download className="w-4 h-4" /> Generate Final Inputs (Excel)
          </button>
          
          <button 
            onClick={() => window.open(`/api/jobs/${id}/pdf/missing`)}
            className="w-full py-3 border border-slate-300 font-bold text-[#0B2545] text-sm uppercase tracking-wider rounded-sm hover:bg-white transition-all flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" /> Download Missing Info PDF
          </button>
        </div>
      </div>
    </div>
  )
}
