import type { Browser } from 'puppeteer-core'

let browserInstance: Browser | null = null

export async function getBrowser(): Promise<Browser> {
  if (browserInstance) return browserInstance

  if (process.env.NODE_ENV === 'production') {
    const chromium = (await import('@sparticuz/chromium-min')).default
    const puppeteer = (await import('puppeteer-core')).default
    browserInstance = await puppeteer.launch({
      args: chromium.args,
      // defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(
        process.env.CHROMIUM_PATH ?? ''
      ),
      headless: true,
    })
  } else {
    // In local development, use standard puppeteer
    const puppeteer = (await import('puppeteer')).default
    browserInstance = await puppeteer.launch({ headless: true })
  }

  return browserInstance
}

export async function closeBrowser() {
  if (browserInstance) {
    await browserInstance.close()
    browserInstance = null
  }
}
