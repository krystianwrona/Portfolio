import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(__dirname, '..', 'public');

function imgBase64(filename) {
  const filepath = path.join(PUBLIC, filename);
  if (!fs.existsSync(filepath)) {
    console.warn(`⚠️  Brak pliku: ${filename}`);
    return '';
  }
  const data = fs.readFileSync(filepath);
  return `data:image/png;base64,${data.toString('base64')}`;
}

async function renderHTML(browser, html, outputName, width, height) {
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 2 });
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({
    path: path.join(PUBLIC, outputName),
    type: 'png',
    omitBackground: true,
  });
  await page.close();
  console.log(`✅ ${outputName}`);
}

// ─────────────────────────────────────────────
// Helper: macOS window chrome bar
// ─────────────────────────────────────────────
const windowBar = (url = '') => `
  <div style="background:#2a2a2a;padding:12px 16px;display:flex;align-items:center;gap:12px;flex-shrink:0">
    <div style="display:flex;gap:6px">
      <div style="width:10px;height:10px;border-radius:50%;background:#ff5f57"></div>
      <div style="width:10px;height:10px;border-radius:50%;background:#febc2e"></div>
      <div style="width:10px;height:10px;border-radius:50%;background:#28c840"></div>
    </div>
    ${url ? `<div style="flex:1;background:#1a1a1a;border-radius:6px;padding:5px 12px;color:#888;font-size:12px;font-family:system-ui">${url}</div>` : ''}
  </div>
`;

// MacBook stand footer
const macbookFoot = () => `
  <div style="background:#2a2a2a;height:18px;border-radius:0 0 2px 2px;flex-shrink:0"></div>
  <div style="background:#3a3a3a;height:8px;width:110%;margin-left:-5%;border-radius:0 0 12px 12px;flex-shrink:0"></div>
`;

// iPhone frame wrapper
const iphone = (imgFile, rotate = '0deg', translateY = '0px') => `
  <div style="transform:rotate(${rotate}) translateY(${translateY});display:inline-block">
    <div style="width:230px;background:#1a1a1a;border-radius:40px;padding:10px;box-shadow:0 20px 60px rgba(0,0,0,0.35)">
      <div style="background:#000;border-radius:32px;overflow:hidden;position:relative">
        <div style="position:absolute;top:0;left:50%;transform:translateX(-50%);width:100px;height:26px;background:#1a1a1a;border-radius:0 0 16px 16px;z-index:10"></div>
        <img src="${imgBase64(imgFile)}" style="width:100%;display:block"/>
      </div>
    </div>
  </div>
`;

// ─────────────────────────────────────────────

async function run() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });

  // 1. HERO — MacBook + iPhone overlay
  await renderHTML(browser, `
    <html><body style="margin:0;background:transparent;width:1200px;height:760px;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden">
      <div style="width:880px;display:flex;flex-direction:column;box-shadow:0 24px 64px rgba(0,0,0,0.4);border-radius:12px 12px 0 0;overflow:visible">
        <div style="background:#1a1a1a;border-radius:12px 12px 0 0;overflow:hidden">
          ${windowBar()}
          <img src="${imgBase64('adoptme-hero-raw.png')}" style="width:100%;display:block"/>
        </div>
        ${macbookFoot()}
      </div>
      <div style="position:absolute;right:48px;bottom:24px">
        ${iphone('adoptme-mobile-home-raw.png', '-4deg', '0px')}
      </div>
    </body></html>
  `, 'adoptme-hero.png', 1200, 760);

  // 2. SEARCH — Browser frame
  await renderHTML(browser, `
    <html><body style="margin:0;background:transparent;width:1100px;height:720px;display:flex;align-items:center;justify-content:center">
      <div style="width:1000px;border-radius:12px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.28)">
        ${windowBar('adoptme-red.vercel.app/search')}
        <img src="${imgBase64('adoptme-search-raw.png')}" style="width:100%;display:block"/>
      </div>
    </body></html>
  `, 'adoptme-search.png', 1100, 720);

  // 3. PET PROFILE — Clean float
  await renderHTML(browser, `
    <html><body style="margin:0;background:transparent;width:1100px;height:720px;display:flex;align-items:center;justify-content:center">
      <div style="border-radius:16px;overflow:hidden;box-shadow:0 28px 80px rgba(0,0,0,0.22);width:1000px">
        <img src="${imgBase64('adoptme-pet-raw.png')}" style="width:100%;display:block"/>
      </div>
    </body></html>
  `, 'adoptme-pet.png', 1100, 720);

  // 4. QUIZ — iPhone realistic frame (single, centered)
  await renderHTML(browser, `
    <html><body style="margin:0;background:transparent;width:480px;height:880px;display:flex;align-items:center;justify-content:center">
      ${iphone('adoptme-quiz-raw.png')}
    </body></html>
  `, 'adoptme-quiz.png', 480, 880);

  // 5. MAP — Browser frame
  await renderHTML(browser, `
    <html><body style="margin:0;background:transparent;width:1100px;height:720px;display:flex;align-items:center;justify-content:center">
      <div style="width:1000px;border-radius:12px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.28)">
        ${windowBar('adoptme-red.vercel.app/shelters')}
        <img src="${imgBase64('adoptme-map-raw.png')}" style="width:100%;display:block"/>
      </div>
    </body></html>
  `, 'adoptme-map.png', 1100, 720);

  // 6. DASHBOARD — MacBook frame
  await renderHTML(browser, `
    <html><body style="margin:0;background:transparent;width:1180px;height:780px;display:flex;align-items:center;justify-content:center;overflow:hidden">
      <div style="width:1000px;display:flex;flex-direction:column">
        <div style="background:#1a1a1a;border-radius:12px 12px 0 0;overflow:hidden">
          ${windowBar()}
          <img src="${imgBase64('adoptme-dashboard-raw.png')}" style="width:100%;display:block"/>
        </div>
        ${macbookFoot()}
      </div>
    </body></html>
  `, 'adoptme-dashboard.png', 1180, 780);

  // 7. KANBAN — Clean float
  await renderHTML(browser, `
    <html><body style="margin:0;background:transparent;width:1100px;height:720px;display:flex;align-items:center;justify-content:center">
      <div style="border-radius:16px;overflow:hidden;box-shadow:0 28px 80px rgba(0,0,0,0.22);width:1000px">
        <img src="${imgBase64('adoptme-kanban-raw.png')}" style="width:100%;display:block"/>
      </div>
    </body></html>
  `, 'adoptme-kanban.png', 1100, 720);

  // 8. MOBILE — 3 iPhones side by side
  await renderHTML(browser, `
    <html><body style="margin:0;background:transparent;width:880px;height:760px;display:flex;align-items:flex-end;justify-content:center;gap:20px;padding-bottom:32px">
      ${iphone('adoptme-mobile-home-raw.png',   '-5deg', '-16px')}
      ${iphone('adoptme-mobile-search-raw.png',  '0deg',  '-32px')}
      ${iphone('adoptme-mobile-pet-raw.png',      '5deg', '-16px')}
    </body></html>
  `, 'adoptme-mobile.png', 880, 760);

  await browser.close();

  // Cleanup raw files
  const rawFiles = fs.readdirSync(PUBLIC).filter(f => f.includes('-raw.'));
  rawFiles.forEach(f => fs.unlinkSync(path.join(PUBLIC, f)));
  console.log(`\n🧹 Usunięto ${rawFiles.length} raw plików`);
  console.log('🎉 8 mockupów gotowych w public/');
}

run().catch(console.error);
