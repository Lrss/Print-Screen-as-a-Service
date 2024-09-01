#!/usr/bin/env node
const express = require('express')
const puppeteer = require("puppeteer");
const moment = require('moment')

app = express();

app.get("/", async (request, response) => {
  const {
    url,
    pageWidth = "800",
    pageHeight,
    selector,
    filetype = "png",
    screenshotWidth,
    screenshotHeight,
    screenshotPositionX = 0,
    screenshotPositionY = 0
  } = request.query;
  try {
    if (!url) {
      throw new Error("You need to specify a 'url' to capture.");
    }
    console.log(`[${moment().format('YYYY-MM-DD:HH:mm:ss')}] Info: Launching webbrowser (${url})`);
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--disable-setuid-sandbox"],
      ignoreHTTPSErrors: true,
    });
    const page = await browser.newPage();
    if (pageHeight || pageWidth !== "800") {
      console.log(`[${moment().format('YYYY-MM-DD:HH:mm:ss')}] Info: Setting viewport ${pageWidth}x${pageHeight} (${url})`);
      await page.setViewport({ width: parseInt(pageWidth), height: pageHeight ? parseInt(pageHeight) : 600 });
    }
    console.log(`[${moment().format('YYYY-MM-DD:HH:mm:ss')}] Info: Loading webpage (${url})`);
    await page.goto(url, { waitUntil: "networkidle2" });
    let imageBuffer;
    if (selector) {
      if (screenshotWidth || screenshotHeight){
        throw new Error("screenshotWidth and screenshotHeight have no effect when specifying a selector element");
      }
      console.log(`[${moment().format('YYYY-MM-DD:HH:mm:ss')}] Info: Taking element screenshot (${url})`);
      await page.waitForSelector(selector);
      const element = await page.$(selector);
      imageBuffer = await element.screenshot({type: filetype});
    } else if (screenshotWidth || screenshotHeight) {
      if (!screenshotWidth || !screenshotHeight) {
        throw new Error("Both screenshotWidth and screenshotHeight must be specified");
      }
      console.log(`[${moment().format('YYYY-MM-DD:HH:mm:ss')}] Info: Taking snippet screenshot (${url})`);
      imageBuffer = await page.screenshot({
        clip: {
          x: parseInt(screenshotPositionX),
          y: parseInt(screenshotPositionY),
          width: parseInt(screenshotWidth),
          height: parseInt(screenshotHeight),
        },
        type: filetype
      });
    } else {
      console.log(`[${moment().format('YYYY-MM-DD:HH:mm:ss')}] Info: Taking full page screenshot (${url})`);
      imageBuffer = await page.screenshot({
        fullPage: pageHeight ? false : true,
        type: filetype
      });
    }
    await browser.close();
    response.set('content-type', 'image/' + filetype);
    response.write(imageBuffer,'binary')
    response.end(null, 'binary')
  } catch (error) {
    console.log(`[${moment().format('YYYY-MM-DD:HH:mm:ss')}] ${error}`);
    response.status(400);
    response.send({ "status": 400,"message": error.message })
  }
});

let port = process.env.PORT || 3000;
for (i = 2; i < process.argv.length; i++){
  if (process.argv[i] === "-h" || process.argv[i] === "--help"){
    console.log("You can specify a custom port to listen on, using the -p --port flag");
    process.exit(0);
  }
  else if (process.argv[i] === "-p" || process.argv[i] === "--port"){
    i++;
    if (i >= process.argv.length){
      console.log("You need to specify a port number after the --port argument.");
      process.exit(1);
    }
    let numberArg = parseInt(process.argv[i]);
    if (isNaN(numberArg) || numberArg > 65535 || numberArg < 1)
    {
      console.log(`The argument ${process.argv[i]} could not be interpreted as a valid port number.`);
      process.exit(1);
    }
    port = numberArg;
  } 
}

let listener = app.listen(port, function () {
  console.log(`[${moment().format('YYYY-MM-DD:HH:mm:ss')}] Info: Your app is listening on port http://localhost:${listener.address().port}`);
});
