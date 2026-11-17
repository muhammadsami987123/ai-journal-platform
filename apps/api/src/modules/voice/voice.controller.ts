import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseInterceptors
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  transcriptionCreateSchema,
  uuidSchema,
  type Transcript,
  type TranscriptionCreateInput
} from "@journal/shared";
import { CurrentUser } from "../../common/decorators/current-user.decorator.js";
import { ZodPipe } from "../../common/pipes/zod.pipe.js";
import type { AuthenticatedUser } from "../../auth/session.types.js";
import { VoiceService } from "./voice.service.js";
import { env } from "../../config/env.js";

@Controller("v1")
export class VoiceController {
  constructor(private readonly voice: VoiceService) {}

  @Post("transcriptions")
  save(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodPipe(transcriptionCreateSchema)) body: TranscriptionCreateInput
  ): Promise<Transcript> {
    return this.voice.saveTranscript(user.id, body);
  }

  @Get("transcriptions/:id")
  get(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", new ZodPipe(uuidSchema)) id: string
  ): Promise<Transcript> {
    return this.voice.getTranscript(user.id, id);
  }

  /**
   * Fallback transcription. Accepts multipart (audio + language). Returns 503
   * with STT_UNAVAILABLE when no provider is configured, by design.
   */
  @Post("voice/transcribe")
  @UseInterceptors(FileInterceptor("audio", { limits: { fileSize: 25 * 1024 * 1024 } }))
  transcribe(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: { buffer: Buffer; mimetype: string; originalname: string; size: number } | undefined,
    @Body("language") language: string | undefined
  ) {
    return this.voice.transcribeAudio(user.id, file, language || env.STT_DEFAULT_LANGUAGE);
  }
}
