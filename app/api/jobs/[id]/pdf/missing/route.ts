import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateMissingFieldsHTML } from '@/lib/pdf/templates/missing-fields.template'
import { generatePDF } from '@/lib/pdf/generate-pdf'
import { detectMissingFields } from '@/lib/engines/validation/missing-fields-detector'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params
    const id = resolvedParams.id
    
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: job, error: jobErr } = await supabase
      .from('jobs')
      .select('ref_number, client_company, client_name, client_email')
      .eq('id', id)
      .single()
    if (jobErr) throw jobErr

    const { data: reqs, error: reqErr } = await supabase
      .from('job_requirements')
      .select('*')
      .eq('job_id', id)
      .single()
    if (reqErr) throw reqErr

    const { data: configData } = await supabase.from('system_config').select('*')
    const companyConfig = (configData || []).reduce((acc: any, row: any) => {
      acc[row.key] = row.value
      return acc
    }, {})

    const missingFields = detectMissingFields(reqs, reqs.ah_required)
    if (missingFields.length === 0) {
      return new NextResponse('No missing fields to report', { status: 400 })
    }

    const html = generateMissingFieldsHTML({
      job: { ref_number: job.ref_number },
      client: {
        company: job.client_company,
        name: job.client_name,
        email: job.client_email
      },
      missingFields,
      today: new Date().toLocaleDateString('en-IN'),
      companyConfig
    })

    const pdfBuffer = await generatePDF(html)
    const filename = `${job.ref_number}-MissingInfo.pdf`

    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      }
    })

  } catch (error: any) {
    console.error('Missing Info PDF error:', error)
    return new NextResponse(error.message, { status: 500 })
  }
}
