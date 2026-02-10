import { users, unfollowers, type User, type InsertUser, type Unfollower, type InsertUnfollower } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUnfollowers(userId: number): Promise<Unfollower[]>;
  createUnfollower(unfollower: InsertUnfollower): Promise<Unfollower>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getUnfollowers(userId: number): Promise<Unfollower[]> {
    return await db.select()
      .from(unfollowers)
      .where(eq(unfollowers.userId, userId))
      .orderBy(desc(unfollowers.detectedAt));
  }

  async createUnfollower(unfollower: InsertUnfollower): Promise<Unfollower> {
    const [newUnfollower] = await db.insert(unfollowers).values(unfollower).returning();
    return newUnfollower;
  }
}

export const storage = new DatabaseStorage();
