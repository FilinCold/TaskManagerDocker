const express = require("express");
const cron = require("node-cron");

const { ENV } = require("./src/config/env");
const { JWT } = require("google-auth-library");
const { GoogleSpreadsheet } = require("google-spreadsheet");
const { ID_TABLE } = require("./src/constants");
const { parserMatch } = require("./src/service/ParserMatch");
const { addMatches } = require("./src/utils");
const app = express();

const PORT = process.env.PORT || 4000;

const serviceAccountAuth = new JWT({
  // env var values here are copied from service account credentials generated by google
  // see "Authentication" section in docs for more info
  email: ENV.EMAIL,
  key: ENV.PASSWORD,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const doc = new GoogleSpreadsheet(ID_TABLE, serviceAccountAuth);
const port = process.env.PORT || 3001;

app.listen(port, async () => {
  console.log(`Server listening on port ${port}`);

  await doc.loadInfo();
  const sheet = doc.sheetsByIndex[0];
  await sheet.loadCells("A1:K10");

  // // Добавляет в таблицу список матчей, если в таблицу уже были добавлены, то не добавляет
  // cron.schedule("00 12 * * *", async () => {
  //   console.log("running a task every day in 12:00");
  //   const rows = await sheet.getRows(); // данные из гугл таблицы
  //   const convertGoogleData = parserMatch.convertGoogleRows(rows); // преобразовываем данные в читаемый вид
  //   const actualMatches = await parserMatch.matches;
  //   addMatches(actualMatches, convertGoogleData, sheet);
  // });

  // // // проверяет предыдущие записанные матчи изменяет бюджет и удаляет их из таблицы
  // cron.schedule("00 04 * * *", async () => {
  //   console.log("running a task every day in 04:00");

  //   const rows = await sheet.getRows(); // данные из гугл таблицы
  //   const convertGoogleData = parserMatch.convertGoogleRows(rows); // преобразовываем данные в читаемый вид
  //   const yesterdayMatches = filterByYesterdaysDate(convertGoogleData);

  //   if (!yesterdayMatches.length) {
  //     return;
  //   }

  //   const valuesChangeBudget = await parserMatch.parseResMatchesCompleted(
  //     yesterdayMatches
  //   );
  //   const budget = sheet.getCell(0, 10); // получаем бюджет
  //   const budgetValue = budget?.value ? Number(budget?.value) : 0;

  //   const newValue = valuesChangeBudget?.reduce((prevVal, curVal) => {
  //     prevVal += curVal;

  //     return prevVal;
  //   }, budgetValue);

  //   budget.value = newValue; // change value budget
  //   yesterdayMatches.map(async (match) => {
  //     const id = Number(match?.id);

  //     if (!id) {
  //       return;
  //     }

  //     await rows[id].delete();
  //   });

  //   await sheet.saveUpdatedCells();
  // });

  cron.schedule("*/5 * * * * *", async () => {
    console.log("running a task every 5 secs");

    try {
      const rows = await sheet.getRows(); // данные из гугл таблицы
      const convertGoogleData = parserMatch.convertGoogleRows(rows); // преобразовываем данные в читаемый вид
      const actualMatches = await parserMatch.matches;
      console.log("actualMatches========>", actualMatches, 111111);

      addMatches(actualMatches, convertGoogleData, sheet);
    } catch (error) {
      console.log("Error add matches in table", error);
    }
  });
});
