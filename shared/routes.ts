import { z } from 'zod';
import { insertUserSchema, insertUnfollowerSchema, users, unfollowers } from './schema';

export const api = {
  users: {
    connect: {
      method: 'POST' as const,
      path: '/api/users/connect' as const,
      input: z.object({
        username: z.string(),
        email: z.string().email(),
        platform: z.enum(['instagram', 'facebook']),
      }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        400: z.object({ message: z.string() }),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/users/:id' as const,
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        404: z.object({ message: z.string() }),
      },
    },
  },
  stats: {
    get: {
      method: 'GET' as const,
      path: '/api/stats/:userId' as const,
      responses: {
        200: z.object({
          totalUnfollowers: z.number(),
          recentUnfollowers: z.array(z.custom<typeof unfollowers.$inferSelect>()),
          growthRate: z.number(),
        }),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
