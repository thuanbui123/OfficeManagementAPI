import dotenv from "dotenv";
dotenv.config();

import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";

import express from "express";
import path from "path";

import routes from "./routes/index";
const notFound = require("./middlewares/notFound");
const errorHandler = require("./middlewares/error");
const rateLimit = require("./middlewares/rateLimit");
const env = require("./config/env");
const db = require("@config/db/index");
import { initRedis } from "@libs/redis";
import { ensureProducer } from "@libs/kafka";
const app = express();
const port = Number(env.PORT) || 3000;

async function bootstrap() {
  // Kết nối DB
  db.connect();

  // Redis & Kafka
  await initRedis();

  // Static files
  app.use(express.static(path.join(__dirname, "public")));

  // Swagger
  const swaggerOptions: swaggerJsdoc.Options = {
    definition: {
      openapi: "3.0.0",
      info: {
        title: "Office Management API",
        version: "1.0.0",
        description: "API docs for OfficeManagement system",
      },
      servers: [{ url: "/api" }],
      components: {
        securitySchemes: {
          bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
        },
      },
      security: [{ bearerAuth: [] }],
    },
    apis: [path.join(__dirname, "routes", "*.{ts,js}")],
  };
  const swaggerSpec = swaggerJsdoc(swaggerOptions);

  app.use(
    "/docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      explorer: true,
      swaggerOptions: { persistAuthorization: true },
    })
  );

  app.get("/docs.json", (_req, res) => res.json(swaggerSpec));

  // Middleware
  app.use(express.json({ limit: "1mb" }));
  app.use(rateLimit());

  // Routes
  app.get("/", (_req, res) => {
    res.json({ message: "Truy cập vào /docs để xem danh sách API" });
  });
  app.get('/healthz', (_req, res) => res.status(200).json({ ok: true }));
  app.use("/api", routes);

  // Error handlers
  app.use(notFound);
  app.use(errorHandler);

  // Start server
  app.listen(port, () => {
    (app.locals as any).startedAt = new Date();
    const host =
      process.env.RENDER_EXTERNAL_URL || `http://localhost:${port}`;
    console.log(`🚀 Server listening on ${host}`);
    console.log(`📚 Swagger UI at ${host}/docs`);
  });

  ensureProducer()
    .then(() => console.log('✅ Kafka producer connected'))
    .catch((e: any) => console.warn('⚠️ Kafka connect failed (will retry internally):', e?.message));
}

// Gọi bootstrap
bootstrap().catch((err) => {
  console.error("❌ Error while starting server:", err);
  process.exit(1);
});

export default app;
