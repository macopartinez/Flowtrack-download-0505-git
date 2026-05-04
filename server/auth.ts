import bcrypt from "bcrypt";
import type { Request } from "express";
import { users, type User } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const [user] = await db.select().from(users).where(eq(users.email, email));
  return user;
}

export async function getUserById(id: number): Promise<User | undefined> {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user;
}

export async function createUser(data: {
  username: string;
  email: string;
  password: string;
}): Promise<User> {
  const passwordHash = await hashPassword(data.password);
  
  const [user] = await db.insert(users).values({
    username: data.username,
    email: data.email,
    passwordHash,
    platform: "instagram", // Always Instagram
    avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.username}`,
    isConnected: false, // Will be set to true after agent follow
  }).returning();
  
  return user;
}

export function getCurrentUser(req: Request): number | null {
  return req.session?.userId ?? null;
}

export function setCurrentUser(req: Request, userId: number): void {
  req.session.userId = userId;
}

export async function destroySession(req: Request): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.destroy((err: Error | null) => {
      if (err) reject(err);
      else resolve();
    });
  });
}
