# Supabase operations

## Client setup

The SPA creates one browser client in `src/lib/supabase.ts` with:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- persisted sessions and automatic token refresh

Feature API modules import that shared client. When `VITE_USE_MOCK=true`, they use the in-memory mock database instead. The anon key is intentionally a browser-safe key; authorization still depends on Supabase Row Level Security. Never use a `service_role` key in the SPA or this repository.

## Free-project activity check

`.github/workflows/keep-supabase-active.yml` queries the existing `profiles` table through PostgREST every Monday and Thursday. This is a real Postgres query, while RLS prevents an unauthenticated request from reading profile data. The workflow discards the response body and fails visibly if Supabase does not return a successful status.

Add these **Actions repository secrets** before enabling the workflow:

| Secret | Value |
| --- | --- |
| `SUPABASE_URL` | The project's API URL, also used as `VITE_SUPABASE_URL` in Vercel |
| `SUPABASE_ANON_KEY` | The project's anon/publishable API key, also used by the SPA |

Then open **Actions → Keep Supabase active → Run workflow** once. A successful manual run confirms the URL, key, table, and RLS behavior before relying on the schedule.

Do not use the `service_role` key for this request. The keep-alive only needs the same least-privileged key used by the browser.

## Operational caveats

- Supabase Free projects may be paused after a period of low database activity. This workflow reduces that risk but is not an availability guarantee; a paid Supabase plan is the supported option when uninterrupted service is required.
- GitHub can delay scheduled jobs during high load.
- GitHub disables scheduled workflows in a public repository after 60 days without repository activity. If that happens, re-enable the workflow from the Actions page or move the same HTTPS check to an external uptime/cron service.
- Keep normal Supabase pause-warning and workflow-failure notifications enabled.
