'use client'

import { useState, useEffect } from 'react'
import { Ruler, ArrowUpToLine, ArrowRightToLine, ChevronDown, ZoomIn, ZoomOut, Maximize, Anchor, Info, CheckCircle2 } from 'lucide-react'
import { useDrawingConfig, useUpdateAllDrawingConfig } from '@/lib/hooks/admin/useDrawingConfig'
import { Skeleton } from '@/components/ui/skeleton'

export default function DrawingConfig() {
  const { data: config, isLoading } = useDrawingConfig()
  const updateMutation = useUpdateAllDrawingConfig()

  const [span, setSpan] = useState('18500')
  const [height, setHeight] = useState('9000')
  const [overhang, setOverhang] = useState('1200')
  const [hoistType, setHoistType] = useState('heavy-duty')

  const [hoistPos, setHoistPos] = useState(50)

  useEffect(() => {
    if (config) {
      const sp = config.find((c: any) => c.parameter === 'DEFAULT_SPAN')
      const ht = config.find((c: any) => c.parameter === 'DEFAULT_LIFT_HEIGHT')
      const oh = config.find((c: any) => c.parameter === 'DEFAULT_OVERHANG')
      const htType = config.find((c: any) => c.parameter === 'DEFAULT_HOIST_TYPE')
      
      if (sp) setSpan(sp.value)
      if (ht) setHeight(ht.value)
      if (oh) setOverhang(oh.value)
      if (htType) setHoistType(htType.value)
    }
  }, [config])

  useEffect(() => {
    const interval = setInterval(() => {
      setHoistPos(30 + Math.random() * 40)
    }, 8000)
    return () => clearInterval(interval)
  }, [])

  const handleSave = () => {
    updateMutation.mutate([
      { parameter: 'DEFAULT_SPAN', value: span.toString(), unit: 'mm' },
      { parameter: 'DEFAULT_LIFT_HEIGHT', value: height.toString(), unit: 'mm' },
      { parameter: 'DEFAULT_OVERHANG', value: overhang.toString(), unit: 'mm' },
      { parameter: 'DEFAULT_HOIST_TYPE', value: hoistType, unit: 'string' },
    ])
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F9F9FF]">
      {/* TopBar */}
      <header className="w-full sticky top-0 z-40 flex justify-between items-center h-16 px-8 bg-white border-b border-slate-200">
        <h1 className="font-semibold text-2xl text-[#0B2545]">Drawing Configuration</h1>
        <button 
          onClick={handleSave}
          disabled={updateMutation.isPending || isLoading}
          className="bg-[#E67E22] text-white px-6 py-2 font-bold uppercase text-xs tracking-wider rounded-sm hover:brightness-110 transition-all disabled:opacity-50"
        >
          {updateMutation.isPending ? 'Saving...' : 'Save Defaults'}
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-[1440px] mx-auto h-full min-h-[600px]">
          
          {/* Left Column: Configuration Form */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <section className="bg-white border border-slate-300 p-6 shadow-sm rounded-sm h-full flex flex-col">
              <div className="mb-8">
                <h3 className="text-xl font-bold text-[#0B2545] mb-2">Technical Parameters</h3>
                <p className="text-sm text-slate-500">Define the baseline geometric constraints for automated drafting.</p>
              </div>
              
              <div className="space-y-6 flex-1">
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                  ))
                ) : (
                  <>
                    <div className="group">
                      <label className="block text-xs font-bold text-[#0B2545] uppercase mb-2">Default Span (mm)</label>
                      <div className="relative">
                        <input 
                          className="w-full bg-white border border-slate-300 focus:border-[#0B2545] focus:ring-1 focus:ring-[#0B2545] px-4 py-3 font-mono outline-none transition-all rounded-sm" 
                          type="number" 
                          value={span}
                          onChange={(e) => setSpan(e.target.value)}
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                          <Ruler className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="group">
                      <label className="block text-xs font-bold text-[#0B2545] uppercase mb-2">Lift Height (mm)</label>
                      <div className="relative">
                        <input 
                          className="w-full bg-white border border-slate-300 focus:border-[#0B2545] focus:ring-1 focus:ring-[#0B2545] px-4 py-3 font-mono outline-none transition-all rounded-sm" 
                          type="number" 
                          value={height}
                          onChange={(e) => setHeight(e.target.value)}
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                          <ArrowUpToLine className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="group">
                      <label className="block text-xs font-bold text-[#0B2545] uppercase mb-2">Overhang (mm)</label>
                      <div className="relative">
                        <input 
                          className="w-full bg-white border border-slate-300 focus:border-[#0B2545] focus:ring-1 focus:ring-[#0B2545] px-4 py-3 font-mono outline-none transition-all rounded-sm" 
                          type="number" 
                          value={overhang}
                          onChange={(e) => setOverhang(e.target.value)}
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                          <ArrowRightToLine className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="group">
                      <label className="block text-xs font-bold text-[#0B2545] uppercase mb-2">Hoist Type</label>
                      <div className="relative">
                        <select 
                          className="w-full bg-white border border-slate-300 focus:border-[#0B2545] focus:ring-1 focus:ring-[#0B2545] px-4 py-3 text-sm font-medium outline-none transition-all appearance-none cursor-pointer rounded-sm"
                          value={hoistType}
                          onChange={(e) => setHoistType(e.target.value)}
                        >
                          <option value="standard">Standard</option>
                          <option value="heavy-duty">Heavy Duty</option>
                          <option value="low-headroom">Low Headroom</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                          <ChevronDown className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </>
                )}
                
                <div className="mt-8 pt-8 border-t border-slate-200">
                  <div className="flex items-center gap-3 p-4 bg-blue-50 border border-[#0B2545] rounded-sm">
                    <Info className="text-[#0B2545] w-5 h-5" />
                    <p className="text-xs font-bold text-[#0B2545] tracking-wider uppercase">CHANGES ARE LOGGED AS VERSION 4.2.1-BETA</p>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column: Technical Preview */}
          <div className="lg:col-span-7 flex flex-col h-full gap-4">
            <div className="flex-grow bg-[#001026] border border-[#0B2545] relative overflow-hidden flex flex-col rounded-sm">
              <div className="p-4 bg-[#051c38] border-b border-[#0B2545] flex justify-between items-center">
                <span className="text-xs font-bold text-blue-300 uppercase tracking-wider">TECHNICAL PREVIEW // LIVE VIEWPORT</span>
                <div className="flex gap-2 text-blue-300">
                  <button className="p-1 hover:bg-[#0B2545] rounded-sm"><ZoomIn className="w-4 h-4" /></button>
                  <button className="p-1 hover:bg-[#0B2545] rounded-sm"><ZoomOut className="w-4 h-4" /></button>
                  <button className="p-1 hover:bg-[#0B2545] rounded-sm"><Maximize className="w-4 h-4" /></button>
                </div>
              </div>
              
              <div 
                className="flex-grow relative p-12 flex items-center justify-center"
                style={{
                  backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)`,
                  backgroundSize: '20px 20px'
                }}
              >
                <div className="relative w-full max-w-2xl h-64 border-l-2 border-r-2 border-dashed border-blue-400/30">
                  <div className="absolute top-1/4 left-0 w-full h-8 bg-blue-300 border border-white/20 flex items-center justify-center overflow-hidden">
                    <div 
                      className="w-full h-full opacity-10" 
                      style={{ background: 'repeating-linear-gradient(45deg, #000, #000 10px, transparent 10px, transparent 20px)' }}
                    />
                    <span className="absolute text-[8px] font-bold text-[#001026] tracking-wider uppercase">UC-SERIES GIRD-V2</span>
                  </div>
                  
                  <div 
                    className="absolute top-1/4 mt-8 w-16 h-12 bg-[#E67E22] border border-white/20 transition-all duration-1000 ease-in-out z-10" 
                    style={{ left: `${hoistPos}%`, transform: 'translateX(-50%)' }}
                  >
                    <div className="w-full h-1 bg-black/20 mt-1"></div>
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-6 bg-blue-300/50 border-x border-white/20"></div>
                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-white">
                      <div className="w-6 h-6 border-2 border-white rounded-full border-t-transparent border-r-transparent rotate-45" />
                    </div>
                  </div>
                  
                  <div className="absolute -top-12 left-0 w-full h-4">
                    <div className="relative w-full h-px bg-blue-300">
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-px h-4 bg-blue-300"></div>
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-blue-300"></div>
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#001026] px-2">
                        <span className="text-blue-300 font-mono text-[10px] uppercase tracking-widest">SPAN: {span}mm</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="absolute top-1/4 -right-12 h-48 w-4">
                    <div className="relative w-px h-full bg-blue-300 ml-auto">
                      <div className="absolute top-0 right-1/2 translate-x-1/2 w-4 h-px bg-blue-300"></div>
                      <div className="absolute bottom-0 right-1/2 translate-x-1/2 w-4 h-px bg-blue-300"></div>
                      <div className="absolute top-1/2 right-1/2 translate-x-full -translate-y-1/2 bg-[#001026] py-1 px-2 rotate-90 whitespace-nowrap">
                        <span className="text-blue-300 font-mono text-[10px] uppercase tracking-widest">LIFT: {height}mm</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="absolute bottom-0 left-0 w-8 h-40 bg-white/5 border-t border-r border-white/10"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-40 bg-white/5 border-t border-l border-white/10"></div>
                </div>
              </div>
              
              <div className="p-6 bg-[#051c38] grid grid-cols-3 gap-4 border-t border-[#0B2545]">
                <div>
                  <p className="text-[10px] font-bold text-blue-200 uppercase mb-1">DEFLECTION RATIO</p>
                  <p className="font-mono text-white text-sm">L/750</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-blue-200 uppercase mb-1">STRESS ANALYSIS</p>
                  <p className="font-mono text-green-400 text-sm">NOMINAL</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-blue-200 uppercase mb-1">REF CODE</p>
                  <p className="font-mono text-white text-sm">FEM 1.001</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border border-slate-300 p-4 shadow-sm rounded-sm">
                <h4 className="text-xs font-bold text-[#0B2545] mb-3 uppercase tracking-wider">MATERIAL SPECIFICATIONS</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs border-b border-slate-100 pb-1">
                    <span className="text-slate-500">Girder Material</span>
                    <span className="font-bold text-[#0B2545]">S355JR Steel</span>
                  </div>
                  <div className="flex justify-between text-xs border-b border-slate-100 pb-1">
                    <span className="text-slate-500">Trolley Rail</span>
                    <span className="font-bold text-[#0B2545]">Square Bar 50x30</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">End Carriage</span>
                    <span className="font-bold text-[#0B2545]">Hollow Profile</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white border border-slate-300 p-4 flex flex-col justify-center items-center text-center shadow-sm rounded-sm">
                <CheckCircle2 className={`w-8 h-8 mb-2 ${updateMutation.isSuccess ? 'text-green-500' : 'text-slate-300'}`} />
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {updateMutation.isSuccess ? 'CONFIGURATION SYNCED' : 'READY TO SYNC'}
                </p>
                {updateMutation.isSuccess && <p className="text-[10px] text-slate-400 mt-1">Recently updated</p>}
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  )
}
