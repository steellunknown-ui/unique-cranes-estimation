import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateJobCardHTML } from '@/lib/pdf/templates/jobcard.template'
import { generatePDF } from '@/lib/pdf/generate-pdf'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params
    const id = resolvedParams.id
    const body = await req.json()
    const { preparedBy } = body

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: job, error: jobErr } = await supabase
      .from('jobs')
      .select('ref_number, created_at, client_name, client_company')
      .eq('id', id)
      .single()
    if (jobErr) throw jobErr

    const { data: reqs, error: reqErr } = await supabase
      .from('job_requirements')
      .select('*')
      .eq('job_id', id)
      .single()
    if (reqErr) throw reqErr

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

    const html = generateJobCardHTML({
      job: { ref_number: (job as any).ref_number, created_at: (job as any).created_at },
      client: { name: (job as any).client_name, company: (job as any).client_company },
      requirements: reqs,
      estimation,
      preparedBy
    })

    const pdfBuffer = await generatePDF(html)

    const { data: prevDocs } = await supabase
      .from('documents')
      .select('version')
      .eq('job_id', id)
      .eq('type', 'job_card')
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle()
      
    const newVersion = prevDocs?.version ? prevDocs.version + 1 : 1
    const filename = `${(job as any).ref_number}-JobCard-v${newVersion}.pdf`
    const storagePath = `${id}/${filename}`

    const { error: uploadErr } = await supabase.storage
      .from('generated-quotations')
      .upload(storagePath, pdfBuffer, { contentType: 'application/pdf', upsert: true })
    if (uploadErr) throw uploadErr

    await supabase.from('documents').insert({
      job_id: id,
      type: 'job_card',
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
    console.error('JobCard PDF error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
