import { defineMiddleware } from 'astro:middleware';

import { createAuthenticatedClient, supabaseClient } from '../db/supabase.client';

const PROTECTED_API_PREFIXES = ['/api/products', '/api/meal-plan', '/api/shopping-list'];

function isProtectedApiPath(pathname: string): boolean {
  return PROTECTED_API_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + '/')
  );
}

function getBearerToken(request: Request): string | null {
  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  return auth.slice(7).trim() || null;
}

function jsonResponse(body: { error: string }, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const onRequest = defineMiddleware(async (context, next) => {
  const pathname = context.url.pathname;

  if (!isProtectedApiPath(pathname)) {
    context.locals.supabase = supabaseClient;
    return next();
  }

  const token = getBearerToken(context.request);
  if (!token) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  const authClient = createAuthenticatedClient(token);

  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser();

  if (userError || !user) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  context.locals.supabase = authClient;
  context.locals.userId = user.id;
  return next();
});
