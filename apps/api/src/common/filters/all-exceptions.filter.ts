import {
  ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
  Logger,
  type ExceptionFilter
} from "@nestjs/common";
import type { Request, Response } from "express";
import { AppException, type ErrorCode } from "../errors/app.exception.js";

const STATUS_CODES: Record<number, ErrorCode> = {
  400: "VALIDATION_FAILED",
  401: "UNAUTHENTICATED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  409: "IMMUTABLE_FIELD",
  422: "VALIDATION_FAILED",
  429: "RATE_LIMITED",
  503: "AI_UNAVAILABLE"
};

/**
 * One error shape for every failure. Client-visible messages are safe;
 * stack traces, SQL and provider detail stay in the server log keyed by
 * request id (T14.7).
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger("HttpError");

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId = request.requestId ?? "req_unknown";

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code: ErrorCode = "INTERNAL_ERROR";
    let message = "Something went wrong on our side. Please try again.";
    let details: unknown;

    if (exception instanceof AppException) {
      status = exception.getStatus();
      code = exception.code;
      const body = exception.getResponse() as { message?: string; details?: unknown };
      message = body.message ?? message;
      details = body.details;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      code = STATUS_CODES[status] ?? "INTERNAL_ERROR";
      const body = exception.getResponse();
      if (typeof body === "string") {
        message = status === 404 ? "Not found." : body;
      } else if (body && typeof body === "object" && "message" in body) {
        const raw = (body as { message: unknown }).message;
        message = Array.isArray(raw) ? raw.join(", ") : String(raw);
        if (status === 404) message = "Not found.";
      }
      if (status === 401) message = "Please sign in to continue.";
    } else if (isDatabaseError(exception)) {
      status = mapDatabaseStatus(exception.code);
      code = status === 409 ? "IMMUTABLE_FIELD" : "VALIDATION_FAILED";
      message =
        status === 409
          ? "That change conflicts with an existing record."
          : "The data could not be saved because it breaks a database rule.";
    }

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.originalUrl} ${status} ${code} [${requestId}]`,
        exception instanceof Error ? exception.stack : String(exception)
      );
    } else {
      this.logger.warn(
        `${request.method} ${request.originalUrl} ${status} ${code} [${requestId}] ${message}`
      );
    }

    response.status(status).json({
      error: {
        code,
        message,
        requestId,
        ...(details ? { details } : {})
      }
    });
  }
}

function isDatabaseError(value: unknown): value is { code: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "code" in value &&
    typeof (value as { code: unknown }).code === "string" &&
    /^[0-9A-Z]{5}$/.test((value as { code: string }).code)
  );
}

function mapDatabaseStatus(pgCode: string): number {
  switch (pgCode) {
    case "23505":
      return HttpStatus.CONFLICT;
    case "23503":
      return HttpStatus.NOT_FOUND;
    default:
      return HttpStatus.BAD_REQUEST;
  }
}
