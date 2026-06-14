import { users, unfollowers, followers, blockers, type User, type InsertUser, type Unfollower, type InsertUnfollower, type Follower, type InsertFollower, type Blocker, type InsertBlocker } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUnfollowers(userId: number): Promise<Unfollower[]>;
  createUnfollower(unfollower: InsertUnfollower): Promise<Unfollower>;
  getFollowers(userId: number): Promise<Follower[]>;
  createFollower(follower: InsertFollower): Promise<Follower>;
  getBlockers(userId: number): Promise<Blocker[]>;
  createBlocker(blocker: InsertBlocker): Promise<Blocker>;
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
    // Supprimer le follower de la table followers s'il existe
    await db.delete(followers)
      .where(
        and(
          eq(followers.userId, unfollower.userId),
          eq(followers.username, unfollower.username)
        )
      );
    
    // Créer l'unfollower
    const [newUnfollower] = await db.insert(unfollowers).values(unfollower).returning();
    return newUnfollower;
  }

  async getFollowers(userId: number): Promise<Follower[]> {
    return await db.select()
      .from(followers)
      .where(eq(followers.userId, userId))
      .orderBy(desc(followers.detectedAt));
  }

  async createFollower(follower: InsertFollower): Promise<Follower> {
    const [newFollower] = await db.insert(followers).values(follower).returning();
    return newFollower;
  }

  async getBlockers(userId: number): Promise<Blocker[]> {
    return await db.select()
      .from(blockers)
      .where(eq(blockers.userId, userId))
      .orderBy(desc(blockers.detectedAt));
  }

  async createBlocker(blocker: InsertBlocker): Promise<Blocker> {
    const [newBlocker] = await db.insert(blockers).values(blocker).returning();
    return newBlocker;
  }
}

export const storage = new DatabaseStorage();
