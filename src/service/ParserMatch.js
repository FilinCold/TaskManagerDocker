const {
  FIRST_WINNER,
  MAIN_URL_FOTTBALL,
  SECOND_WINNER,
  SUMM_AMOUNT,
  SUMM_WIN_DEFAULT,
  COLORS_CELL,
  COORDS_CHECK_ROW,
  COORDS_RESULT_ROW,
  LOWER_COEFF_THRESHOLD,
  BOTH_WINNER,
  NUMBER_SHEETS,
  BOTH_WINNER_TABLE_3,
  FIRST_WINNER_TABLE_3,
  SECOND_WINNER_TABLE_3,
  DEFAULT_COEFF,
  LENGTH_ARR_COEFF,
  MAIN_URL_TENNIS,
} = require("../constants");
const { v4 } = require("uuid");
const uuidv4 = v4;
class ParserMatch {
  constructor() {}

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
    // находит дробные числа из строки вида 12.34
    const regex = /\d+\.\d+/g;
    const numbers = [];

    arr.forEach((str) => {
      const matches = str.match(regex);

      if (matches) {
        numbers.push(...matches.map(Number));
      }
    });

    return this.makeChunks(numbers, 2);
  };

  getCoeffForDetailInfo = (arr) => {
    const regex = /<(span|div)[^>]*>([^<]+)<\/\1>([\d.,]+)/i;
    const numbers = [];

    arr.forEach((str) => {
      const matches = str.match(regex);

      if (matches) {
        numbers.push([matches[2], matches[3]]);
      }
    });

    return numbers.filter((elem, index) => (index !== 1 ? elem : false));
  };

  createCovertMatchesForecast = (dataMatches, isThirdGoogleTable = false) => {
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
      const secondCoeff =
        coeff[i].length === LENGTH_ARR_COEFF ? coeff[i][1] : coeff[i][0];
      // проверяет, если не смогли спарсить матч по названиям команд
      // и коэффициентам
      const isNoParseMatch =
        this.isCheckString(firstCommand) ||
        this.isCheckString(secondCommand) ||
        this.isCheckString(secondCoeff);

      if (isNoParseMatch) {
        continue;
      }

      // не добавляем элемент с кэфф меньше 1.3
      if (secondCoeff < LOWER_COEFF_THRESHOLD && !isThirdGoogleTable) {
        continue;
      }

      const convertCoeffInDot = secondCoeff
        ? String(secondCoeff)
        : String(DEFAULT_COEFF);
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

  parseMatches = async (puppeter, numberSheet) => {
    const isFourthSheet = numberSheet === NUMBER_SHEETS.FOURTH_SHEET;

    try {
      const page = await puppeter?.createPage();

      const urlMain = isFourthSheet ? MAIN_URL_TENNIS : MAIN_URL_FOTTBALL;
      await page?.goto?.(urlMain, {
        waitUntil: "domcontentloaded",
      });

      // убираем появляющиеся баннеры добавляя в localStorage ключи
      await this.setLocalStorageForHideBanners(page);

      if (isFourthSheet) {
        await page.waitForSelector(
          "#__next > div.ui.container.main-container > div > div.eleven.wide.column > div > div.sc-23d37354-0.bRtjmr > div.sc-d7c2ec8-2.dHJrlm > div.sc-d7c2ec8-0.beuQtE.latest-matches > div:nth-child(2) > select"
        );
        const buttonClickSelect = await page.$(
          "#__next > div.ui.container.main-container > div > div.eleven.wide.column > div > div.sc-23d37354-0.bRtjmr > div.sc-d7c2ec8-2.dHJrlm > div.sc-d7c2ec8-0.beuQtE.latest-matches > div:nth-child(2) > select"
        );

        await buttonClickSelect.click();

        await page.select(
          "#__next > div.ui.container.main-container > div > div.eleven.wide.column > div > div.sc-23d37354-0.bRtjmr > div.sc-d7c2ec8-2.dHJrlm > div.sc-d7c2ec8-0.beuQtE.latest-matches > div:nth-child(2) > select",
          "12" // interval 12 hours get matches
        );
      }

      await this.sleep(3000);

      const rawUrlMatches = await page?.evaluate?.(() => {
        return Array.from(
          document.querySelectorAll("div.sc-da821db2-6 > a[href]"),
          (a) => a.getAttribute("href")
        );
      });

      const rawDateMatches = await page?.evaluate?.(() => {
        return Array.from(
          document.querySelectorAll("div.sc-da821db2-0 > div"),
          (a) => a.innerHTML
        );
      });

      const rawCommandMatches = await page?.evaluate?.(() => {
        return Array.from(
          document.querySelectorAll("div.sc-da821db2-3 > div"),
          (a) => a.innerHTML
        );
      });

      const rawCoeffMatches = await page?.evaluate?.(() => {
        return Array.from(
          document.querySelectorAll("div.sc-479cd3f2-0 > span:nth-child(1)"),
          (a) => a.innerHTML
        );
      });

      const rawWinnerMatches = await page?.evaluate?.(() => {
        return Array.from(
          document.querySelectorAll("div.sc-479cd3f2-1 > div:nth-child(1)"),
          (a) => a.innerHTML
        );
      });

      await puppeter.pageClose();
      const urlMatches = this.concatUrl(rawUrlMatches);
      const dateMatchesChunk = this.convertStrWordDate(
        this.makeChunks(rawDateMatches)
      ); // разделяем на чанки по [[1,2]]
      const dateMatches = this.convertStrWordDate(dateMatchesChunk); // преобразовываем строки слов в даты
      const commandMatches = this.makeChunks(rawCommandMatches);
      const coeffMatches = this.clearSomeSymbolRegex(rawCoeffMatches);

      const defaultData = {
        dates: dateMatches,
        commands: commandMatches,
        urls: urlMatches,
        coeff: coeffMatches,
        winners: rawWinnerMatches,
      };

      let dataForListGoogleThird = defaultData;
      const isThirdGoogleTable = numberSheet === NUMBER_SHEETS.THIRD_SHEET;

      // изменяет данные coeff, winners в зависимости от 3 листа таблицы
      if (isThirdGoogleTable) {
        dataForListGoogleThird = await this.convertDataThirdListGoogle(
          puppeter,
          defaultData
        );
      }

      const dataMatches = {
        ...dataForListGoogleThird,
      };

      // isThirdGoogleTable - если 3 таблица, то пушим значения низких кэфов
      return this.createCovertMatchesForecast(dataMatches, isThirdGoogleTable); // [{ time: '', date: '', }, ...]
    } catch (error) {
      console.log("Error parse match", error);
    }
  };

  async convertDataThirdListGoogle(
    puppeter,
    data = { urls: [], coeff: [], winners: [], dates: [], commands: [] } // default value
  ) {
    const { urls, coeff, winners, dates, commands } = data;
    let urlClear = [...urls],
      coeffClear = [...coeff],
      winnersClear = [...winners],
      datesClear = [...dates],
      commandsClear = [...commands];

    try {
      for (let i = 0; i < urlClear.length; i++) {
        const page = await puppeter.createPage();

        await page?.goto?.(urlClear[i], {
          waitUntil: "domcontentloaded",
        });

        await this.sleep(1000);

        // ищем кнопку Сделать прогноз
        const [button] = await page.$x(
          "//button[contains(., 'Сделать прогноз')]"
        );

        if (button) {
          await button.click();
        }

        await page.waitForSelector("div.sc-57cb9113-24");
        const rawCoeff = await page?.evaluate?.(() => {
          // '<span class="sc-51b5fb96-2 bmbyaV">1X</span>1.043' находит строку с кэф.
          return Array.from(
            // обращаемся к значению 1,
            // чтобы из массива всех статистик получить нужный нам
            document
              ?.querySelectorAll("div.sc-57cb9113-24")[1]
              ?.querySelectorAll("div.sc-57cb9113-1"),
            (div) => div.innerHTML
          );
        });

        const [firstCoeffWin, secondCoeffWin] =
          this.getCoeffForDetailInfo(rawCoeff);
        const [firstWinSymbol, firstCoeff] = firstCoeffWin;
        const [secondWinSymbol, secondCoeff] = secondCoeffWin
          ? secondCoeffWin
          : ["SYMBOL", "0"];

        const isFirstWinner = winners[i] === FIRST_WINNER;
        const winner = isFirstWinner ? firstWinSymbol : secondWinSymbol;

        if (winner === "SYMBOL") {
          // очищаем из массива элементы, которые содержат значение symbol
          urlClear = urlClear.filter((_, index) => index !== i);
          coeffClear = coeffClear.filter((_, index) => index !== i);
          winnersClear = winnersClear.filter((_, index) => index !== i);
          datesClear = datesClear.filter((_, index) => index !== i);
          commandsClear = commandsClear.filter((_, index) => index !== i);

          continue;
        }
        // переопределяем значение победителя на x1 || x2
        winnersClear[i] = winner;
        //добавил условие, что у какого-то матча может не спарсится двойной шанс

        // удаляем последний элемент, чтобы поместить в массив обновленный кэфф
        coeffClear[i].pop();
        const elementCoeff = isFirstWinner
          ? Number(firstCoeff)
          : Number(secondCoeff);
        coeffClear[i].push(elementCoeff);

        console.log("Parse page complete ======>", urlClear[i]);
        await puppeter.pageClose();
      }

      return {
        dates: datesClear,
        commands: commandsClear,
        urls: urlClear,
        coeff: coeffClear,
        winners: winnersClear,
      };
    } catch (error) {
      console.log("Error parse link", error);
    }
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
  parseResMatchesCompleted = async (
    completedMatches = [],
    sheet,
    numberSheet,
    puppeter
  ) => {
    // Заходим на основную страницу и добавляем в localStorage необходимые ключи
    // для скрытия банеров
    const pageMainUrl = await puppeter.createPage();

    await pageMainUrl?.goto?.(MAIN_URL_FOTTBALL, {
      waitUntil: "domcontentloaded",
    });
    // убираем появляющиеся баннеры добавляя в localStorage ключи
    await this.setLocalStorageForHideBanners(pageMainUrl);
    await puppeter.pageClose();

    const arr = [];

    try {
      for (let i = 0; i < completedMatches.length; i++) {
        const page = await puppeter.createPage();
        const isFourthSheet = numberSheet === NUMBER_SHEETS.FOURTH_SHEET;

        await page?.goto?.(completedMatches[i]?.link, {
          waitUntil: "domcontentloaded",
        });

        await this.sleep(1000);

        let rawCheck = null;

        if (isFourthSheet) {
          // такое условие, потому что нельзя вынести в переменную и использовать внутри, т.к. обращения мы делаем в консоли
          // и консоль ничего не знает, что у нас из вне
          rawCheck = await page?.evaluate?.(() => {
            return Array.from(
              document.querySelectorAll(
                "#__next > div.ui.container.main-container > div.ui.stackable.equal.width.grid > div.eleven.wide.column > div > div.sc-8401a795-1.iBALIp > div.sc-8401a795-5.cRbFpH > div.sc-8401a795-9.jenvbW > div.sc-8401a795-11.dcpICH > div"
              ),
              (div) => div.innerHTML
            );
          });
        }

        if (!isFourthSheet) {
          rawCheck = await page?.evaluate?.(() => {
            return Array.from(
              document.querySelectorAll(
                "#__next > div.ui.container.main-container > div.ui.stackable.equal.width.grid > div.eleven.wide.column > div > div.sc-8401a795-1.iBALIp > div.sc-8401a795-5.cRbFpH > div.sc-8401a795-9.jlDaCk > div.sc-8401a795-11.dclGPc > div"
              ),
              (div) => div.innerHTML
            );
          });
        }

        const res = await this.matchesCompletedDependencyListGoogleTable(
          completedMatches[i],
          rawCheck,
          numberSheet,
          sheet,
          puppeter
        );

        console.log(
          "Parse page complete ======>",
          completedMatches[i].link,
          "Res====>",
          res
        );

        arr.push(res);
        await puppeter.pageClose();
      }

      return arr;
    } catch (error) {
      console.log("Error parse res matches", error);
    }

    return arr;
  };

  matchesCompletedDependencyListGoogleTable = async (
    completedMatch,
    rawCheck,
    numberSheet,
    sheet,
    puppeter
  ) => {
    const [firstCommand, secondCommand] = rawCheck;
    let winCommand = "";
    // получаем id элемента из таблицы и меняем цвет ячейки в зависимости от прогноза
    const idGoogleTable = completedMatch?.idGoogleTable ?? 0;
    // добавляем в ячейку результата кэфф * ставку, если победа, иначе -ставка
    const colorCellMatchCheck = sheet.getCell(idGoogleTable, COORDS_CHECK_ROW);
    const resCellMatch = sheet.getCell(idGoogleTable, COORDS_RESULT_ROW);

    const checkDefault = Number(completedMatch?.check);
    const money = Number(completedMatch?.coefficient) * checkDefault;
    const resMoneyWin = Number((money - checkDefault).toFixed(1));

    colorCellMatchCheck.backgroundColor = COLORS_CELL.RED;
    resCellMatch.value = String(-Number(completedMatch?.check));
    let result = -Number(completedMatch?.check);

    const isBothWinner = firstCommand === secondCommand;
    const isFirstWinner = firstCommand > secondCommand;
    const isSecondWinner = firstCommand < secondCommand;

    // проверяем, что первый лист
    if (
      numberSheet === NUMBER_SHEETS.FIRST_SHEET ||
      numberSheet === NUMBER_SHEETS.FOURTH_SHEET
    ) {
      if (isBothWinner) {
        winCommand = BOTH_WINNER;
        colorCellMatchCheck.backgroundColor = COLORS_CELL.RED;
        resCellMatch.value = String(-Number(completedMatch?.check));
        result = -Number(completedMatch?.check);
      }

      if (isFirstWinner) {
        winCommand = FIRST_WINNER;
      }

      if (isSecondWinner) {
        winCommand = SECOND_WINNER;
      }

      if (winCommand === completedMatch?.forecast) {
        colorCellMatchCheck.backgroundColor = COLORS_CELL.GREEN;
        resCellMatch.value = String(resMoneyWin);
        result = resMoneyWin;
      }
    }

    if (numberSheet === NUMBER_SHEETS.SECOND_SHEET) {
      if (isBothWinner) {
        winCommand = BOTH_WINNER;
        colorCellMatchCheck.backgroundColor = COLORS_CELL.GREY;
        resCellMatch.value = String(0);
        result = 0;
      }

      if (isFirstWinner) {
        winCommand = FIRST_WINNER;
      }

      if (isSecondWinner) {
        winCommand = SECOND_WINNER;
      }

      if (winCommand === completedMatch?.forecast) {
        colorCellMatchCheck.backgroundColor = COLORS_CELL.GREEN;
        resCellMatch.value = String(resMoneyWin);
        result = resMoneyWin;
      }
    }

    if (numberSheet === NUMBER_SHEETS.THIRD_SHEET) {
      if (isBothWinner) {
        winCommand = BOTH_WINNER_TABLE_3;
        colorCellMatchCheck.backgroundColor = COLORS_CELL.GREEN;
      }

      if (isFirstWinner) {
        winCommand = FIRST_WINNER_TABLE_3;
      }

      if (isSecondWinner) {
        winCommand = SECOND_WINNER_TABLE_3;
      }

      if (winCommand === completedMatch?.forecast || isBothWinner) {
        colorCellMatchCheck.backgroundColor = COLORS_CELL.GREEN;
        resCellMatch.value = String(resMoneyWin);
        result = resMoneyWin;
      }
    }

    await sheet.saveUpdatedCells();
    await puppeter?.pageClose();

    return result;
  };

  // убираем появляющиеся баннеры добавляя в localStorage ключи
  setLocalStorageForHideBanners = async (page) => {
    await page?.evaluate(() => {
      if (window?.localStorage) {
        localStorage.setItem("_fs.nb_hideFullScreenBanner", String(Date.now()));
        localStorage.setItem("_fs.nb_countFullScreenBanner", String(0));
        localStorage.setItem("_tp.nb-tph", String(Date.now()));
        localStorage.setItem("_tp.nb-tch", String(1));
      }
    });
  };

  sleep = async (timer) => await new Promise((res) => setTimeout(res, timer));

  isCheckString = (str) => {
    // проверяет, что значение не может быть
    // пустой строкой, undefined, null
    const regex = /^(?:string|undefined|null|)$/i;

    if (regex.test(str)) {
      return true;
    }

    return false;
  };
}

const parserMatch = new ParserMatch();

module.exports = { parserMatch };
