import { launch } from '@cloudflare/playwright';
import { createService } from './service.mjs';
import paperCss from '../../css/preview.css';

const service = createService({
  async renderPdf(paper, env) {
    const browser = await launch(env.BROWSER);
    try {
      const context = await browser.newContext({ javaScriptEnabled: false });
      const page = await context.newPage();
      // Uploaded raster images and the exact built-in crest are embedded. No user URL is fetched.
      await page.route('**/*', route => route.abort());
      const html = '<!doctype html><html lang="' + (paper.style.rtl ? 'ur' : 'en') + '"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; img-src data:; style-src \'unsafe-inline\'"><style>*{box-sizing:border-box}body{margin:0;color:#000}'+paperCss+' .pv{border-radius:0;box-shadow:none;margin:0;print-color-adjust:exact;-webkit-print-color-adjust:exact} @page{size:'+paper.style.page+' '+paper.style.orient+';margin:0}</style></head><body>'+globalThis.APGRender(paper)+'</body></html>';
      await page.setContent(html, { waitUntil: 'load', timeout: 45000 });
      return await page.pdf({ format: paper.style.page, landscape: paper.style.orient === 'landscape', printBackground: true, preferCSSPageSize: true });
    } finally { await browser.close(); }
  }
});
export default service;
