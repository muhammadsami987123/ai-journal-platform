import { HttpException, HttpStatus } from "@nestjs/common";

export type ErrorCode =
  | "VALIDATION_FAILED"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "ENTRY_NOT_FOUND"
  | "QUESTION_NOT_FOUND"
  | "ENTRY_EMPTY"
  | "ENTRY_TOO_LONG"
  | "IMMUTABLE_FIELD"
  | "DUPLICATE_EMAIL"
  | "INVALID_CREDENTIALS"
  | "MOOD_INVALID"
  | "AI_UNAVAILABLE"
  | "AI_INVALID_OUTPUT"
  | "AI_RATE_LIMITED"
  | "STT_UNAVAILABLE"
  | "REMINDER_NOT_CONSENTED"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

/**
 * Application error with a stable machine code and a message that is safe to
 * display. Internal detail is logged server-side only, keyed by request id.
 */
export class AppException extends HttpException {
  constructor(
    readonly code: ErrorCode,
    message: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
    readonly details?: unknown
  ) {
    super({ code, message, details }, status);
  }

  static notFound(code: ErrorCode, message = "Not found"): AppException {
    return new AppException(code, message, HttpStatus.NOT_FOUND);
  }

  static unauthenticated(message = "Please sign in to continue."): AppException {
    return new AppException("UNAUTHENTICATED", message, HttpStatus.UNAUTHORIZED);
  }
}
