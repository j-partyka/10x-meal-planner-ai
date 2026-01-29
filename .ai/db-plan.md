# Database Schema - 10x Meal Planner (MVP)

PostgreSQL schema for Supabase. Single primary table for inventory; meal plans and shopping lists are generated in application logic and not persisted.

---

## 1. Tables

### 1.1 Custom type: `product_unit`

| Type   | Name          | Description                    |
|--------|---------------|--------------------------------|
| ENUM   | product_unit  | Allowed values: `kg`, `g`, `ml`, `L`, `pieces` |

Defined before `products` table. Metric-only per PRD.

---

### 1.2 Table: `products`

Stores kitchen inventory items. One row per product entry; duplicates (same name, user, expiration) are allowed.

| Column          | Data Type              | Nullable | Default              | Constraints / Notes                          |
|-----------------|------------------------|----------|----------------------|----------------------------------------------|
| id              | UUID                   | NOT NULL | `gen_random_uuid()`  | Primary key                                  |
| user_id         | UUID                   | NOT NULL | —                    | FK → `auth.users(id)` ON DELETE CASCADE      |
| name            | TEXT                   | NOT NULL | —                    | CHECK (char_length(name) <= 200)             |
| quantity        | NUMERIC(10, 3)         | NOT NULL | —                    | CHECK (quantity > 0)                        |
| unit            | product_unit           | NOT NULL | —                    | ENUM: kg, g, ml, L, pieces                   |
| expiration_date | DATE                   | NOT NULL | —                    | Past dates allowed                           |
| category        | TEXT                   | NULL     | NULL                 | CHECK (category IS NULL OR char_length(category) <= 100) |
| created_at      | TIMESTAMP WITH TIME ZONE | NOT NULL | `NOW()`            | Insert time only (no updated_at in MVP)      |

**Table-level:** Row Level Security (RLS) enabled.

---

## 2. Relationships

| From       | To           | Type       | Foreign Key | On Delete | Description                          |
|------------|--------------|------------|-------------|-----------|--------------------------------------|
| products   | auth.users   | Many-to-one| products.user_id → auth.users(id) | CASCADE | Each product belongs to one user; deleting user removes their products. |

No other application tables. Meal plans and shopping lists are computed in the app (no `meal_plans`, `shopping_list`, or junction tables).

---

## 3. Indexes

All indexes are B-tree. No partial indexes or GIN/pg_trgm for MVP.

| Table    | Index name (suggested)       | Columns                    | Purpose                                      |
|----------|-----------------------------|----------------------------|----------------------------------------------|
| products | products_pkey               | (id)                       | Primary key (auto)                           |
| products | products_user_id_idx        | (user_id)                  | User-scoped queries, FK lookups             |
| products | products_expiration_date_idx| (expiration_date)          | Filter/sort by expiration                    |
| products | products_name_idx           | (name)                     | Search and sort by name                      |
| products | products_user_id_expiration_date_idx | (user_id, expiration_date) | User + expiration (e.g. “expiring soon”)     |
| products | products_user_id_category_idx       | (user_id, category)        | Category filter and shopping-list grouping   |

`user_id` may already be indexed via FK; creating `products_user_id_idx` is still recommended for RLS and list views.

---

## 4. Row Level Security (RLS)

**Table:** `products`  
**RLS:** Enabled.

Policies use `auth.uid()` only (no security definer functions).

| Policy name                  | Command | Expression / check                          |
|-----------------------------|---------|---------------------------------------------|
| Users can view own products | SELECT  | `USING (auth.uid() = user_id)`              |
| Users can insert own products | INSERT | `WITH CHECK (auth.uid() = user_id)`         |
| Users can update own products | UPDATE | `USING (auth.uid() = user_id)`              |
| Users can delete own products | DELETE | `USING (auth.uid() = user_id)`              |

Result: each user can only read/write rows where `user_id` equals their authenticated ID.

---

## 5. Design notes

- **Normalization:** Single table in 3NF. Category is free text (no category table) per PRD and session decisions.
- **No history for meal plans:** Current plan only; no tables for plans or plan history.
- **Units:** ENUM enforces metric units and avoids typos; application uses same set (kg, g, ml, L, pieces).
- **Quantity:** `NUMERIC(10, 3)` supports decimals and large values (e.g. 9,999,999.999).
- **Timestamps:** `created_at` only; no `updated_at` or triggers in MVP.
- **Deletes:** Hard deletes only; no `is_deleted` or soft delete.
- **Expiration logic:** “Expiring within 3/7 days” and prioritization are done in application code, not in DB views or functions.
- **Migrations:** Supabase migrations in `supabase/migrations` with timestamp-prefixed filenames (e.g. `20260129120000_create_products.sql`).
- **Auth:** User identity comes from Supabase Auth (`auth.users`). No separate `users` table in application schema.

This schema is ready to be implemented as a Supabase migration and supports inventory CRUD, user isolation, expiration-based logic in the app, and category-based grouping for shopping lists.
