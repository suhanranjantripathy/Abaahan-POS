-- Run in Supabase SQL Editor if Add Employee reports:
-- "Could not find the 'email' column of 'users' in the schema cache"

alter table public.users
add column if not exists email text;

notify pgrst, 'reload schema';
