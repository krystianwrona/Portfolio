import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT = path.join(__dirname, '..', 'public');
const BASE = 'https://adoptme-red.vercel.app';

async function shot(browser, url, filename, viewport, waitMs = 2000) {
  console.log(`📸 ${filename}...`);
  const page = await browser.newPage();
  await page.setViewport({ ...viewport, deviceScaleFactor: 2 });
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
  await new Promise(r => setTimeout(r, waitMs));
  await page.screenshot({ path: path.join(OUTPUT, filename), type: 'png' });
  await page.close();
}

async function run() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: null,
  });

  const desktop = { width: 1440, height: 900 };
  const mobile  = { width: 390,  height: 844 };

  await shot(browser, `${BASE}/`,                    'adoptme-hero-raw.png',            desktop, 2000);
  await shot(browser, `${BASE}/search?species=dog`,  'adoptme-search-raw.png',          desktop, 1500);
  await shot(browser, `${BASE}/pet/168`,             'adoptme-pet-raw.png',             desktop, 1500);
  await shot(browser, `${BASE}/quiz`,                'adoptme-quiz-raw.png',            mobile,  1500);
  await shot(browser, `${BASE}/shelters`,            'adoptme-map-raw.png',             desktop, 3500);
  await shot(browser, `${BASE}/admin/dashboard`,     'adoptme-dashboard-raw.png',       desktop, 2000);
  await shot(browser, `${BASE}/admin/applications`,  'adoptme-kanban-raw.png',          desktop, 2000);
  await shot(browser, `${BASE}/`,                    'adoptme-mobile-home-raw.png',     mobile,  2000);
  await shot(browser, `${BASE}/search`,              'adoptme-mobile-search-raw.png',   mobile,  1500);
  await shot(browser, `${BASE}/pet/168`,             'adoptme-mobile-pet-raw.png',      mobile,  1500);

  await browser.close();
  console.log('\n✅ Wszystkie raw screenshoty gotowe w public/');
}

run().catch(console.error);
