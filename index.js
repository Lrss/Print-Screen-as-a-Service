const puppeteer = require("puppeteer");

async function takeScreenshot(
  url,
  selector = null,
  pageWidth = null,
  pageHeight = null,
  screenshotWidth = null,
  screenshotHeight = null,
  screenshotPositionX = 0,
  screenshotPositionY = 0,
) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--disable-setuid-sandbox"],
    ignoreHTTPSErrors: true,
  });
  const page = await browser.newPage();

  if (pageWidth !== null || pageHeight !== null) {
    if (pageWidth === null || pageHeight === null) {
      throw new Error("Both pageWidth and pageHeight must be specified");
    }
    await page.setViewport({ width: pageWidth, height: pageHeight });
  }
  await page.goto(url, { waitUntil: "networkidle2" });
  if (selector !== null) {
    if (screenshotWidth !== null || screenshotHeight !== null){
      throw new Error("screenshotWidth and screenshotHeight have no effect when specifying a selector element");
    }
    await page.waitForSelector(selector);
    const element = await page.$(selector);
    await element.screenshot({
      type: "png",
      path: "screenshot2.png",
    });
  } else if (screenshotWidth !== null || screenshotHeight !== null) {
    if (screenshotWidth === null || screenshotHeight === null) {
      throw new Error("Both screenshotWidth and screenshotHeight must be specified");
    }
    await page.screenshot({
      clip: {
        x: screenshotPositionX,
        y: screenshotPositionY,
        width: screenshotWidth,
        height: screenshotHeight,
      },
      type: "png",
      path: "screenshot.png",
    });
  } else {
    await page.screenshot({
      fullPage: true,
      type: "png",
      path: "screenshot.png",
    });
  }

  await browser.close();
}

takeScreenshot(
  url = "https://plotly.com/javascript/responsive-fluid-layout/",
  selector = ".main-svg",
  pageWidth = 1920,
  pageHeigth = 1080,
);
