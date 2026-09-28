import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import ExcelJS from 'exceljs'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params
    const id = resolvedParams.id
    
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new NextResponse('Unauthorized', { status: 401 })

    // Fetch Job + Requirements
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

    // Generate Excel
    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'Unique Cranes ERP'
    workbook.created = new Date()

    const sheet = workbook.addWorksheet('Technical Inputs', {
      views: [{ showGridLines: false }]
    })

    // Setup Columns
    sheet.columns = [
      { header: 'No.', key: 'id', width: 8 },
      { header: 'Parameter', key: 'param', width: 35 },
      { header: 'Description / Value', key: 'value', width: 45 },
      { header: 'Unit', key: 'unit', width: 15 }
    ]

    // Title Row
    sheet.mergeCells('A1:D1')
    const titleCell = sheet.getCell('A1')
    titleCell.value = 'TECHNICAL SPECIFICATIONS FOR CRANE'
    titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } }
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0B2545' } }
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
    sheet.getRow(1).height = 30

    // Client Info
    sheet.mergeCells('A2:D2')
    const clientCell = sheet.getCell('A2')
    clientCell.value = `Client: ${job.client_company || 'N/A'} | Ref: ${job.ref_number}`
    clientCell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FF0B2545' } }
    clientCell.alignment = { horizontal: 'center', vertical: 'middle' }
    clientCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }
    sheet.getRow(2).height = 25

    // Spacer
    sheet.addRow([])

    // Headers
    const headerRow = sheet.getRow(4)
    headerRow.values = ['S.No.', 'Description', 'Value', 'Unit']
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF64748B' } }
    headerRow.alignment = { horizontal: 'center' }

    let rowIndex = 5
    let sn = 1

    const addSection = (title: string) => {
      sheet.mergeCells(`A${rowIndex}:D${rowIndex}`)
      const cell = sheet.getCell(`A${rowIndex}`)
      cell.value = title
      cell.font = { bold: true, color: { argb: 'FF0F172A' } }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } }
      cell.alignment = { vertical: 'middle' }
      sheet.getRow(rowIndex).height = 20
      rowIndex++
    }

    const addRow = (param: string, val: any, unit: string = '') => {
      const row = sheet.getRow(rowIndex)
      row.values = [sn++, param, val ?? 'TBA', unit]
      
      row.getCell(1).alignment = { horizontal: 'center' }
      row.getCell(2).alignment = { horizontal: 'left', indent: 1 }
      row.getCell(3).alignment = { horizontal: 'left', indent: 1 }
      row.getCell(4).alignment = { horizontal: 'center' }

      // Borders
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        if (colNumber <= 4) {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
            left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
            bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
            right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
          }
        }
      })
      
      rowIndex++
    }

    addSection('1. BASIC INFORMATION')
    addRow('Crane Type', reqs.crane_type)
    addRow('Quantity', reqs.quantity, 'Nos.')
    addRow('Location', reqs.location_type)
    addRow('Control Type', reqs.control_type)

    addSection('2. CAPACITY & DIMENSIONS')
    addRow('Main Hoist (MH) Capacity', reqs.mh_capacity, 'Tonnes')
    if (reqs.ah_required) {
      addRow('Auxiliary Hoist (AH) Capacity', reqs.ah_capacity, 'Tonnes')
    }
    addRow('Span', reqs.span, 'Meters')
    addRow('Bay Length', reqs.bay_length, 'Meters')
    addRow('MH Lift', reqs.mh_lift, 'Meters')
    if (reqs.ah_required) {
      addRow('AH Lift', reqs.ah_lift, 'Meters')
    }

    addSection('3. SPEEDS')
    addRow('Main Hoist Speed', reqs.mh_speed, 'M/Min')
    if (reqs.ah_required) {
      addRow('Aux Hoist Speed', reqs.ah_speed, 'M/Min')
    }
    addRow('Cross Travel (CT) Speed', reqs.ct_speed, 'M/Min')
    addRow('Long Travel (LT) Speed', reqs.lt_speed, 'M/Min')
    addRow('Micro Speed Required', reqs.micro_speed ? 'Yes' : 'No')

    addSection('4. ELECTRICAL & ENVIRONMENT')
    addRow('Ambient Temperature', reqs.ambient_temp, '°C')
    addRow('Duty Class', reqs.duty_class)
    addRow('VVVF Drive Required', reqs.vvvf_required ? 'Yes' : 'No')
    addRow('Power Supply', reqs.power_supply)

    addSection('5. CIVIL & STRUCTURAL')
    addRow('Rail Size', reqs.rail_size)
    addRow('DSL Type', reqs.dsl_type)

    addSection('6. SPECIAL FEATURES')
    const features = Array.isArray(reqs.special_features) ? reqs.special_features.join(', ') : 'None'
    addRow('Included Features', features)

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer()

    const filename = `${job.ref_number}_Technical_Inputs.xlsx`

    return new NextResponse(buffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.byteLength.toString(),
      }
    })

  } catch (error: any) {
    console.error('Excel Export error:', error)
    return new NextResponse(error.message, { status: 500 })
  }
}
