-- =============================================================================
-- AI Journal — database guarantees Drizzle cannot express in the schema file.
-- Applied after every `db:migrate` (idempotent). Never edit a generated
-- migration to add these: regenerate freely, this file always re-applies.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. updated_at maintenance (T1.3: assert by query, not by assumption)
-- -----------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  target text;
begin
  foreach target in array array[
    'profiles', 'entries', 'questions', 'answers', 'moods',
    'preferences', 'reminders', 'journal_chats'
  ]
  loop
    execute format('drop trigger if exists %I_set_updated_at on %I', target, target);
    execute format(
      'create trigger %I_set_updated_at before update on %I for each row execute function set_updated_at()',
      target, target
    );
  end loop;
end;
$$;

-- -----------------------------------------------------------------------------
-- 2. entries → ai_generations foreign key (kept out of the TS schema to avoid
--    a cyclic module dependency; behaviour is identical to DATABASE_SCHEMA §4)
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'entries_ai_generation_id_fk'
  ) then
    alter table entries
      add constraint entries_ai_generation_id_fk
      foreign key (ai_generation_id) references ai_generations(id)
      on delete set null;
  end if;
end;
$$;

-- -----------------------------------------------------------------------------
-- 3. original_text is write-once (three-record rule, invariant #6)
-- -----------------------------------------------------------------------------
create or replace function prevent_original_text_rewrite()
returns trigger
language plpgsql
as $$
begin
  if old.original_text <> '' and new.original_text is distinct from old.original_text then
    raise exception 'original_text is immutable after the first save'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists entries_original_text_immutable on entries;
create trigger entries_original_text_immutable
  before update of original_text on entries
  for each row execute function prevent_original_text_rewrite();

-- -----------------------------------------------------------------------------
-- 4. transcripts are write-once
-- -----------------------------------------------------------------------------
create or replace function prevent_transcript_rewrite()
returns trigger
language plpgsql
as $$
begin
  if new.text is distinct from old.text then
    raise exception 'transcriptions are immutable'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists transcriptions_text_immutable on transcriptions;
create trigger transcriptions_text_immutable
  before update of text on transcriptions
  for each row execute function prevent_transcript_rewrite();

-- -----------------------------------------------------------------------------
-- 5. AI generations are append-only: only the approval flags may change
-- -----------------------------------------------------------------------------
create or replace function prevent_generation_rewrite()
returns trigger
language plpgsql
as $$
begin
  if new.output_json is distinct from old.output_json
     or new.output_markdown is distinct from old.output_markdown
     or new.source_type is distinct from old.source_type
     or new.user_id is distinct from old.user_id then
    raise exception 'ai_generations are append-only'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists ai_generations_append_only on ai_generations;
create trigger ai_generations_append_only
  before update on ai_generations
  for each row execute function prevent_generation_rewrite();

-- -----------------------------------------------------------------------------
-- 6. Reminder consent: enabling requires recorded consent (defence in depth)
-- -----------------------------------------------------------------------------
create or replace function enforce_reminder_consent()
returns trigger
language plpgsql
as $$
begin
  if new.enabled and new.consent_at is null then
    raise exception 'reminder consent is required before enabling'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists reminders_consent_guard on reminders;
create trigger reminders_consent_guard
  before insert or update on reminders
  for each row execute function enforce_reminder_consent();
