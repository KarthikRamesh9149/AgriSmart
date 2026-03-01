const { chromium } = require('playwright-core');

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });

  const districtsSectionVisible = await page.getByText(/districts/i).first().isVisible().catch(() => false);

  const canvas = page.locator('canvas').first();
  const box = await canvas.boundingBox();
  let opened = false;
  if (box) {
    const points = [
      [0.58, 0.56],
      [0.63, 0.50],
      [0.52, 0.48],
      [0.68, 0.60],
      [0.46, 0.58],
      [0.60, 0.42],
    ];
    for (const [rx, ry] of points) {
      await page.mouse.click(box.x + box.width * rx, box.y + box.height * ry);
      await page.waitForTimeout(700);
      if (await page.locator('.right-panel').isVisible().catch(() => false)) {
        opened = true;
        break;
      }
    }
  }

  console.log(JSON.stringify({ districtsSectionVisible, panelOpenedFromMap: opened }));
  await browser.close();
})();
