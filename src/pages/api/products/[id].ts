import type { APIRoute } from 'astro';

import { errorResponse, jsonResponse } from '../../../lib/api-responses';
import { logServerError, logValidationFailure } from '../../../lib/api-logger';
import { uuidParamSchema, updateProductSchema } from '../../../lib/schemas';
import {
  getProductById,
  updateProduct,
  deleteProduct,
} from '../../../lib/services/product.service';

export const prerender = false;

/**
 * GET /api/products/:id – Get a single product by id (must be owned by user).
 */
export const GET: APIRoute = async ({ locals, params }) => {
  const userId = locals.userId;
  if (!userId) {
    return errorResponse('Unauthorized', 401);
  }

  const parsed = uuidParamSchema.safeParse(params);
  if (!parsed.success) {
    return errorResponse('Invalid product id', 400);
  }

  try {
    const product = await getProductById(locals.supabase, userId, parsed.data.id);
    if (!product) {
      return errorResponse('Not found', 404);
    }
    return jsonResponse(product, 200);
  } catch (err) {
    logServerError('GET /api/products/:id', err);
    return errorResponse('Internal server error', 500);
  }
};

/**
 * PATCH /api/products/:id – Update a product (partial body).
 */
export const PATCH: APIRoute = async ({ locals, params, request }) => {
  const userId = locals.userId;
  if (!userId) {
    return errorResponse('Unauthorized', 401);
  }

  const idParsed = uuidParamSchema.safeParse(params);
  if (!idParsed.success) {
    return errorResponse('Invalid product id', 400);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON body', 400);
  }

  const bodyParsed = updateProductSchema.safeParse(body);
  if (!bodyParsed.success) {
    const details = bodyParsed.error.flatten().fieldErrors;
    const detailsList = Object.entries(details).flatMap(([field, messages]) =>
      (messages ?? []).map((message) => ({ field, message }))
    );
    logValidationFailure('PATCH /api/products/:id', detailsList);
    return errorResponse('Validation failed', 400, detailsList);
  }

  try {
    const product = await updateProduct(
      locals.supabase,
      userId,
      idParsed.data.id,
      bodyParsed.data
    );
    if (!product) {
      return errorResponse('Not found', 404);
    }
    return jsonResponse(product, 200);
  } catch (err) {
    logServerError('PATCH /api/products/:id', err);
    return errorResponse('Internal server error', 500);
  }
};

/**
 * DELETE /api/products/:id – Delete a product (must be owned by user).
 */
export const DELETE: APIRoute = async ({ locals, params }) => {
  const userId = locals.userId;
  if (!userId) {
    return errorResponse('Unauthorized', 401);
  }

  const parsed = uuidParamSchema.safeParse(params);
  if (!parsed.success) {
    return errorResponse('Invalid product id', 400);
  }

  try {
    const deleted = await deleteProduct(locals.supabase, userId, parsed.data.id);
    if (!deleted) {
      return errorResponse('Not found', 404);
    }
    return new Response(null, { status: 204 });
  } catch (err) {
    logServerError('DELETE /api/products/:id', err);
    return errorResponse('Internal server error', 500);
  }
};
