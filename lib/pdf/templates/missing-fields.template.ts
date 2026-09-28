export interface MissingField {
  field: string
  label: string
  severity: 'blocking' | 'warning' | 'info'
  reason: string
}

export function generateMissingFieldsHTML(data: {
  job: { ref_number: string }
  client: { name: string; company: string; email: string }
  missingFields: MissingField[]
  today: string
  companyConfig: Record<string, string>
}): string {
  const { job, client, missingFields, today, companyConfig } = data
  const validUntil = new Date()
  validUntil.setDate(validUntil.getDate() + 7)
  const validStr = validUntil.toLocaleDateString('en-IN')

  const rows = missingFields.map((f, i) => {
    let color = '#3498DB'
    if (f.severity === 'blocking') color = '#C0392B'
    if (f.severity === 'warning') color = '#E67E22'
    
    return '<tr>' +
      '<td style="text-align:center; border-left:4px solid ' + color + '">' + (i + 1) + '</td>' +
      '<td><strong>' + f.label + '</strong></td>' +
      '<td>' + f.reason + '</td>' +
      '<td></td>' +
    '</tr>'
  }).join('')

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  @page { size: A4; margin: 0; }
  body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
  .page { width: 210mm; min-height: 297mm; padding: 15mm; box-sizing: border-box; }
  .header { background: #0B2545; color: white; padding: 20px; margin: -15mm -15mm 20px -15mm; }
  .company-name { font-size: 22px; font-weight: bold; }
  .accent-bar { background: #E67E22; height: 3px; margin: -20px -20px 20px -20px; }
  .doc-title { font-size: 16px; font-weight: bold; color: #0B2545; text-align: center; border-bottom: 2px solid #0B2545; padding-bottom: 8px; margin-bottom: 20px; }
  
  .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px; }
  .meta-table td { padding: 4px 8px; vertical-align: top; }
  .address-block { border-left: 3px solid #0B2545; padding-left: 12px; margin: 15px 0; }
  
  .body-text { font-size: 12px; line-height: 1.6; color: #333; margin-bottom: 20px; }
  
  .data-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px; }
  .data-table th, .data-table td { padding: 10px; border: 1px solid #ddd; }
  .data-table th { background: #EAF2FB; color: #0B2545; text-align: left; }
  
  .legend { font-size: 10px; display: flex; gap: 15px; margin-bottom: 40px; }
  .legend span { display: flex; align-items: center; gap: 5px; }
  .legend-box { width: 12px; height: 12px; }
</style>
</head>
<body>

<div class="page">
  <div class="header">
    <div class="company-name">UNIQUE INDUSTRIAL HANDLERS PVT. LTD.</div>
  </div>
  <div class="accent-bar"></div>
  
  <div class="doc-title">ADDITIONAL INFORMATION REQUIRED</div>
  
  <table class="meta-table">
    <tr>
      <td style="width: 50%;">
        <strong>To:</strong><br>
        <div class="address-block">
          <strong>${client.company}</strong><br>
          Attn: ${client.name}<br>
          ${client.email}
        </div>
      </td>
      <td style="width: 50%;">
        <table style="width: 100%;">
          <tr><td style="font-weight:bold; color:#0B2545">Our Ref</td><td>: UC-${job.ref_number}</td></tr>
          <tr><td style="font-weight:bold; color:#0B2545">Date</td><td>: ${today}</td></tr>
        </table>
      </td>
    </tr>
  </table>
  
  <div class="body-text">
    <p>Dear Sir/Madam,</p>
    <p>Thank you for your enquiry. To prepare a detailed technical and commercial offer, we require the following additional information at your earliest convenience.</p>
  </div>
  
  <table class="data-table">
    <tr>
      <th style="width:5%">Sr</th>
      <th style="width:25%">Field Required</th>
      <th style="width:35%">Why Needed</th>
      <th style="width:35%">Your Response</th>
    </tr>
    ${rows}
  </table>
  
  <div class="legend">
    <span><div class="legend-box" style="background:#C0392B"></div> Blocking (Required for design)</span>
    <span><div class="legend-box" style="background:#E67E22"></div> Warning (Impacts pricing)</span>
    <span><div class="legend-box" style="background:#3498DB"></div> Info (Good to have)</span>
  </div>
  
  <div class="body-text" style="text-align:center; font-weight:bold; color:#C0392B; padding:15px; background:#FDF2E9; border-radius:5px;">
    Please return to ${companyConfig.COMPANY_EMAIL || 'our sales team'} by ${validStr} to avoid delays in quoting.
  </div>
  
  <div class="body-text" style="margin-top: 50px;">
    <p>Yours faithfully,</p>
    <p><strong>UNIQUE INDUSTRIAL HANDLERS PVT. LTD.</strong></p>
  </div>
</div>

</body>
</html>
  `
}
