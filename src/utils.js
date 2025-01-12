const { COORDS_CHECK_ROW, COLORS_CELL } = require("./constants");

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
  // добавляем в таблицу если в таблице нет записей
  if (!googleMatches.length) {
    await googleSheet.addRows(actualMatches);
    // await addColorColumn(actualMatches, googleSheet);
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
  // await addColorColumn(matchesWhichAdd, googleSheet);
  console.log("Mathes added in the table");
};

// isFirstAddedInTable проверка нужна, чтобы закрашивать ячейки с самого начала столбца
// т.к. они еще не были добавлены в таблицу в другом случае получить номер ячейки и закрасить
const addColorColumn = async (matches, sheet) => {
  const lenMatches = matches.length;

  if (!lenMatches) {
    return;
  }

  // добавляем желтый цвет для ячеек
  for (let i = 0; i < lenMatches; i++) {
    let copyIterator = i;
    const checkColumn = sheet.getCell(++copyIterator, COORDS_CHECK_ROW);
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
  return arr.filter((item) => item.date === yesterday);
};

const sleep = async (timer) =>
  await new Promise((res) => setTimeout(res, timer));

module.exports = {
  sleep,
  getYesterdayDate,
  getMatchesWhichAdd,
  filterByYesterdaysDate,
  addMatches,
};
