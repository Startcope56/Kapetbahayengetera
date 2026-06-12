import { pgTable, text, serial, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  pinHash: text("pin_hash").notNull(),
  profilePicture: text("profile_picture"),
  coverPicture: text("cover_picture"),
  bio: text("bio"),
  location: text("location"),
  website: text("website"),
  privacy: text("privacy").notNull().default("public"),
  isAdmin: boolean("is_admin").notNull().default(false),
  isBlueAI: boolean("is_blue_ai").notNull().default(false),
  blueBadge: boolean("blue_badge").notNull().default(false),
  blueBadgeClaimedAt: timestamp("blue_badge_claimed_at", { withTimezone: true }),
  restricted: boolean("restricted").notNull().default(false),
  banned: boolean("banned").notNull().default(false),
  accountApproved: boolean("account_approved").notNull().default(true),
  followerCount: integer("follower_count").notNull().default(0),
  followingCount: integer("following_count").notNull().default(0),
  postCount: integer("post_count").notNull().default(0),
  totalPostViews: integer("total_post_views").notNull().default(0),
  profileViewCount: integer("profile_view_count").notNull().default(0),
  rank: text("rank").notNull().default("Newbie"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const sessionsTable = pgTable("sessions", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const siteSettingsTable = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
export type Session = typeof sessionsTable.$inferSelect;
export type SiteSetting = typeof siteSettingsTable.$inferSelect;
