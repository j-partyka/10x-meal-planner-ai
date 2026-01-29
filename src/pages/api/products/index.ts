import type { APIRoute } from 'astro';

import { errorResponse, jsonResponse } from '../../../lib/api-responses';
import { logServerError, logValidationFailure } from '../../../lib/api-logger';
import {
  createProductSchema,
  listProductsQuerySchema,
} from '../../../lib/schemas';
import { listProducts, createProduct } from '../../../lib/services/product.service';
import type { PaginationMeta } from '../../../types';

export const prerender = false;

/**
 * GET /api/products – List products for the authenticated user.
 * Query: search, category, sort, order, page, limit.
 */
export const GET: APIRoute = async ({ locals, url }) => {
  const userId = locals.userId;
  if (!userId) {
    return errorResponse('Unauthorized', 401);
  }

  const raw = Object.fromEntries(url.searchParams);
  const parsed = listProductsQuerySchema.safeParse(raw);
  if (!parsed.success) {
    const details = parsed.error.flatten().fieldErrors;
    const detailsList = Object.entries(details).flatMap(([field, messages]) =>
      (messages ?? []).map((message) => ({ field, message }))
    );
    logValidationFailure('GET /api/products', detailsList);
    return errorResponse('Validation failed', 400, detailsList);
  }

  try {
    const { data, total } = await listProducts(locals.supabase, userId, parsed.data);
    const { page, limit } = parsed.data;
    const totalPages = Math.ceil(total / limit) || 1;
    const meta: PaginationMeta = { total, page, limit, totalPages };
    return jsonResponse({ data, meta }, 200);
  } catch (err) {
    logServerError('GET /api/products', err);
    return errorResponse('Internal server error', 500);
  }
};

/**
 * POST /api/products – Create a product for the authenticated user.
 * Body: name, quantity, unit, expiration_date, category?.
 */
export const POST: APIRoute = async ({ locals, request }) => {
  const userId = locals.userId;
  if (!userId) {
    return errorResponse('Unauthorized', 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON body', 400);
  }

  const parsed = createProductSchema.safeParse(body);
  if (!parsed.success) {
    const details = parsed.error.flatten().fieldErrors;
    const detailsList = Object.entries(details).flatMap(([field, messages]) =>
      (messages ?? []).map((message) => ({ field, message }))
    );
    logValidationFailure('POST /api/products', detailsList);
    return errorResponse('Validation failed', 400, detailsList);
  }

  try {
    const product = await createProduct(locals.supabase, userId, parsed.data);
    return jsonResponse(product, 201);
  } catch (err) {
    logServerError('POST /api/products', err);
    return errorResponse('Internal server error', 500);
  }
};
