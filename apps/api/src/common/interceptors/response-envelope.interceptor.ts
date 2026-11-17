import type { CallHandler, ExecutionContext, NestInterceptor } from "@nestjs/common";
import { Injectable } from "@nestjs/common";
import type { Request } from "express";
import type { Observable } from "rxjs";
import { map } from "rxjs/operators";

interface Enveloped {
  data: unknown;
  meta?: Record<string, unknown>;
}

function isEnveloped(value: unknown): value is Enveloped {
  return (
    typeof value === "object" &&
    value !== null &&
    "data" in value &&
    !(value instanceof Date) &&
    !Array.isArray(value)
  );
}

/**
 * Wraps domain responses in the documented `{ data, meta }` envelope.
 * Better Auth owns its own response shapes, so /api/auth is never wrapped.
 */
@Injectable()
export class ResponseEnvelopeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    if (request.path.startsWith("/api/auth")) {
      return next.handle();
    }

    return next.handle().pipe(
      map((body: unknown) => {
        const requestId = request.requestId ?? undefined;
        if (body === undefined || body === null) {
          return { data: null, meta: { requestId } };
        }
        if (isEnveloped(body)) {
          return { ...body, meta: { ...body.meta, requestId } };
        }
        if (body instanceof Date) {
          return { data: body.toISOString(), meta: { requestId } };
        }
        return { data: body, meta: { requestId } };
      })
    );
  }
}
