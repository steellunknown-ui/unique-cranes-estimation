export interface JobCardTemplateData {
  job: { ref_number: string; created_at: string }
  client: { name: string; company: string }
  requirements: any // JobRequirements
  estimation: any // EstimationResult
  preparedBy: string
}

const inr = (n: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR',
    maximumFractionDigits: 0
  }).format(n)

export function generateJobCardHTML(data: JobCardTemplateData): string {
  const { job, client, requirements, estimation, preparedBy } = data
  const todayStr = new Date().toLocaleDateString('en-IN')
  
  const hasAH = (requirements.ah_capacity || 0) > 0
  const capacityStr = hasAH ? `${requirements.mh_capacity}/${requirements.ah_capacity}` : `${requirements.mh_capacity}`

  const getRows = (breakdown: any[], motion: string) => {
    return breakdown.map((item: any) => {
      const isManual = item.source === 'manual' && item.unit_rate === 0
      const rateStr = isManual ? 'TBD' : inr(item.unit_rate)
      const totalStr = isManual ? 'TBD' : inr(item.total)
      const bg = isManual ? 'background-color: #FFF3CD;' : ''
      return `<tr style="${bg}">
        <td>${motion}</td>
        <td>${item.component}</td>
        <td>${item.model || 'TBD'}</td>
        <td style="text-align:center">${item.quantity}</td>
        <td style="text-align:right">${rateStr}</td>
        <td style="text-align:right">${totalStr}</td>
      </tr>`
    }).join('')
  }
  
  const getSubtotal = (breakdown: any[]) => breakdown.reduce((sum: number, i: any) => sum + (i.total || 0), 0)
  
  const mhRows = getRows(estimation.mh_breakdown || [], 'MH')
  const ahRows = getRows(estimation.ah_breakdown || [], 'AH')
  const ctRows = getRows(estimation.ct_breakdown || [], 'CT')
  const ltRows = getRows(estimation.lt_breakdown || [], 'LT')

  const totalMH = getSubtotal(estimation.mh_breakdown || [])
  const totalAH = getSubtotal(estimation.ah_breakdown || [])
  const totalCT = getSubtotal(estimation.ct_breakdown || [])
  const totalLT = getSubtotal(estimation.lt_breakdown || [])
  
  const grandTotal = totalMH + totalAH + totalCT + totalLT

  // Mini tables logic
  const findItem = (bd: any[], cat: string) => bd.find(i => i.category === cat) || {}
  const mhMotor = findItem(estimation.mh_breakdown || [], 'MOTOR')
  const ahMotor = findItem(estimation.ah_breakdown || [], 'MOTOR')
  const ctMotor = findItem(estimation.ct_breakdown || [], 'MOTOR')
  const ltMotor = findItem(estimation.lt_breakdown || [], 'MOTOR')
  
  const mhGearbox = findItem(estimation.mh_breakdown || [], 'GEARBOX')
  const ctGearbox = findItem(estimation.ct_breakdown || [], 'GEARBOX')
  const ltGearbox = findItem(estimation.lt_breakdown || [], 'GEARBOX')

  const mhRope = findItem(estimation.mh_breakdown || [], 'WIRE_ROPE')
  const mhDrum = findItem(estimation.mh_breakdown || [], 'ROPE_DRUM')
  const ahRope = findItem(estimation.ah_breakdown || [], 'WIRE_ROPE')

  const mhDCEM = findItem(estimation.mh_breakdown || [], 'BRAKE_DCEM')
  const ahDCEM = findItem(estimation.ah_breakdown || [], 'BRAKE_DCEM')
  const ctEHT = findItem(estimation.ct_breakdown || [], 'BRAKE_EHT')
  const ltEHT = findItem(estimation.lt_breakdown || [], 'BRAKE_EHT')

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  @page { size: A4 landscape; margin: 10mm; }
  body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
  .header-table { width: 100%; border-bottom: 2px solid #0B2545; margin-bottom: 10px; }
  .grid-2 { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 10px; }
  .banner { background: #0B2545; color: white; padding: 8px; font-weight: bold; text-align: center; margin-bottom: 10px; font-size: 12px; }
  
  .data-table { width: 100%; border-collapse: collapse; font-size: 9px; margin-bottom: 10px; }
  .data-table th, .data-table td { padding: 4px; border: 1px solid #ccc; }
  .data-table th { background: #EAF2FB; color: #0B2545; }
  .subtotal-row { background: #F4F6F7; font-weight: bold; }
  .grand-total-row { background: #0B2545; color: white; font-weight: bold; }
  
  .mini-tables { display: flex; gap: 10px; font-size: 9px; }
  .mini-table { flex: 1; border-collapse: collapse; }
  .mini-table th, .mini-table td { padding: 4px; border: 1px solid #ccc; }
  .mini-table th { background: #eee; }
  
  .footer { margin-top: 20px; font-size: 10px; display: flex; justify-content: space-between; font-weight: bold; }
</style>
</head>
<body>

<table class="header-table">
  <tr>
    <td style="font-size:24px; font-weight:bold; color:#0B2545">UNICRANE</td>
    <td style="text-align:center; font-size:12px; font-weight:bold;">UNIQUE INDUSTRIAL HANDLERS PVT. LTD.</td>
    <td style="text-align:right; font-size:24px; font-weight:bold; color:#0B2545">JOB CARD</td>
  </tr>
</table>

<div class="grid-2">
  <div>
    <strong>CUSTOMER:</strong> ${client.company}<br>
    <strong>JOB NO:</strong> ${job.ref_number}
  </div>
  <div style="text-align:right;">
    <strong>DATE:</strong> ${todayStr}<br>
    <strong>DESIGNER:</strong> ${preparedBy}
  </div>
</div>

<div class="banner">
  ${requirements.crane_type.replace(/_/g, ' ')} | ${capacityStr}T | ${requirements.span}M SPAN | ${requirements.location_type} | DUTY: ${requirements.duty_class}
</div>

<table class="data-table">
  <tr>
    <th>MOTION</th>
    <th>COMPONENT</th>
    <th>MODEL</th>
    <th style="text-align:center">QTY</th>
    <th style="text-align:right">UNIT RATE</th>
    <th style="text-align:right">TOTAL</th>
  </tr>
  ${mhRows}
  <tr class="subtotal-row"><td colspan="5" style="text-align:right">MH Subtotal:</td><td style="text-align:right">${inr(totalMH)}</td></tr>
  ${hasAH ? '<tr class="subtotal-row"><td colspan="5" style="text-align:right">AH Subtotal:</td><td style="text-align:right">' + inr(totalAH) + '</td></tr>' : ''}
  ${ctRows}
  <tr class="subtotal-row"><td colspan="5" style="text-align:right">CT Subtotal:</td><td style="text-align:right">${inr(totalCT)}</td></tr>
  ${ltRows}
  <tr class="subtotal-row"><td colspan="5" style="text-align:right">LT Subtotal:</td><td style="text-align:right">${inr(totalLT)}</td></tr>
  
  <tr class="grand-total-row">
    <td colspan="5" style="text-align:right">MECHANICAL GRAND TOTAL</td>
    <td style="text-align:right">${inr(grandTotal)}</td>
  </tr>
</table>

<div class="mini-tables">
  <table class="mini-table">
    <tr><th colspan="2">ROPE & DRUM</th></tr>
    <tr><td>MH Rope</td><td>${mhRope.model || '-'}</td></tr>
    <tr><td>MH Drum</td><td>${mhDrum.model || '-'}</td></tr>
    <tr><td>AH Rope</td><td>${ahRope.model || '-'}</td></tr>
  </table>
  
  <table class="mini-table">
    <tr><th colspan="2">MOTORS</th></tr>
    <tr><td>MH</td><td>${mhMotor.model || '-'}</td></tr>
    <tr><td>AH</td><td>${ahMotor.model || '-'}</td></tr>
    <tr><td>CT</td><td>${ctMotor.model || '-'}</td></tr>
    <tr><td>LT</td><td>${ltMotor.model || '-'}</td></tr>
  </table>
  
  <table class="mini-table">
    <tr><th colspan="2">GEARBOXES</th></tr>
    <tr><td>MH</td><td>${mhGearbox.model || '-'}</td></tr>
    <tr><td>CT</td><td>${ctGearbox.model || '-'}</td></tr>
    <tr><td>LT</td><td>${ltGearbox.model || '-'}</td></tr>
  </table>
  
  <table class="mini-table">
    <tr><th colspan="2">BRAKES</th></tr>
    <tr><td>MH</td><td>DCEM ${mhDCEM.model || '-'} x${mhDCEM.quantity || 0}</td></tr>
    <tr><td>AH</td><td>DCEM ${ahDCEM.model || '-'}</td></tr>
    <tr><td>CT</td><td>EHT ${ctEHT.model || '-'} x${ctEHT.quantity || 0}</td></tr>
    <tr><td>LT</td><td>EHT ${ltEHT.model || '-'} x${ltEHT.quantity || 0}</td></tr>
  </table>
</div>

<div class="footer">
  <div>PREPARED BY: _________________________ DATE: ________________</div>
  <div>APPROVED BY: _________________________ DATE: ________________</div>
</div>

</body>
</html>
  `
}
