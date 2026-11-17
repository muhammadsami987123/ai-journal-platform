import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import {
  aiApproveSchema,
  aiGenerateSchema,
  aiRegenerateSchema,
  uuidSchema,
  type AiApproveInput,
  type AiGenerateInput,
  type AiGeneration
} from "@journal/shared";
import { z } from "zod";
import { CurrentUser } from "../../common/decorators/current-user.decorator.js";
import { ZodPipe } from "../../common/pipes/zod.pipe.js";
import type { AuthenticatedUser } from "../../auth/session.types.js";
import { AiService } from "./ai.service.js";

const listQuery = z.object({ entry_id: uuidSchema });

@Controller("v1/ai")
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Post("generate")
  generate(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodPipe(aiGenerateSchema)) body: AiGenerateInput
  ): Promise<AiGeneration> {
    return this.ai.generate(user.id, body);
  }

  @Post("generations/:id/regenerate")
  regenerate(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", new ZodPipe(uuidSchema)) id: string,
    @Body(new ZodPipe(aiRegenerateSchema))
    body: { instruction?: string; output_language?: string }
  ): Promise<AiGeneration> {
    return this.ai.regenerate(user.id, id, body);
  }

  @Post("generations/:id/approve")
  approve(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", new ZodPipe(uuidSchema)) id: string,
    @Body(new ZodPipe(aiApproveSchema)) body: AiApproveInput
  ): Promise<AiGeneration> {
    return this.ai.approve(user.id, id, body);
  }

  @Get("generations")
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query(new ZodPipe(listQuery)) query: { entry_id: string }
  ): Promise<AiGeneration[]> {
    return this.ai.list(user.id, query.entry_id);
  }
}
