import type { VercelRequest, VercelResponse } from '@vercel/node';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

interface Slide {
  html: string;
  index: number;
}

interface RequestBody {
  slides: Slide[];
  deckTitle?: string;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Enable CORS for Lovable
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { slides, deckTitle = 'deck' } = req.body as RequestBody;

    if (!slides || !Array.isArray(slides) || slides.length === 0) {
      return res.status(400).json({ 
        error: 'Invalid request: slides array with at least one slide required' 
      });
    }

    console.log(`🎨 Generating PDF for ${slides.length} slides...`);

    // Configure chromium for Vercel environment
    const executablePath = await chromium.executablePath();
    
    console.log('Chromium path:', executablePath);

    // Launch Puppeteer with chromium
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: executablePath,
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    
    // Set exact viewport to 1920x1080 (no scaling!)
    await page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
    });

    const screenshots: Buffer[] = [];

    // Generate screenshot for each slide
    for (const slide of slides) {
      console.log(`📸 Processing slide ${slide.index + 1}/${slides.length}`);
      
      // Load the slide HTML
      await page.setContent(slide.html, {
        waitUntil: ['networkidle0', 'load'],
        timeout: 30000,
      });

      // Wait a bit for any final rendering (fonts, images)
      await page.waitForTimeout(500);

      // Capture at exact 1920x1080
      const screenshot = await page.screenshot({
        type: 'png',
        clip: { x: 0, y: 0, width: 1920, height: 1080 },
        omitBackground: false,
      });

      screenshots.push(screenshot as Buffer);
    }

    await browser.close();

    console.log('✅ Screenshots captured, generating PDF...');

    // Combine screenshots into PDF using jsPDF
    const { jsPDF } = await import('jspdf');
    
    // Create PDF with exact 1920x1080 dimensions
    // Convert pixels to inches at 96 DPI: 1920/96 = 20 inches, 1080/96 = 11.25 inches
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'in',
      format: [20, 11.25], // Exact pixel-to-inch conversion
    });

    for (let i = 0; i < screenshots.length; i++) {
      if (i > 0) {
        pdf.addPage();
      }
      
      // Add image to PDF page at full size
      const imageData = `data:image/png;base64,${screenshots[i].toString('base64')}`;
      pdf.addImage(imageData, 'PNG', 0, 0, 20, 11.25, undefined, 'FAST');
    }

    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));

    console.log(`✨ PDF generated: ${(pdfBuffer.length / 1024 / 1024).toFixed(2)}MB`);

    // Send PDF response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${deckTitle}.pdf"`);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('❌ PDF generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate PDF',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}

// Vercel function configuration
export const config = {
  maxDuration: 60,
  memory: 1024,
};
