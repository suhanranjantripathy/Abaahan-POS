# Backend Migration Notes

This project currently runs in `local` data mode, using browser storage for customers, inspection logs, saved reports, sessions, and loyalty rules.

## Environment

Copy `.env.example` to `.env` and configure:

```bash
VITE_DATA_BACKEND=local
VITE_API_BASE_URL=
VITE_API_TOKEN=
VITE_EMPLOYEE_AUTH_URL=
VITE_RAZORPAY_KEY=
```

When a custom backend API is ready, switch:

```bash
VITE_DATA_BACKEND=api
VITE_API_BASE_URL=https://your-api.example.com
VITE_API_TOKEN=your-public-or-session-token
```

When Supabase is ready, switch:

```bash
VITE_DATA_BACKEND=supabase
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Current Backend Boundary

- Shared app constants live in `src/config/appConfig.js`.
- `src/services/backendClient.js` provides a fetch wrapper for future API-backed repositories.
- `src/services/supabaseClient.js` provides a dependency-free Supabase REST wrapper.
- `AppProvider` still owns local state and localStorage persistence for now.

## Suggested API Resources

- `users`
- `customers`
- `vehicles`
- `inspection_logs`
- `jobs`
- `reports`
- `loyalty_rules`
- `loyalty_transactions`

## Next Step

Create repository modules per resource, for example `src/services/customerRepository.js`, with the same method names for local and API modes. Then replace direct `localStorage` reads/writes inside `AppProvider` with repository calls.
