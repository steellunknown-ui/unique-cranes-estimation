import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateQuotationHTML } from '@/lib/pdf/templates/quotation.template'
import { generatePDF } from '@/lib/pdf/generate-pdf'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params
    const id = resolvedParams.id
    const body = await req.json()
    const { preparedBy, includeGST } = body

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Fetch Job & Client
    const { data: job, error: jobErr } = await supabase
      .from('jobs')
      .select('ref_number, created_at, client_name, client_company, client_email, client_phone, client_address')
      .eq('id', id)
      .single()
    if (jobErr) throw jobErr

    // Fetch Requirements
    const { data: reqs, error: reqErr } = await supabase
      .from('job_requirements')
      .select('*')
      .eq('job_id', id)
      .single()
    if (reqErr) throw reqErr

    // Fetch Latest Estimation
    const { data: estimation, error: estErr } = await supabase
      .from('estimations')
      .select('*')
      .eq('job_id', id)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle()
      
    if (estErr || !estimation) {
      return NextResponse.json({ error: 'Please generate estimation first' }, { status: 400 })
    }

    // Fetch Latest GA Drawing from Supabase Storage via documents table
    const { data: gaDoc } = await supabase
      .from('documents')
      .select('storage_path')
      .eq('job_id', id)
      .eq('type', 'ga_drawing')
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle()

    let svgDrawing: string | null = null
    if (gaDoc?.storage_path) {
      const { data: fileData, error: fileErr } = await supabase.storage
        .from('generated-drawings')
        .download(gaDoc.storage_path)
      if (!fileErr && fileData) {
        svgDrawing = await fileData.text()
      }
    }

    // Fetch config
    const { data: configData } = await supabase.from('system_config').select('*')
    const companyConfig = (configData || []).reduce((acc: any, row: any) => {
      acc[row.key] = row.value
      return acc
    }, {})

    const html = generateQuotationHTML({
      job: { ref_number: (job as any).ref_number, created_at: (job as any).created_at },
      client: { 
        name: (job as any).client_name, 
        company: (job as any).client_company,
        address: (job as any).client_address,
        email: (job as any).client_email,
        phone: (job as any).client_phone
      },
      requirements: reqs,
      estimation,
      svgDrawing,
      preparedBy,
      companyConfig,
      includeGST
    })

    const pdfBuffer = await generatePDF(html)

    // Versioning
    const { data: prevDocs } = await supabase
      .from('documents')
      .select('version')
      .eq('job_id', id)
      .eq('type', 'quotation')
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle()
      
    const newVersion = prevDocs?.version ? prevDocs.version + 1 : 1
    const filename = `${(job as any).ref_number}-Quotation-v${newVersion}.pdf`
    const storagePath = `${id}/${filename}`

    const { error: uploadErr } = await supabase.storage
      .from('generated-quotations')
      .upload(storagePath, pdfBuffer, { contentType: 'application/pdf', upsert: true })
    if (uploadErr) throw uploadErr

    await supabase.from('documents').insert({
      job_id: id,
      type: 'quotation',
      storage_path: storagePath,
      version: newVersion,
      created_by: user.id
    })

    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      }
    })

  } catch (error: any) {
    console.error('Quotation PDF error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
