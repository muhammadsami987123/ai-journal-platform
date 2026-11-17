import type { NextFunction, Request, Response } from "express";
import { randomUUID } from "node:crypto";

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

/**
 * Attaches a request id to every request and response. Applied in main.ts
 * before routing so even 404s and auth errors carry one (T14.7).
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const supplied = req.header("x-request-id");
  const safe =
    supplied && /^[A-Za-z0-9._-]{8,100}$/.test(supplied) ? supplied : `req_${randomUUID()}`;
  req.requestId = safe;
  res.setHeader("x-request-id", safe);
  next();
}
