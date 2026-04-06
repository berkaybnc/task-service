import { ZodError } from "zod";
import { AppError } from "../../domain/errors/AppError.js";

export function errorHandler(err, req, res, next) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: "Validation error",
      errors: err.errors
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      message: err.message
    });
  }

  console.error(err);

  return res.status(500).json({
    message: "Internal server error"
  });
}