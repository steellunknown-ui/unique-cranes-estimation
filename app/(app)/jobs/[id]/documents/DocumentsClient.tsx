'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { FileText, ClipboardList, AlertCircle, Download, Loader2 } from 'lucide-react'
import { useDocuments, useGenerateQuotation, useGenerateJobCard, useDownloadMissingPDF } from '@/lib/hooks/app/useDocuments'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'

interface DocumentsClientProps {
  jobId: string
  jobRef: string
  preparedBy: string
  missingCount: number
  hasReqs: boolean
}

export default function DocumentsClient({ jobId, jobRef, preparedBy, missingCount, hasReqs }: DocumentsClientProps) {
  const [quotationPreparedBy, setQuotationPreparedBy] = useState(preparedBy)
  const [jobCardPreparedBy, setJobCardPreparedBy] = useState(preparedBy)
  const [includeGST, setIncludeGST] = useState(true)

  const { data: documents, isLoading: docsLoading } = useDocuments(jobId)
  const genQuotation = useGenerateQuotation(jobId, jobRef)
  const genJobCard = useGenerateJobCard(jobId, jobRef)
  const genMissing = useDownloadMissingPDF(jobId, jobRef)

  const handleDownload = async (path: string, filename: string) => {
    const supabase = createClient()
    const { data, error } = await supabase.storage.from('generated-quotations').download(path)
    if (error || !data) {
      alert('Failed to download file')
      return
    }
    const url = URL.createObjectURL(data)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getLatestVersion = (type: string) => {
    if (!documents) return null
    return documents.find((d: any) => d.type === type)
  }

  const latestQuotation = getLatestVersion('quotation')
  const latestJobCard = getLatestVersion('job_card')

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* CARD 1: QUOTATION */}
        <Card className="p-6 flex flex-col space-y-4">
          <div className="flex items-center gap-4">
            <FileText size={48} className="text-[#0B2545]" />
            <div>
              <h3 className="font-bold text-lg text-[#0B2545]">Technical &amp; Commercial Quotation</h3>
              <p className="text-sm text-gray-500">Professional client-facing quotation</p>
            </div>
          </div>
          
          <div className="space-y-2 mt-4">
            <Label>Prepared By</Label>
            <Input value={quotationPreparedBy} onChange={(e: any) => setQuotationPreparedBy(e.target.value)} />
          </div>
          
          <div className="flex items-center gap-2 mt-2">
            <Switch checked={includeGST} onCheckedChange={setIncludeGST} />
            <Label>Include GST @ 18%</Label>
          </div>

          <div className="mt-auto pt-4 space-y-2">
            <Button 
              className="w-full bg-[#0B2545] text-white hover:bg-[#0B2545]/90" 
              onClick={() => genQuotation.mutate({ preparedBy: quotationPreparedBy, includeGST })}
              disabled={genQuotation.isPending}
            >
              {genQuotation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating PDF...</> : 'Generate Quotation'}
            </Button>

            {latestQuotation && (
              <div className="text-sm text-center text-gray-500 pt-2 space-y-2">
                <div>Last generated: {new Date(latestQuotation.created_at).toLocaleDateString()} (v{latestQuotation.version})</div>
                <Button variant="outline" size="sm" className="w-full" onClick={() => handleDownload(latestQuotation.storage_path, `${jobRef}-Quotation-v${latestQuotation.version}.pdf`)}>
                  <Download className="mr-2 h-4 w-4" /> Download Previous
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* CARD 2: JOB CARD */}
        <Card className="p-6 flex flex-col space-y-4">
          <div className="flex items-center gap-4">
            <ClipboardList size={48} className="text-blue-500" />
            <div>
              <h3 className="font-bold text-lg">Internal Job Card</h3>
              <p className="text-sm text-gray-500">Component schedule for production team</p>
            </div>
          </div>
          
          <div className="space-y-2 mt-4">
            <Label>Prepared By</Label>
            <Input value={jobCardPreparedBy} onChange={(e: any) => setJobCardPreparedBy(e.target.value)} />
          </div>

          <div className="mt-auto pt-4 space-y-2">
            <Button 
              className="w-full" 
              onClick={() => genJobCard.mutate({ preparedBy: jobCardPreparedBy })}
              disabled={genJobCard.isPending}
            >
              {genJobCard.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating PDF...</> : 'Generate Job Card'}
            </Button>

            {latestJobCard && (
              <div className="text-sm text-center text-gray-500 pt-2 space-y-2">
                <div>Last generated: {new Date(latestJobCard.created_at).toLocaleDateString()} (v{latestJobCard.version})</div>
                <Button variant="outline" size="sm" className="w-full" onClick={() => handleDownload(latestJobCard.storage_path, `${jobRef}-JobCard-v${latestJobCard.version}.pdf`)}>
                  <Download className="mr-2 h-4 w-4" /> Download Previous
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* CARD 3: MISSING INFO REQUEST */}
        <Card className="p-6 flex flex-col space-y-4">
          <div className="flex items-center gap-4">
            <AlertCircle size={48} className="text-orange-500" />
            <div>
              <h3 className="font-bold text-lg">Missing Information Request</h3>
              <p className="text-sm text-gray-500">Send to client for missing data</p>
            </div>
          </div>
          
          <div className="mt-4">
            {!hasReqs ? (
              <Badge variant="destructive">No requirements generated</Badge>
            ) : missingCount === 0 ? (
              <Badge className="bg-green-500 hover:bg-green-600">All required fields complete</Badge>
            ) : (
              <Badge variant="destructive">{missingCount} fields need attention</Badge>
            )}
          </div>

          <div className="mt-auto pt-4 space-y-2">
            <Button 
              variant="outline"
              className="w-full border-orange-500 text-orange-600 hover:bg-orange-50" 
              onClick={() => genMissing.mutate()}
              disabled={genMissing.isPending || missingCount === 0}
            >
              {genMissing.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</> : <><Download className="mr-2 h-4 w-4" /> Download Missing Info PDF</>}
            </Button>
            <div className="text-xs text-center text-gray-500 pt-2">
              This PDF is not versioned &mdash; always fresh
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-12">
        <h2 className="text-xl font-bold mb-4 text-[#0B2545]">Document History</h2>
        
        {docsLoading ? (
          <div>Loading history...</div>
        ) : !documents || documents.length === 0 ? (
          <div className="p-8 text-center text-gray-500 border rounded-lg bg-gray-50">No documents generated yet</div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Filename</th>
                  <th className="px-4 py-3">Version</th>
                  <th className="px-4 py-3">Generated By</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc: any) => (
                  <tr key={doc.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">
                      {doc.type === 'quotation' ? 'Quotation' : doc.type === 'job_card' ? 'Job Card' : doc.type}
                    </td>
                    <td className="px-4 py-3 text-gray-600 truncate max-w-[200px]">
                      {doc.storage_path?.split('/').pop() || '-'}
                    </td>
                    <td className="px-4 py-3">v{doc.version}</td>
                    <td className="px-4 py-3">{doc.user_profiles?.full_name || 'Unknown'}</td>
                    <td className="px-4 py-3">{new Date(doc.created_at).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">
                      {doc.storage_path && (
                        <Button variant="ghost" size="sm" onClick={() => handleDownload(doc.storage_path, doc.storage_path?.split('/').pop()!)}>
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
