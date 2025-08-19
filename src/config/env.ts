import * as dotenv from "dotenv";

dotenv.config();

const env = {
  PORT: Number(process.env.PORT) || 3000,
  NODE_ENV: (process.env.NODE_ENV as "development" | "production" | "test") || "development",
};

module.exports = env;
