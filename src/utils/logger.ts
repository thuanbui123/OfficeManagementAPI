// src/logger.ts
import pino, { LoggerOptions, TransportSingleOptions } from 'pino';

type LogLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace' | 'silent';
const isProd = process.env.NODE_ENV === 'production';
const LOG_LEVEL = (process.env.LOG_LEVEL as LogLevel) ?? (isProd ? 'info' : 'debug');

// Pretty khi dev, JSON thuần khi prod
const transport: TransportSingleOptions | undefined = !isProd
  ? {
      target: 'pino-pretty',
      options: {
        translateTime: 'SYS:standard',
        singleLine: false,
        ignore: 'pid,hostname',
      },
    }
  : undefined;

const options: LoggerOptions = {
  level: LOG_LEVEL,
  transport,               // chỉ hoạt động ở dev
  base: {                  // thêm meta cố định
    env: process.env.NODE_ENV,
    service: 'your-service-name',
  },
  // Ẩn thông tin nhạy cảm
  redact: {
    paths: [
      'req.headers.authorization',
      'password',
      '*.password',
      'token',
      'refreshToken',
    ],
    remove: true,
  },
};

// (Tuỳ chọn) ghi file trong prod:
// import { destination } from 'pino';
// const dest = isProd ? pino.destination({ dest: 'logs/app.log', sync: false }) : undefined;
// export const logger = pino(options, dest);

export const logger = pino(options);
