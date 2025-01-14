const puppeteer = require("puppeteer");
const {
  FIRST_WINNER,
  MAIN_URL_FOTTBALL,
  SECOND_WINNER,
  SUMM_AMOUNT,
  SUMM_WIN_DEFAULT,
  COLORS_CELL,
  COORDS_CHECK_ROW,
  COORDS_RESULT_ROW,
} = require("../constants");
const { v4 } = require("uuid");
const uuidv4 = v4;
class ParserMatch {
  constructor() {
    this.browser = {};
    this.page = {};
  }

  formatDate = (date) => {
    let day = date.getDate().toString().padStart(2, "0");
    let month = (date.getMonth() + 1).toString().padStart(2, "0"); // Месяцы начинаются с 0
    return `${day}.${month}`;
  };

  // Функция для обработки входного слова "сегодня" или "завтра"
  convertWordToDate = (word) => {
    let result;

    switch (word.toLowerCase()) {
      case "сегодня": {
        result = new Date(); // Сегодняшняя дата

        break;
      }
      case "завтра": {
        result = new Date(new Date().getTime() + 24 * 60 * 60 * 1000); // Завтрашняя дата

        break;
      }
      default: {
        return word;
      }
    }

    return this.formatDate(result);
  };

  convertStrWordDate = (arr) => {
    return arr?.reduce((prevVal, curVal) => {
      const [time, date] = curVal;
      const convertDateStrInDate = this.convertWordToDate(date);

      prevVal.push([time, convertDateStrInDate]);

      return prevVal;
    }, []);

    // была в конце удобно было удалять из таблицы
  };

  setConfigBrowser = async (page) => {
    await this.page?.setViewport({ width: 1080, height: 1024 });
    await this.page?.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    );
  };

  makeChunks = (arr, chunkSize = 2) => {
    const copyArr = [...arr];
    const arrChunks = [];

    for (let i = 0; i < copyArr.length; i += chunkSize) {
      const chunk = copyArr.slice(i, i + chunkSize);
      arrChunks.push(chunk);
    }

    return arrChunks;
  };

  concatUrl = (rawUrls) => {
    return rawUrls?.reduce((prevVal, curVal) => {
      const clearUrl = curVal.slice(1); // удаляем первый символ / для склеивания с основным урлом
      prevVal.push(`${MAIN_URL_FOTTBALL}${clearUrl}`);

      return prevVal;
    }, []);
  };

  clearSomeSymbolRegex = (arr) => {
    const regex = /\d+\.\d+/g;
    const numbers = [];

    arr.forEach((str) => {
      const matches = str.match(/\d+\.\d+/g);
      if (matches) {
        numbers.push(...matches.map(Number));
      }
    });

    return this.makeChunks(numbers, 2);
  };

  createCovertMatchesForecast = (dataMatches) => {
    const {
      urls = [],
      dates = [],
      commands = [],
      coeff = [],
      winners = [],
    } = dataMatches;
    const arrMatches = [];

    for (let i = 0; i < urls.length; i++) {
      const [timeMatch, dateMatch] = dates[i];
      const [firstCommand, secondCommand] = commands[i];
      const [_, secondCoeff] = coeff[i];
      const convertCoeffInDot = String(secondCoeff);
      const win = winners[i];
      const url = urls[i];
      const match = {
        id: uuidv4(),
        time: timeMatch,
        date: dateMatch,
        owner: firstCommand,
        guest: secondCommand,
        forecast: win,
        coefficient: convertCoeffInDot,
        check: SUMM_AMOUNT,
        link: url,
        result: SUMM_WIN_DEFAULT,
      };

      arrMatches.push(match);
    }

    return arrMatches;
  };

  parseMatches = async () => {
    await this._initPuppeter();
    await this.page?.goto?.(MAIN_URL_FOTTBALL, {
      waitUntil: "domcontentloaded",
    });

    const rawUrlMatches = await this.page?.evaluate?.(() => {
      return Array.from(
        document.querySelectorAll("div.sc-c7273f60-6 > a[href]"),
        (a) => a.getAttribute("href")
      );
    });

    const rawDateMatches = await this.page?.evaluate?.(() => {
      return Array.from(
        document.querySelectorAll("div.sc-c7273f60-0 > div"),
        (a) => a.innerHTML
      );
    });

    const rawCommandMatches = await this.page?.evaluate?.(() => {
      return Array.from(
        document.querySelectorAll("div.sc-c7273f60-3 > div"),
        (a) => a.innerHTML
      );
    });

    const rawCoeffMatches = await this.page?.evaluate?.(() => {
      return Array.from(
        document.querySelectorAll("div.sc-d83ff2c2-0 > span:nth-child(1)"),
        (a) => a.innerHTML
      );
    });

    const rawWinnerMatches = await this.page?.evaluate?.(() => {
      return Array.from(
        document.querySelectorAll("div.sc-d83ff2c2-1 > div:nth-child(1)"),
        (a) => a.innerHTML
      );
    });
    const urlMatches = this.concatUrl(rawUrlMatches);
    const dateMatchesChunk = this.convertStrWordDate(
      this.makeChunks(rawDateMatches)
    ); // разделяем на чанки по [[1,2]]
    const dateMatches = this.convertStrWordDate(dateMatchesChunk); // преобразовываем строки слов в даты
    const commandMatches = this.makeChunks(rawCommandMatches);
    const coeffMatches = this.clearSomeSymbolRegex(rawCoeffMatches);

    const dataMatches = {
      urls: urlMatches,
      dates: dateMatches,
      commands: commandMatches,
      coeff: coeffMatches,
      winners: rawWinnerMatches,
    };

    await this.browser?.close();
    return this.createCovertMatchesForecast(dataMatches); // [{ time: '', date: '', }, ...]
  };

  get matches() {
    return this.parseMatches();
  }

  async _initPuppeter() {
    this.browser = await puppeteer?.launch({
      headless: true,
      args: [
        "--disable-setuid-sandbox",
        "--no-sandbox",
        "--single-process",
        "--no-zygote",
      ],
      executablePath:
        process.env.NODE_ENV === "production"
          ? process.env.PUPPETEER_EXECUTABLE_PATH
          : puppeteer.executablePath(),
    });

    this.page = await this.browser.newPage();

    await this.setConfigBrowser();
  }

  convertGoogleRows(items = []) {
    return items.reduce((prevVal, curVal, index) => {
      const copyIndex = ++index; // Ячейки с данными в гугле начинаются с 1, поэтому прибавляем на +1 сразу;
      const convertGoogleMatch = {
        id: curVal?.get("id"),
        time: curVal?.get("time"),
        date: curVal?.get("date"),
        owner: curVal?.get("owner"),
        guest: curVal?.get("guest"),
        forecast: curVal?.get("forecast"),
        coefficient: curVal?.get("coefficient"),
        check: curVal?.get("check"),
        link: curVal?.get("link"),
        result: curVal?.get("result"),
        idGoogleTable: copyIndex,
      };

      prevVal.push(convertGoogleMatch);

      return prevVal;
    }, []);
  }

  // получить результат матчей
  parseResMatchesCompleted = async (completedMatches = [], sheet) => {
    const arr = [];
    const browser = await puppeteer?.launch({
      headless: true,
      args: [
        "--disable-setuid-sandbox",
        "--no-sandbox",
        "--single-process",
        "--no-zygote",
      ],
      executablePath:
        process.env.NODE_ENV === "production"
          ? process.env.PUPPETEER_EXECUTABLE_PATH
          : puppeteer.executablePath(),
    });

    try {
      for (let i = 0; i < completedMatches.length; i++) {
        const page = await browser.newPage();
        await page?.setViewport({ width: 1080, height: 1024 });
        await page?.setUserAgent(
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        );
        await page?.goto?.(completedMatches[i]?.link, {
          waitUntil: "domcontentloaded",
        });

        const rawCheck = await page?.evaluate?.(() => {
          return Array.from(
            document.querySelectorAll("div.sc-1bcc6d0c-11 > div"),
            (div) => div.innerHTML
          );
        });

        const [firstCommand, secondCommand] = rawCheck;
        const winCommand =
          firstCommand > secondCommand ? FIRST_WINNER : SECOND_WINNER;
        // получаем id элемента из таблицы и меняем цвет ячейки в зависимости от прогноза
        const idGoogleTable = completedMatches[i]?.idGoogleTable ?? 0;
        // добавляем в ячейку результата кэфф * ставку, если победа, иначе -ставка
        const colorCellMatchCheck = sheet.getCell(
          idGoogleTable,
          COORDS_CHECK_ROW
        );
        const resCellMatch = sheet.getCell(idGoogleTable, COORDS_RESULT_ROW);
        // проверяем результат матча с тем, который прогнозировали
        // иначе преобразовываем сумму ставки в отрицательное и кладем в массив
        if (winCommand === completedMatches[i]?.forecast) {
          const money =
            Number(completedMatches[i]?.coefficient) *
            Number(completedMatches[i]?.check);
          arr.push(money);
          await page.close();
          resCellMatch.value = String(money);
          colorCellMatchCheck.backgroundColor = COLORS_CELL.GREEN;

          continue;
        }

        colorCellMatchCheck.backgroundColor = COLORS_CELL.RED;
        const summBet = -Number(completedMatches[i]?.check);
        resCellMatch.value = String(summBet);
        arr.push(summBet);
        await page.close();
      }
      // обновляем цвета ячеек
      await sheet.saveUpdatedCells();
      await browser.close();
    } catch (error) {
      console.log("Error", error);

      await browser.close();
    }

    return arr;
  };
}

const parserMatch = new ParserMatch();

module.exports = { parserMatch };
