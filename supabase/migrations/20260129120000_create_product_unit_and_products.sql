-- ---------------------------------------------------------------------------
-- Migration: create_product_unit_and_products
-- Purpose: Introduce custom enum product_unit and products table for kitchen
--          inventory. Enables user-scoped CRUD with RLS and indexes for
--          common query patterns.
-- Affected: new type product_unit; new table public.products
-- Special:  RLS enabled; policies use auth.uid() only; FK to auth.users with
--           ON DELETE CASCADE. No meal_plans or shopping_list tables (app-only).
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- Step 1: Create custom enum product_unit
-- Metric-only units per PRD; avoids typos and enforces allowed values.
-- ---------------------------------------------------------------------------
create type public.product_unit as enum (
  'kg',
  'g',
  'ml',
  'L',
  'pieces'
);

comment on type public.product_unit is 'Allowed units for product quantity: kg, g, ml, L, pieces (metric-only).';

-- ---------------------------------------------------------------------------
-- Step 2: Create products table
-- One row per inventory item; duplicates (same name, user, expiration) allowed.
-- user_id references auth.users; deleting a user cascades to their products.
-- ---------------------------------------------------------------------------
create table public.products (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  quantity numeric(10, 3) not null,
  unit public.product_unit not null,
  expiration_date date not null,
  category text null,
  created_at timestamptz not null default now(),

  constraint products_pkey primary key (id),
  constraint products_user_id_fkey foreign key (user_id)
    references auth.users (id) on delete cascade,
  constraint products_name_length check (char_length(name) <= 200),
  constraint products_quantity_positive check (quantity > 0),
  constraint products_category_length check (
    category is null or char_length(category) <= 100
  )
);

comment on table public.products is 'Kitchen inventory items; one row per product entry per user.';
comment on column public.products.user_id is 'Owner; references auth.users. Deletes cascade.';
comment on column public.products.name is 'Product name; max 200 chars.';
comment on column public.products.quantity is 'Amount; positive, up to 3 decimal places.';
comment on column public.products.unit is 'Unit of measure (product_unit enum).';
comment on column public.products.expiration_date is 'Expiration date; past dates allowed.';
comment on column public.products.category is 'Optional category; max 100 chars. Free text, no category table.';
comment on column public.products.created_at is 'Insert time only; no updated_at in MVP.';

-- ---------------------------------------------------------------------------
-- Step 3: Create indexes
-- B-tree only; supports user-scoped lists, expiration and category filters.
-- products_pkey is created by the primary key constraint above.
-- ---------------------------------------------------------------------------

-- User-scoped queries and FK lookups; recommended for RLS and list views.
create index products_user_id_idx on public.products (user_id);

-- Filter and sort by expiration (e.g. "expiring soon" in app).
create index products_expiration_date_idx on public.products (expiration_date);

-- Search and sort by product name.
create index products_name_idx on public.products (name);

-- User + expiration (e.g. "my products expiring soon").
create index products_user_id_expiration_date_idx on public.products (user_id, expiration_date);

-- Category filter and shopping-list grouping per user.
create index products_user_id_category_idx on public.products (user_id, category);

-- ---------------------------------------------------------------------------
-- Step 4: Enable Row Level Security (RLS)
-- Required even for user-private data; policies enforce auth.uid() = user_id.
-- ---------------------------------------------------------------------------
alter table public.products enable row level security;

-- ---------------------------------------------------------------------------
-- Step 5: RLS policies — SELECT
-- Users may only read rows where user_id equals their authenticated id.
-- ---------------------------------------------------------------------------

-- Anonymous users: no matching rows (auth.uid() is null); explicit policy for clarity.
create policy products_select_anon
  on public.products
  for select
  to anon
  using (auth.uid() = user_id);

comment on policy products_select_anon on public.products is
  'Anon: no rows visible (auth.uid() is null). Keeps policy set complete.';

-- Authenticated users: may select only their own products.
create policy products_select_authenticated
  on public.products
  for select
  to authenticated
  using (auth.uid() = user_id);

comment on policy products_select_authenticated on public.products is
  'Authenticated: view only rows where user_id = auth.uid().';

-- ---------------------------------------------------------------------------
-- Step 6: RLS policies — INSERT
-- Users may only insert rows with user_id set to their own id.
-- ---------------------------------------------------------------------------

create policy products_insert_anon
  on public.products
  for insert
  to anon
  with check (auth.uid() = user_id);

comment on policy products_insert_anon on public.products is
  'Anon: insert effectively denied (auth.uid() is null). Keeps policy set complete.';

create policy products_insert_authenticated
  on public.products
  for insert
  to authenticated
  with check (auth.uid() = user_id);

comment on policy products_insert_authenticated on public.products is
  'Authenticated: may insert only with user_id = auth.uid().';

-- ---------------------------------------------------------------------------
-- Step 7: RLS policies — UPDATE
-- Users may only update their own products.
-- ---------------------------------------------------------------------------

create policy products_update_anon
  on public.products
  for update
  to anon
  using (auth.uid() = user_id);

comment on policy products_update_anon on public.products is
  'Anon: no rows updatable. Keeps policy set complete.';

create policy products_update_authenticated
  on public.products
  for update
  to authenticated
  using (auth.uid() = user_id);

comment on policy products_update_authenticated on public.products is
  'Authenticated: may update only rows where user_id = auth.uid().';

-- ---------------------------------------------------------------------------
-- Step 8: RLS policies — DELETE
-- Users may only delete their own products.
-- ---------------------------------------------------------------------------

create policy products_delete_anon
  on public.products
  for delete
  to anon
  using (auth.uid() = user_id);

comment on policy products_delete_anon on public.products is
  'Anon: no rows deletable. Keeps policy set complete.';

create policy products_delete_authenticated
  on public.products
  for delete
  to authenticated
  using (auth.uid() = user_id);

comment on policy products_delete_authenticated on public.products is
  'Authenticated: may delete only rows where user_id = auth.uid().';
