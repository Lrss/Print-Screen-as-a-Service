#!/usr/bin/env node
const express = require('express')
const puppeteer = require("puppeteer");
const moment = require('moment')

app = express();

function print_log(message, log_type = "Info") {
  console.log(`[${moment().format('YYYY-MM-DD:HH:mm:ss')}] ${log_type}: ${message}`);
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
    if (Object.keys(request.query).length === 0) {
      print_log("No queries defined", "Error");
      response.status(406);
      response.send({
        status: 406,
        message: "No queries provided. You need to atleast specify an url to capture.",
        mandatoryQueries: {
          url: "https://example.com"
        },
        queriesWithDefaultValues: {
          scale: 1,
          pageWidth: 800,
          pageHeight: 600,
          filetype: "png,jpg,webp,pdf",
          screenshotPositionX: 0,
          screenshotPositionY: 0
        },
        optionalQueries: {
          selector: "limit screenshot to a single class, id, or element",
          screenshotWidth: "limit screenshot to a snippet",
          screenshotHeight: "limit screenshot to a snippet",
        }
      })
      return;
    }
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
    if (filetype == "png" || filetype == "jpeg" || filetype == "webp") {
      print_log(`Setting viewport ${pageWidth}x${pageHeight} resolution, ${scale} scale factor`);
      await page.setViewport({
        width: parseInt(pageWidth),
        height: parseInt(pageHeight),
        deviceScaleFactor: parseFloat(scale)
      });
    } else if (filetype != "pdf") {
      throw new Error("Only supported filetypes are png, jpeg, webp, and pdf.");
    }
    print_log(`Loading webpage ${url}`);
    await page.goto(url, { waitUntil: "networkidle2" });
    const config = {};
    if (filetype !== "pdf") {
      config.type = filetype;
    }
    if (selector) {
      if (screenshotWidth || screenshotHeight) {
        throw new Error("screenshotWidth and screenshotHeight have no effect when specifying a selector element.");
      }
      if (filetype == "pdf") {
        throw new Error("pdf capture only works for fullpage rendering.");
      }
    } else if (screenshotWidth || screenshotHeight) {
      if (!screenshotWidth || !screenshotHeight) {
        throw new Error("Both screenshotWidth and screenshotHeight must be specified.");
      }
      if (filetype == "pdf") {
        throw new Error("pdf capture only works for fullpage rendering.");
      }
      config.clip = {
        x: parseInt(screenshotPositionX),
        y: parseInt(screenshotPositionY),
        width: parseInt(screenshotWidth),
        height: parseInt(screenshotHeight)
      };
    } else {
      if (filetype == "pdf") {
        if (request.query.pageWidth || request.query.pageHeight) {
          config.width = parseInt(pageWidth);
          config.height = parseInt(pageHeight);
        } else {
          config.format = 'A4';
        }
      } else if (!request.query.pageHeight) {
        config.fullPage = true;
      }
    }
    let imageBuffer;
    if (filetype == "pdf") {
      imageBuffer = await page.pdf(config);
    } else if (selector) {
      await page.waitForSelector(selector);
      const element = await page.$(selector);
      imageBuffer = await element.screenshot(config);
    } else {
      imageBuffer = await page.screenshot(config);
    }
    print_log(`Delivering ${filetype} from ${url} with config:${JSON.stringify(config)}`);
    await browser.close();
    response.set(
      'content-type',
      (filetype == "pdf" ? 'application/' : 'image/') + filetype
    );
    response.write(imageBuffer, 'binary')
    response.end(null, 'binary')
  } catch (error) {
    print_log(error.message, error.constructor.name);
    response.status(400);
    response.send({ "status": 400, "message": error.message })
  }
});

let port = process.env.PORT || 3000;
for (i = 2; i < process.argv.length; i++) {
  if (process.argv[i] === "-h" || process.argv[i] === "--help") {
    console.log("You can specify a custom port to listen on, using the -p --port flag");
    process.exit(0);
  }
  else if (process.argv[i] === "-p" || process.argv[i] === "--port") {
    i++;
    if (i >= process.argv.length) {
      console.log("You need to specify a port number after the --port argument.");
      process.exit(1);
    }
    let numberArg = parseInt(process.argv[i]);
    if (isNaN(numberArg) || numberArg > 65535 || numberArg < 1) {
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
