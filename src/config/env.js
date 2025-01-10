// доступ к env переменным
require("dotenv").config();

const ENV = {
  EMAIL: process.env.EMAIL,
  PASSWORD: process.env.PASSWORD,
};

module.exports = { ENV };
