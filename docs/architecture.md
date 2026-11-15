# Architecture

```
Browser (React SPA, PWA) ── supabase-js ──► Supabase
  TanStack Router                            ├─ Auth (magic link, Google, Apple)
  TanStack Query cache  ◄── Realtime ─────── ├─ Postgres + RLS + RPCs
  i18next, Tailwind                          └─ Realtime (chapter_reads)
Hosted on Vercel (static)
```

The app has no custom server. Every authorization decision lives in Postgres, through Row-Level Security policies and `SECURITY DEFINER` functions, and pgTAP tests cover them (`supabase/tests`).

## Data model

| Table                     | Purpose                                                                                                |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `bible_books`             | Reference data: 66 books with their codes and chapter counts. Used to validate reads.                  |
| `profiles`                | Display name, locale, Bible.com version and theme. Created automatically on sign-up.                   |
| `reading_records`         | A set of chapter reads. Owned by **either** a user (their personal record) **or** a shared-mode group. |
| `chapter_reads`           | One row per (record, book, chapter), plus who read it and when.                                        |
| `reading_events`          | An append-only log of read and unread actions, used for streaks, the heatmap and activity feeds.       |
| `plan_enrollments`        | A reading plan attached to a record: books, number of days and start date.                             |
| `groups`, `group_members` | A group with a mode (`shared` or `individual`), an invite code, and owner and member roles.            |
| `record_shares`           | Read-only grants on a record, either to a specific user (by email) or as a public token.               |

Plan schedules are not stored. `src/domain/plans.ts` computes them from the plan's books and number of days, so plan logic can change without data migrations.

## Access rules

Each rule is enforced in the database:

- `can_write_record`: the record is your personal record, or it belongs to a shared group you are a member of.
- `can_read_record`: you can write to it, or it is shared with you, or it is the personal record of someone who shares an _individual-mode_ group with you.
- Inserts into `chapter_reads` may only set `(record_id, book_code, chapter)`. A trigger sets `read_by` and `read_at` and validates the chapter against `bible_books`.
- Public share links are served only by `get_public_record(token)`, which is the only function granted to the `anon` role.
- Group invite codes are visible only to members. Joining goes through `group_preview` and `join_group`.

## Client patterns

- **Queries**: `record_reads(record)` returns the record's reads as compact JSON, which avoids the PostgREST row limit. The client turns it into a `Map<"GEN.1", ReadEntry>`.
- **Mutations**: optimistic updates with rollback. Bulk "mark book" actions use one upsert or delete.
- **Realtime**: changes to `chapter_reads` are applied to the cache, so shared-group members see each other's marks live.
- **Code splitting**: each route is lazy-loaded; the Today page and Login page are in the main bundle.
- **Legacy import**: `src/domain/legacy.ts` reads the original app's localStorage keys (`"<Book>_<n>"`), including its misspelled book names, and the `import_chapters` RPC imports them without logging events.
