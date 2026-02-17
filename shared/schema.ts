import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(),
  email: text("email").notNull(),
  platform: text("platform").notNull(), // 'instagram' or 'facebook'
  avatarUrl: text("avatar_url"),
  isConnected: boolean("is_connected").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const unfollowers = pgTable("unfollowers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  username: text("username").notNull(), // The person who unfollowed
  detectedAt: timestamp("detected_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({ 
  id: true, 
  createdAt: true 
}).extend({
  email: z.string().email("Veuillez entrer une adresse email valide"),
});

export const insertUnfollowerSchema = createInsertSchema(unfollowers).omit({ 
  id: true, 
  detectedAt: true 
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Unfollower = typeof unfollowers.$inferSelect;
export type InsertUnfollower = z.infer<typeof insertUnfollowerSchema>;
