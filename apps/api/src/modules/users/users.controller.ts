import { Body, Controller, Get, Patch, Header } from "@nestjs/common";
import {
  preferencesUpdateSchema,
  profileUpdateSchema,
  type MeResponse,
  type Preferences,
  type Profile
} from "@journal/shared";
import { CurrentUser } from "../../common/decorators/current-user.decorator.js";
import { ZodPipe } from "../../common/pipes/zod.pipe.js";
import type { AuthenticatedUser } from "../../auth/session.types.js";
import { UsersService } from "./users.service.js";

@Controller("v1/me")
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  me(@CurrentUser() user: AuthenticatedUser): Promise<MeResponse> {
    return this.users.me(user);
  }

  @Patch("profile")
  updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodPipe(profileUpdateSchema)) body: Parameters<UsersService["updateProfile"]>[1]
  ): Promise<Profile> {
    return this.users.updateProfile(user.id, body);
  }

  @Patch("preferences")
  updatePreferences(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodPipe(preferencesUpdateSchema))
    body: Parameters<UsersService["updatePreferences"]>[1]
  ): Promise<Preferences> {
    return this.users.updatePreferences(user.id, body);
  }

  @Get("export")
  @Header("content-type", "application/json; charset=utf-8")
  @Header("content-disposition", 'attachment; filename="ai-journal-export.json"')
  export(@CurrentUser() user: AuthenticatedUser): Promise<Record<string, unknown>> {
    return this.users.exportAll(user.id);
  }
}
