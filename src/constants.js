const SUMM_AMOUNT = 1000;
const SUMM_WIN_DEFAULT = 0;
const MAIN_URL_FOTTBALL = "https://nb-bet.com/";
const MAIN_URL_TENNIS = "https://nb-bet.com/tennis/odds-scanner";
const ID_TABLE = "1z-rm8dtMZ2TY2yLXkjt4W108trsHqUwX-CSKV-feAgU";
const FIRST_WINNER = "П1";
const SECOND_WINNER = "П2";
const BOTH_WINNER = "П3";
const FIRST_WINNER_TABLE_3 = "1X";
const SECOND_WINNER_TABLE_3 = "2X";
const BOTH_WINNER_TABLE_3 = "3X";
// почему-то у гугла диапазон цветов от 0 до 1, поэтому нужно делить значение на 255
const COLORS_CELL = {
  RED: { red: 224 / 255, green: 102 / 255, blue: 102 / 255 },
  YELLOW: { red: 252 / 255, green: 217 / 255, blue: 102 / 255 },
  GREEN: { red: 147 / 255, green: 196 / 255, blue: 125 / 255 },
  GREY: { red: 217 / 255, green: 217 / 255, blue: 217 / 255 },
};
const COORDS_CHECK_ROW = 6;
const COORDS_BUDGET_ROW = 10;
const COORDS_RESULT_ROW = 8;
const LOWER_COEFF_THRESHOLD = 1.3;
const NUMBER_SHEETS = {
  FIRST_SHEET: 0,
  SECOND_SHEET: 1,
  THIRD_SHEET: 2,
  FOURTH_SHEET: 3,
};
const DEFAULT_COEFF = 1.0;
const LENGTH_ARR_COEFF = 2;

module.exports = {
  SUMM_AMOUNT,
  SUMM_WIN_DEFAULT,
  MAIN_URL_FOTTBALL,
  ID_TABLE,
  FIRST_WINNER,
  SECOND_WINNER,
  COLORS_CELL,
  COORDS_CHECK_ROW,
  COORDS_BUDGET_ROW,
  COORDS_RESULT_ROW,
  LOWER_COEFF_THRESHOLD,
  NUMBER_SHEETS,
  BOTH_WINNER,
  FIRST_WINNER_TABLE_3,
  SECOND_WINNER_TABLE_3,
  BOTH_WINNER_TABLE_3,
  DEFAULT_COEFF,
  LENGTH_ARR_COEFF,
  MAIN_URL_TENNIS,
};
