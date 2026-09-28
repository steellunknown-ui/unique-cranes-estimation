import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const id = resolvedParams.id
  
  try {
    const supabase = await createClient()

    // 1. Get latest drawing document
    const { data: doc, error } = await supabase
      .from('documents')
      .select('*')
      .eq('job_id', id)
      .eq('type', 'ga_drawing')
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error || !doc) {
      return new NextResponse('Drawing not found. Please generate the drawing first.', { status: 404 })
    }

    // 2. Fetch SVG content from storage
    const { data: fileData, error: dlError } = await supabase.storage
      .from('ga-drawings')
      .download(doc.storage_path as string)

    if (dlError || !fileData) {
      return new NextResponse('Error downloading drawing from storage.', { status: 500 })
    }

    const svgString = await fileData.text()

    // 3. Construct HTML document with Print CSS and Auto-print script
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>GA Drawing Print</title>
        <style>
          @media print {
            @page { 
              size: A1 landscape; 
              margin: 0; 
            }
            body { margin: 0; padding: 0; }
            svg { 
              width: 100vw; 
              height: 100vh; 
              max-width: 100%; 
            }
          }
          /* Screen preview styles */
          body { 
            margin: 0; 
            padding: 20px; 
            background: #f0f0f0; 
            display: flex; 
            justify-content: center; 
            align-items: center; 
            min-height: 100vh;
          }
          .print-wrapper {
            background: white;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          @media print {
            .print-wrapper {
              box-shadow: none;
              background: transparent;
            }
          }
        </style>
      </head>
      <body>
        <div class="print-wrapper">
          ${svgString}
        </div>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8'
      }
    })

  } catch (err: any) {
    return new NextResponse(err.message, { status: 500 })
  }
}
