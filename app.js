#!/usr/bin/env node
const express = require('express')
const puppeteer = require("puppeteer");
const moment = require('moment')

app = express();

function print_log(message){ 
  console.log(`[${moment().format('YYYY-MM-DD:HH:mm:ss')}] Info: ${message}`);
}
function print_error(message){ 
  console.log(`[${moment().format('YYYY-MM-DD:HH:mm:ss')}] Error: ${message}`);
}

app.get("/", async (request, response) => {
  const {
    url,
    pageWidth = "800",
    pageHeight = "600",
    scale = "1",
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
    print_log(`Launching webbrowser (${url})`);
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--disable-setuid-sandbox"],
      ignoreHTTPSErrors: true,
    });
    const page = await browser.newPage();
    if (filetype == "png" || filetype == "jpeg" || filetype == "webp"){
      print_log(`Setting viewport ${pageWidth}x${pageHeight} resolution, ${scale} scale factor (${url})`);
      await page.setViewport({ width: parseInt(pageWidth), height: parseInt(pageHeight), deviceScaleFactor: parseFloat(scale) });
    } else if (filetype != "pdf" ){
      throw new Error("Only supported filetypes are png, jpeg, webp, and pdf.");
    }
    print_log(`Loading webpage (${url})`);
    await page.goto(url, { waitUntil: "networkidle2" });
    let imageBuffer;
    if (selector) {
      if (screenshotWidth || screenshotHeight){
        throw new Error("screenshotWidth and screenshotHeight have no effect when specifying a selector element.");
      }
      print_log(`Taking element screenshot (${url})`);
      await page.waitForSelector(selector);
      const element = await page.$(selector);
      if (filetype == "pdf"){
        throw new Error("pdf capture only works for fullpage rendering.");
      }
      imageBuffer = await element.screenshot({type: filetype});
    } else if (screenshotWidth || screenshotHeight) {
      if (!screenshotWidth || !screenshotHeight) {
        throw new Error("Both screenshotWidth and screenshotHeight must be specified.");
      }
      print_log(`Taking snippet screenshot (${url})`);

      if (filetype == "pdf"){
        throw new Error("pdf capture only works for fullpage rendering.");
      }
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
      print_log(`Taking full page screenshot (${url})`);
      if (filetype == "pdf"){
        if (request.query.pageWidth || request.query.pageHeight){
          imageBuffer = await page.pdf({
            width: parseInt(pageWidth),
            height: parseInt(pageHeight),
          });
        } else {
          imageBuffer = await page.pdf({
            format: 'A4',
          });
        }
      } else {
        imageBuffer = await page.screenshot({
          fullPage: pageHeight ? false : true,
          type: filetype
        });
      }
    }
    await browser.close();
    response.set('content-type', ("pdf" ? 'application/' : 'image/') + filetype);
    response.write(imageBuffer,'binary')
    response.end(null, 'binary')
  } catch (error) {
    print_error(error);
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
  print_log(
    `Your app is listening on port http://localhost:${listener.address().port}`
  );
});
