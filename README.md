# Abahaan POS

Abahaan POS is a workshop management and point-of-sale application for premium automotive service centers. It covers customer discovery, KYC, vehicle inspection, service recommendations, estimate consent, floor execution, billing, reporting, reminders, loyalty, and customer follow-up workflows.

The app is built as a React/Vite frontend with local browser storage by default and optional Supabase-backed data, Edge Functions, email, portal links, report PDF generation, and storage.

## Features

- **Role-based workflows:** Store Manager, POS Executive, and Technician views with different dashboard and action access.
- **Customer KYC and lookup:** Register customers, attach vehicles, search by mobile number, and track last visits.
- **Inspection flow:** Capture tyre, battery, odometer, visual condition, and run-rate details.
- **Smart recommendations:** Generate service suggestions from inspection values such as tread depth, pressure, battery health, and vehicle condition.
- **Estimate and consent:** Build itemized estimates and dispatch approved jobs to the workshop floor.
- **Job floor tracker:** Move jobs through Pending, In Progress, and Completed states.
- **Billing and invoicing:** Collect Cash, UPI, Card, and NetBanking payments and generate invoices after job completion.
- **Reports and follow-up:** Save digital reports, share via WhatsApp/email flows, manage reminders, review feedback, and track lost opportunities.
- **Loyalty and analytics:** Configure loyalty rules and review revenue, reminders, repeat customers, and operational metrics.
- **Supabase-ready backend:** Includes schema, repository modules, Edge Functions, portal token support, email logs, reminders, and report PDF storage.

## Tech Stack

- **Frontend:** React 19, Vite 5
- **Styling:** Tailwind CSS
- **Routing:** React Router DOM 7
- **State:** React Context API
- **Charts:** Recharts
- **Icons:** Lucide React
- **Animations:** Framer Motion
- **Backend options:** Local browser storage by default, Supabase when configured
- **Payments:** Razorpay Standard Checkout SDK

## Getting Started

### Prerequisites

- Node.js
- npm

### Install

```bash
npm install
```

### Configure Environment

Create a local env file from the example:

```bash
cp .env.example .env
```

For local-only development, keep:

```bash
VITE_DATA_BACKEND=local
```

For Supabase-backed development, configure:

```bash
VITE_DATA_BACKEND=supabase
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Optional production/service settings:

```bash
VITE_RAZORPAY_KEY=your-razorpay-key
VITE_GOOGLE_REVIEW_URL=https://your-review-link
VITE_EMPLOYEE_AUTH_URL=https://your-auth-endpoint
VITE_EMAIL_FROM=your-sender@example.com
```

Supabase Edge Function secrets are not exposed to Vite. Configure them in Supabase:

```bash
EMAIL_PROVIDER=resend|postmark
EMAIL_FROM=your-sender@example.com
RESEND_API_KEY=your-resend-key
POSTMARK_SERVER_TOKEN=your-postmark-token
PORTAL_TOKEN_SECRET=long-random-secret
APP_ORIGIN=https://your-app-origin
```

### Run

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Lint

```bash
npm run lint
```

## Supabase Setup

The Supabase assets live in `supabase/`.

- Run `supabase/schema.sql` for a new project.
- Run `supabase/new_features_migration.sql` when applying only portal tokens, reminders, email logs, and report PDF storage to an existing base schema.
- Deploy the Edge Functions in `supabase/functions/`:
  - `send-email`
  - `create-employee`
  - `create-portal-link`
  - `resolve-portal-token`
  - `generate-report-pdf`

  ```bash
  npx supabase login
  npx supabase functions deploy create-employee --project-ref gnbbfccueimtuchtmwzk
  ```

  If deploy still says `Access token not provided`, generate a personal access token in Supabase Dashboard > Account > Access Tokens and run:

  ```bash
  SUPABASE_ACCESS_TOKEN=your-token npx supabase functions deploy create-employee --project-ref gnbbfccueimtuchtmwzk
  ```

  Or use the project script:

  ```bash
  npm run supabase:deploy:create-employee
  ```

The schema enables RLS and tenant policies around each shop. Make sure authenticated users have a matching profile row in `public.users` with a valid `shop_id`.

If Add Employee reports that the `email` column of `users` is missing from the schema cache, run `supabase/fix_users_email_column.sql` in the Supabase SQL Editor, then redeploy `create-employee`.

## Application Flow

1. Login as a Store Manager, POS Executive, or Technician.
2. Search or register a customer and attach vehicle details.
3. Create or start an inspection request.
4. Record diagnostic tyre, battery, and usage data.
5. Review generated recommendations and build an estimate.
6. Capture customer consent and dispatch the job to the workshop floor.
7. Technician moves the job through the floor tracker and marks it completed.
8. Billing unlocks after completion, payment is collected, and invoice/report flows become available.
9. Follow-up reminders, feedback, loyalty, and lost-opportunity tracking support post-service operations.

## Production Notes

- Razorpay Checkout is integrated on the frontend, but server-side payment signature verification is still required before trusting successful payments in production.
- `VITE_DATA_BACKEND=api` has a fetch wrapper scaffold, but custom API repositories are not fully implemented yet. Use `local` or `supabase` unless you add the API repository layer.
- Browser `mailto:` fallback cannot force the sender address. Use the Supabase `send-email` function with a configured provider for production email.
- Supabase report PDFs use the public `reports` bucket from the migration. Switch to signed URLs if reports must be private.
- Vite may warn about large production chunks. The app builds successfully, but route-level/manual chunk optimization can improve initial load performance.

## Useful Files

- `src/context/AppProvider.jsx` - central app state, workflow actions, and local persistence.
- `src/config/appConfig.js` - environment-backed app constants and default service catalog.
- `src/services/` - Supabase/API/client-side service boundaries.
- `src/pages/` - route-level app screens.
- `supabase/schema.sql` - full Supabase schema and RLS setup.
- `BACKEND_MIGRATION.md` - backend migration notes and remaining backend direction.
