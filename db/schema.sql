-- Athiya's Hyderabad Biryani — Supabase schema (free tier is plenty).
-- Run this in the Supabase SQL editor, then paste URL + anon key into js/config.js.

create table if not exists public.menu_items (
  id          text primary key,
  category    text not null,
  name        text not null,
  price       integer not null check (price >= 0),
  in_stock    boolean not null default true,
  special     boolean not null default false,
  family      boolean not null default false,
  sort_order  integer not null default 0
);

create table if not exists public.orders (
  id            text primary key,
  token         text not null,
  customer_name text not null,
  phone         text not null,
  address       text not null,
  pincode       text not null,
  items         jsonb not null default '[]'::jsonb,
  net_amount    numeric not null default 0,
  status        text not null default 'pending'
                check (status in ('pending','accepted','dispatched','paid','cancelled')),
  payment       text not null default 'pod',
  created_at    timestamptz not null default now()
);

create index if not exists orders_created_idx on public.orders (created_at desc);
create index if not exists orders_status_idx on public.orders (status);

-- Single-row settings bag.
create table if not exists public.settings (  
  id       text primary key,
  pincodes jsonb not null default '["522034"]'::jsonb,
  open     boolean not null default true
);
insert into public.settings (id, pincodes, open) values ('app', '["522034"]'::jsonb, true)
on conflict (id) do nothing;

-- Realtime: new-order chits must reach the dashboard the instant they land.
-- Idempotent: skip if already a member.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'orders'
  ) then
    alter publication supabase_realtime add table public.orders;
  end if;
end
$$;

-- ── Row-level security ─────────────────────────────────────────────────────
-- v1 keeps this pragmatic: the customer site (anon) inserts orders and reads
-- the menu; the dashboard (anon, PIN-gated in the browser) reads/updates.
-- TODO(harden): move admin to Supabase Auth and restrict orders SELECT/UPDATE
-- to the owner role so customer phone/address are not readable by anonymous
-- clients at the database level.

alter table public.menu_items enable row level security;
alter table public.orders    enable row level security;
alter table public.settings  enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'menu_all') then
    execute 'create policy menu_all on public.menu_items for all to anon using (true) with check (true)';
  end if;
  if not exists (select 1 from pg_policies where policyname = 'orders_insert') then
    execute 'create policy orders_insert on public.orders for insert to anon with check (true)';
  end if;
  if not exists (select 1 from pg_policies where policyname = 'orders_select') then
    execute 'create policy orders_select on public.orders for select to anon using (true)';
  end if;
  if not exists (select 1 from pg_policies where policyname = 'orders_update') then
    execute 'create policy orders_update on public.orders for update to anon using (true)';
  end if;
  if not exists (select 1 from pg_policies where policyname = 'settings_all') then
    execute 'create policy settings_all on public.settings for all to anon using (true) with check (true)';
  end if;
end
$$;
