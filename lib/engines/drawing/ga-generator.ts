import { EstimationResult } from '../estimation'

export interface JobRequirements {
  span: number
  mh_lift: number
  mh_capacity: number
  ah_capacity: number | null
  rail_size: string
  power_supply: string
  duty_class: string
  ambient_temp: string
  vvvf_required: boolean
  control_type: string
  mh_speed: number
  ah_speed?: number | null
  ct_speed: number
  lt_speed: number
}

export interface DrawingConfig {
  head_room_mm: string
  girder_depth_factor: string
  end_carriage_min_width_mm: string
  min_hook_approach_mh_mm: string
  buffer_size_mm: string
}

export interface DrawingInput {
  requirements: JobRequirements
  config: DrawingConfig
  estimation?: EstimationResult
  jobRef: string
  clientName: string
  preparedBy: string
  date: string
}

const DRAWING_STYLES = `
  .main-line { stroke: #000000; stroke-width: 1.5; fill: none; }
  .hidden-line { stroke: #000000; stroke-width: 0.7; fill: none; stroke-dasharray: 8,4; }
  .center-line { stroke: #000000; stroke-width: 0.5; fill: none; stroke-dasharray: 20,4,4,4; }
  .dimension-line { stroke: #000000; stroke-width: 0.7; fill: none; }
  .section-fill { fill: #E8E8E8; stroke: #000000; stroke-width: 1.5; }
  .text-standard { font-family: Arial, sans-serif; font-size: 11px; fill: #000000; }
  .text-small { font-family: Arial, sans-serif; font-size: 9px; fill: #000000; }
  .text-large { font-family: Arial, sans-serif; font-size: 14px; font-weight: bold; fill: #000000; }
  .text-title { font-family: Arial, sans-serif; font-size: 18px; font-weight: bold; fill: #000000; }
  .title-block { fill: #FFFFFF; stroke: #000000; stroke-width: 1.5; }
  .tech-table-header { fill: #C0C0C0; stroke: #000000; stroke-width: 1; }
  .tech-table-row-alt { fill: #F0F0F0; stroke: #000000; stroke-width: 0.5; }
  .grid-border { stroke: #000000; stroke-width: 3; fill: none; }
`

export function generateGADrawing(input: DrawingInput): string {
  const { requirements, config, estimation, jobRef, clientName, preparedBy, date } = input
  
  const CANVAS_W = 1600
  const CANVAS_H = 1100
  const MARGIN = 40

  const FRONT_ELEV_ZONE = { x: MARGIN, y: MARGIN, w: CANVAS_W * 0.48, h: CANVAS_H * 0.72 }
  const END_VIEW_ZONE   = { x: CANVAS_W * 0.51, y: MARGIN, w: CANVAS_W * 0.13, h: CANVAS_H * 0.45 }
  const PLAN_ZONE       = { x: MARGIN, y: CANVAS_H * 0.74, w: CANVAS_W * 0.48, h: CANVAS_H * 0.22 }
  const TECH_TABLE_ZONE = { x: CANVAS_W * 0.66, y: MARGIN, w: CANVAS_W * 0.315, h: CANVAS_H * 0.72 }
  const TITLE_ZONE      = { x: CANVAS_W * 0.66, y: CANVAS_H * 0.74, w: CANVAS_W * 0.315, h: CANVAS_H * 0.245 }

  const spanMM = requirements.span * 1000
  const liftMM = requirements.mh_lift * 1000  
  const headroomMM = parseFloat(config.head_room_mm)
  const endCarriageWidthMM = parseFloat(config.end_carriage_min_width_mm)

  const SCALE_X = (FRONT_ELEV_ZONE.w - 120) / (spanMM + 2 * endCarriageWidthMM)
  const SCALE_Y = (FRONT_ELEV_ZONE.h - 160) / (liftMM + headroomMM + parseFloat(config.buffer_size_mm))

  // Key Y coordinates
  const railTopY = FRONT_ELEV_ZONE.y + 100
  const girderDepthScaled = spanMM * parseFloat(config.girder_depth_factor) * SCALE_Y
  const girderBottomY = railTopY + girderDepthScaled
  const floorY = railTopY + (liftMM + headroomMM) * SCALE_Y
  
  // Hook coordinates
  const hookBottomY = floorY
  const hookTopY = railTopY + headroomMM * SCALE_Y

  // Key X coordinates
  const leftRailX = FRONT_ELEV_ZONE.x + 80
  const rightRailX = leftRailX + spanMM * SCALE_X
  const leftEndX = leftRailX - endCarriageWidthMM * SCALE_X
  const rightEndX = rightRailX + endCarriageWidthMM * SCALE_X

  const hasAH = (requirements.ah_capacity || 0) > 0

  // SVG BUILDER
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CANVAS_W} ${CANVAS_H}" width="100%" height="100%">
    <defs>
      <style>${DRAWING_STYLES}</style>
      <marker id="arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z" fill="#000000" />
      </marker>
    </defs>
    
    <!-- Outer Border -->
    <rect x="10" y="10" width="${CANVAS_W - 20}" height="${CANVAS_H - 20}" class="grid-border" />
    
    <!-- Grid Reference Circles -->
    <circle cx="20" cy="20" r="15" class="main-line" fill="white" /><text x="20" y="24" text-anchor="middle" class="text-large">A</text>
    <circle cx="${CANVAS_W - 20}" cy="20" r="15" class="main-line" fill="white" /><text x="${CANVAS_W - 20}" y="24" text-anchor="middle" class="text-large">B</text>
    <circle cx="20" cy="${CANVAS_H - 20}" r="15" class="main-line" fill="white" /><text x="20" y="${CANVAS_H - 16}" text-anchor="middle" class="text-large">C</text>
    <circle cx="${CANVAS_W - 20}" cy="${CANVAS_H - 20}" r="15" class="main-line" fill="white" /><text x="${CANVAS_W - 20}" y="${CANVAS_H - 16}" text-anchor="middle" class="text-large">D</text>
  `

  // ================= VIEW 1: FRONT ELEVATION =================
  svg += `
    <!-- GANTRY RAILS -->
    <line x1="${leftRailX}" y1="${railTopY}" x2="${leftRailX}" y2="${floorY}" class="center-line" />
    <line x1="${rightRailX}" y1="${railTopY}" x2="${rightRailX}" y2="${floorY}" class="center-line" />
    
    <!-- Rail sections -->
    <rect x="${leftRailX - 10}" y="${railTopY}" width="20" height="15" class="main-line" />
    <rect x="${rightRailX - 10}" y="${railTopY}" width="20" height="15" class="main-line" />
    <text x="${leftRailX}" y="${railTopY - 10}" text-anchor="middle" class="text-standard">${requirements.rail_size}</text>
    
    <!-- SPAN Dimension -->
    <line x1="${leftRailX}" y1="${railTopY - 40}" x2="${rightRailX}" y2="${railTopY - 40}" class="dimension-line" marker-start="url(#arrow)" marker-end="url(#arrow)" />
    <text x="${(leftRailX + rightRailX)/2}" y="${railTopY - 45}" text-anchor="middle" class="text-standard">${requirements.span}M SPAN</text>

    <!-- GIRDERS -->
    <rect x="${leftRailX}" y="${railTopY - girderDepthScaled}" width="${spanMM * SCALE_X}" height="${girderDepthScaled}" class="main-line" />
    <rect x="${leftRailX}" y="${railTopY - girderDepthScaled - 5}" width="${spanMM * SCALE_X}" height="${girderDepthScaled + 10}" class="main-line" />
    <!-- Stiffeners -->
    ${Array.from({length: 15}).map((_, i) => `<line x1="${leftRailX + (i+1)*(spanMM * SCALE_X)/16}" y1="${railTopY - girderDepthScaled}" x2="${leftRailX + (i+1)*(spanMM * SCALE_X)/16}" y2="${railTopY}" class="hidden-line" />`).join('')}
    <!-- Handrails -->
    <line x1="${leftRailX}" y1="${railTopY - girderDepthScaled - 30}" x2="${rightRailX}" y2="${railTopY - girderDepthScaled - 30}" class="main-line" stroke-width="0.5" />
    ${Array.from({length: 15}).map((_, i) => `<line x1="${leftRailX + (i)*(spanMM * SCALE_X)/15}" y1="${railTopY - girderDepthScaled - 30}" x2="${leftRailX + (i)*(spanMM * SCALE_X)/15}" y2="${railTopY - girderDepthScaled}" class="main-line" stroke-width="0.5" />`).join('')}

    <!-- END CARRIAGES -->
    <rect x="${leftEndX}" y="${railTopY - girderDepthScaled}" width="${endCarriageWidthMM * SCALE_X}" height="${girderDepthScaled + 30}" class="main-line" fill="white" />
    <rect x="${rightRailX}" y="${railTopY - girderDepthScaled}" width="${endCarriageWidthMM * SCALE_X}" height="${girderDepthScaled + 30}" class="main-line" fill="white" />
    <!-- LT Wheels Left -->
    <circle cx="${leftEndX + 20}" cy="${railTopY}" r="10" class="main-line" />
    <circle cx="${leftRailX - 20}" cy="${railTopY}" r="10" class="main-line" />
    <!-- LT Wheels Right -->
    <circle cx="${rightRailX + 20}" cy="${railTopY}" r="10" class="main-line" />
    <circle cx="${rightEndX - 20}" cy="${railTopY}" r="10" class="main-line" />
    
    <!-- End Stops -->
    <rect x="${leftEndX - 5}" y="${railTopY - 15}" width="5" height="15" class="section-fill" />
    <rect x="${rightEndX}" y="${railTopY - 15}" width="5" height="15" class="section-fill" />

    <!-- MH TROLLEY -->
    <rect x="${leftRailX + (spanMM * SCALE_X)/2 - 40}" y="${railTopY - girderDepthScaled - 30}" width="80" height="25" class="main-line" fill="#FAFAFA" />
    <!-- MH Ropes & Hook -->
    <line x1="${leftRailX + (spanMM * SCALE_X)/2}" y1="${railTopY - girderDepthScaled - 5}" x2="${leftRailX + (spanMM * SCALE_X)/2}" y2="${hookBottomY - 20}" class="main-line" />
    <polygon points="${leftRailX + (spanMM * SCALE_X)/2 - 15},${hookBottomY - 20} ${leftRailX + (spanMM * SCALE_X)/2 + 15},${hookBottomY - 20} ${leftRailX + (spanMM * SCALE_X)/2},${hookBottomY}" class="main-line" fill="white" />
    <path d="M ${leftRailX + (spanMM * SCALE_X)/2} ${hookBottomY} Q ${leftRailX + (spanMM * SCALE_X)/2 - 10} ${hookBottomY + 20} ${leftRailX + (spanMM * SCALE_X)/2 + 10} ${hookBottomY + 15}" class="main-line" fill="none" />
    
    <!-- MH Lift Dimension -->
    <line x1="${leftRailX - 40}" y1="${railTopY}" x2="${leftRailX - 40}" y2="${hookBottomY}" class="dimension-line" marker-start="url(#arrow)" marker-end="url(#arrow)" />
    <text x="${leftRailX - 45}" y="${(railTopY + hookBottomY)/2}" transform="rotate(-90 ${leftRailX - 45} ${(railTopY + hookBottomY)/2})" text-anchor="middle" class="text-standard">MH LIFT ${requirements.mh_lift}M</text>
    
    <!-- FLOOR LINE -->
    <line x1="${FRONT_ELEV_ZONE.x + 20}" y1="${floorY + 20}" x2="${rightEndX + 40}" y2="${floorY + 20}" class="main-line" stroke-width="2" />
    <text x="${leftRailX + 50}" y="${floorY + 35}" class="text-standard">SHOP FLOOR LEVEL</text>
  `

  if (hasAH) {
    svg += `
      <!-- AH TROLLEY -->
      <rect x="${leftRailX + (spanMM * SCALE_X)/2 + 80}" y="${railTopY - girderDepthScaled - 20}" width="40" height="15" class="main-line" fill="#FAFAFA" />
      <line x1="${leftRailX + (spanMM * SCALE_X)/2 + 100}" y1="${railTopY - girderDepthScaled - 5}" x2="${leftRailX + (spanMM * SCALE_X)/2 + 100}" y2="${hookBottomY - 40}" class="main-line" />
      <polygon points="${leftRailX + (spanMM * SCALE_X)/2 + 90},${hookBottomY - 40} ${leftRailX + (spanMM * SCALE_X)/2 + 110},${hookBottomY - 40} ${leftRailX + (spanMM * SCALE_X)/2 + 100},${hookBottomY - 20}" class="main-line" fill="white" />
      <text x="${leftRailX + (spanMM * SCALE_X)/2 + 125}" y="${hookBottomY - 30}" class="text-small">AH LIFT</text>
    `
  }

  // Cabin
  if (requirements.control_type === 'Open Cabin' || requirements.control_type === 'Closed Cabin') {
    svg += `
      <rect x="${leftRailX + 20}" y="${railTopY}" width="60" height="80" class="main-line" fill="white" />
      <text x="${leftRailX + 50}" y="${railTopY + 40}" text-anchor="middle" class="text-small" transform="rotate(-90 ${leftRailX + 50} ${railTopY + 40})">OPERATOR CABIN</text>
    `
  }

  // DSL Guard
  svg += `
    <rect x="${rightRailX - 15}" y="${railTopY - girderDepthScaled}" width="10" height="${girderDepthScaled + 40}" class="hidden-line" />
    <text x="${rightRailX + 5}" y="${railTopY}" class="text-small">DSL GUARD</text>
  `

  svg += `<text x="${FRONT_ELEV_ZONE.x + FRONT_ELEV_ZONE.w/2}" y="${FRONT_ELEV_ZONE.y + FRONT_ELEV_ZONE.h - 20}" text-anchor="middle" class="text-title">FRONT ELEVATION</text>`


  // ================= VIEW 2: END VIEW =================
  const evStartX = END_VIEW_ZONE.x + 80
  svg += `
    <!-- Box girders cross section -->
    <rect x="${evStartX}" y="${railTopY - girderDepthScaled}" width="40" height="${girderDepthScaled}" class="section-fill" />
    <rect x="${evStartX + 80}" y="${railTopY - girderDepthScaled}" width="40" height="${girderDepthScaled}" class="section-fill" />
    
    <!-- End Carriage Profile -->
    <rect x="${evStartX - 10}" y="${railTopY - 20}" width="140" height="40" class="main-line" fill="white" />
    <circle cx="${evStartX + 10}" cy="${railTopY + 20}" r="10" class="main-line" />
    <circle cx="${evStartX + 110}" cy="${railTopY + 20}" r="10" class="main-line" />
    
    <!-- Rail -->
    <rect x="${evStartX - 20}" y="${railTopY + 30}" width="160" height="15" class="main-line" />
    
    <!-- Platform -->
    <line x1="${evStartX - 40}" y1="${railTopY - girderDepthScaled}" x2="${evStartX}" y2="${railTopY - girderDepthScaled}" class="main-line" />
    <line x1="${evStartX + 120}" y1="${railTopY - girderDepthScaled}" x2="${evStartX + 160}" y2="${railTopY - girderDepthScaled}" class="main-line" />
    
    <text x="${END_VIEW_ZONE.x + END_VIEW_ZONE.w/2}" y="${END_VIEW_ZONE.y + END_VIEW_ZONE.h - 20}" text-anchor="middle" class="text-title">END ELEVATION</text>
  `


  // ================= VIEW 3: PLAN VIEW =================
  const planY = PLAN_ZONE.y + 40
  svg += `
    <rect x="${leftRailX}" y="${planY}" width="${spanMM * SCALE_X}" height="80" class="main-line" />
    <rect x="${leftRailX}" y="${planY + 20}" width="${spanMM * SCALE_X}" height="40" class="main-line" />
    <!-- End carriages plan -->
    <rect x="${leftEndX}" y="${planY - 20}" width="${endCarriageWidthMM * SCALE_X}" height="120" class="main-line" fill="white" />
    <rect x="${rightRailX}" y="${planY - 20}" width="${endCarriageWidthMM * SCALE_X}" height="120" class="main-line" fill="white" />
    
    <!-- Trolley -->
    <rect x="${leftRailX + (spanMM * SCALE_X)/2 - 30}" y="${planY - 10}" width="60" height="100" class="hidden-line" />
    
    <!-- Bay Length dimension -->
    <line x1="${leftEndX - 30}" y1="${planY - 20}" x2="${leftEndX - 30}" y2="${planY + 100}" class="dimension-line" marker-start="url(#arrow)" marker-end="url(#arrow)" />
    <text x="${leftEndX - 35}" y="${planY + 40}" text-anchor="middle" transform="rotate(-90 ${leftEndX - 35} ${planY + 40})" class="text-small">BAY LENGTH (TYP)</text>
    
    <text x="${PLAN_ZONE.x + PLAN_ZONE.w/2}" y="${PLAN_ZONE.y + PLAN_ZONE.h - 20}" text-anchor="middle" class="text-title">KEY PLAN (FURNACE)</text>
  `


  // ================= VIEW 4: TECHNICAL PARTICULARS =================
  const TBL_X = TECH_TABLE_ZONE.x
  let TBL_Y = TECH_TABLE_ZONE.y
  
  const drawRow = (rY: number, h: number, cols: string[], isHeader = false) => {
    let out = `<rect x="${TBL_X}" y="${rY}" width="${TECH_TABLE_ZONE.w}" height="${h}" class="${isHeader ? 'tech-table-header' : 'title-block'}" />`
    const widths = [0.34, 0.22, 0.16, 0.14, 0.14]
    let curX = TBL_X
    for(let i=0; i<cols.length; i++) {
      const cw = TECH_TABLE_ZONE.w * widths[i]
      out += `<rect x="${curX}" y="${rY}" width="${cw}" height="${h}" class="${isHeader ? 'tech-table-header' : 'title-block'}" />`
      let cellText = cols[i] || '-'
      const limit = widths[i] > 0.2 ? 26 : 16
      if (cellText.length > limit && !isHeader) cellText = cellText.substring(0, limit-2) + '..'
      out += `<text x="${curX + 5}" y="${rY + h/2 + 4}" class="${isHeader ? 'text-small font-bold' : 'text-small'}">${cellText}</text>`
      curX += cw
    }
    return out
  }

  svg += `
    <rect x="${TBL_X}" y="${TBL_Y}" width="${TECH_TABLE_ZONE.w}" height="40" class="tech-table-header" />
    <text x="${TBL_X + TECH_TABLE_ZONE.w/2}" y="${TBL_Y + 25}" text-anchor="middle" class="text-title">TECHNICAL PARTICULARS</text>
  `
  TBL_Y += 40
  svg += drawRow(TBL_Y, 30, ['PARTICULARS', 'MAIN HOIST', 'AUX HOIST', 'C.T.', 'L.T.'], true)
  TBL_Y += 30

  const getCompModel = (breakdown: any[], category: string) => {
    if (!breakdown) return '-'
    const item = breakdown.find(i => i.category === category)
    const rawModel = item ? (item.model || 'TBD') : '-'
    return rawModel.length > 12 && rawModel !== '-' ? rawModel.substring(0, 12) + '..' : rawModel
  }

  const mhMotor = getCompModel(estimation?.mh_breakdown || [], 'MOTOR')
  const ahMotor = getCompModel(estimation?.ah_breakdown || [], 'MOTOR')
  const ctMotor = getCompModel(estimation?.ct_breakdown || [], 'MOTOR')
  const ltMotor = getCompModel(estimation?.lt_breakdown || [], 'MOTOR')
  
  const mhGearbox = getCompModel(estimation?.mh_breakdown || [], 'GEARBOX')

  svg += drawRow(TBL_Y, 25, ['SPEED M/MIN', requirements.mh_speed.toString(), requirements.ah_speed?.toString() || '-', requirements.ct_speed.toString(), requirements.lt_speed.toString()])
  TBL_Y += 25
  svg += drawRow(TBL_Y, 25, ['MOTOR KW/FRAME SIZE', mhMotor, ahMotor, ctMotor, ltMotor])
  TBL_Y += 25
  svg += drawRow(TBL_Y, 25, ['GEAR BOX TYPE/QTY', mhGearbox, '-', '-', '-'])
  TBL_Y += 25
  svg += drawRow(TBL_Y, 25, ['BRAKE TYPE', 'DCEM/THRUSTER', 'DCEM/THRUSTER', 'EHT', 'EHT'])
  TBL_Y += 25
  svg += drawRow(TBL_Y, 25, ['ROPE DIA/CONST', 'FMC 6x36', 'FMC 6x36', '-', '-'])
  TBL_Y += 25
  svg += drawRow(TBL_Y, 25, ['NO OF FALLS', '4 / 8', hasAH ? '2 / 4' : '-', '-', '-'])
  TBL_Y += 25
  svg += drawRow(TBL_Y, 25, ['RAIL SIZE', '-', '-', requirements.rail_size, requirements.rail_size])
  TBL_Y += 25
  svg += drawRow(TBL_Y, 25, ['APPROX WT OF CRANE', (estimation?.structural_cost ? 'TBD TONS' : 'TBD TONS'), '-', '-', '-'])
  TBL_Y += 25

  // NOTES BOX
  svg += `
    <rect x="${TBL_X}" y="${TBL_Y + 20}" width="${TECH_TABLE_ZONE.w}" height="180" class="title-block" />
    <text x="${TBL_X + 10}" y="${TBL_Y + 40}" class="text-large">NOTES:</text>
    <text x="${TBL_X + 10}" y="${TBL_Y + 60}" class="text-standard">1. ALL DIMENSIONS ARE IN MM UNLESS OTHERWISE SPECIFIED.</text>
    <text x="${TBL_X + 10}" y="${TBL_Y + 80}" class="text-standard">2. POWER SUPPLY: ${requirements.power_supply.toUpperCase()}</text>
    <text x="${TBL_X + 10}" y="${TBL_Y + 100}" class="text-standard">3. ALL MOTORS ${requirements.duty_class} CDF, 6 POLE, CL-F INSULATION.</text>
    <text x="${TBL_X + 10}" y="${TBL_Y + 120}" class="text-standard">4. ELECTRICAL EQUIPMENT SUITABLE FOR ${requirements.ambient_temp} DEG C AMB TEMP.</text>
    <text x="${TBL_X + 10}" y="${TBL_Y + 140}" class="text-standard">5. VVVF DRIVE ${(requirements.vvvf_required === true || requirements.vvvf_required === 'true' as any) ? 'PROVIDED ON ALL MOTIONS.' : 'NOT PROVIDED.'}</text>
    <text x="${TBL_X + 10}" y="${TBL_Y + 160}" class="text-standard">6. ${requirements.control_type.toUpperCase()} OPERATION.</text>
    <text x="${TBL_X + 10}" y="${TBL_Y + 180}" class="text-standard">7. THIS DRAWING IS THE PROPERTY OF UNIQUE INDUSTRIAL HANDLERS.</text>
  `

  // CLEARANCES & DIMENSIONS BOX
  const dimBoxY = TBL_Y + 220
  svg += `
    <rect x="${TBL_X}" y="${dimBoxY}" width="${TECH_TABLE_ZONE.w}" height="100" class="title-block" />
    <text x="${TBL_X + TECH_TABLE_ZONE.w/2}" y="${dimBoxY + 20}" text-anchor="middle" class="text-large">CLEARANCES &amp; KEY DIMENSIONS</text>
    <line x1="${TBL_X}" y1="${dimBoxY + 30}" x2="${TBL_X + TECH_TABLE_ZONE.w}" y2="${dimBoxY + 30}" class="main-line" />
    
    <text x="${TBL_X + 10}" y="${dimBoxY + 50}" class="text-standard">WHEEL BASE (END CARRIAGE):</text>
    <text x="${TBL_X + 250}" y="${dimBoxY + 50}" class="text-standard" font-weight="bold">${endCarriageWidthMM} MM</text>
    
    <text x="${TBL_X + 10}" y="${dimBoxY + 70}" class="text-standard">HEADROOM (RAIL TOP TO ROOF):</text>
    <text x="${TBL_X + 250}" y="${dimBoxY + 70}" class="text-standard" font-weight="bold">${headroomMM} MM</text>
    
    <text x="${TBL_X + 10}" y="${dimBoxY + 90}" class="text-standard">MIN HOOK APPROACH (MH):</text>
    <text x="${TBL_X + 250}" y="${dimBoxY + 90}" class="text-standard" font-weight="bold">${config.min_hook_approach_mh_mm} MM (TYP)</text>
  `

  // MATERIAL OF CONSTRUCTION BOX
  const mocBoxY = dimBoxY + 120
  svg += `
    <rect x="${TBL_X}" y="${mocBoxY}" width="${TECH_TABLE_ZONE.w}" height="130" class="title-block" />
    <text x="${TBL_X + TECH_TABLE_ZONE.w/2}" y="${mocBoxY + 20}" text-anchor="middle" class="text-large">MATERIAL OF CONSTRUCTION (MOC)</text>
    <line x1="${TBL_X}" y1="${mocBoxY + 30}" x2="${TBL_X + TECH_TABLE_ZONE.w}" y2="${mocBoxY + 30}" class="main-line" />
    
    <text x="${TBL_X + 10}" y="${mocBoxY + 50}" class="text-standard">STRUCTURAL STEEL (GIRDERS/EC):</text>
    <text x="${TBL_X + 250}" y="${mocBoxY + 50}" class="text-standard">IS 2062 Gr.B / EQUIVALENT</text>
    
    <text x="${TBL_X + 10}" y="${mocBoxY + 70}" class="text-standard">LT / CT WHEELS:</text>
    <text x="${TBL_X + 250}" y="${mocBoxY + 70}" class="text-standard">EN-8 / EN-9 FORGED STEEL</text>
    
    <text x="${TBL_X + 10}" y="${mocBoxY + 90}" class="text-standard">GEARS &amp; PINIONS:</text>
    <text x="${TBL_X + 250}" y="${mocBoxY + 90}" class="text-standard">EN-9 / EN-24 ALLOY STEEL</text>
    
    <text x="${TBL_X + 10}" y="${mocBoxY + 110}" class="text-standard">PAINTING / FINISH (STD):</text>
    <text x="${TBL_X + 250}" y="${mocBoxY + 110}" class="text-standard">RED OXIDE + SYNTHETIC ENAMEL</text>
  `


  // ================= TITLE BLOCK =================
  const TITLE_X = TITLE_ZONE.x
  let TITLE_Y = TITLE_ZONE.y

  svg += `
    <rect x="${TITLE_X}" y="${TITLE_Y}" width="${TITLE_ZONE.w}" height="${TITLE_ZONE.h}" class="grid-border" />
    
    <!-- Company Name Header -->
    <rect x="${TITLE_X}" y="${TITLE_Y}" width="${TITLE_ZONE.w}" height="40" class="title-block" fill="#f0f0f0"/>
    <text x="${TITLE_X + TITLE_ZONE.w/2}" y="${TITLE_Y + 25}" text-anchor="middle" class="text-title">UNIQUE INDUSTRIAL HANDLERS PVT. LTD.</text>
    
    <!-- Signatures -->
    <rect x="${TITLE_X}" y="${TITLE_Y + 40}" width="${TITLE_ZONE.w}" height="80" class="title-block" />
    <line x1="${TITLE_X + 80}" y1="${TITLE_Y + 40}" x2="${TITLE_X + 80}" y2="${TITLE_Y + 120}" class="main-line" />
    <line x1="${TITLE_X + 220}" y1="${TITLE_Y + 40}" x2="${TITLE_X + 220}" y2="${TITLE_Y + 120}" class="main-line" />
    <line x1="${TITLE_X}" y1="${TITLE_Y + 60}" x2="${TITLE_ZONE.w + TITLE_X}" y2="${TITLE_Y + 60}" class="main-line" />
    
    <text x="${TITLE_X + 40}" y="${TITLE_Y + 55}" text-anchor="middle" class="text-large">WORK</text>
    <text x="${TITLE_X + 150}" y="${TITLE_Y + 55}" text-anchor="middle" class="text-large">DATE</text>
    <text x="${TITLE_X + 360}" y="${TITLE_Y + 55}" text-anchor="middle" class="text-large">NAME/SIGN</text>
    
    <text x="${TITLE_X + 40}" y="${TITLE_Y + 80}" text-anchor="middle" class="text-standard">DRN.</text>
    <text x="${TITLE_X + 150}" y="${TITLE_Y + 80}" text-anchor="middle" class="text-standard">${date}</text>
    <text x="${TITLE_X + 360}" y="${TITLE_Y + 80}" text-anchor="middle" class="text-standard">${preparedBy.toUpperCase()}</text>
    
    <text x="${TITLE_X + 40}" y="${TITLE_Y + 100}" text-anchor="middle" class="text-standard">CHD.</text>
    <text x="${TITLE_X + 40}" y="${TITLE_Y + 115}" text-anchor="middle" class="text-standard">APPD.</text>
    
    <!-- Meta Info -->
    <rect x="${TITLE_X}" y="${TITLE_Y + 120}" width="${TITLE_ZONE.w}" height="30" class="title-block" />
    <line x1="${TITLE_X + 120}" y1="${TITLE_Y + 120}" x2="${TITLE_X + 120}" y2="${TITLE_Y + 150}" class="main-line" />
    <line x1="${TITLE_X + 420}" y1="${TITLE_Y + 120}" x2="${TITLE_X + 420}" y2="${TITLE_Y + 150}" class="main-line" />
    
    <text x="${TITLE_X + 10}" y="${TITLE_Y + 140}" class="text-standard">SCALE: N.T.S.</text>
    <text x="${TITLE_X + 130}" y="${TITLE_Y + 140}" class="text-large">DRG.NO: ${jobRef}-GA</text>
    <text x="${TITLE_X + TITLE_ZONE.w - 10}" y="${TITLE_Y + 140}" text-anchor="end" class="text-standard">REV: 0</text>

    <!-- Main Title Area -->
    <rect x="${TITLE_X}" y="${TITLE_Y + 150}" width="${TITLE_ZONE.w}" height="${TITLE_ZONE.h - 150}" class="title-block" fill="#FAFAFA" />
    <text x="${TITLE_X + TITLE_ZONE.w/2}" y="${TITLE_Y + 180}" text-anchor="middle" class="text-large">GENERAL ARRANGEMENT</text>
    <text x="${TITLE_X + TITLE_ZONE.w/2}" y="${TITLE_Y + 210}" text-anchor="middle" class="text-title">FOR ${requirements.mh_capacity}${hasAH ? '/' + requirements.ah_capacity : ''}T x ${requirements.span}M SPAN EOT CRANE</text>
    <text x="${TITLE_X + TITLE_ZONE.w/2}" y="${TITLE_Y + 240}" text-anchor="middle" class="text-large">EOT CRANE — ${clientName.toUpperCase()}</text>
  `

  svg += '</svg>'
  
  return svg
}
