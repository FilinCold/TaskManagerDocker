const puppeteer = require("puppeteer");
const { MAIN_URL_FOTTBALL } = require("../constants");

class Puppeter {
  constructor(url = MAIN_URL_FOTTBALL) {
    this.url = url;
    this._browser = {};
    this._page = {};
  }

  static async init() {
    const puppeteer = new Puppeter();
    // Do async stuff
    await puppeteer.setConfig();
    // Return instance
    return puppeteer;
  }

  async setConfig() {
    this._browser = await puppeteer?.launch({
      headless: true,
      args: ["--single-process"],
      executablePath:
        process.env.NODE_ENV === "production"
          ? process.env.PUPPETEER_EXECUTABLE_PATH
          : puppeteer.executablePath(),
    });
  }

  async createPage() {
    this._page = await this._browser.newPage();
    await this._page?.setViewport({ width: 1080, height: 1024 });
    await this._page?.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    );

    return this.page;
  }

  get page() {
    return this._page;
  }

  get browser() {
    return this._browser;
  }

  async pageClose() {
    try {
      console.log("try page disconnect #1", 67676767);
      await this._page?.close();
      this._page = {};
      console.log("try page disconnect #2", 76767676);
    } catch (error) {
      console.log("Error browser close", error);
    }
  }
}

module.exports = { Puppeter };
