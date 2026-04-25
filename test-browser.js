import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure()?.errorText));

  try {
    await page.goto('http://localhost:5174', { waitUntil: 'networkidle2', timeout: 10000 });
  } catch(e) {
    console.log('Goto failed:', e);
  }
  // wait 2 seconds
  await new Promise(resolve => setTimeout(resolve, 2000));
  await browser.close();
})();
