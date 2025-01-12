const SUMM_AMOUNT = 500;
const SUMM_WIN_DEFAULT = 0;
const MAIN_URL_FOTTBALL = "https://nb-bet.com/";
const ID_TABLE = "1z-rm8dtMZ2TY2yLXkjt4W108trsHqUwX-CSKV-feAgU";
const FIRST_WINNER = "П1";
const SECOND_WINNER = "П2";
// почему-то у гугла диапазон цветов от 0 до 1, поэтому нужно делить значение на 255
const COLORS_CELL = {
  RED: { red: 153 / 255, green: 0 / 255, blue: 0 / 255 },
  YELLOW: { red: 191 / 255, green: 144 / 255, blue: 0 / 255 },
  GREEN: { red: 56 / 255, green: 118 / 255, blue: 29 / 255 },
};
const COORDS_CHECK_ROW = 6;
const COORDS_BUDGET_ROW = 10;

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
};
