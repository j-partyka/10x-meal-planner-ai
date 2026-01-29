import type { SupabaseClient } from '../../db/supabase.client';
import type {
  CreateProductCommand,
  ListProductsQuery,
  ProductDto,
  UpdateProductCommand,
} from '../../types';

export interface ListProductsResult {
  data: ProductDto[];
  total: number;
}

/**
 * Lists products for the given user with optional search, category filter, sort, and pagination.
 * Uses the Supabase client from context so RLS applies.
 */
export async function listProducts(
  supabase: SupabaseClient,
  userId: string,
  query: ListProductsQuery
): Promise<ListProductsResult> {
  const { search, category, sort = 'expiration_date', order = 'asc', page = 1, limit = 50 } = query;

  let q = supabase
    .from('products')
    .select('*', { count: 'exact' })
    .eq('user_id', userId);

  if (search?.trim()) {
    const term = `%${search.trim()}%`;
    q = q.or(`name.ilike.${term},category.ilike.${term}`);
  }

  if (category?.trim()) {
    q = q.eq('category', category.trim());
  }

  q = q.order(sort, { ascending: order === 'asc' });

  const from = (page - 1) * limit;
  const to = from + limit - 1;
  q = q.range(from, to);

  const { data, error, count } = await q;

  if (error) {
    throw error;
  }

  return {
    data: (data ?? []) as ProductDto[],
    total: count ?? 0,
  };
}

/**
 * Returns a single product by id if it belongs to the user, otherwise null.
 */
export async function getProductById(
  supabase: SupabaseClient,
  userId: string,
  id: string
): Promise<ProductDto | null> {
  const { data, error } = await supabase
    .from('products')
    .select()
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw error;
  }

  return data as ProductDto;
}

/**
 * Creates a product for the user. user_id is set server-side; do not pass in body.
 */
export async function createProduct(
  supabase: SupabaseClient,
  userId: string,
  body: CreateProductCommand
): Promise<ProductDto> {
  const { data, error } = await supabase
    .from('products')
    .insert({
      ...body,
      user_id: userId,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as ProductDto;
}

/**
 * Updates a product by id. Only provided fields are updated. Returns the updated row or null if not found/not owned.
 */
export async function updateProduct(
  supabase: SupabaseClient,
  userId: string,
  id: string,
  body: UpdateProductCommand
): Promise<ProductDto | null> {
  const { data, error } = await supabase
    .from('products')
    .update(body)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return data as ProductDto;
}

/**
 * Deletes a product by id. Returns true if a row was deleted, false if not found/not owned.
 */
export async function deleteProduct(
  supabase: SupabaseClient,
  userId: string,
  id: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
    .select('id');

  if (error) {
    throw error;
  }

  return Array.isArray(data) && data.length > 0;
}
