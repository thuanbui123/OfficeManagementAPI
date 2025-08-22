import * as dotenv from "dotenv";

dotenv.config();

const env = {
  PORT: Number(process.env.PORT) || 3000,
  NODE_ENV: (process.env.NODE_ENV as "development" | "production" | "test") || "development",
  ACCESS_TOKEN_SECRET: process.env.JWT_ACCESS_SECRET,
  ACCESS_TOKEN_LIFE: process.env.JWT_EXPIRE,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "default_refresh_secret",
  REDIS_URL: process.env.REDIS_URL
};


export default env;
