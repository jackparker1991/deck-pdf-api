# Deck.events PDF Generation API

Server-side PDF generation for deck.events using Puppeteer and Vercel.

## 🚀 Quick Deploy to Vercel

This repository is ready to deploy! Just click the button below:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR-USERNAME/deck-pdf-api)

## What This Does

- Takes slide HTML from your Lovable app
- Renders each slide at **exactly 1920x1080** using headless Chrome
- Combines screenshots into a pixel-perfect PDF
- Returns the PDF for download

## API Endpoint

**POST** `/api/generate-pdf`

### Request Body

```json
{
  "slides": [
    {
      "html": "<html>...</html>",
      "index": 0
    }
  ],
  "deckTitle": "my-presentation"
}
```

### Response

PDF file download

## Local Testing

```bash
npm install
vercel dev
```

Then test:
```bash
curl -X POST http://localhost:3000/api/generate-pdf \
  -H "Content-Type: application/json" \
  -d '{"slides":[{"html":"<html><body style=\"margin:0;width:1920px;height:1080px;background:#fff;\"><h1>Test</h1></body></html>","index":0}]}' \
  --output test.pdf
```

## Environment Variables

None required! Everything works out of the box.

## Vercel Configuration

- **Memory**: 1GB
- **Timeout**: 60 seconds (requires Hobby plan, free tier is 10s)

## Cost

- **Free tier**: 100GB-hours/month (covers ~5,000 PDFs)
- **Hobby tier**: $20/month for 60s timeout + 100GB-hours

## Integration with Lovable

Add this to your Lovable environment variables:

```
VERCEL_PDF_URL = https://your-project.vercel.app/api/generate-pdf
```

Then call it:

```typescript
const response = await fetch(import.meta.env.VITE_VERCEL_PDF_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    slides: slideData,
    deckTitle: 'my-deck'
  })
});

const blob = await response.blob();
// Download the blob...
```

## Troubleshooting

### Fonts not loading
Embed Google Fonts in your slide HTML:
```html
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap" rel="stylesheet">
```

### Images not showing
Use absolute URLs or convert to base64 before sending.

### Timeout errors
- Free tier: 10s limit (try fewer slides or upgrade to Hobby)
- Hobby tier: 60s limit (should handle 30+ slides)

## Architecture

```
Lovable App → Vercel API → Puppeteer → Screenshots → jsPDF → Download
```

No scaling issues because Puppeteer renders at native 1920x1080 (no CSS transforms).

## License

MIT
