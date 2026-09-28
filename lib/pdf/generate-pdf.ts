import { getBrowser } from './puppeteer-instance'

export async function generatePDF(html: string): Promise<Buffer> {
  const browser = await getBrowser()
  const page = await browser.newPage()
  
  try {
    await page.setContent(html, { waitUntil: 'domcontentloaded' })
    await page.waitForNetworkIdle({ timeout: 15000 })
    
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', bottom: '0', left: '0', right: '0' },
      preferCSSPageSize: true,
    })
    
    return pdf as Buffer
  } catch (error) {
    throw new Error(`PDF generation failed: ${error}`)
  } finally {
    await page.close()
  }
}
