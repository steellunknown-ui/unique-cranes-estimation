'use client'

import React, { useState, useCallback, use, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { UploadCloud, FileText, X, CheckCircle2, Loader2, AlertCircle, TerminalSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDropzone } from 'react-dropzone'

export default function JobUploadPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const resolvedParams = use(params)
  const jobId = resolvedParams.id
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  
  const [step, setStep] = useState(0)
  const [file, setFile] = useState<File | null>(null)

  const [logs, setLogs] = useState<{message: string, type: string}[]>([])
  const logsEndRef = useRef<HTMLDivElement>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles?.[0]) {
      setFile(acceptedFiles[0])
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc']
    },
    maxFiles: 1
  })

  // Auto-scroll the terminal to bottom when new logs arrive
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs])

  const handleUpload = async () => {
    if (!file) return
    setErrorMsg(null)
    setStep(1)
    setLogs([{ message: 'Initializing secure connection...', type: 'info' }])
    
    try {
      // 1. Upload to Supabase Storage
      const formData = new FormData()
      formData.append('file', file)
      
      const uploadRes = await fetch(`/api/jobs/${jobId}/upload`, {
        method: 'POST',
        body: formData
      })

      if (!uploadRes.ok) throw new Error('Upload failed')
      const uploadData = await uploadRes.json()

      // 2. Start Extraction Process via SSE
      const extractRes = await fetch(`/api/jobs/${jobId}/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storage_path: uploadData.data.storage_path })
      })

      if (!extractRes.body) throw new Error('No streaming response body from server')

      const reader = extractRes.body.getReader()
      const decoder = new TextDecoder()
      let done = false

      while (!done) {
        const { value, done: readerDone } = await reader.read()
        done = readerDone
        if (value) {
          const chunk = decoder.decode(value, { stream: true })
          const events = chunk.split('\n\n').filter(e => e.startsWith('data: '))
          
          for (const event of events) {
            const jsonStr = event.replace('data: ', '')
            let parsed;
            try {
              parsed = JSON.parse(jsonStr)
              
              if (parsed.type === 'done') {
                 setLogs(prev => [...prev, { message: parsed.message, type: 'success' }])
                 setTimeout(() => router.push(`/jobs/${jobId}/requirements`), 1000)
                 return
              } else if (parsed.type === 'error') {
                 throw new Error(parsed.message)
              } else {
                setLogs(prev => [...prev, { message: parsed.message, type: parsed.type }])
              }
            } catch (e) {
               // malformed json chunk or error thrown from parsed.type === 'error'
               if (e instanceof Error && parsed?.type === 'error') throw e;
            }
          }
        }
      }
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.message || 'An error occurred during AI extraction.')
      setStep(0)
    }
  }

  return (
    <div className="max-w-3xl mx-auto mt-12 p-6 h-[80vh] flex flex-col">
      <div className="text-center mb-8 shrink-0">
        <h1 className="text-2xl font-bold text-[#0B2545] mb-2">Upload Technical Document</h1>
        <p className="text-slate-600">
          Upload massive client PDFs or DOCX files. Our dual-AI engine will parse and extract all technical crane specifications in real-time.
        </p>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex flex-col items-center justify-center space-y-4 shrink-0">
          <div className="flex items-center space-x-2 text-red-600 font-medium">
            <AlertCircle className="w-5 h-5" />
            <span>{errorMsg}</span>
          </div>
          <Button 
            variant="outline" 
            onClick={() => router.push(`/jobs/${jobId}/requirements`)}
          >
            Continue to Manual Entry
          </Button>
        </div>
      )}

      {step === 0 ? (
        <div className="space-y-6 shrink-0">
          <div 
            {...getRootProps()} 
            className={`
              border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-[#0B2545] bg-[#0B2545]/5' : 'border-slate-300 hover:border-[#0B2545]/50'}
              ${file ? 'bg-slate-50 border-slate-300' : ''}
            `}
          >
            <input {...getInputProps()} />
            
            {file ? (
              <div className="flex flex-col items-center space-y-4">
                <FileText className="w-16 h-16 text-[#0B2545] opacity-80" />
                <div>
                  <p className="font-medium text-slate-900">{file.name}</p>
                  <p className="text-sm text-slate-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={(e) => { e.stopPropagation(); setFile(null) }}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="w-4 h-4 mr-2" /> Remove File
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-4">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
                  <UploadCloud className="w-10 h-10 text-[#0B2545]" />
                </div>
                <div>
                  <p className="font-medium text-slate-900 text-lg">Drag & drop PDF or DOCX here, or click to browse</p>
                  <p className="text-sm text-slate-500 mt-1">Supports massive documents up to 100MB</p>
                </div>
              </div>
            )}
          </div>

          <Button 
            className="w-full bg-[#0B2545] hover:bg-[#0B2545]/90 text-white py-6 text-lg" 
            disabled={!file}
            onClick={handleUpload}
          >
            Start Dual-AI Extraction
          </Button>
        </div>
      ) : (
        <div className="flex-1 bg-[#0d1117] border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col min-h-0">
          {/* Terminal Header */}
          <div className="bg-[#161b22] px-4 py-3 flex items-center justify-between border-b border-slate-800 shrink-0">
            <div className="flex items-center space-x-2 text-slate-400 font-mono text-sm">
              <TerminalSquare className="w-4 h-4" />
              <span>AI Engine Logs</span>
            </div>
            <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
          </div>
          
          {/* Terminal Body */}
          <div className="p-4 overflow-y-auto font-mono text-[13px] flex-1 min-h-0 space-y-2">
            {logs.map((log, index) => (
              <div 
                key={index} 
                className={`flex items-start break-words whitespace-pre-wrap ${
                  log.type === 'success' ? 'text-green-400' :
                  log.type === 'error' ? 'text-red-400' :
                  'text-slate-300'
                }`}
              >
                <span className="text-slate-600 mr-3 shrink-0">{'>'}</span>
                <span>{log.message}</span>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        </div>
      )}
    </div>
  )
}
