import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.post(api.users.connect.path, async (req, res) => {
    try {
      const input = api.users.connect.input.parse(req.body);
      // Simulate connecting - in a real app this would do OAuth
      const user = await storage.createUser({
        username: input.username,
        platform: input.platform,
        avatarUrl: `https://ui-avatars.com/api/?name=${input.username}&background=random`,
        isConnected: true
      });
      
      // Seed some mock data for this new user
      await seedMockData(user.id);
      
      res.json(user);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.get(api.users.get.path, async (req, res) => {
    const user = await storage.getUser(Number(req.params.id));
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  });

  app.get(api.stats.get.path, async (req, res) => {
    const userId = Number(req.params.userId);
    const recentUnfollowers = await storage.getUnfollowers(userId);
    
    res.json({
      totalUnfollowers: recentUnfollowers.length + 42, // Mock historical data
      recentUnfollowers,
      growthRate: -2.4 // Mock negative growth
    });
  });

  return httpServer;
}

async function seedMockData(userId: number) {
  const mockUnfollowers = [
    { username: "crypto_bot_99", userId },
    { username: "inactive_user_123", userId },
    { username: "random_person_x", userId },
  ];

  for (const u of mockUnfollowers) {
    await storage.createUnfollower(u);
  }
}
