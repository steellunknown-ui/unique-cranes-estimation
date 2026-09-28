import * as math from 'mathjs'
import { createClient } from '@/lib/supabase/server'

export interface SummaryItem {
  label: string
  amount: number
  isBold?: boolean
}

export interface LineItem {
  component: string        // e.g. "Main Hoist Motor"
  category: string         // e.g. "MOTOR"
  model: string            // e.g. "VD 225M"
  quantity: number
  unit_rate: number
  total: number
  source: 'catalog' | 'formula' | 'manual'
  notes?: string
}

export interface EstimationResult {
  job_id: string
  mh_breakdown: LineItem[]
  ah_breakdown: LineItem[]
  ct_breakdown: LineItem[]
  lt_breakdown: LineItem[]
  structural_cost: number
  base_total: number
  margin_multiplier: number
  after_margin: number
  painting_cost: number
  misc_cost: number
  crd_cost: number
  grand_total: number
  gst_rate: number
  gst_amount: number
  grand_total_with_gst: number
  summary: SummaryItem[]
  version: number
}

// STEP 2 — Helper function: selectComponent(category, specs_filter)
function selectComponent(components: any[], category: string, specsFilter: (specs: any) => boolean): any {
  const matches = components.filter(c => c.category === category && specsFilter(c.specs || {}))
  if (matches.length > 0) {
    // Return first match for simplicity, or could sort by exactness
    return matches[0]
  }
  return null
}

function createLineItem(
  components: any[], 
  category: string, 
  componentName: string, 
  quantity: number, 
  specsFilter: (specs: any) => boolean
): LineItem {
  const component = selectComponent(components, category, specsFilter)
  
  if (!component) {
    console.warn(`[Estimation Engine] No catalog match found for ${componentName} (${category})`)
    return {
      component: componentName,
      category,
      model: 'Unknown',
      quantity,
      unit_rate: 0,
      total: 0,
      source: 'manual',
      notes: '⚠ No catalog match found — rate to be entered manually'
    }
  }

  const rate = parseFloat(component.unit_price) || 0
  return {
    component: componentName,
    category,
    model: component.model,
    quantity,
    unit_rate: rate,
    total: rate * quantity,
    source: 'catalog'
  }
}

// STEP 3 — Helper function: evaluateFormula(name, variables)
function evaluateFormula(formulas: any[], name: string, variables: any): number {
  const formula = formulas.find(f => f.name === name)
  if (!formula) {
    console.warn(`[Estimation Engine] Formula not found: ${name}`)
    return 0
  }
  try {
    const result = math.evaluate(formula.expression, variables)
    return parseFloat(result.toString()) || 0
  } catch (err) {
    console.warn(`[Estimation Engine] Error evaluating formula ${name}:`, err)
    return 0
  }
}

export async function calculateEstimation(jobId: string): Promise<EstimationResult> {
  const supabase = await createClient()

  // STEP 1 — Load all data from Supabase
  const { data: jobRequirements, error: reqError } = await supabase
    .from('job_requirements')
    .select('*')
    .eq('job_id', jobId)
    .single()
  
  if (reqError) throw new Error('Failed to load job requirements')
  
  const { data: componentsData } = await supabase.from('components').select('*').eq('is_active', true)
  const components = componentsData || []

  const { data: formulasData } = await supabase.from('formulas').select('*')
  const formulas = formulasData || []

  const { data: configData } = await supabase.from('system_config').select('*')
  const config = (configData || []).reduce((acc: any, row: any) => {
    acc[row.key] = row.value
    return acc
  }, {})

  // Basic variables
  const mh_capacity = parseFloat(String(jobRequirements.mh_capacity || 0)) || 0
  const ah_capacity = parseFloat(String(jobRequirements.ah_capacity || 0)) || 0
  const span = parseFloat(String(jobRequirements.span || 0)) || 0
  const mh_lift = parseFloat(String(jobRequirements.mh_lift || 0)) || 0
  const ah_lift = parseFloat(String(jobRequirements.ah_lift || 0)) || 0
  const mh_speed = parseFloat(String(jobRequirements.mh_speed || 3)) || 3
  const ah_speed = parseFloat(String(jobRequirements.ah_speed || 3)) || 3
  const ct_speed = parseFloat(String(jobRequirements.ct_speed || 15)) || 15
  const lt_speed = parseFloat(String(jobRequirements.lt_speed || 30)) || 30

  // Config Rates
  const limitSwitchRate = parseFloat(config.LIMIT_SWITCH_RATE) || 3500
  const topPulleyRate = parseFloat(config.TOP_PULLEY_RATE) || 8500
  const equalizerPulleyRate = parseFloat(config.EQUALIZER_PULLEY_RATE) || 12000
  const floatShaftRate = parseFloat(config.FLOAT_SHAFT_RATE) || 18000
  
  const getHookRate = (cap: number) => {
    if (cap < 15) return parseFloat(config.HOOK_RATE_SMALL) || 35000
    if (cap <= 35) return parseFloat(config.HOOK_RATE_MEDIUM) || 65000
    return parseFloat(config.HOOK_RATE_LARGE) || 110000
  }

  const getDrumRate = (cap: number) => {
    if (cap < 15) return parseFloat(config.DRUM_RATE_SMALL) || 85000
    if (cap <= 35) return parseFloat(config.DRUM_RATE_MEDIUM) || 145000
    return parseFloat(config.DRUM_RATE_LARGE) || 220000
  }

  const getWireRopeDia = (cap: number) => {
    if (cap < 10) return 18
    if (cap <= 25) return 22
    return 26
  }

  const getGearboxSeries = (cap: number) => {
    if (cap < 10) return 'HR350'
    if (cap <= 25) return 'HR650'
    if (cap <= 50) return 'VR500'
    return 'HR1700'
  }

  // Calculate Breakdowns
  
  // STEP 4 — Calculate MH (Main Hoist) breakdown
  const mh_breakdown: LineItem[] = []
  
  // a) MH Motor
  const req_mh_power = (mh_capacity * mh_speed / 6120) * 1.25
  const mhMotor = createLineItem(components, 'MOTOR', 'Main Hoist Motor', 1, specs => (parseFloat(specs.power_kw) || 0) >= req_mh_power)
  mh_breakdown.push(mhMotor)

  // b) MH Input Coupling
  mh_breakdown.push(createLineItem(components, 'COUPLING', 'MH Input Coupling', 1, specs => true))

  // c) MH Gearbox
  const mhGbSeries = getGearboxSeries(mh_capacity)
  mh_breakdown.push(createLineItem(components, 'GEARBOX', 'MH Gearbox', 1, specs => specs.series === mhGbSeries))

  // d) MH Brake DCEM
  mh_breakdown.push(createLineItem(components, 'BRAKE_DCEM', 'MH Brake (DCEM)', mh_capacity > 50 ? 2 : 1, specs => true))

  // e) MH Limit Switch
  mh_breakdown.push({
    component: 'MH Limit Switch', category: 'ELECTRICAL', model: 'Standard',
    quantity: 2, unit_rate: limitSwitchRate, total: limitSwitchRate * 2, source: 'manual'
  })

  // f) MH Wire Rope
  const mhFalls = evaluateFormula(formulas, 'MH_FALLS', { mh_capacity }) || 4
  const mhRopeLength = evaluateFormula(formulas, 'MH_ROPE_LENGTH', { mh_lift, falls: mhFalls, span }) || (mh_lift * mhFalls + 10)
  const mhRopeDia = getWireRopeDia(mh_capacity)
  const mhWireRope = createLineItem(components, 'WIRE_ROPE', 'MH Wire Rope', mhRopeLength, specs => (parseFloat(specs.diameter) || 0) === mhRopeDia)
  // Fix quantity mismatch since createLineItem defaults to unit_price * quantity
  mhWireRope.total = mhWireRope.unit_rate * mhRopeLength
  mh_breakdown.push(mhWireRope)

  // g) MH Rope Drum
  const mhDrumRate = getDrumRate(mh_capacity)
  mh_breakdown.push({
    component: 'MH Rope Drum', category: 'MECHANICAL', model: 'Custom',
    quantity: 1, unit_rate: mhDrumRate, total: mhDrumRate, source: 'manual'
  })

  // h) MH Snatch Block
  mh_breakdown.push(createLineItem(components, 'SNATCH_BLOCK', 'MH Snatch Block', Math.max(1, Math.floor(mhFalls / 2)), specs => true))

  // i) MH Top Pulleys + Equalizer
  mh_breakdown.push({
    component: 'MH Top Pulleys', category: 'MECHANICAL', model: 'Standard',
    quantity: mhFalls, unit_rate: topPulleyRate, total: topPulleyRate * mhFalls, source: 'manual'
  })
  mh_breakdown.push({
    component: 'MH Equalizer Pulley', category: 'MECHANICAL', model: 'Standard',
    quantity: 1, unit_rate: equalizerPulleyRate, total: equalizerPulleyRate, source: 'manual'
  })

  // j) MH Hook Block Assembly
  const mhHookRate = getHookRate(mh_capacity)
  mh_breakdown.push({
    component: 'MH Hook Block Assembly', category: 'MECHANICAL', model: 'Standard',
    quantity: 1, unit_rate: mhHookRate, total: mhHookRate, source: 'manual'
  })

  // k) MH Misc
  const mhSubtotal = mh_breakdown.reduce((sum, item) => sum + item.total, 0)
  mh_breakdown.push({
    component: 'MH Miscellaneous', category: 'MISC', model: 'Various',
    quantity: 1, unit_rate: mhSubtotal * 0.05, total: mhSubtotal * 0.05, source: 'formula'
  })

  // STEP 5 — Calculate AH (Auxiliary Hoist) breakdown
  const ah_breakdown: LineItem[] = []
  if (ah_capacity > 0) {
    const req_ah_power = (ah_capacity * ah_speed / 6120) * 1.25
    ah_breakdown.push(createLineItem(components, 'MOTOR', 'Aux Hoist Motor', 1, specs => (parseFloat(specs.power_kw) || 0) >= req_ah_power))
    ah_breakdown.push(createLineItem(components, 'COUPLING', 'AH Input Coupling', 1, specs => true))
    ah_breakdown.push(createLineItem(components, 'GEARBOX', 'AH Gearbox', 1, specs => specs.series === getGearboxSeries(ah_capacity)))
    ah_breakdown.push(createLineItem(components, 'BRAKE_DCEM', 'AH Brake (DCEM)', 1, specs => true))
    ah_breakdown.push({
      component: 'AH Limit Switch', category: 'ELECTRICAL', model: 'Standard',
      quantity: 2, unit_rate: limitSwitchRate, total: limitSwitchRate * 2, source: 'manual'
    })
    const ahFalls = evaluateFormula(formulas, 'AH_FALLS', { ah_capacity }) || 4
    const ahRopeLength = evaluateFormula(formulas, 'AH_ROPE_LENGTH', { ah_lift, falls: ahFalls, span }) || (ah_lift * ahFalls + 10)
    const ahRopeDia = getWireRopeDia(ah_capacity)
    const ahWireRope = createLineItem(components, 'WIRE_ROPE', 'AH Wire Rope', ahRopeLength, specs => (parseFloat(specs.diameter) || 0) === ahRopeDia)
    ahWireRope.total = ahWireRope.unit_rate * ahRopeLength
    ah_breakdown.push(ahWireRope)
    const ahDrumRate = getDrumRate(ah_capacity)
    ah_breakdown.push({
      component: 'AH Rope Drum', category: 'MECHANICAL', model: 'Custom',
      quantity: 1, unit_rate: ahDrumRate, total: ahDrumRate, source: 'manual'
    })
    ah_breakdown.push(createLineItem(components, 'SNATCH_BLOCK', 'AH Snatch Block', Math.max(1, Math.floor(ahFalls / 2)), specs => true))
    ah_breakdown.push({
      component: 'AH Top Pulleys', category: 'MECHANICAL', model: 'Standard',
      quantity: ahFalls, unit_rate: topPulleyRate, total: topPulleyRate * ahFalls, source: 'manual'
    })
    ah_breakdown.push({
      component: 'AH Equalizer Pulley', category: 'MECHANICAL', model: 'Standard',
      quantity: 1, unit_rate: equalizerPulleyRate, total: equalizerPulleyRate, source: 'manual'
    })
    const ahHookRate = getHookRate(ah_capacity)
    ah_breakdown.push({
      component: 'AH Hook Block Assembly', category: 'MECHANICAL', model: 'Standard',
      quantity: 1, unit_rate: ahHookRate, total: ahHookRate, source: 'manual'
    })
    const ahSubtotal = ah_breakdown.reduce((sum, item) => sum + item.total, 0)
    ah_breakdown.push({
      component: 'AH Miscellaneous', category: 'MISC', model: 'Various',
      quantity: 1, unit_rate: ahSubtotal * 0.05, total: ahSubtotal * 0.05, source: 'formula'
    })
  }

  // STEP 6 — Calculate CT (Cross Travel) breakdown
  const ct_breakdown: LineItem[] = []
  const totalWeight = mh_capacity + ah_capacity + 10 // roughly add crane dead weight for CT
  const req_ct_power = (totalWeight * ct_speed / 6120) * 0.15
  ct_breakdown.push(createLineItem(components, 'MOTOR', 'CT Motor', 1, specs => (parseFloat(specs.power_kw) || 0) >= req_ct_power))
  ct_breakdown.push(createLineItem(components, 'COUPLING', 'CT Coupling', 1, specs => true))
  ct_breakdown.push(createLineItem(components, 'GEARBOX', 'CT Gearbox', 1, specs => true))
  ct_breakdown.push(createLineItem(components, 'BRAKE_EHT', 'CT Brake (EHT)', 1, specs => true))
  ct_breakdown.push({
    component: 'CT Limit Switch', category: 'ELECTRICAL', model: 'Standard',
    quantity: 2, unit_rate: limitSwitchRate, total: limitSwitchRate * 2, source: 'manual'
  })
  ct_breakdown.push(createLineItem(components, 'WHEEL', 'CT Wheels', 4, specs => true))
  ct_breakdown.push({
    component: 'CT Float Shaft', category: 'MECHANICAL', model: 'Custom',
    quantity: 1, unit_rate: floatShaftRate, total: floatShaftRate, source: 'manual'
  })
  const ctSubtotal = ct_breakdown.reduce((sum, item) => sum + item.total, 0)
  ct_breakdown.push({
    component: 'CT Miscellaneous', category: 'MISC', model: 'Various',
    quantity: 1, unit_rate: ctSubtotal * 0.05, total: ctSubtotal * 0.05, source: 'formula'
  })

  // STEP 7 — Calculate LT (Long Travel) breakdown
  const lt_breakdown: LineItem[] = []
  const req_lt_power = ((totalWeight + 15) * lt_speed / 6120) * 0.15
  lt_breakdown.push(createLineItem(components, 'MOTOR', 'LT Motor', 2, specs => (parseFloat(specs.power_kw) || 0) >= req_lt_power))
  lt_breakdown.push(createLineItem(components, 'COUPLING', 'LT Coupling', 2, specs => true))
  lt_breakdown.push(createLineItem(components, 'GEARBOX', 'LT Gearbox', 2, specs => true))
  lt_breakdown.push(createLineItem(components, 'BRAKE_EHT', 'LT Brake (EHT)', 2, specs => true))
  lt_breakdown.push({
    component: 'LT Limit Switch', category: 'ELECTRICAL', model: 'Standard',
    quantity: 2, unit_rate: limitSwitchRate, total: limitSwitchRate * 2, source: 'manual'
  })
  lt_breakdown.push(createLineItem(components, 'WHEEL', 'LT Wheels', 8, specs => true))
  lt_breakdown.push({
    component: 'LT Float Shaft', category: 'MECHANICAL', model: 'Custom',
    quantity: 1, unit_rate: floatShaftRate, total: floatShaftRate, source: 'manual'
  })
  const ltSubtotal = lt_breakdown.reduce((sum, item) => sum + item.total, 0)
  lt_breakdown.push({
    component: 'LT Miscellaneous', category: 'MISC', model: 'Various',
    quantity: 1, unit_rate: ltSubtotal * 0.05, total: ltSubtotal * 0.05, source: 'formula'
  })

  // STEP 8 — Structural Cost
  let structural_weight = evaluateFormula(formulas, 'STRUCTURAL_WEIGHT_TONS', { span, mh_capacity })
  if (structural_weight === 0) {
    // Basic fallback if formula missing
    structural_weight = (span * 0.5) + (mh_capacity * 0.2)
  }
  const structural_rate = parseFloat(config.STRUCTURAL_RATE_PER_TON) || 85000
  const structural_cost = structural_weight * structural_rate

  // STEP 9 — Summary calculation
  const sumMh = mh_breakdown.reduce((s, i) => s + i.total, 0)
  const sumAh = ah_breakdown.reduce((s, i) => s + i.total, 0)
  const sumCt = ct_breakdown.reduce((s, i) => s + i.total, 0)
  const sumLt = lt_breakdown.reduce((s, i) => s + i.total, 0)
  
  const base_total = sumMh + sumAh + sumCt + sumLt + structural_cost
  const margin_multiplier = parseFloat(config.MARGIN_MULTIPLIER) || 1.6
  const after_margin = base_total * margin_multiplier
  
  const painting_cost = parseFloat(config.PAINTING_FLAT) || 75000
  const misc_cost = parseFloat(config.MISC_FLAT) || 50000
  const crd_cost = parseFloat(config.CRD_FLAT) || 120000
  
  const grand_total = after_margin + painting_cost + misc_cost + crd_cost
  const gst_rate = parseFloat(config.GST_RATE) || 18
  const gst_amount = grand_total * (gst_rate / 100)
  const grand_total_with_gst = grand_total + gst_amount

  // Summary object for quick rendering
  const summary: SummaryItem[] = [
    { label: 'Main Hoist Assembly', amount: sumMh },
    { label: 'Auxiliary Hoist Assembly', amount: sumAh },
    { label: 'Cross Travel Mechanism', amount: sumCt },
    { label: 'Long Travel Mechanism', amount: sumLt },
    { label: 'Structural & Fabrication', amount: structural_cost },
    { label: 'Base Total', amount: base_total, isBold: true },
    { label: `Margin @ ${(margin_multiplier - 1)*100}%`, amount: after_margin - base_total },
    { label: 'After Margin', amount: after_margin, isBold: true },
    { label: 'Painting & Surface Treatment', amount: painting_cost },
    { label: 'Miscellaneous', amount: misc_cost },
    { label: 'CRD / Packing & Forwarding', amount: crd_cost },
  ]

  // STEP 10 — Save to estimations table
  const { data: latestEst } = await supabase
    .from('estimations')
    .select('version')
    .eq('job_id', jobId)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle()

  const newVersion = (latestEst?.version || 0) + 1

  const estimationData = {
    job_id: jobId,
    mh_breakdown,
    ah_breakdown,
    ct_breakdown,
    lt_breakdown,
    structural_cost,
    base_total,
    margin_multiplier,
    painting_cost,
    misc_cost,
    crd_cost,
    grand_total,
    gst_amount,
    grand_total_with_gst,
    version: newVersion,
    created_at: new Date().toISOString()
  }

  const { error: insError } = await supabase.from('estimations').insert(estimationData as any)
  if (insError) throw new Error('Failed to save estimation record: ' + insError.message)

  // Update job status if grand_total > 0
  if (grand_total > 0) {
    await supabase.from('jobs').update({ status: 'estimated' }).eq('id', jobId)
  }

  return {
    ...estimationData,
    gst_rate,
    after_margin,
    summary
  }
}
