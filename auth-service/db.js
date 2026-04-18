const { Sequelize } = require("sequelize");
const logger = require("./logger");

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

const sequelize = new Sequelize(DATABASE_URL, {
  dialect: "postgres",
  logging: (msg) => logger.debug(msg),
});

module.exports = sequelize;
