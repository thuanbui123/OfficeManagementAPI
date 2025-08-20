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

db.connect();

const app = express();
const port = Number(env.PORT) || 3000;

app.use(express.static(path.join(__dirname, "public")));

const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Office Management API",
      version: "1.0.0",
      description: "API docs for OfficeManagement system",
    },
    servers: [{ url: "http://localhost:3000/api" }],
  },
  apis: [path.join(__dirname, 'routes', '*.{ts,js}')],
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use(
  "/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    explorer: true,
    swaggerOptions: { deepLinking: false },
  })
);

app.get("/docs.json", (_req, res) => res.json(swaggerSpec));

app.use(express.json({ limit: "1mb" }));
app.use(rateLimit());

app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);

app.listen(port, () => {
  (app.locals as any).startedAt = new Date();
  console.log(`🚀 Server listening on http://localhost:${port}`);
  console.log(`📚 Swagger UI at http://localhost:${port}/docs`);
});

export default app;
