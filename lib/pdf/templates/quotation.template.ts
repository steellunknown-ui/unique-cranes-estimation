export interface QuotationTemplateData {
  job: { ref_number: string; created_at: string }
  client: { name: string; company: string; address: string; email: string; phone: string }
  requirements: any // JobRequirements
  estimation: any // EstimationResult
  svgDrawing: string | null
  preparedBy: string
  companyConfig: Record<string, string>
  includeGST: boolean
}

const inr = (n: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR',
    maximumFractionDigits: 0
  }).format(n)

export function generateQuotationHTML(data: QuotationTemplateData): string {
  const { job, client, requirements, estimation, svgDrawing, preparedBy, companyConfig, includeGST } = data
  const QUOTATION_VALIDITY_DAYS = parseInt(companyConfig.QUOTATION_VALIDITY_DAYS || '30')
  const validUntil = new Date()
  validUntil.setDate(validUntil.getDate() + QUOTATION_VALIDITY_DAYS)

  const todayStr = new Date().toLocaleDateString('en-IN')
  const validStr = validUntil.toLocaleDateString('en-IN')
  
  const hasAH = (requirements.ah_capacity || 0) > 0
  const capacityStr = hasAH ? `${requirements.mh_capacity}/${requirements.ah_capacity}` : `${requirements.mh_capacity}`
  
  let cleanSvg = ''
  if (svgDrawing) {
    cleanSvg = svgDrawing.replace(/<script[\s\S]*?<\/script>/gi, '')
  }

  // Calculate Subtotal & GST
  let subtotal = 0
  const sections = [
    { title: 'Main Hoist System', items: estimation.mh_breakdown || [] },
    { title: 'Aux Hoist System', items: estimation.ah_breakdown || [] },
    { title: 'Cross Travel System', items: estimation.ct_breakdown || [] },
    { title: 'Long Travel System', items: estimation.lt_breakdown || [] },
    { title: 'Electrical & Panels', items: [{ component: 'Electrical System', total: estimation.crd_cost || 0 }] },
    { title: 'Structure & Assembly', items: [{ component: 'Structural Fabrication', total: estimation.structural_cost || 0 }] },
    { title: 'Misc & Painting', items: [{ component: 'Painting & Misc', total: (estimation.painting_cost || 0) + (estimation.misc_cost || 0) }] }
  ]
  
  sections.forEach(s => {
    s.items.forEach((item: any) => { subtotal += (item.total || 0) })
  })
  
  let gst = 0
  let grandTotal = subtotal
  if (includeGST) {
    const rate = parseFloat(companyConfig.GST_RATE || '18') / 100
    gst = subtotal * rate
    grandTotal += gst
  }

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  @page { size: A4; margin: 0; }
  body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
  .page { width: 210mm; min-height: 297mm; padding: 15mm; 
          box-sizing: border-box; page-break-after: always; }
  .header { background: #0B2545; color: white; 
            padding: 20px; margin: -15mm -15mm 20px -15mm; }
  .company-name { font-size: 22px; font-weight: bold; }
  .accent-bar { background: #E67E22; height: 3px; 
                margin: -20px -20px 20px -20px; }
  .doc-title { font-size: 16px; font-weight: bold; 
               color: #0B2545; text-align: center; 
               border-bottom: 2px solid #0B2545; 
               padding-bottom: 8px; margin-bottom: 20px; }
  .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  .meta-table td { padding: 4px 8px; font-size: 11px; vertical-align: top; }
  .meta-label { font-weight: bold; color: #0B2545; width: 35%; }
  .address-block { border-left: 3px solid #0B2545; padding-left: 12px; margin: 15px 0; }
  .subject-line { background: #EAF2FB; padding: 10px 15px; 
                  font-weight: bold; font-size: 12px; 
                  border-left: 4px solid #0B2545; margin: 15px 0; }
  .body-text { font-size: 11px; line-height: 1.6; color: #333; }
  
  .section-title { font-size: 14px; font-weight: bold; color: #0B2545; margin: 20px 0 10px 0; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
  .data-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 11px; }
  .data-table th, .data-table td { padding: 8px; border: 1px solid #ddd; }
  .data-table th { background: #EAF2FB; color: #0B2545; text-align: left; }
  .data-table tr:nth-child(even) { background-color: #F4F6F7; }
  
  .summary-table { width: 70%; float: right; border-collapse: collapse; font-size: 11px; margin-bottom: 20px; }
  .summary-table td { padding: 8px; border-bottom: 1px solid #ddd; }
  .summary-label { text-align: right; font-weight: bold; color: #0B2545; }
  .summary-val { text-align: right; width: 30%; }
  .grand-total { background: #0B2545; color: white; font-weight: bold; font-size: 13px; }
  .grand-total td { border: none !important; }
  
  .terms-list { font-size: 11px; padding-left: 20px; line-height: 1.6; }
  .terms-list li { margin-bottom: 8px; }
  
  .signature-box { border-top: 1px dashed #ccc; width: 200px; text-align: center; font-size: 11px; margin-top: 60px; padding-top: 5px; }
  .clear { clear: both; }
</style>
</head>
<body>

  <!-- PAGE 1: COVER -->
  <div class="page">
    <div class="header">
      <div class="company-name">UNIQUE INDUSTRIAL HANDLERS PVT. LTD.</div>
      <div style="font-size:10px; margin-top:5px;">
        ${companyConfig.COMPANY_ADDRESS || 'Address'} | Email: ${companyConfig.COMPANY_EMAIL || 'Email'} | Phone: ${companyConfig.COMPANY_PHONE || 'Phone'}
      </div>
    </div>
    <div class="accent-bar"></div>
    
    <div class="doc-title">TECHNICAL & COMMERCIAL QUOTATION</div>
    
    <table class="meta-table">
      <tr>
        <td style="width: 50%;">
          <strong>To:</strong><br>
          <div class="address-block">
            <strong>${client.company}</strong><br>
            ${client.address || ''}<br><br>
            Attn: ${client.name}
          </div>
        </td>
        <td style="width: 50%;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td class="meta-label">Our Ref</td><td class="info-value">: ${job.ref_number}</td></tr>
            <tr><td class="meta-label">Date</td><td>: ${todayStr}</td></tr>
            <tr><td class="meta-label">Valid Until</td><td>: ${validStr}</td></tr>
          </table>
        </td>
      </tr>
    </table>
    
    <div class="subject-line">
      Re: Supply of 1 No. ${requirements.crane_type.replace(/_/g, ' ')} Crane, ${capacityStr}T x ${requirements.span}M Span for ${client.company}
    </div>
    
    <div class="body-text">
      <p>Dear Sir/Madam,</p>
      <p>We thank you for your enquiry and the interest shown in our products. We are pleased to submit our most competitive offer for the design, manufacture, testing, and supply of the subject crane.</p>
      <p>Our quotation is detailed in the following sections:</p>
      <ul>
        <li>Section 1: Technical Specifications</li>
        <li>Section 2: Price Summary</li>
        <li>Section 3: Terms & Conditions</li>
        <li>Section 4: General Arrangement Drawing</li>
      </ul>
      <p>We hope you will find our offer competitive and structurally robust. We look forward to receiving your valued order.</p>
    </div>
  </div>

  <!-- PAGE 2: TECHNICAL SPECIFICATIONS -->
  <div class="page">
    <div class="section-title">1. TECHNICAL SPECIFICATIONS</div>
    <table class="data-table">
      <tr><th style="width:40%">Parameter</th><th>Specification</th></tr>
      <tr><td>Crane Type</td><td>${requirements.crane_type.replace(/_/g, ' ')}</td></tr>
      <tr><td>Capacity (MH${hasAH ? ' / AH' : ''})</td><td>${capacityStr} Tonnes</td></tr>
      <tr><td>Span</td><td>${requirements.span} Metres</td></tr>
      <tr><td>Height of Lift</td><td>${requirements.mh_lift} Metres</td></tr>
      <tr><td>Location</td><td>${requirements.location_type}</td></tr>
      <tr><td>Duty Class</td><td>${requirements.duty_class}</td></tr>
      <tr><td>Power Supply</td><td>${requirements.power_supply}</td></tr>
      <tr><td>Control Type</td><td>${requirements.control_type.replace(/_/g, ' ')}</td></tr>
      <tr><td>Main Hoist Speed</td><td>${requirements.mh_speed} M/Min</td></tr>
      ${hasAH ? '<tr><td>Aux Hoist Speed</td><td>' + requirements.ah_speed + ' M/Min</td></tr>' : ''}
      <tr><td>Cross Travel Speed</td><td>${requirements.ct_speed} M/Min</td></tr>
      <tr><td>Long Travel Speed</td><td>${requirements.lt_speed} M/Min</td></tr>
    </table>
    
    <div class="section-title">PREFERRED MAKES</div>
    <div class="body-text">
      Motors: Crompton / Bharat Bijlee / BBL<br>
      Gearboxes: Premium / Shanthi / Elecon<br>
      Brakes: Electromag / Speed-O-Control<br>
      Wire Rope: Usha Martin / FMC<br>
      Electricals: L&T / Siemens / Schneider
    </div>
  </div>

  <!-- PAGE 3: COMMERCIAL SUMMARY -->
  <div class="page">
    <div class="section-title">2. PRICE SUMMARY</div>
    
    <table class="summary-table">
      ${sections.filter(s => s.items.length > 0).map(s => {
        const sum = s.items.reduce((acc: number, cur: any) => acc + (cur.total || 0), 0)
        return '<tr><td class="summary-label">' + s.title + '</td><td class="summary-val">' + inr(sum) + '</td></tr>'
      }).join('')}
      <tr><td class="summary-label" style="border-top:2px solid #0B2545">Subtotal</td><td class="summary-val" style="border-top:2px solid #0B2545"><strong>${inr(subtotal)}</strong></td></tr>
      ${includeGST ? '<tr><td class="summary-label">GST (@' + (companyConfig.GST_RATE || '18') + '%)</td><td class="summary-val">' + inr(gst) + '</td></tr>' : ''}
      <tr class="grand-total"><td class="summary-label" style="color:white">GRAND TOTAL</td><td class="summary-val">${inr(grandTotal)}</td></tr>
    </table>
    <div class="clear"></div>
    <div class="body-text" style="text-align: right; margin-top: 10px;">
      <em>Price valid for ${QUOTATION_VALIDITY_DAYS} days. Ex-works basis.</em>
    </div>
  </div>

  <!-- PAGE 4: TERMS & CONDITIONS -->
  <div class="page">
    <div class="section-title">3. TERMS & CONDITIONS</div>
    <div class="body-text">
      ${(companyConfig.TERMS_AND_CONDITIONS || '').split('\\n').map(p => '<p>' + p + '</p>').join('')}
    </div>
  </div>

  <!-- PAGE 5: GA DRAWING -->
  <div class="page">
    <div class="section-title">4. GENERAL ARRANGEMENT DRAWING</div>
    ${cleanSvg ? 
      '<div style="width:100%; text-align:center; margin-top:10px;">' + cleanSvg.replace('<svg ', '<svg style="width:100%;height:auto;max-height:240mm" ') + '</div>' 
      : 
      '<div style="width:100%; height:200px; border:2px dashed #ccc; display:flex; align-items:center; justify-content:center; color:#666; margin-top:20px;">' +
      '   GA Drawing: ' + job.ref_number + '-GA &mdash; To Follow' +
      ' </div>'
    }
  </div>

  <!-- PAGE 6: SIGN OFF -->
  <div class="page">
    <div class="body-text" style="margin-top: 40px; font-size: 13px;">
      <p>Thanking you and assuring you of our best services.</p>
      <p style="margin-top:40px">Yours faithfully,</p>
      <p><strong>UNIQUE INDUSTRIAL HANDLERS PVT. LTD.</strong></p>
    </div>
    
    <div style="display:flex; justify-content:space-between; margin-top:80px;">
      <div class="signature-box">
        Prepared by<br>${preparedBy}<br>Date: ${todayStr}
      </div>
      <div style="width:150px; height:100px; border:2px dashed #ccc; display:flex; align-items:center; justify-content:center; color:#999; font-size:10px; margin-top:-40px;">
        Company Stamp
      </div>
      <div class="signature-box">
        Authorised Signatory<br>Director<br>Date: ${todayStr}
      </div>
    </div>
  </div>

</body>
</html>
  `
}
