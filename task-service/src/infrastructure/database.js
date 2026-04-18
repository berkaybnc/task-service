import { Sequelize } from "sequelize";
import { env } from "../config/env.js";
import pino from "pino";

const logger = pino();

const sequelize = new Sequelize(env.databaseUrl, {
  dialect: "postgres",
  logging: (msg) => logger.debug(msg),
});

export default sequelize;
