import type { ZodType } from "zod";
import type { PipeTransform } from "@nestjs/common";
import { AppException } from "../errors/app.exception.js";

/**
 * Single validation mechanism for body / params / query, driven by the shared
 * schemas so the web app and the API cannot disagree about a payload.
 */
export class ZodPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodType<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message
      }));
      throw new AppException(
        "VALIDATION_FAILED",
        details[0]?.message ?? "The request could not be validated.",
        400,
        details
      );
    }
    return result.data;
  }
}

/** Parse without a pipe (services, repositories, scripts). */
export function parseOrThrow<T>(schema: ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message
    }));
    throw new AppException(
      "VALIDATION_FAILED",
      details[0]?.message ?? "The request could not be validated.",
      400,
      details
    );
  }
  return result.data;
}
