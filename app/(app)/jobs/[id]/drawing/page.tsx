"use client"

import { useState, use, useRef, useEffect } from "react"
import { useDrawing, useGenerateDrawing, useDrawingPDF } from "@/lib/hooks/app/useDrawing"
import { Button } from "@/components/ui/button"
import { Ruler, Loader2, Download, Printer, ZoomIn, ZoomOut, Maximize, RotateCcw } from "lucide-react"

export default function DrawingPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const jobId = resolvedParams.id

  const { data: drawingResponse, isLoading: isFetching } = useDrawing(jobId)
  const generateMutation = useGenerateDrawing(jobId)
  const handlePrint = useDrawingPDF(jobId)

  const drawing = drawingResponse?.data

  const [zoom, setZoom] = useState(100)
  const containerRef = useRef<HTMLDivElement>(null)

  // Zoom to fit initial
  useEffect(() => {
    if (drawing && containerRef.current) {
      handleFit()
    }
  }, [drawing])

  const handleZoomIn = () => setZoom(z => Math.min(200, z + 25))
  const handleZoomOut = () => setZoom(z => Math.max(25, z - 25))
  
  const handleFit = () => {
    if (!containerRef.current) return
    const container = containerRef.current
    // A1 landscape is approx 1600x1100 ratio
    const cw = container.clientWidth - 80 // padding
    const ch = container.clientHeight - 80
    
    // Scale needed to fit width or height
    const scaleW = cw / 1600
    const scaleH = ch / 1100
    const fitScale = Math.min(scaleW, scaleH)
    
    setZoom(Math.max(25, Math.min(200, Math.floor(fitScale * 100))))
  }

  const handleDownloadSVG = () => {
    if (!drawing?.svg_string) return
    const blob = new Blob([drawing.svg_string], { type: "image/svg+xml" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `GA-Drawing-${jobId}.svg`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleGenerate = () => {
    if (drawing) {
      if (!confirm("This will overwrite the current drawing version. Continue?")) return
    }
    generateMutation.mutate()
  }

  if (isFetching) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400 mb-4" />
        <p className="text-slate-500">Loading drawing data...</p>
      </div>
    )
  }

  if (generateMutation.isPending) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 animate-spin text-[#0B2545] mb-4" />
        <h2 className="text-xl font-semibold text-slate-800">Generating General Arrangement drawing...</h2>
        <p className="text-slate-500 mt-2">Running parametric calculations and generating SVG</p>
      </div>
    )
  }

  if (!drawing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-slate-50/50 rounded-xl border border-dashed border-slate-200 m-6">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
          <Ruler className="w-10 h-10 text-slate-400" />
        </div>
        <h2 className="text-xl font-semibold text-slate-800 mb-2">No drawing generated yet</h2>
        <p className="text-slate-500 max-w-md text-center mb-6">Click 'Generate Drawing' to create the GA drawing from current requirements.</p>
        <Button onClick={handleGenerate} className="px-6 py-2 bg-[#0B2545] text-white rounded-md hover:bg-[#0B2545]/90 font-medium transition-colors">
          Generate Drawing
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-slate-200 shadow-sm z-10">
        <div className="flex items-center gap-4">
          <Button onClick={handleGenerate} variant="outline" size="sm" className="text-[#0B2545] border-[#0B2545] hover:bg-slate-50">
            <RotateCcw className="w-4 h-4 mr-2" />
            Regenerate
          </Button>
          <div className="text-sm text-slate-500">
            Version {drawing.version} • Generated {new Date(drawing.created_at).toLocaleString()}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={handleDownloadSVG} variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900">
            <Download className="w-4 h-4 mr-2" />
            Download SVG
          </Button>
          <Button onClick={handlePrint} variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900 mr-4">
            <Printer className="w-4 h-4 mr-2" />
            Print / PDF
          </Button>

          <div className="h-6 w-px bg-slate-200 mx-2"></div>

          <Button onClick={handleZoomOut} variant="ghost" size="icon" className="h-8 w-8 text-slate-600" disabled={zoom <= 25}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium w-12 text-center text-slate-700">{zoom}%</span>
          <Button onClick={handleZoomIn} variant="ghost" size="icon" className="h-8 w-8 text-slate-600" disabled={zoom >= 200}>
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button onClick={handleFit} variant="ghost" size="icon" className="h-8 w-8 text-slate-600 ml-2" title="Fit to Screen">
            <Maximize className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-auto bg-slate-100 p-8 flex items-center justify-center relative"
      >
        <div 
          className="bg-white shadow-xl border border-slate-200 transition-transform duration-200 origin-center"
          style={{ 
            width: '1600px', 
            height: '1100px',
            transform: `scale(${zoom / 100})`
          }}
          dangerouslySetInnerHTML={{ __html: drawing.svg_string }}
        />
      </div>
    </div>
  )
}
