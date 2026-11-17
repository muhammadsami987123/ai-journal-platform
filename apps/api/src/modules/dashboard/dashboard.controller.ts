import { Controller, Get } from "@nestjs/common";
import type { DashboardPayload } from "@journal/shared";
import { CurrentUser } from "../../common/decorators/current-user.decorator.js";
import type { AuthenticatedUser } from "../../auth/session.types.js";
import { DashboardService } from "./dashboard.service.js";

@Controller("v1/dashboard")
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get()
  get(@CurrentUser() user: AuthenticatedUser): Promise<DashboardPayload> {
    return this.dashboard.get(user.id);
  }
}
