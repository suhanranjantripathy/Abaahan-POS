-- Incremental migration for portal tokens, reminders, email logs, and report PDFs.
-- Use this when the base Abahaan schema already exists.

alter table public.users
add column if not exists email text;

create table if not exists public.portal_tokens (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete cascade,
  job_id uuid references public.jobs(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete cascade,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  job_id uuid references public.jobs(id) on delete set null,
  type text not null default 'follow_up',
  source text,
  title text not null,
  notes text,
  due_at timestamptz not null,
  assigned_to uuid references public.users(id) on delete set null,
  status text not null default 'open',
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.email_logs (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid references public.shops(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  job_id uuid references public.jobs(id) on delete set null,
  recipient text not null,
  sender text not null default 'testtrailattempt@gmail.com',
  subject text not null,
  status text not null default 'queued',
  provider text,
  provider_message_id text,
  error text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.portal_tokens enable row level security;
alter table public.reminders enable row level security;
alter table public.email_logs enable row level security;

DO $$
DECLARE
  table_name text;
BEGIN
  FOR table_name IN SELECT unnest(ARRAY['portal_tokens', 'reminders', 'email_logs']) LOOP
    EXECUTE format('
      drop policy if exists "Tenant Select %1$s" on public.%1$s;
      drop policy if exists "Tenant Insert %1$s" on public.%1$s;
      drop policy if exists "Tenant Update %1$s" on public.%1$s;
      drop policy if exists "Tenant Delete %1$s" on public.%1$s;
      create policy "Tenant Select %1$s" on public.%1$s for select using (shop_id = public.get_current_shop_id());
      create policy "Tenant Insert %1$s" on public.%1$s for insert with check (shop_id = public.get_current_shop_id());
      create policy "Tenant Update %1$s" on public.%1$s for update using (shop_id = public.get_current_shop_id());
      create policy "Tenant Delete %1$s" on public.%1$s for delete using (shop_id = public.get_current_shop_id());
    ', table_name);
  END LOOP;
END $$;

-- Public report PDF bucket. If you want private PDFs later, switch the app/function to signed URLs.
insert into storage.buckets (id, name, public)
values ('reports', 'reports', true)
on conflict (id) do update set public = excluded.public;
