import { z } from 'zod';
import { insertUserSchema, insertUnfollowerSchema, users, unfollowers, followers, blockers } from './schema';

export const api = {
  users: {
    connect: {
      method: 'POST' as const,
      path: '/api/users/connect' as const,
      input: z.object({
        username: z.string(),
        email: z.string().email(),
        password: z.string().min(6),
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
          // Instagram profile stats
          instagramFollowers: z.number().optional(),
          instagramFollowing: z.number().optional(),
          instagramPosts: z.number().optional(),
          instagramBio: z.string().optional(),
          isPrivate: z.boolean().optional(),
          analysisStatus: z.string().optional(),
          lastAnalyzedAt: z.string().nullable().optional(),
          // Activity tracking stats
          totalUnfollowers: z.number(),
          totalFollowers: z.number(),
          totalBlockers: z.number(),
          recentUnfollowers: z.array(z.custom<typeof unfollowers.$inferSelect>()),
          recentFollowers: z.array(z.custom<typeof followers.$inferSelect>()),
          recentBlockers: z.array(z.custom<typeof blockers.$inferSelect>()),
          chartData: z.array(z.object({
            day: z.number(),
            followers: z.number(),
            unfollowers: z.number(),
            blockers: z.number().optional(),
          })),
          growthRate: z.number(),
        }),
      },
    },
  },
  unfollowers: {
    list: {
      method: 'GET' as const,
      path: '/api/unfollowers' as const,
      responses: {
        200: z.object({
          unfollowers: z.array(z.object({
            id: z.number(),
            username: z.string(),
            avatar_url: z.string().nullable(),
            status: z.string(),
            detected_at: z.string(),
            verified_at: z.string().nullable(),
          })),
        }),
      },
    },
    ghostFollowers: {
      method: 'GET' as const,
      path: '/api/ghost-followers' as const,
      responses: {
        200: z.object({
          ghostFollowers: z.array(z.object({
            id: z.number(),
            username: z.string(),
            avatar_url: z.string().nullable(),
            status: z.string(), // 'blocked' or 'deleted'
            detected_at: z.string(),
            verified_at: z.string().nullable(),
          })),
        }),
      },
    },
    stats: {
      method: 'GET' as const,
      path: '/api/unfollowers/stats' as const,
      responses: {
        200: z.object({
          unfollowed: z.number(),
          blocked: z.number(),
          deleted: z.number(),
          ghost: z.number(),
          total: z.number(),
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
