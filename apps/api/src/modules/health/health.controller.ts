import { Controller, Get, Logger } from "@nestjs/common";
import { getDatabase } from "@journal/database";
import type { ApiSuccess } from "@journal/shared";
import { Public } from "../../common/decorators/public.decorator.js";

interface HealthPayload {
  status: "ok" | "degraded";
  db: "ok" | "down";
  version: string;
  uptime_seconds: number;
}

@Controller("health")
export class HealthController {
  private readonly logger = new Logger("Health");

  @Public()
  @Get()
  async check(): Promise<ApiSuccess<HealthPayload>> {
    let db: "ok" | "down" = "ok";
    try {
      const { pool } = getDatabase();
      await pool.query("select 1");
    } catch (error) {
      db = "down";
      this.logger.error(
        `Database health check failed: ${error instanceof Error ? error.message : "unknown"}`
      );
    }

    return {
      data: {
        status: db === "ok" ? "ok" : "degraded",
        db,
        version: process.env.npm_package_version ?? "0.1.0",
        uptime_seconds: Math.round(process.uptime())
      }
    };
  }
}
