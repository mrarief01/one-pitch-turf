# AGENTS.md

Turf booking site: Next.js 15 (App Router) + React 19 + TypeScript (strict), Supabase Postgres, Razorpay (UPI), Resend (email), WhatsApp Cloud API. npm. No test suite, no CI, no README.

## Commands
- `npm run dev` / `npm run build` / `npm start`
- `npm run lint` is `next lint` and is **broken** (eslint is not installed and there is no config) — do not rely on it. Typecheck instead: `npx tsc --noEmit`.
- No tests exist; don't invent a test framework.

## Architecture / booking flow
- UI (`BookingModal.tsx`) → `POST /api/razorpay/create-order` (re-checks availability, holds slots via RPC, creates Razorpay order) → Razorpay checkout → `POST /api/razorpay/verify-payment` (server-side HMAC signature check, confirms booking via RPC, fires WhatsApp notifications). `holdToken` ties the whole flow together.
- `POST /api/bookings` with `action: "confirm"` is a separate no-payment path; both confirm paths and `api/whatsapp/notify` also call the "Dual WhatsApp Engine".
- The browser never queries the `bookings` table. All DB access is through security-definer RPCs in `supabase/migrations/20260905_create_bookings.sql`: `hold_booking`, `attach_booking_order`, `confirm_booking`, `active_booking_slots`. The table has RLS enabled. The migration must be applied to the Supabase project (SQL editor or `supabase db push`) — without it the availability API returns 503 with "apply the bookings migration".
- Hold semantics: `hold_booking` holds slots 5 minutes (`held_until`), serializes per date via `pg_advisory_xact_lock`, and full turf court `F` conflicts with both `C1` and `C2`.
- Fixed turf config (courts, prices ₹200/C1·C2, ₹500/F per hour, and the 20 hourly slots `slot-05-06` … `slot-23-24`, `slot-00-01`) lives only in `src/lib/bookingStore.ts`. Change prices/slots there, and keep in sync with the SQL `court_id` check (`C1|C2|F`) and RPC slot validation.
- Path alias `@/*` → `./src/*`. `next.config.js` has `images.unoptimized: true` (all images are static files under `public/images/`).

## Env & secrets
- Copy `.env.example` → `.env.local`. Use the Supabase **anon/publishable** key as `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — never a service_role key. Razorpay needs `NEXT_PUBLIC_RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` (server-side only).
- There are **two WhatsApp implementations with different env var names** and the `.env.example` only documents the old one:
  - `src/lib/whatsapp.ts` (`sendBookingWhatsAppNotifications`, called from `bookingService.confirmHeldBooking`) — reads `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_TEMPLATE_CUSTOMER`, `WHATSAPP_TEMPLATE_OWNER`, `WHATSAPP_TEMPLATE_LANG`.
  - `src/lib/whatsappService.ts` (`sendDualWhatsAppNotifications`, called from the API routes) — reads `WHATSAPP_CLOUD_ACCESS_TOKEN` + `WHATSAPP_CLOUD_PHONE_NUMBER_ID` (+ `WHATSAPP_CUSTOMER_TEMPLATE_NAME`/`WHATSAPP_OWNER_TEMPLATE_NAME`), falling back to `WHATSAPP_GATEWAY_URL`/`WHATSAPP_GATEWAY_TOKEN`; `OWNER_WHATSAPP_NUMBER` defaults to hardcoded `9952323211`. A confirmed booking currently triggers **both** senders.
- All notification senders are intentionally never-throwing: a broken email/WhatsApp config must never fail or delay a paid booking (see `Promise.allSettled` in `bookingService.ts:216`, `email.ts`, `whatsapp.ts`, `whatsappService.ts`). Preserve this invariant.
- Customer phones are validated as Indian 10-digit (starting 6–9) numbers via `src/lib/phoneValidation.ts`; WhatsApp numbers are normalized to E.164 digits (`91…`).