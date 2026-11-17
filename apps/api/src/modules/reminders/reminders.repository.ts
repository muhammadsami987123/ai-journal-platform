import { Inject, Injectable } from "@nestjs/common";
import { reminders} from "@journal/database/schema";
import type { Database } from "@journal/database";
import type { ReminderSettings, ReminderUpdateInput } from "@journal/shared";
import { eq } from "drizzle-orm";
import { DATABASE } from "../../database/database.module.js";
import { AppException } from "../../common/errors/app.exception.js";
import { mapReminder } from "../../common/mappers.js";

@Injectable()
export class RemindersRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  private async getRow(userId: string) {
    const [row] = await this.db
      .select()
      .from(reminders)
      .where(eq(reminders.userId, userId))
      .limit(1);
    return row ?? null;
  }

  private async ensureRow(userId: string) {
    const existing = await this.getRow(userId);
    if (existing) return existing;

    const [created] = await this.db
      .insert(reminders)
      .values({ userId, enabled: false, timezone: "UTC", channel: "browser" })
      .onConflictDoNothing({ target: reminders.userId })
      .returning();

    return created ?? (await this.getRow(userId));
  }

  async get(userId: string): Promise<ReminderSettings> {
    const row = await this.ensureRow(userId);
    if (!row) throw new AppException("INTERNAL_ERROR", "Reminder settings unavailable.", 500);
    return mapReminder(row);
  }

  async recordConsent(userId: string): Promise<ReminderSettings> {
    await this.ensureRow(userId);
    const [row] = await this.db
      .update(reminders)
      .set({ consentAt: new Date(), updatedAt: new Date() })
      .where(eq(reminders.userId, userId))
      .returning();
    if (!row) throw new AppException("INTERNAL_ERROR", "Consent could not be recorded.", 500);
    return mapReminder(row);
  }

  async update(userId: string, input: ReminderUpdateInput): Promise<ReminderSettings> {
    const current = await this.ensureRow(userId);
    if (!current) throw new AppException("INTERNAL_ERROR", "Reminder settings unavailable.", 500);

    if (input.enabled === true && !current.consentAt) {
      throw new AppException(
        "REMINDER_NOT_CONSENTED",
        "Allow notifications in your browser before enabling reminders.",
        403
      );
    }

    const [row] = await this.db
      .update(reminders)
      .set({
        ...(input.enabled !== undefined ? { enabled: input.enabled } : {}),
        ...(input.time_local !== undefined ? { timeLocal: input.time_local } : {}),
        ...(input.timezone !== undefined ? { timezone: input.timezone } : {}),
        ...(input.channel !== undefined ? { channel: input.channel } : {}),
        updatedAt: new Date()
      })
      .where(eq(reminders.userId, userId))
      .returning();

    if (!row) throw new AppException("INTERNAL_ERROR", "Reminder settings could not be saved.", 500);
    return mapReminder(row);
  }
}
