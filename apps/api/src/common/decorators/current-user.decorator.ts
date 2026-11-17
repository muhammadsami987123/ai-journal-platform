import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { Request } from "express";
import type { AuthenticatedUser, RequestAuth } from "../../auth/session.types.js";

/**
 * The library's global AuthGuard resolves the Better Auth session on every
 * non-public route and attaches it to `request.session` / `request.user`.
 */
interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser | null;
  session?: { id: string; userId: string; expiresAt: Date } | null;
}

/** Returns the authenticated context attached by the global AuthGuard. */
export const CurrentAuth = createParamDecorator(
  (_data: unknown, context: ExecutionContext): RequestAuth => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.user || !request.session) {
      throw new Error("CurrentAuth used on a route without the auth guard");
    }
    return {
      user: request.user,
      session: {
        id: request.session.id,
        userId: request.session.userId,
        expiresAt: request.session.expiresAt
      }
    };
  }
);

/** Convenience decorator for the parts of the session most handlers need. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.user) {
      throw new Error("CurrentUser used on a route without the auth guard");
    }
    return request.user;
  }
);
