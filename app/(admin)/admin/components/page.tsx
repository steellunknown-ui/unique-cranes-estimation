'use client'

import { useState, useEffect } from 'react'
import { Search, Edit2, Trash2, Info, X, Plus, Trash } from 'lucide-react'
import { useComponents, useCreateComponent, useUpdateComponent, useToggleComponent, useDeleteComponent, useInlineUpdatePrice } from '@/lib/hooks/admin/useComponents'
import { Skeleton } from '@/components/ui/skeleton'

const CATEGORIES = [
  'MOTOR', 'BRAKE_DCEM', 'BRAKE_EHT', 'GEARBOX', 
  'WIRE_ROPE', 'WHEEL', 'SNATCH_BLOCK', 'COUPLING', 'OTHER'
]

export default function ComponentCatalog() {
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  
  // Form State
  const [editId, setEditId] = useState<string | null>(null)
  const [formCategory, setFormCategory] = useState('MOTOR')
  const [formModel, setFormModel] = useState('')
  const [formPrice, setFormPrice] = useState('')
  
  const [dynamicSpecs, setDynamicSpecs] = useState<Record<string, any>>({})
  const [customSpecs, setCustomSpecs] = useState<{key: string, value: string}[]>([])

  const { data: components, isLoading, isError, refetch } = useComponents(selectedCategory || undefined)
  const createMutation = useCreateComponent()
  const updateMutation = useUpdateComponent()
  const toggleMutation = useToggleComponent()
  const deleteMutation = useDeleteComponent()
  const inlinePriceMutation = useInlineUpdatePrice()

  const openEditSheet = (comp?: any) => {
    if (comp) {
      setEditId(comp.id)
      setFormCategory(comp.category)
      setFormModel(comp.model)
      setFormPrice(comp.unit_price.toString())
      
      const specs = comp.specs || {}
      if (comp.category === 'OTHER') {
        const arr = Object.entries(specs).map(([key, value]) => ({ key, value: String(value) }))
        setCustomSpecs(arr)
        setDynamicSpecs({})
      } else {
        setDynamicSpecs(specs)
        setCustomSpecs([])
      }
    } else {
      setEditId(null)
      setFormCategory('MOTOR')
      setFormModel('')
      setFormPrice('')
      setDynamicSpecs({})
      setCustomSpecs([])
    }
    setIsSheetOpen(true)
  }

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormCategory(e.target.value)
    setDynamicSpecs({})
    setCustomSpecs([])
  }

  const updateSpec = (key: string, value: any) => {
    setDynamicSpecs(prev => ({ ...prev, [key]: value }))
  }

  const handleMotorPoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const poles = e.target.value;
    let autoRpm = dynamicSpecs.rpm;
    if (poles === '2 pole') autoRpm = 2950;
    else if (poles === '4 pole') autoRpm = 1450;
    else if (poles === '6 pole') autoRpm = 975;
    else if (poles === '8 pole') autoRpm = 730;
    
    setDynamicSpecs(prev => ({ ...prev, poles, rpm: autoRpm }))
  }

  const handleSave = () => {
    let parsedSpecs: Record<string, any> = {}
    
    if (formCategory === 'OTHER') {
      customSpecs.forEach(spec => {
        if (spec.key.trim()) {
          parsedSpecs[spec.key.trim()] = spec.value.trim()
        }
      })
    } else {
      parsedSpecs = { ...dynamicSpecs }
    }

    const payload = {
      category: formCategory,
      model: formModel,
      unit_price: parseFloat(formPrice) || 0,
      specs: parsedSpecs
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

  const filteredComponents = components?.filter((c: any) => 
    c.model.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  const renderDynamicFields = () => {
    switch (formCategory) {
      case 'MOTOR':
        return (
          <>
            <div className="flex flex-col"><label className="text-[12px] font-bold text-slate-500 uppercase mb-2">Power (kW)</label><input type="number" className="border border-slate-300 rounded-sm p-3 bg-white text-sm focus:ring-1 focus:ring-[#0B2545] focus:border-[#0B2545]" value={dynamicSpecs.power_kw || ''} onChange={e => updateSpec('power_kw', e.target.value)} /></div>
            <div className="flex flex-col"><label className="text-[12px] font-bold text-slate-500 uppercase mb-2">Frame Size</label><input type="text" placeholder="e.g. 160M, 180L" className="border border-slate-300 rounded-sm p-3 bg-white text-sm focus:ring-1 focus:ring-[#0B2545] focus:border-[#0B2545]" value={dynamicSpecs.frame_size || ''} onChange={e => updateSpec('frame_size', e.target.value)} /></div>
            <div className="flex flex-col"><label className="text-[12px] font-bold text-slate-500 uppercase mb-2">Poles</label><select className="border border-slate-300 rounded-sm p-3 bg-white text-sm focus:ring-1 focus:ring-[#0B2545] focus:border-[#0B2545]" value={dynamicSpecs.poles || ''} onChange={handleMotorPoleChange}><option value="">Select Poles</option><option value="2 pole">2 pole</option><option value="4 pole">4 pole</option><option value="6 pole">6 pole</option><option value="8 pole">8 pole</option></select></div>
            <div className="flex flex-col"><label className="text-[12px] font-bold text-slate-500 uppercase mb-2">RPM</label><input type="number" className="border border-slate-300 rounded-sm p-3 bg-white text-sm focus:ring-1 focus:ring-[#0B2545] focus:border-[#0B2545]" value={dynamicSpecs.rpm || ''} onChange={e => updateSpec('rpm', e.target.value)} /></div>
            <div className="flex flex-col"><label className="text-[12px] font-bold text-slate-500 uppercase mb-2">Voltage</label><select className="border border-slate-300 rounded-sm p-3 bg-white text-sm focus:ring-1 focus:ring-[#0B2545] focus:border-[#0B2545]" value={dynamicSpecs.voltage || ''} onChange={e => updateSpec('voltage', e.target.value)}><option value="">Select Voltage</option><option value="415V">415V</option><option value="380V">380V</option><option value="220V">220V</option></select></div>
          </>
        )
      case 'BRAKE_DCEM':
      case 'BRAKE_EHT':
        return (
          <>
            <div className="flex flex-col"><label className="text-[12px] font-bold text-slate-500 uppercase mb-2">Frame Size</label><input type="number" placeholder={formCategory === 'BRAKE_DCEM' ? "e.g. 160, 200, 300, 500" : ""} className="border border-slate-300 rounded-sm p-3 bg-white text-sm focus:ring-1 focus:ring-[#0B2545] focus:border-[#0B2545]" value={dynamicSpecs.frame_size || ''} onChange={e => updateSpec('frame_size', e.target.value)} /></div>
            <div className="flex flex-col"><label className="text-[12px] font-bold text-slate-500 uppercase mb-2">Braking Torque (Nm)</label><input type="number" className="border border-slate-300 rounded-sm p-3 bg-white text-sm focus:ring-1 focus:ring-[#0B2545] focus:border-[#0B2545]" value={dynamicSpecs.torque_nm || ''} onChange={e => updateSpec('torque_nm', e.target.value)} /></div>
          </>
        )
      case 'GEARBOX':
        return (
          <>
            <div className="flex flex-col"><label className="text-[12px] font-bold text-slate-500 uppercase mb-2">Type</label><select className="border border-slate-300 rounded-sm p-3 bg-white text-sm focus:ring-1 focus:ring-[#0B2545] focus:border-[#0B2545]" value={dynamicSpecs.type || ''} onChange={e => updateSpec('type', e.target.value)}><option value="">Select Type</option><option value="HR">HR</option><option value="VR">VR</option><option value="FGC">FGC</option><option value="HGC">HGC</option></select></div>
            <div className="flex flex-col"><label className="text-[12px] font-bold text-slate-500 uppercase mb-2">Size</label><input type="number" placeholder="350, 500, 650, 1700 etc." className="border border-slate-300 rounded-sm p-3 bg-white text-sm focus:ring-1 focus:ring-[#0B2545] focus:border-[#0B2545]" value={dynamicSpecs.size || ''} onChange={e => updateSpec('size', e.target.value)} /></div>
            <div className="flex flex-col"><label className="text-[12px] font-bold text-slate-500 uppercase mb-2">Ratio</label><input type="number" className="border border-slate-300 rounded-sm p-3 bg-white text-sm focus:ring-1 focus:ring-[#0B2545] focus:border-[#0B2545]" value={dynamicSpecs.ratio || ''} onChange={e => updateSpec('ratio', e.target.value)} /></div>
            <div className="flex flex-col"><label className="text-[12px] font-bold text-slate-500 uppercase mb-2">Output RPM</label><input type="number" className="border border-slate-300 rounded-sm p-3 bg-white text-sm focus:ring-1 focus:ring-[#0B2545] focus:border-[#0B2545]" value={dynamicSpecs.output_rpm || ''} onChange={e => updateSpec('output_rpm', e.target.value)} /></div>
          </>
        )
      case 'WIRE_ROPE':
        return (
          <>
            <div className="flex flex-col"><label className="text-[12px] font-bold text-slate-500 uppercase mb-2">Diameter (mm)</label><input type="number" className="border border-slate-300 rounded-sm p-3 bg-white text-sm focus:ring-1 focus:ring-[#0B2545] focus:border-[#0B2545]" value={dynamicSpecs.diameter_mm || ''} onChange={e => updateSpec('diameter_mm', e.target.value)} /></div>
            <div className="flex flex-col"><label className="text-[12px] font-bold text-slate-500 uppercase mb-2">Construction</label><select className="border border-slate-300 rounded-sm p-3 bg-white text-sm focus:ring-1 focus:ring-[#0B2545] focus:border-[#0B2545]" value={dynamicSpecs.construction || ''} onChange={e => updateSpec('construction', e.target.value)}><option value="">Select</option><option value="6x36">6x36</option><option value="6x19">6x19</option><option value="35W×7">35W×7</option></select></div>
            <div className="flex flex-col"><label className="text-[12px] font-bold text-slate-500 uppercase mb-2">Core</label><select className="border border-slate-300 rounded-sm p-3 bg-white text-sm focus:ring-1 focus:ring-[#0B2545] focus:border-[#0B2545]" value={dynamicSpecs.core || ''} onChange={e => updateSpec('core', e.target.value)}><option value="">Select</option><option value="FC">FC — Fibre Core</option><option value="IWRC">IWRC — Steel Core</option></select></div>
            <div className="flex flex-col"><label className="text-[12px] font-bold text-slate-500 uppercase mb-2">Grade (kg/mm²)</label><input type="number" className="border border-slate-300 rounded-sm p-3 bg-white text-sm focus:ring-1 focus:ring-[#0B2545] focus:border-[#0B2545]" value={dynamicSpecs.grade || ''} onChange={e => updateSpec('grade', e.target.value)} /></div>
          </>
        )
      case 'WHEEL':
        return (
          <>
            <div className="flex flex-col"><label className="text-[12px] font-bold text-slate-500 uppercase mb-2">Diameter (mm)</label><input type="number" className="border border-slate-300 rounded-sm p-3 bg-white text-sm focus:ring-1 focus:ring-[#0B2545] focus:border-[#0B2545]" value={dynamicSpecs.diameter_mm || ''} onChange={e => updateSpec('diameter_mm', e.target.value)} /></div>
            <div className="flex flex-col"><label className="text-[12px] font-bold text-slate-500 uppercase mb-2">Compatible Rail</label><select className="border border-slate-300 rounded-sm p-3 bg-white text-sm focus:ring-1 focus:ring-[#0B2545] focus:border-[#0B2545]" value={dynamicSpecs.compatible_rail || ''} onChange={e => updateSpec('compatible_rail', e.target.value)}><option value="">Select</option><option value="CR-60">CR-60</option><option value="CR-80">CR-80</option><option value="CR-100">CR-100</option><option value="UIC-60">UIC-60</option></select></div>
            <div className="flex flex-col"><label className="text-[12px] font-bold text-slate-500 uppercase mb-2">Material</label><select className="border border-slate-300 rounded-sm p-3 bg-white text-sm focus:ring-1 focus:ring-[#0B2545] focus:border-[#0B2545]" value={dynamicSpecs.material || ''} onChange={e => updateSpec('material', e.target.value)}><option value="">Select</option><option value="C55Mn75">C55Mn75</option><option value="EN8">EN8</option><option value="Cast Steel">Cast Steel</option></select></div>
            <div className="flex flex-col"><label className="text-[12px] font-bold text-slate-500 uppercase mb-2">Hardness BHN</label><input type="number" className="border border-slate-300 rounded-sm p-3 bg-white text-sm focus:ring-1 focus:ring-[#0B2545] focus:border-[#0B2545]" value={dynamicSpecs.hardness_bhn || ''} onChange={e => updateSpec('hardness_bhn', e.target.value)} /></div>
          </>
        )
      case 'SNATCH_BLOCK':
        return (
          <>
            <div className="flex flex-col"><label className="text-[12px] font-bold text-slate-500 uppercase mb-2">Capacity (Tonnes)</label><input type="number" className="border border-slate-300 rounded-sm p-3 bg-white text-sm focus:ring-1 focus:ring-[#0B2545] focus:border-[#0B2545]" value={dynamicSpecs.capacity || ''} onChange={e => updateSpec('capacity', e.target.value)} /></div>
            <div className="flex flex-col"><label className="text-[12px] font-bold text-slate-500 uppercase mb-2">Sheave Diameter (mm)</label><input type="number" className="border border-slate-300 rounded-sm p-3 bg-white text-sm focus:ring-1 focus:ring-[#0B2545] focus:border-[#0B2545]" value={dynamicSpecs.sheave_diameter_mm || ''} onChange={e => updateSpec('sheave_diameter_mm', e.target.value)} /></div>
            <div className="flex flex-col"><label className="text-[12px] font-bold text-slate-500 uppercase mb-2">Number of Sheaves</label><input type="number" className="border border-slate-300 rounded-sm p-3 bg-white text-sm focus:ring-1 focus:ring-[#0B2545] focus:border-[#0B2545]" value={dynamicSpecs.number_of_sheaves || ''} onChange={e => updateSpec('number_of_sheaves', e.target.value)} /></div>
            <div className="flex flex-col"><label className="text-[12px] font-bold text-slate-500 uppercase mb-2">Number of Falls</label><input type="number" placeholder="e.g. 4, 6, 8, 12" className="border border-slate-300 rounded-sm p-3 bg-white text-sm focus:ring-1 focus:ring-[#0B2545] focus:border-[#0B2545]" value={dynamicSpecs.number_of_falls || ''} onChange={e => updateSpec('number_of_falls', e.target.value)} /></div>
          </>
        )
      case 'COUPLING':
        return (
          <>
            <div className="flex flex-col"><label className="text-[12px] font-bold text-slate-500 uppercase mb-2">Type</label><select className="border border-slate-300 rounded-sm p-3 bg-white text-sm focus:ring-1 focus:ring-[#0B2545] focus:border-[#0B2545]" value={dynamicSpecs.type || ''} onChange={e => updateSpec('type', e.target.value)}><option value="">Select</option><option value="Gear">Gear</option><option value="Flexible">Flexible</option><option value="Flange">Flange</option></select></div>
            <div className="flex flex-col"><label className="text-[12px] font-bold text-slate-500 uppercase mb-2">Size</label><input type="text" className="border border-slate-300 rounded-sm p-3 bg-white text-sm focus:ring-1 focus:ring-[#0B2545] focus:border-[#0B2545]" value={dynamicSpecs.size || ''} onChange={e => updateSpec('size', e.target.value)} /></div>
            <div className="flex flex-col"><label className="text-[12px] font-bold text-slate-500 uppercase mb-2">Bore Diameter (mm)</label><input type="number" className="border border-slate-300 rounded-sm p-3 bg-white text-sm focus:ring-1 focus:ring-[#0B2545] focus:border-[#0B2545]" value={dynamicSpecs.bore_diameter_mm || ''} onChange={e => updateSpec('bore_diameter_mm', e.target.value)} /></div>
          </>
        )
      case 'OTHER':
        return (
          <div className="space-y-3">
            {customSpecs.map((spec, index) => (
              <div key={index} className="flex gap-2 items-center">
                <input type="text" placeholder="Property Name" className="flex-1 border border-slate-300 rounded-sm p-2 bg-white text-sm" value={spec.key} onChange={(e) => {
                  const newSpecs = [...customSpecs]; newSpecs[index].key = e.target.value; setCustomSpecs(newSpecs);
                }} />
                <input type="text" placeholder="Value" className="flex-1 border border-slate-300 rounded-sm p-2 bg-white text-sm" value={spec.value} onChange={(e) => {
                  const newSpecs = [...customSpecs]; newSpecs[index].value = e.target.value; setCustomSpecs(newSpecs);
                }} />
                <button type="button" onClick={() => setCustomSpecs(customSpecs.filter((_, i) => i !== index))} className="p-2 text-red-500 hover:bg-red-50 rounded-sm"><Trash className="w-4 h-4" /></button>
              </div>
            ))}
            <button type="button" onClick={() => setCustomSpecs([...customSpecs, {key: '', value: ''}])} className="text-sm text-[#0B2545] font-bold hover:underline">+ Add Property</button>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <header className="w-full sticky top-0 z-40 flex justify-between items-center h-16 px-8 bg-[#F9F9FF] border-b border-slate-200">
        <div className="flex items-center space-x-6">
          <h1 className="font-semibold text-2xl text-[#0B2545]">Component Catalog</h1>
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-sm focus:border-[#0B2545] focus:ring-1 focus:ring-[#0B2545] text-sm" 
              placeholder="Search by Model..." 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => openEditSheet()}
            className="px-6 py-2.5 bg-[#0B2545] text-white font-bold text-[13px] uppercase tracking-wider rounded-sm hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add New Component
          </button>
        </div>
      </header>

      <div className="p-8 space-y-4 overflow-y-auto flex-1">
        <div className="flex items-center justify-between bg-white p-4 border border-slate-300 shadow-sm rounded-sm">
          <div className="flex space-x-4">
            <div className="flex flex-col">
              <label className="text-[12px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Category</label>
              <select 
                className="border border-slate-300 py-2 px-3 bg-white text-sm focus:ring-1 focus:ring-[#0B2545] focus:border-[#0B2545] min-w-[200px] rounded-sm"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-300 shadow-sm rounded-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0B2545] text-white border-b border-slate-300">
                <th className="p-4 text-[12px] font-bold uppercase tracking-widest">Category</th>
                <th className="p-4 text-[12px] font-bold uppercase tracking-widest">Model</th>
                <th className="p-4 text-[12px] font-bold uppercase tracking-widest">Unit Price</th>
                <th className="p-4 text-[12px] font-bold uppercase tracking-widest">Specs</th>
                <th className="p-4 text-[12px] font-bold uppercase tracking-widest text-center">Status</th>
                <th className="p-4 text-[12px] font-bold uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="p-4"><Skeleton className="h-6 w-16" /></td>
                    <td className="p-4"><Skeleton className="h-5 w-32" /></td>
                    <td className="p-4"><Skeleton className="h-5 w-20" /></td>
                    <td className="p-4"><Skeleton className="h-5 w-48" /></td>
                    <td className="p-4 flex justify-center"><Skeleton className="h-6 w-12" /></td>
                    <td className="p-4 text-right"><Skeleton className="h-8 w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : isError ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-red-500">
                    Failed to load components. <button onClick={() => refetch()} className="underline">Retry</button>
                  </td>
                </tr>
              ) : filteredComponents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No components found.
                  </td>
                </tr>
              ) : (
                filteredComponents.map((comp: any) => (
                  <tr key={comp.id} className={`hover:bg-slate-50 transition-colors group ${!comp.is_active ? 'opacity-50' : ''}`}>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-[10px] font-black uppercase tracking-tighter rounded-sm">{comp.category}</span>
                    </td>
                    <td className="p-4 text-sm font-medium text-[#0B2545]">{comp.model}</td>
                    <td className="p-4 text-sm font-bold">
                      <div className="flex items-center gap-1 group/price cursor-text" onClick={(e) => {
                        const newPrice = prompt("Enter new price:", comp.unit_price)
                        if (newPrice && !isNaN(Number(newPrice))) {
                          inlinePriceMutation.mutate({ id: comp.id, unit_price: Number(newPrice) })
                        }
                      }}>
                        ${comp.unit_price.toFixed(2)}
                        <Edit2 className="w-3 h-3 text-slate-300 opacity-0 group-hover/price:opacity-100" />
                      </div>
                    </td>
                    <td className="p-4 text-sm text-slate-500 italic max-w-[200px] truncate">
                      {JSON.stringify(comp.specs)}
                    </td>
                    <td className="p-4 text-center">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          checked={comp.is_active}
                          onChange={(e) => toggleMutation.mutate({ id: comp.id, is_active: e.target.checked })}
                          className="sr-only peer" 
                          type="checkbox" 
                        />
                        <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0B2545]"></div>
                      </label>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button onClick={() => openEditSheet(comp)} className="p-1.5 hover:bg-blue-50 text-[#0B2545] transition-all rounded-sm">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => {
                        if (confirm('Are you sure you want to delete this component?')) {
                          deleteMutation.mutate(comp.id)
                        }
                      }} className="p-1.5 hover:bg-red-50 text-red-600 transition-all rounded-sm">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div className="p-4 flex items-center justify-between bg-slate-50 border-t border-slate-200">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Showing {filteredComponents.length} components</span>
          </div>
        </div>
      </div>

      {isSheetOpen && (
        <div 
          className="fixed inset-0 bg-[#0B2545]/40 backdrop-blur-sm z-[60] transition-opacity duration-300" 
          onClick={() => setIsSheetOpen(false)}
        />
      )}

      <div 
        className={`fixed top-0 right-0 h-screen w-[500px] bg-white z-[70] shadow-2xl transition-transform duration-300 flex flex-col border-l border-slate-300 ${isSheetOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-semibold text-[#0B2545] uppercase tracking-wider">{editId ? 'Edit Component' : 'Add Component'}</h2>
          <button className="text-[#0B2545] hover:rotate-90 transition-transform" onClick={() => setIsSheetOpen(false)}>
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="space-y-4">
            <div className="flex flex-col">
              <label className="text-[12px] font-bold text-slate-500 uppercase mb-2">Category Selection</label>
              <select 
                className="border border-slate-300 rounded-sm p-3 bg-white text-sm focus:ring-1 focus:ring-[#0B2545] focus:border-[#0B2545]"
                value={formCategory}
                onChange={handleCategoryChange}
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-[12px] font-bold text-slate-500 uppercase mb-2">Model Designation</label>
              <input 
                className="border border-slate-300 rounded-sm p-3 bg-white text-sm font-bold focus:ring-1 focus:ring-[#0B2545] focus:border-[#0B2545]" 
                type="text" 
                value={formModel}
                onChange={(e) => setFormModel(e.target.value)}
                placeholder="e.g. HEAVY-DUTY AC-450" 
              />
            </div>
            <div className="flex flex-col">
              <label className="text-[12px] font-bold text-slate-500 uppercase mb-2">Unit Base Price (USD)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">$</span>
                <input 
                  className="border border-slate-300 rounded-sm p-3 pl-8 bg-white text-sm font-mono focus:ring-1 focus:ring-[#0B2545] focus:border-[#0B2545] w-full" 
                  type="number" 
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  placeholder="0.00" 
                />
              </div>
            </div>
            
            <div className="pt-2 border-t border-slate-200 mt-6">
              <h3 className="text-sm font-bold text-[#0B2545] uppercase tracking-wider mb-4">Technical Specs</h3>
              <div className="bg-slate-50 p-4 rounded-sm border border-slate-200 space-y-4">
                {renderDynamicFields()}
              </div>
            </div>
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
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
