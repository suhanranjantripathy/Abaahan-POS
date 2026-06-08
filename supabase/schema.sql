-- Abahaan POS Multi-Tenant Supabase Schema
-- Run this in Supabase SQL Editor to set up the database structure.

create extension if not exists "pgcrypto";

-- Shops (Tenants)
create table if not exists public.shops (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Users (Linked to Supabase Auth)
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  shop_id uuid not null references public.shops(id) on delete cascade,
  role text not null default 'POS Executive',
  name text not null,
  email text,
  mobile text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  name text not null,
  mobile text not null,
  city text,
  email text,
  dob date,
  consent boolean default true,
  loyalty integer not null default 0,
  next_reminder timestamptz,
  last_visit timestamptz default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(shop_id, mobile)
);

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  make text not null,
  model text not null,
  year text,
  fuel_type text,
  odometer text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.inspection_logs (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  status text not null default 'pending',
  requested_by text,
  requested_by_role text,
  technician_name text,
  requested_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  inspection_log_id uuid references public.inspection_logs(id) on delete set null,
  status text not null default 'Pending',
  items jsonb not null default '[]'::jsonb,
  snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  job_id uuid references public.jobs(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  report_number text unique,
  status text not null default 'Completed',
  items jsonb not null default '[]'::jsonb,
  snapshot jsonb not null default '{}'::jsonb,
  saved_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.loyalty_rules (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  purchase_points integer not null default 1,
  purchase_amount integer not null default 100,
  referral_bonus integer not null default 500,
  redemption_value integer not null default 1,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.loyalty_transactions (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete cascade,
  report_id uuid references public.reports(id) on delete set null,
  type text not null,
  points integer not null,
  notes text,
  created_at timestamptz not null default now()
);

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

-- Enable RLS on all tables
alter table public.shops enable row level security;
alter table public.users enable row level security;
alter table public.customers enable row level security;
alter table public.vehicles enable row level security;
alter table public.inspection_logs enable row level security;
alter table public.jobs enable row level security;
alter table public.reports enable row level security;
alter table public.loyalty_rules enable row level security;
alter table public.loyalty_transactions enable row level security;
alter table public.portal_tokens enable row level security;
alter table public.reminders enable row level security;
alter table public.email_logs enable row level security;

-- RLS Helper Function: Get the shop_id of the currently authenticated user
create or replace function public.get_current_shop_id()
returns uuid
language sql security definer
as $$
  select shop_id from public.users where id = auth.uid();
$$;

-- RLS Policies
-- 1. Shops: Users can only read their own shop details
drop policy if exists "Users can read their own shop" on public.shops;
create policy "Users can read their own shop" on public.shops
  for select using (id = public.get_current_shop_id());

-- Allow authenticated users to INSERT a new shop (used during registration before profile exists)
drop policy if exists "Authenticated users can create a shop" on public.shops;
create policy "Authenticated users can create a shop" on public.shops
  for insert with check (auth.role() = 'authenticated');

-- 2. Users: Users can see co-workers in the same shop
drop policy if exists "Users can read co-workers" on public.users;
create policy "Users can read co-workers" on public.users
  for select using (shop_id = public.get_current_shop_id());

-- Dynamic generation for tenant tables:
DO $$ 
DECLARE
  table_name text;
BEGIN
  FOR table_name IN SELECT unnest(ARRAY['customers', 'vehicles', 'inspection_logs', 'jobs', 'reports', 'loyalty_rules', 'loyalty_transactions', 'portal_tokens', 'reminders', 'email_logs']) LOOP
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
