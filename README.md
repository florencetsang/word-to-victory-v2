# Word to Victory

Track your Bible reading chapter by chapter, alone or together. This is a ground-up rewrite of the original [Word to Victory / Bible Track](https://github.com/florencetsang/word-to-victory) app. It keeps the 66-book chapter tracker and the Bible.com links, and adds:

- **Accounts and cloud sync**: sign in with an email magic link, Google or Apple.
- **Today dashboard**: continue where you left off, your streak, and today's plan reading.
- **Reading plans**: Bible in a year, NT in 90 days, Gospels in 30 days, Wisdom in 60 days, or custom plans.
- **Stats**: overall and per-testament progress, current and longest streaks, an activity heatmap, and per-book bars.
- **Groups** (invite link or code):
  - _Shared_ groups mark one collective record.
  - _Individual_ groups show each member's own record side by side.
- **Sharing**: read-only access for specific people (by email) or a revocable public link.
- **Legacy import**: progress saved by the old app in this browser can be imported in one click.
- English and Traditional Chinese, a per-user Bible.com version, light and dark themes, installable PWA, and realtime updates.

## Stack

| Layer    | Choice                                                                            |
| -------- | --------------------------------------------------------------------------------- |
| Frontend | Vite, React 19, TypeScript, Tailwind CSS v4, Radix primitives (shadcn-style)      |
| Data     | TanStack Query (optimistic mutations) and TanStack Router                         |
| Backend  | Supabase: Postgres, Auth, Row-Level Security, RPC functions, Realtime             |
| Hosting  | Vercel (static SPA) and Supabase Cloud                                            |
| Mobile   | Capacitor (iOS and Android apps built from the same code), Codemagic cloud builds |
| Quality  | Vitest, pgTAP (database), Playwright (e2e, desktop and mobile), oxlint, Prettier  |

See [docs/architecture.md](docs/architecture.md) for the data model and security design. To publish the iOS and Android apps, follow [docs/mobile-launch.md](docs/mobile-launch.md).

## Local development

Prerequisites: Node 22.12+ and Docker.

```bash
npm install
npm run db:start             # local Supabase (Postgres, Auth, Realtime, Mailpit)
cp .env.example .env.local   # then paste the API URL and publishable key printed by db:start
npm run dev                  # http://localhost:5173
```

Magic-link emails are captured by Mailpit at http://127.0.0.1:54324.

### Scripts

| Script                                  | Purpose                                                               |
| --------------------------------------- | --------------------------------------------------------------------- |
| `npm run dev` / `build` / `preview`     | Vite dev server, production build, and a preview of the build         |
| `npm test`                              | Unit tests (domain logic and translation coverage)                    |
| `npm run e2e`                           | Playwright tests (needs `db:start`; starts the dev server)            |
| `npm run db:test`                       | pgTAP tests for the schema, RLS and RPCs                              |
| `npm run db:reset`                      | Re-apply migrations to the local database                             |
| `npm run db:types`                      | Regenerate `src/lib/database.types.ts`                                |
| `npm run typecheck` / `lint` / `format` | Static checks                                                         |
| `npm run pwa-assets`                    | Regenerate the PWA icons from `public/favicon.svg`                    |
| `npm run cap:sync`                      | Build the web app and copy it into the `ios/` and `android/` projects |
| `npm run cap:android`                   | `cap:sync`, then open Android Studio (emulator)                       |
| `npm run cap:assets`                    | Regenerate native app icons and splash screens from `assets/`         |

## Deployment

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Apply the migrations:
   ```bash
   npx supabase link --project-ref <project-id>
   npx supabase db push
   ```
3. In **Authentication → URL Configuration**, set the Site URL to your Vercel domain and add `https://<domain>/**` to the redirect URLs.
4. Optional OAuth providers (**Authentication → Providers**):
   - **Google**: create an OAuth client in Google Cloud and use the Supabase callback URL `https://<project>.supabase.co/auth/v1/callback`.
   - **Apple**: create a Services ID and key in the Apple Developer portal, using the same callback URL.
   - The buttons only appear when the provider is listed in `VITE_AUTH_PROVIDERS` (see Vercel below).
5. In **Authentication → Email Templates**, paste `supabase/templates/magic_link.html` into **Magic Link** and `supabase/templates/confirmation.html` into **Confirm signup**. These include the 6-digit code (`{{ .Token }}`), so people can still sign in when the link opens in another browser or in an email app's built-in viewer.
6. For automated migrations, add the repository secrets `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD` and `SUPABASE_PROJECT_ID`. The **Deploy database** workflow then runs `supabase db push` whenever migrations change on `main`.

### 2. Vercel

Import the repository into Vercel; `vercel.json` already configures the Vite build, SPA rewrites and caching. Set these environment variables:

| Variable                        | Example                                                      |
| ------------------------------- | ------------------------------------------------------------ |
| `VITE_SUPABASE_URL`             | `https://<project>.supabase.co`                              |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | The publishable (anon) key from **Project Settings → API**   |
| `VITE_AUTH_PROVIDERS`           | `google,apple` (comma-separated; leave empty for email only) |

These values are compiled in at build time, so redeploy after changing them.

### 3. iOS and Android apps

See [docs/mobile-launch.md](docs/mobile-launch.md) for the step-by-step guide: domain, developer accounts, native sign-in, Codemagic cloud builds, TestFlight and Google Play testing, store listings and review.

## Project layout

```
src/
  app/          router, layout and theme
  components/   UI primitives and shared components
  domain/       pure, tested logic: books, plans, streaks, dates, legacy import
  features/     auth, tracker, today, stats, plans, groups, sharing, settings
  lib/          Supabase client, i18n, generated DB types, native-app helpers
  locales/      en and zh-Hant translations
supabase/
  migrations/   schema, RLS policies and RPCs
  tests/        pgTAP tests
e2e/            Playwright tests (magic-link login through Mailpit)
ios/, android/  Capacitor native projects (see docs/mobile-launch.md)
assets/         Source images for the native icons and splash screens
scripts/        configure-mobile.mjs writes production values into the native projects
```
