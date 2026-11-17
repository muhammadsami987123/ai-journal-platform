import { sql } from "drizzle-orm";
import {
  check,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid
} from "drizzle-orm/pg-core";
import { user } from "./auth.js";
import { entries } from "./journal.js";

/**
 * PLUS-phase tables (T1.4). Created with the core schema so migrations never
 * need to be retrofitted, but no endpoint references them until Phase 13.
 */

export const attachments = pgTable(
  "attachments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    entryId: uuid("entry_id")
      .notNull()
      .references(() => entries.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    storageKey: text("storage_key").notNull(),
    mime: text("mime").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    caption: text("caption"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index("idx_attachments_entry").on(table.entryId),
    index("idx_attachments_user").on(table.userId, table.createdAt.desc()),
    check("attachments_kind_chk", sql`${table.kind} in ('image', 'document', 'audio')`),
    check("attachments_size_chk", sql`${table.sizeBytes} > 0`)
  ]
);

export const journalChats = pgTable(
  "journal_chats",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull().default("New conversation"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull()
  },
  (table) => [index("idx_journal_chats_user").on(table.userId, table.updatedAt.desc())]
);

export const journalChatMessages = pgTable(
  "journal_chat_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    chatId: uuid("chat_id")
      .notNull()
      .references(() => journalChats.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
    content: text("content").notNull(),
    citedEntryIds: uuid("cited_entry_ids").array(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index("idx_chat_messages_chat").on(table.chatId, table.createdAt),
    check("chat_messages_role_chk", sql`${table.role} in ('user', 'assistant')`)
  ]
);

export const reflections = pgTable(
  "reflections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    periodStart: date("period_start").notNull(),
    periodEnd: date("period_end").notNull(),
    insightsJson: jsonb("insights_json").notNull(),
    model: text("model").notNull(),
    promptVersion: text("prompt_version").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index("idx_reflections_user").on(table.userId, table.createdAt.desc()),
    check("reflections_period_chk", sql`${table.periodStart} <= ${table.periodEnd}`)
  ]
);

export type AttachmentRow = typeof attachments.$inferSelect;
export type JournalChatRow = typeof journalChats.$inferSelect;
export type ReflectionRow = typeof reflections.$inferSelect;
