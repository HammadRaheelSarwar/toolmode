# ToolModeOn

ToolModeOn is a Next.js App Router application for 25 browser and AI tools, account dashboards, team workspaces, subscription entitlements, a content system, and platform administration.

## Local development

Use Node.js 20 LTS, then install and run the app:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Copy `.env.example` to `.env.local` and configure the integrations you need. Restart Next.js after changing environment variables. The service role key, Paddle API key, webhook secret, and AI provider key are server-only secrets; never add them to a `NEXT_PUBLIC_` variable.

## Supabase setup

1. Create a Supabase project and set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` in the deployment environment.
2. Apply migrations in order: `supabase/migrations/202611070001_phase3_auth_dashboard.sql`, `supabase/migrations/202611080001_phases4_8.sql`, `supabase/migrations/202611080002_final_subscription_policy.sql`, and `supabase/migrations/202611120001_phase6_admin_dashboard.sql`. The Phase 6 migration adds canonical staff roles, private admin user search, dashboard and AI/storage metrics, support ownership and notes, deletion requests, and webhook retry metadata.
3. Configure the Supabase Auth site URL and redirect allowlist for local and production `/auth/callback` URLs. Enable email verification. Configure SMTP/Auth templates for verification, recovery, and invitations. Enable Google only after its Supabase provider is configured and `NEXT_PUBLIC_SUPABASE_GOOGLE_ENABLED=true` is set.
4. Create the first administrator deliberately after the account has been created and verified. In the Supabase SQL editor, replace the email below with the exact administrator address:

   ```sql
   insert into public.admin_users (user_id, role)
   select id, 'super_admin' from auth.users where lower(email) = lower('admin@example.com')
   on conflict (user_id) do update set role = excluded.role;
   ```

   Do not expose an administrator bootstrap route or seed a public/default administrator account. Only a super admin can manage staff roles. Use `admin`, `support_manager`, or `content_manager` for other staff.

The app uses Supabase RLS for account data. Server routes that need privileged work validate the signed-in user and then use the server-only service role key. The migration must be installed before using plan enforcement, distributed rate limits, admin metrics, team analytics, or billing.

Vercel schedules `/api/cron/maintenance` daily at 03:00 UTC using `vercel.json`. Set a strong `CRON_SECRET` in Vercel and in local environments that invoke the route manually. The route fails closed when the secret or server-side Supabase service-role configuration is missing. Vercel Cron runs on production deployments; verify the invocation and its cleanup results after deployment.

## Plans, limits, and Paddle

Free, Pro, and Business plan prices and entitlements are stored in `plan_entitlements`. Administrators can update plan copy, prices, feature limits, and Paddle price IDs from `/admin/plans`. The default prices and limits in the migration are examples; confirm the actual offer and local currency before publishing.

### Sandbox

1. Create Paddle sandbox products and recurring prices for each paid monthly/yearly option.
2. Set `PADDLE_ENVIRONMENT=sandbox`, `PADDLE_API_KEY`, `PADDLE_CLIENT_TOKEN`, and `PADDLE_WEBHOOK_SECRET` to sandbox credentials. Configure the four `PADDLE_PRO_*_PRICE_ID` and `PADDLE_BUSINESS_*_PRICE_ID` variables, or store those price IDs in the plan table.
3. Register `https://your-domain.example/api/webhooks/paddle` as a sandbox webhook. Subscribe to transaction completion, payment failure/past-due/cancelation, subscription lifecycle, and adjustment created/updated events. Use Paddle's notification destination secret for signature verification.
4. Sign in with a verified test account and exercise checkout, renewal/status changes, a failed payment, cancellation, and a refund in Paddle sandbox. The app activates paid access only from signature-verified webhooks; returning from checkout by itself does not grant a plan.

### Live billing gate

Live billing requires all of the following: Paddle accepts and approves the seller account, payout details and required verification are complete, live products/prices and webhook destination are configured, and the deployment explicitly sets `PADDLE_ENVIRONMENT=live`, `PADDLE_LIVE_ENABLED=true`, and `PADDLE_SELLER_APPROVED=true`. Keep the last two values false until the account owner has independently confirmed approval. The application cannot complete seller verification or confirm country-specific payout eligibility for you.

`PADDLE_API_KEY`, `PADDLE_CLIENT_TOKEN`, and webhook secrets must be from the same environment as the configured price IDs. The subscription portal is generated server-side for the signed-in customer. Refunds and plan changes must be reflected by Paddle webhook events; never edit subscriptions directly to simulate a successful payment.

## AI, file storage, and account data

AI tools use `AI_PROVIDER_API_URL`, `AI_PROVIDER_API_KEY`, and `AI_PROVIDER_MODEL` on the server. Configure a provider-compatible chat completions endpoint; without these values AI requests return a setup error. Account project outputs currently use the Supabase Storage bucket and short-lived signed downloads. Saved project files and featured images are capped at 4 MB to remain within Vercel Function request limits. The Cloudflare R2 variables are reserved for a future storage adapter and do not enable R2 by themselves; do not migrate live files to R2 until an adapter and cleanup path are implemented and tested.

Tool runs, AI requests, plan limits, team membership, account suspension, and shared workspace access are checked on the server/database. Guest users retain the existing free-tool flows. Distributed rate limiting depends on the Phase 4â€“8 SQL RPC; the in-process fallback is for local development only and is not a production multi-instance limiter.

## Admin and content

Administrators manage accounts, plans, tool availability, AI provider configuration (without disclosing secrets), blog drafts and publishing, support requests, ads, affiliate links, and audit history at `/admin`. The production blog includes 20 starter articles in `lib/blog-content.ts`; database articles can be authored and published in the admin area. Search, category pages, metadata, canonical links, Article JSON-LD, sitemap, and robots rules are included.

Analytics scripts load only after the visitor opts in to analytics cookies. Google Analytics uses `NEXT_PUBLIC_GA_MEASUREMENT_ID`. AdSense stays disabled unless the publisher has approval and a valid `ADSENSE_PUBLISHER_ID`, the deployment explicitly sets `ADSENSE_APPROVED=true`, a matching enabled free-plan slot is configured in `/admin/settings`, and the visitor consents to advertising cookies. Paid plans are always excluded from ad delivery. `ads.txt` is emitted only after the same approval/configuration gate is met.

Affiliate redirects are configured in `/admin/settings`; only authorized, disclosed HTTPS destinations should be entered. Click counts are aggregated for 30 and 90 days. The public disclosure page is `/affiliate-disclosure`.

## Security and operational setup

- Keep Supabase service role, Paddle API, Paddle webhook, and AI keys in the host's secret manager. Never commit `.env.local`.
- Use HTTPS in production and set `NEXT_PUBLIC_SITE_URL` to the canonical origin. Configure SMTP, allowed auth redirects, webhook destinations, and provider credentials before enabling their UI flows.
- The middleware applies security headers and rejects cross-origin unsafe API requests (except the signed Paddle webhook). Preserve the same-origin app/API deployment pattern or update and review that check before introducing a separate API origin.
- Support and account pages link the privacy policy, terms, cookie policy, and affiliate disclosure. Have the site owner review the legal copy, retention periods, pricing, refund language, and processor disclosures for their jurisdiction before launch.
- Do not enable AdSense before publisher approval or live Paddle checkout before seller approval and end-to-end sandbox verification.

## Build and launch checklist

```bash
npm run build
npm start
```

Before production, apply all four migrations to the target Supabase project; verify RLS with two separate accounts; test email verification, recovery, dashboard access, favorites, history, personal and shared projects, team invitations/roles, plan limits, admin permissions, support, and account suspension; run the full Paddle sandbox lifecycle and confirm payment/refund ledger values; test consent and ads with production approval still disabled; and check mobile layouts. Set `CRON_SECRET` and verify the scheduled maintenance route after deployment. Account deletion requests are queued for operator review; completing a request still requires an authorized manual deletion procedure. Configure backups, SMTP delivery, monitoring, error reporting, and a rollback path at the host.

This repository can build without external credentials, but live integration tests require a configured Supabase project and Paddle sandbox account. Do not describe authentication/database/payment integrations as production-verified until the checks above have been run against those services.
