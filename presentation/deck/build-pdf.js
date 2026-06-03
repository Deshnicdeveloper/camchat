/* Build a pixel-perfect PDF of the deck (one slide == one page).
 *
 * Why screenshots instead of reveal's ?print-pdf: this deck is a full-bleed
 * dark design, and reveal's print stylesheet re-paginates / re-flows it. Rendering
 * each slide and placing it as a full-page image reproduces the deck exactly.
 *
 * Usage:
 *   1) serve the deck:   python3 -m http.server 8088 --directory .
 *   2) npm i puppeteer   (one-off)
 *   3) node build-pdf.js  ->  ../CamChat_System_Presentation.pdf
 */
const puppeteer = require('puppeteer');
const fs = require('fs');
const os = require('os');
const path = require('path');

const BASE = process.env.DECK_URL || 'http://localhost:8088';
const SLIDES = Number(process.env.SLIDES || 19);
const OUT = path.resolve(__dirname, '..', 'CamChat_System_Presentation.pdf');

(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'camchat-pdf-'));
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 2 });

  for (let i = 0; i < SLIDES; i++) {
    await page.goto(`${BASE}/#/${i}`, { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 1600)); // let entrance + counters settle
    const n = String(i + 1).padStart(2, '0');
    await page.screenshot({
      path: path.join(tmp, `s-${n}.jpg`), type: 'jpeg', quality: 88,
      clip: { x: 0, y: 0, width: 1280, height: 720 },
    });
  }

  const imgs = fs.readdirSync(tmp).filter((f) => f.endsWith('.jpg')).sort();
  const html = `<!doctype html><meta charset=utf-8>
    <style>@page{size:1280px 720px;margin:0}html,body{margin:0;background:#081627}
    img{display:block;width:1280px;height:720px;page-break-after:always}
    img:last-child{page-break-after:avoid}</style>
    ${imgs.map((f) => `<img src="file://${path.join(tmp, f)}">`).join('')}`;
  fs.writeFileSync(path.join(tmp, 'assemble.html'), html);

  await page.goto(`file://${path.join(tmp, 'assemble.html')}`, { waitUntil: 'networkidle0' });
  await page.pdf({ path: OUT, printBackground: true, preferCSSPageSize: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 } });

  await browser.close();
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log('Wrote', OUT);
})();
