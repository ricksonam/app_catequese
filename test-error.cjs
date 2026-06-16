const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:8080/auth?view=signup');
  
  // Wait a bit to let the app load
  await page.waitForTimeout(3000);
  
  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log("PAGE TEXT:", bodyText);
  
  await browser.close();
})();
