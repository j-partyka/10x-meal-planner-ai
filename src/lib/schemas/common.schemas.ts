import { z } from 'zod';

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Path param schema for resource id (UUID). */
export const uuidParamSchema = z.object({
  id: z.string().regex(uuidRegex, 'Invalid UUID'),
});

export type UuidParam = z.infer<typeof uuidParamSchema>;
