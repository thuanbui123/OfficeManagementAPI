import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod"

type RequestSource = "body" | "query" | "params";

// Use with zod schemas to validate req body/params/query
const validate =
  <T>(schema: ZodSchema<T>, source: RequestSource = "body") =>
  (req: Request, res: Response, next: NextFunction): void => {
    const data = req[source];
    const result = schema.safeParse(data);

    if (!result.success) {
      const details = result.error.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
      }));

      res.status(400).json({ error: "ValidationError", details });
      return;
    }

    // Ghi đè lại dữ liệu đã được Zod parse (đã "sanitize")
    (req as any)[source] = result.data;
    next();
  };

module.exports = validate;
