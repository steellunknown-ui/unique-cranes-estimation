import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateGADrawing, DrawingInput, DrawingConfig } from '@/lib/engines/drawing/ga-generator'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const id = resolvedParams.id
  
  try {
    const supabase = await createClient()

    const { data: doc, error } = await supabase
      .from('documents')
      .select('*')
      .eq('job_id', id)
      .eq('type', 'ga_drawing')
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw error

    if (!doc) {
      return NextResponse.json({ data: null })
    }

    // Fetch SVG content from storage
    const { data: fileData, error: dlError } = await supabase.storage
      .from('ga-drawings')
      .download(doc.storage_path as string)

    if (dlError) throw dlError

    const svgString = await fileData.text()

    return NextResponse.json({ 
      data: {
        id: doc.id,
        version: doc.version,
        svg_string: svgString,
        storage_path: doc.storage_path,
        created_at: doc.created_at
      }
    })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const id = resolvedParams.id
  
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    let preparedBy = 'SYSTEM'
    if (user) {
      const { data: profile } = await supabase.from('user_profiles').select('name').eq('id', user.id).single()
      if (profile) preparedBy = (profile as any).name || 'SYSTEM'
    }

    // 1. Fetch Job & Client
    const { data: job, error: jobErr } = await supabase
      .from('jobs')
      .select('ref_number, client_company')
      .eq('id', id)
      .single()
    if (jobErr) throw jobErr

    const jobRef = (job as any).ref_number
    const clientName = (job as any).client_company || 'UNKNOWN CLIENT'

    // 2. Fetch Requirements
    const { data: reqs, error: reqErr } = await supabase
      .from('job_requirements')
      .select('*')
      .eq('job_id', id)
      .single()
    
    if (reqErr || !reqs) {
      return NextResponse.json({ error: 'Job requirements not found' }, { status: 400 })
    }

    // 3. Fetch Estimation
    const { data: est } = await supabase
      .from('estimations')
      .select('*')
      .eq('job_id', id)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle()

    // 4. Fetch Drawing Config
    const { data: sysConf } = await supabase
      .from('system_config')
      .select('key, value')
      .in('key', ['head_room_mm', 'girder_depth_factor', 'end_carriage_min_width_mm', 'min_hook_approach_mh_mm', 'buffer_size_mm'])
    
    const configMap = (sysConf || []).reduce((acc: any, row) => {
      acc[row.key] = row.value
      return acc
    }, {})

    const config: DrawingConfig = {
      head_room_mm: configMap['head_room_mm'] || '3300',
      girder_depth_factor: configMap['girder_depth_factor'] || '0.055',
      end_carriage_min_width_mm: configMap['end_carriage_min_width_mm'] || '1000',
      min_hook_approach_mh_mm: configMap['min_hook_approach_mh_mm'] || '1250',
      buffer_size_mm: configMap['buffer_size_mm'] || '400'
    }

    const today = new Date()
    const dateStr = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth()+1).toString().padStart(2, '0')}/${today.getFullYear()}`

    // 5. Generate SVG
    const svgString = generateGADrawing({
      requirements: reqs as any,
      config,
      estimation: est as any,
      jobRef,
      clientName,
      preparedBy,
      date: dateStr
    })

    // 6. Quality Check
    const requiredElements = [
      'FRONT ELEVATION',
      'TECHNICAL PARTICULARS', 
      'GENERAL ARRANGEMENT',
      'UC-'
    ]
    
    for (const elem of requiredElements) {
      if (!svgString.includes(elem)) {
        console.error(`Missing element in SVG: ${elem}`)
        return NextResponse.json({ 
          error: "Drawing generation incomplete — required elements missing. Please check job requirements are complete." 
        }, { status: 500 })
      }
    }

    // 7. Get Version for Document
    const { data: prevDocs } = await supabase
      .from('documents')
      .select('version')
      .eq('job_id', id)
      .eq('type', 'ga_drawing')
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle()
      
    const version = (prevDocs?.version || 0) + 1
    const filename = `UC-${jobRef}-GA-v${version}.svg`
    const storagePath = `${id}/${filename}`

    // 8. Upload to Storage
    const { error: uploadErr } = await supabase.storage
      .from('ga-drawings')
      .upload(storagePath, svgString, {
        contentType: 'image/svg+xml',
        upsert: true
      })
      
    if (uploadErr) throw uploadErr

    // 9. Save Document Record
    const { data: newDoc, error: docErr } = await supabase
      .from('documents')
      .insert({
        job_id: id,
        type: 'ga_drawing',
        storage_path: storagePath,
        version: version,
        created_by: user?.id
      })
      .select()
      .single()

    if (docErr) throw docErr

    return NextResponse.json({ 
      data: {
        id: newDoc.id,
        version: newDoc.version,
        svg_string: svgString,
        storage_path: storagePath,
        created_at: newDoc.created_at
      }
    }, { status: 200 })

  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
