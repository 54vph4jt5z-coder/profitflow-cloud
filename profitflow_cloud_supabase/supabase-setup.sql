-- ProfitFlow Cloud database setup
-- Paste this into Supabase > SQL Editor > New query > Run.

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  sku text,
  stock integer default 0,
  buy_price numeric default 0,
  sell_price numeric default 0,
  supplier text,
  created_at timestamptz default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  order_date date not null,
  product text,
  platform text,
  quantity integer default 1,
  sale_price numeric default 0,
  fees numeric default 0,
  shipping numeric default 0,
  created_at timestamptz default now()
);

create table if not exists costs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  cost_date date not null,
  website text,
  category text,
  description text,
  amount numeric default 0,
  created_at timestamptz default now()
);

alter table products enable row level security;
alter table orders enable row level security;
alter table costs enable row level security;

drop policy if exists "Users can manage own products" on products;
drop policy if exists "Users can manage own orders" on orders;
drop policy if exists "Users can manage own costs" on costs;

create policy "Users can manage own products"
on products for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can manage own orders"
on orders for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can manage own costs"
on costs for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);