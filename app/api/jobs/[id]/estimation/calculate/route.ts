import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateEstimation } from '@/lib/engines/estimation'
import { detectMissingFields } from '@/lib/engines/validation/missing-fields-detector'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  try {
    const supabase = await createClient()

    // 1. Get latest estimation
    const { data: latest, error: getErr } = await supabase
      .from('estimations')
      .select('*')
      .eq('job_id', id)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (getErr) throw getErr

    // 2. Get version history
    const { data: versions } = await supabase
      .from('estimations')
      .select('id, version, grand_total, created_at')
      .eq('job_id', id)
      .order('version', { ascending: false })

    if (latest) {
      const l: any = latest
      const sumMh = (l.mh_breakdown || []).reduce((s:any, i:any) => s + (i.total || 0), 0)
      const sumAh = (l.ah_breakdown || []).reduce((s:any, i:any) => s + (i.total || 0), 0)
      const sumCt = (l.ct_breakdown || []).reduce((s:any, i:any) => s + (i.total || 0), 0)
      const sumLt = (l.lt_breakdown || []).reduce((s:any, i:any) => s + (i.total || 0), 0)

      const marginMult = l.margin_multiplier || 1.15
      
      l.summary = [
        { label: 'Main Hoist Assembly', amount: sumMh },
        { label: 'Auxiliary Hoist Assembly', amount: sumAh },
        { label: 'Cross Travel Mechanism', amount: sumCt },
        { label: 'Long Travel Mechanism', amount: sumLt },
        { label: 'Structural Fabrication', amount: l.structural_cost || 0 },
        { label: 'SUB TOTAL (Base Cost)', amount: l.base_total || 0, isBold: true },
        { label: `Estimation Value (incl. ${(marginMult - 1)*100}% Margin)`, amount: (l.base_total || 0) * marginMult, isBold: true },
        { label: 'Painting & Packing', amount: l.painting_cost || 0 },
        { label: 'Miscellaneous / Transport', amount: l.misc_cost || 0 },
        { label: 'CRD / DSL', amount: l.crd_cost || 0 }
      ]
      
      l.gst_rate = 18
      l.after_margin = (l.base_total || 0) * marginMult
    }

    return NextResponse.json({ 
      data: latest || null, 
      versions: versions || [] 
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  try {
    const supabase = await createClient()

    // Check if job exists and user has access
    const { data: job, error: jobErr } = await supabase
      .from('jobs')
      .select('id')
      .eq('id', id)
      .single()

    if (jobErr) return NextResponse.json({ error: 'Job not found or access denied' }, { status: 404 })

    // Check blocking fields
    const { data: requirements } = await supabase
      .from('job_requirements')
      .select('*')
      .eq('job_id', id)
      .single()

    if (requirements) {
      const missing = detectMissingFields(requirements, !!requirements.ah_capacity)
      const blocking = missing.filter(m => m.severity === 'blocking')
      if (blocking.length > 0) {
        return NextResponse.json({ 
          error: 'Cannot estimate: missing critical fields', 
          missing: blocking 
        }, { status: 400 })
      }
    }

    // Run engine
    const result = await calculateEstimation(id)

    return NextResponse.json({ data: result }, { status: 200 })
  } catch (err: any) {
    console.error('Estimation Engine Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
