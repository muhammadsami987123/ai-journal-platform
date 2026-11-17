CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_generations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"entry_id" uuid,
	"source_type" text NOT NULL,
	"source_ref_id" uuid,
	"output_json" jsonb NOT NULL,
	"output_markdown" text NOT NULL,
	"language" text,
	"is_translation" boolean DEFAULT false NOT NULL,
	"model" text NOT NULL,
	"provider" text NOT NULL,
	"prompt_version" text NOT NULL,
	"is_approved" boolean DEFAULT false NOT NULL,
	"approved_at" timestamp with time zone,
	"tokens_in" integer,
	"tokens_out" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ai_generations_source_chk" CHECK ("ai_generations"."source_type" in ('text', 'transcription'))
);
--> statement-breakpoint
CREATE TABLE "answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entry_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"answer_text" text DEFAULT '' NOT NULL,
	"is_skipped" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "answers_skip_exclusive_chk" CHECK ("answers"."is_skipped" = false or "answers"."answer_text" = '')
);
--> statement-breakpoint
CREATE TABLE "entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"entry_date" date NOT NULL,
	"title" text,
	"original_text" text DEFAULT '' NOT NULL,
	"final_text" text DEFAULT '' NOT NULL,
	"language" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"ai_generation_id" uuid,
	"word_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "entries_status_chk" CHECK ("entries"."status" in ('draft', 'complete')),
	CONSTRAINT "entries_empty_complete_chk" CHECK ("entries"."status" <> 'complete' or length(btrim("entries"."final_text")) > 0),
	CONSTRAINT "entries_length_chk" CHECK (length("entries"."final_text") <= 100000),
	CONSTRAINT "entries_word_count_chk" CHECK ("entries"."word_count" >= 0),
	CONSTRAINT "entries_title_length_chk" CHECK ("entries"."title" is null or length("entries"."title") <= 200)
);
--> statement-breakpoint
CREATE TABLE "moods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"entry_id" uuid,
	"record_date" date NOT NULL,
	"mood" text NOT NULL,
	"intensity" smallint,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "moods_value_chk" CHECK ("moods"."mood" in ('happy','excited','peaceful','motivated','normal','tired','stressed','sad','frustrated','anxious')),
	CONSTRAINT "moods_intensity_chk" CHECK ("moods"."intensity" is null or ("moods"."intensity" >= 1 and "moods"."intensity" <= 5)),
	CONSTRAINT "moods_note_length_chk" CHECK ("moods"."note" is null or length("moods"."note") <= 500)
);
--> statement-breakpoint
CREATE TABLE "preferences" (
	"user_id" text PRIMARY KEY NOT NULL,
	"default_language" text DEFAULT 'en' NOT NULL,
	"ai_output_language" text DEFAULT 'match' NOT NULL,
	"week_starts_on" smallint DEFAULT 1 NOT NULL,
	"theme_accent" text DEFAULT 'default' NOT NULL,
	"autosave_enabled" boolean DEFAULT true NOT NULL,
	"reduced_motion" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "preferences_week_start_chk" CHECK ("preferences"."week_starts_on" in (0, 1))
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"user_id" text PRIMARY KEY NOT NULL,
	"display_name" text NOT NULL,
	"avatar_url" text,
	"bio" text,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_bio_length_chk" CHECK ("profiles"."bio" is null or length("profiles"."bio") <= 500)
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text,
	"prompt" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "questions_prompt_length_chk" CHECK (length("questions"."prompt") <= 500),
	CONSTRAINT "questions_system_owner_chk" CHECK (("questions"."is_system" = true and "questions"."user_id" is null) or ("questions"."is_system" = false and "questions"."user_id" is not null))
);
--> statement-breakpoint
CREATE TABLE "reminders" (
	"user_id" text PRIMARY KEY NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"time_local" time DEFAULT '21:00' NOT NULL,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"channel" text DEFAULT 'browser' NOT NULL,
	"consent_at" timestamp with time zone,
	"last_sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reminders_channel_chk" CHECK ("reminders"."channel" in ('browser', 'in_app')),
	CONSTRAINT "reminders_consent_chk" CHECK ("reminders"."enabled" = false or "reminders"."consent_at" is not null)
);
--> statement-breakpoint
CREATE TABLE "transcriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"entry_id" uuid,
	"text" text NOT NULL,
	"language" text,
	"provider" text DEFAULT 'browser' NOT NULL,
	"duration_ms" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "transcriptions_provider_chk" CHECK ("transcriptions"."provider" in ('browser', 'server'))
);
--> statement-breakpoint
CREATE TABLE "attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"entry_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"storage_key" text NOT NULL,
	"mime" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"caption" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "attachments_kind_chk" CHECK ("attachments"."kind" in ('image', 'document', 'audio')),
	CONSTRAINT "attachments_size_chk" CHECK ("attachments"."size_bytes" > 0)
);
--> statement-breakpoint
CREATE TABLE "journal_chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chat_id" uuid NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"cited_entry_ids" uuid[],
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chat_messages_role_chk" CHECK ("journal_chat_messages"."role" in ('user', 'assistant'))
);
--> statement-breakpoint
CREATE TABLE "journal_chats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"title" text DEFAULT 'New conversation' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reflections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"insights_json" jsonb NOT NULL,
	"model" text NOT NULL,
	"prompt_version" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reflections_period_chk" CHECK ("reflections"."period_start" <= "reflections"."period_end")
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_generations" ADD CONSTRAINT "ai_generations_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_generations" ADD CONSTRAINT "ai_generations_entry_id_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "answers" ADD CONSTRAINT "answers_entry_id_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "answers" ADD CONSTRAINT "answers_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entries" ADD CONSTRAINT "entries_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moods" ADD CONSTRAINT "moods_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moods" ADD CONSTRAINT "moods_entry_id_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "preferences" ADD CONSTRAINT "preferences_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transcriptions" ADD CONSTRAINT "transcriptions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transcriptions" ADD CONSTRAINT "transcriptions_entry_id_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."entries"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_entry_id_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_chat_messages" ADD CONSTRAINT "journal_chat_messages_chat_id_journal_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."journal_chats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_chats" ADD CONSTRAINT "journal_chats_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reflections" ADD CONSTRAINT "reflections_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "idx_ai_gen_user_entry" ON "ai_generations" USING btree ("user_id","entry_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "answers_entry_question_unique" ON "answers" USING btree ("entry_id","question_id");--> statement-breakpoint
CREATE INDEX "idx_answers_entry" ON "answers" USING btree ("entry_id");--> statement-breakpoint
CREATE INDEX "idx_entries_user_date" ON "entries" USING btree ("user_id","entry_date" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_entries_user_active" ON "entries" USING btree ("user_id","deleted_at");--> statement-breakpoint
CREATE INDEX "idx_entries_ai_gen" ON "entries" USING btree ("ai_generation_id");--> statement-breakpoint
CREATE INDEX "idx_entries_search" ON "entries" USING gin (to_tsvector('simple', coalesce("title", '') || ' ' || "final_text"));--> statement-breakpoint
CREATE UNIQUE INDEX "moods_entry_unique" ON "moods" USING btree ("entry_id");--> statement-breakpoint
CREATE INDEX "idx_moods_user_date" ON "moods" USING btree ("user_id","record_date");--> statement-breakpoint
CREATE INDEX "idx_moods_value" ON "moods" USING btree ("user_id","mood");--> statement-breakpoint
CREATE INDEX "idx_questions_owner" ON "questions" USING btree ("user_id","sort_order");--> statement-breakpoint
CREATE INDEX "idx_transcriptions_user" ON "transcriptions" USING btree ("user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_attachments_entry" ON "attachments" USING btree ("entry_id");--> statement-breakpoint
CREATE INDEX "idx_attachments_user" ON "attachments" USING btree ("user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_chat_messages_chat" ON "journal_chat_messages" USING btree ("chat_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_journal_chats_user" ON "journal_chats" USING btree ("user_id","updated_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_reflections_user" ON "reflections" USING btree ("user_id","created_at" DESC NULLS LAST);