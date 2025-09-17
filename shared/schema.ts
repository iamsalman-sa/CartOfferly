import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, decimal, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const stores = pgTable("stores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  shopifyStoreId: text("shopify_store_id").notNull().unique(),
  storeName: text("store_name").notNull(),
  accessToken: text("access_token").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  shopifyProductId: text("shopify_product_id").notNull(),
  storeId: varchar("store_id").references(() => stores.id),
  title: text("title").notNull(),
  handle: text("handle").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("image_url"),
  isBundle: boolean("is_bundle").default(false),
  isEligibleForRewards: boolean("is_eligible_for_rewards").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const milestones = pgTable("milestones", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  storeId: varchar("store_id").references(() => stores.id),
  thresholdAmount: decimal("threshold_amount", { precision: 10, scale: 2 }).notNull(),
  rewardType: text("reward_type").notNull(), // 'free_delivery', 'free_products'
  freeProductCount: integer("free_product_count").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const cartSessions = pgTable("cart_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  storeId: varchar("store_id").references(() => stores.id),
  customerId: text("customer_id"),
  cartToken: text("cart_token").notNull(),
  currentValue: decimal("current_value", { precision: 10, scale: 2 }).default("0"),
  unlockedMilestones: jsonb("unlocked_milestones").default("[]"),
  selectedFreeProducts: jsonb("selected_free_products").default("[]"),
  timerExpiresAt: timestamp("timer_expires_at"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const rewardHistory = pgTable("reward_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  storeId: varchar("store_id").references(() => stores.id),
  cartSessionId: varchar("cart_session_id").references(() => cartSessions.id),
  milestoneId: varchar("milestone_id").references(() => milestones.id),
  rewardType: text("reward_type").notNull(),
  rewardValue: decimal("reward_value", { precision: 10, scale: 2 }),
  isRedeemed: boolean("is_redeemed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const storesRelations = relations(stores, ({ many }) => ({
  products: many(products),
  milestones: many(milestones),
  cartSessions: many(cartSessions),
  rewardHistory: many(rewardHistory),
}));

export const productsRelations = relations(products, ({ one }) => ({
  store: one(stores, {
    fields: [products.storeId],
    references: [stores.id],
  }),
}));

export const milestonesRelations = relations(milestones, ({ one, many }) => ({
  store: one(stores, {
    fields: [milestones.storeId],
    references: [stores.id],
  }),
  rewardHistory: many(rewardHistory),
}));

export const cartSessionsRelations = relations(cartSessions, ({ one, many }) => ({
  store: one(stores, {
    fields: [cartSessions.storeId],
    references: [stores.id],
  }),
  rewardHistory: many(rewardHistory),
}));

export const rewardHistoryRelations = relations(rewardHistory, ({ one }) => ({
  store: one(stores, {
    fields: [rewardHistory.storeId],
    references: [stores.id],
  }),
  cartSession: one(cartSessions, {
    fields: [rewardHistory.cartSessionId],
    references: [cartSessions.id],
  }),
  milestone: one(milestones, {
    fields: [rewardHistory.milestoneId],
    references: [milestones.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertStoreSchema = createInsertSchema(stores).omit({
  id: true,
  createdAt: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
});

export const insertMilestoneSchema = createInsertSchema(milestones).omit({
  id: true,
  createdAt: true,
});

export const insertCartSessionSchema = createInsertSchema(cartSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRewardHistorySchema = createInsertSchema(rewardHistory).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertStore = z.infer<typeof insertStoreSchema>;
export type Store = typeof stores.$inferSelect;

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

export type InsertMilestone = z.infer<typeof insertMilestoneSchema>;
export type Milestone = typeof milestones.$inferSelect;

export type InsertCartSession = z.infer<typeof insertCartSessionSchema>;
export type CartSession = typeof cartSessions.$inferSelect;

export type InsertRewardHistory = z.infer<typeof insertRewardHistorySchema>;
export type RewardHistory = typeof rewardHistory.$inferSelect;
