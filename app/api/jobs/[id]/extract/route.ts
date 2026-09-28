import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
const mammoth = require('mammoth');

export const dynamic = 'force-dynamic'

// Extract text from PDF buffer using pdf2json (pure Node.js, no canvas, no worker)
async function extractPdfText(buffer: Buffer): Promise<string> {
  const PDFParser = require('pdf2json')
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser(null, true) // second param = raw text mode
    pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
      try {
        const safeDecodeURI = (str: string) => { try { return decodeURIComponent(str) } catch { return str } }
        const pages: string[] = pdfData.Pages.map((page: any, idx: number) => {
          const pageText = page.Texts
            .map((t: any) => t.R.map((r: any) => safeDecodeURI(r.T)).join(''))
            .join(' ')
          return `\n--- Page ${idx + 1} ---\n${pageText}`
        })
        resolve(pages.join(''))
      } catch (e) {
        reject(e)
      }
    })
    pdfParser.on('pdfParser_dataError', (err: any) => reject(err))
    pdfParser.parseBuffer(buffer)
  })
}

const EXTRACTOR_PROMPT = `
You are an expert engineering AI reading a massive technical document for a crane manufacturing job.
Here is the text extracted from the document:

{documentText}

---
Your job is to find the values for the following crane parameters.
Return ONLY a valid JSON object. For each field, provide the "value". If it's missing, set "value": null.

{
  "crane_type": { "value": null, "instructions": "MUST be exactly one of: 'EOT', 'HOT', 'Gantry', 'Jib', 'Semi-Gantry'." },
  "quantity": { "value": null, "instructions": "MUST be an integer number only." },
  "location_type": { "value": null, "instructions": "MUST be exactly one of: 'Indoor', 'Outdoor', 'Semi-Outdoor'." },
  "control_type": { "value": null, "instructions": "MUST be exactly one of: 'Open Cabin', 'Closed Cabin A/C', 'Floor Pendant', 'Radio Remote'." },
  "mh_capacity": { "value": null, "unit": "tonnes" },
  "ah_capacity": { "value": null, "unit": "tonnes" },
  "span": { "value": null, "unit": "metres" },
  "mh_lift": { "value": null, "unit": "metres" },
  "ah_lift": { "value": null, "unit": "metres" },
  "bay_length": { "value": null, "unit": "metres" },
  "mh_speed": { "value": null, "unit": "m/min" },
  "ah_speed": { "value": null, "unit": "m/min" },
  "ct_speed": { "value": null, "unit": "m/min" },
  "lt_speed": { "value": null, "unit": "m/min" },
  "micro_speed": { "value": null, "instructions": "true or false" },
  "ambient_temp": { "value": null, "unit": "degC" },
  "duty_class": { "value": null, "instructions": "MUST be exactly one of: 'M3', 'M4', 'M5', 'M6'." },
  "vvvf_required": { "value": null, "instructions": "true or false" },
  "power_supply": { "value": null },
  "rail_size": { "value": null, "instructions": "MUST be exactly one of: 'CR-60', 'CR-80', 'CR-100', 'UIC-60'." },
  "dsl_type": { "value": null, "instructions": "MUST be exactly one of: 'Copper Shrouded', 'Festoon Cable', 'G.I. Pipe'." }
}
`

const VERIFIER_PROMPT = `
You are the QA Engineer AI. You are reviewing the extraction made by another AI from this same document.
Here is what the Extractor found:
{extractorResult}

Here is the raw text from the document for your reference:
{documentText}

Your job is to look at the document and verify these findings.
For EVERY field, provide the "value" (correcting it if the Extractor was wrong), a "confidence" score (0.0 to 1.0) based on how clearly it is stated in the document, and a "citation" string pointing to the exact context or section where you found it (e.g., "Found near: Span is 15m..."). If the value is completely missing in the document, set value: null and citation: null.

Return ONLY a valid JSON object matching the keys from the extraction.
`

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const resolvedParams = await params
  const jobId = resolvedParams.id

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const sendLog = (message: string, type: 'info' | 'success' | 'error' | 'done' = 'info', data?: any) => {
        const payload = JSON.stringify({ message, type, data })
        controller.enqueue(encoder.encode(`data: ${payload}\n\n`))
      }

      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Unauthorized')

        const body = await request.json()
        const { storage_path } = body
        if (!storage_path) throw new Error('Missing storage_path')

        const fileName = storage_path.split('/').pop() || 'document.pdf'
        const ext = fileName.split('.').pop()?.toLowerCase()

        sendLog(`Downloading document (${fileName}) from secure storage...`)

        // 1. Download file
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('client-documents')
          .download(storage_path)

        if (downloadError || !fileData) {
          throw new Error('Failed to retrieve document from storage')
        }

        const buffer = Buffer.from(await fileData.arrayBuffer())

        // 2. Parse Text
        sendLog(`Parsing raw text from ${ext?.toUpperCase()} file...`)
        let documentText = ''

        if (ext === 'pdf') {
          documentText = await extractPdfText(buffer)
          const pageCount = (documentText.match(/--- Page /g) || []).length
          sendLog(`Parsed PDF successfully. Found ${pageCount} pages. Extracted ${documentText.length} characters.`)
        } else if (ext === 'docx' || ext === 'doc') {
          const result = await mammoth.extractRawText({ buffer })
          documentText = result.value
          sendLog(`Parsed DOCX successfully. Extracted ${documentText.length} characters.`)
        } else {
          throw new Error('Unsupported file format. Please upload PDF or DOCX.')
        }

        // Limit text length to prevent context limit errors for free models (approx 50k chars)
        // For production, you'd chunk this properly.
        if (documentText.length > 80000) {
          sendLog(`Document is massive. Truncating for AI processing...`, 'info')
          documentText = documentText.substring(0, 80000)
        }

        const extractorKey = process.env.OPENROUTER_EXTRACTOR_API_KEY
        const extractorModel = process.env.OPENROUTER_EXTRACTOR_MODEL || 'nvidia/nemotron-3.5-lightning:free'
        const verifierKey = process.env.OPENROUTER_VERIFIER_API_KEY
        const verifierModel = process.env.OPENROUTER_VERIFIER_MODEL || 'minimax/minimax-m3:free'

        if (!extractorKey || !verifierKey) throw new Error('OpenRouter API Keys not configured')

        // 3. Extractor Agent
        sendLog(`[Extractor Agent] Starting analysis using ${extractorModel}...`)
        const extractPrompt = EXTRACTOR_PROMPT.replace('{documentText}', documentText)
        
        const extractResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${extractorKey}`,
            'HTTP-Referer': 'http://localhost:3000',
            'X-Title': 'Unique Cranes ERP'
          },
          body: JSON.stringify({
            model: extractorModel,
            messages: [{ role: 'user', content: extractPrompt }],
            temperature: 0.1,
            response_format: { type: 'json_object' }
          })
        })

        if (!extractResponse.ok) throw new Error(`Extractor API failed: ${extractResponse.statusText}`)
        
        const extractorResult = await extractResponse.json()
        const rawExtractorJson = extractorResult.choices?.[0]?.message?.content || '{}'
        
        sendLog(`[Extractor Agent] Successfully extracted raw parameters!`, 'success')
        sendLog(`[Extractor Agent] Data found: \n${rawExtractorJson.slice(0, 100)}...`)

        // 4. Verifier Agent
        sendLog(`[Verifier Agent] Calling QA AI (${verifierModel}) to verify extracted data against source document...`)
        const verifyPrompt = VERIFIER_PROMPT.replace('{extractorResult}', rawExtractorJson).replace('{documentText}', documentText)

        const verifyResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${verifierKey}`,
            'HTTP-Referer': 'http://localhost:3000',
            'X-Title': 'Unique Cranes ERP'
          },
          body: JSON.stringify({
            model: verifierModel,
            messages: [{ role: 'user', content: verifyPrompt }],
            temperature: 0.1,
            response_format: { type: 'json_object' }
          })
        })

        if (!verifyResponse.ok) throw new Error(`Verifier API failed: ${verifyResponse.statusText}`)
        
        const verifierResult = await verifyResponse.json()
        let rawJsonString = verifierResult.choices?.[0]?.message?.content
        if (!rawJsonString) throw new Error('Empty response from Verifier model')

        sendLog(`[Verifier Agent] Verification complete! Validating JSON output...`)

        let parsedData
        try {
          let jsonStr = rawJsonString.trim()
          if (jsonStr.startsWith('```json')) jsonStr = jsonStr.replace(/^```json/, '').replace(/```$/, '').trim()
          else if (jsonStr.startsWith('```')) jsonStr = jsonStr.replace(/^```/, '').replace(/```$/, '').trim()
          parsedData = JSON.parse(jsonStr)
        } catch (e) {
          throw new Error('Failed to parse Verifier AI output as JSON')
        }

        sendLog(`[System] Processing and formatting verified requirements...`)

        const fieldConfidence: Record<string, number> = {}
        const fieldCitations: Record<string, string> = {}
        const missingFields: string[] = []
        const requirementsUpdates: Record<string, any> = {}
        let extractedCount = 0

        const { data: existingReqs } = await supabase.from('job_requirements').select('*').eq('job_id', jobId).single()
        const currentReqs: Record<string, any> = existingReqs || {}

        Object.entries(parsedData).forEach(([key, data]: [string, any]) => {
          if (data && typeof data === 'object') {
            fieldConfidence[key] = data.confidence || 0
            fieldCitations[key] = data.citation || ''
            if (data.value === null || data.value === undefined) {
              missingFields.push(key)
            } else {
              extractedCount++
              if (currentReqs[key] === null || currentReqs[key] === undefined) {
                requirementsUpdates[key] = data.value
              }
            }
          }
        })

        sendLog(`[System] Saving ${extractedCount} extracted parameters to database...`)

        const { data: extractionRecord, error: extractInsertError } = await supabase
          .from('ai_extractions')
          .insert({
            job_id: jobId,
            raw_extraction: parsedData,
            field_confidence: fieldConfidence,
            missing_fields: missingFields
          })
          .select()
          .single()

        if (extractInsertError) throw new Error('Failed to save extraction record')

        if (Object.keys(requirementsUpdates).length > 0) {
          if (requirementsUpdates.micro_speed !== undefined) requirementsUpdates.micro_speed = !!requirementsUpdates.micro_speed
          if (requirementsUpdates.vvvf_required !== undefined) requirementsUpdates.vvvf_required = !!requirementsUpdates.vvvf_required

          if (!existingReqs) {
            await supabase.from('job_requirements').insert({ job_id: jobId, ...(requirementsUpdates as any) })
          } else {
            await supabase.from('job_requirements').update(requirementsUpdates as any).eq('job_id', jobId)
          }
        }

        await supabase.from('jobs').update({ status: 'review' }).eq('id', jobId)

        sendLog(`Process complete! Redirecting...`, 'done')

      } catch (err: any) {
        sendLog(err.message || 'An error occurred', 'error')
        await supabase.from('jobs').update({ status: 'draft' }).eq('id', jobId)
      } finally {
        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  })
}
