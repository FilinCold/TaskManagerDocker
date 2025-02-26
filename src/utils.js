const {
  COORDS_CHECK_ROW,
  COLORS_CELL,
  COORDS_BUDGET_ROW,
} = require("./constants");
const cron = require("node-cron");
const { parserMatch } = require("./service/ParserMatch");

const getMatchesWhichAdd = (actualMatches, googleMatches) => {
  try {
    const ownersActualMatch = googleMatches.map((item) => item.owner); // change on actualmatches
    const filteredMatches = actualMatches.filter((match) => {
      return !ownersActualMatch.includes(match.owner);
    });

    return filteredMatches;
  } catch (error) {
    console.log("Error", error);

    return [];
  }
};

const addMatches = async (actualMatches, googleMatches, googleSheet) => {
  // для теста условие, чтобы мок данные добавлять и проверять пустую таблицу
  // if (!googleMatches[0]?.["time"]) {
  try {
    // добавляем в таблицу если в таблице нет записей
    // проверяем, что хотя бы первый элемент присутствует в таблице
    // если нет, то добавляем весь с 1 строки
    if (!googleMatches[0]?.time) {
      await googleSheet.addRows(actualMatches);
      await addColorColumn(null, actualMatches, googleSheet);
      console.log("Mathes added in the table");

      return;
    }

    const matchesWhichAdd = getMatchesWhichAdd(actualMatches, googleMatches);
    const isAddMatches = matchesWhichAdd.length;

    if (!isAddMatches) {
      console.log("Matches have been added to the table");

      return;
    }

    await googleSheet.addRows(matchesWhichAdd);
    await addColorColumn(googleMatches, matchesWhichAdd, googleSheet);
    console.log("Mathes added in the table");
  } catch (error) {
    console.log(error);
  }
};

// т.к. они еще не были добавлены в таблицу в другом случае получить номер ячейки и закрасить
const addColorColumn = async (matchesGoogle, matchesActual, sheet) => {
  if (!matchesGoogle) {
    // добавляем желтый цвет для ячеек
    for (let i = 0; i < matchesActual.length; i++) {
      let copyIterator = i;
      const checkColumn = sheet.getCell(++copyIterator, COORDS_CHECK_ROW);
      checkColumn.backgroundColor = COLORS_CELL.YELLOW;
    }

    await sheet.saveUpdatedCells();

    return;
  }

  let idLastCellGoogle = matchesGoogle.length; // +1 потому что google считает ячейки не с 0
  for (let i = 0; i < matchesActual.length; i++) {
    const checkColumn = sheet.getCell(++idLastCellGoogle, COORDS_CHECK_ROW);
    checkColumn.backgroundColor = COLORS_CELL.YELLOW;
  }

  // обновляем цвет ячеек
  await sheet.saveUpdatedCells();
};

const getYesterdayDate = () => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1); // Уменьшаем текущую дату на 1 день

  // Форматируем дату в виде 'ДД.ММ'
  let day = String(yesterday.getDate()).padStart(2, "0");
  let month = String(yesterday.getMonth() + 1).padStart(2, "0"); // Месяцы считаются с нуля
  return `${day}.${month}`;
};

const filterByYesterdaysDate = (arr) => {
  const yesterday = getYesterdayDate(); // Получаем вчерашнюю дату

  return arr.filter((item) => {
    const dateArr = item.date?.split("."); // преобразуем строку в массив ДДММГГ
    dateArr.pop(); // и удаляем год
    const date = dateArr.join(".");

    return date === yesterday;
  });
};

const changeBudgetTable = async (sheet, puppeter, numberSheet) => {
  console.log("numberSheet change budget =====>", numberSheet);

  const rows = await sheet.getRows(); // данные из гугл таблицы
  const convertGoogleData = parserMatch.convertGoogleRows(rows); // преобразовываем данные в читаемый вид
  const yesterdayMatches = filterByYesterdaysDate(convertGoogleData);

  if (!yesterdayMatches.length) {
    console.log("Budget don't changes");
    return;
  }

  const valuesChangeBudget = await parserMatch.parseResMatchesCompleted(
    yesterdayMatches,
    sheet,
    numberSheet, // нужно для сравнения на каком листе таблицы мы находимся
    puppeter
  );
  console.log("valuesChangeBudget", valuesChangeBudget, 33333333);

  const budget = sheet.getCell(0, COORDS_BUDGET_ROW); // получаем бюджет
  const budgetValue = budget?.value ? Number(budget?.value) : 0;
  console.log("budgetValue google", budgetValue, 888888);

  const newValue = valuesChangeBudget?.reduce((prevVal, curVal) => {
    prevVal += curVal;

    return prevVal;
  }, budgetValue);

  budget.value = String(newValue); // change value budget
  await sheet.saveUpdatedCells();
  console.log("Budget was changed, completed matches were removed");
};

const addMatchesTable = async (sheet, puppeter, numberSheet) => {
  console.log("numberSheet addMatches =====>", numberSheet);

  const rows = await sheet.getRows(); // данные из гугл таблицы
  const convertGoogleData = parserMatch.convertGoogleRows(rows); // преобразовываем данные в читаемый вид
  const actualMatches = await parserMatch.parseMatches(puppeter, numberSheet);
  addMatches(actualMatches, convertGoogleData, sheet);
  await puppeter.pageClose();
};

const sleep = async (timer) =>
  await new Promise((res) => setTimeout(res, timer));

const processMatchingChangeBudget = async (
  numberSheet = 0,
  doc,
  puppeter,
  { isChangeBudget = false, isAddMatches = false }
) => {
  try {
    console.log(
      "isChangeBudget====>",
      isChangeBudget,
      "isAddMatches=====>",
      isAddMatches
    );

    const sheet = doc.sheetsByIndex[numberSheet];
    const { lastColumnLetter, rowCount } = sheet;
    await sheet.loadCells(`A1:${lastColumnLetter}${rowCount}`);

    if (isChangeBudget) {
      await changeBudgetTable(sheet, puppeter, numberSheet);
    }

    if (isAddMatches) {
      await addMatchesTable(sheet, puppeter, numberSheet);
    }
  } catch (error) {
    console.log("Error", error);
  }
};

module.exports = {
  sleep,
  getYesterdayDate,
  getMatchesWhichAdd,
  filterByYesterdaysDate,
  addMatches,
  processMatchingChangeBudget,
};
