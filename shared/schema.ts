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
  name: text("name").default("Milestone"), // "2500 PKR Free Delivery", "VIP Milestone"
  description: text("description"), // Optional description
  thresholdAmount: decimal("threshold_amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("PKR"), // Currency support
  rewardType: text("reward_type").notNull(), // 'free_delivery', 'free_products', 'discount'
  freeProductCount: integer("free_product_count").default(0),
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).default("0"), // For discount rewards
  discountType: text("discount_type").default("percentage"), // 'percentage', 'fixed'
  
  // Status and Control
  status: text("status").default("active"), // 'active', 'paused', 'deleted'
  isActive: boolean("is_active").default(true),
  
  // Advanced Conditions
  conditions: jsonb("conditions").default("{}"), // Flexible conditions (customer type, product categories, etc.)
  eligibleProducts: text("eligible_products").array(), // Array of product IDs eligible for free selection
  excludeProducts: text("exclude_products").array(), // Products to exclude
  customerSegments: text("customer_segments").array().default(["all"]), // "all", "new", "returning", "vip"
  
  // Scheduling
  startDate: timestamp("start_date"), // When milestone becomes active
  endDate: timestamp("end_date"), // When milestone expires
  
  // Usage Limits
  usageLimit: integer("usage_limit"), // Max number of times this milestone can be used
  usageCount: integer("usage_count").default(0), // How many times it's been used
  maxUsagePerCustomer: integer("max_usage_per_customer").default(1), // Limit per customer
  
  // Priority and Display
  priority: integer("priority").default(1), // Order of milestone evaluation
  displayOrder: integer("display_order").default(1), // Order in UI
  icon: text("icon").default("🎁"), // Icon for display
  color: text("color").default("#e91e63"), // Color theme
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: text("created_by"), // Admin user who created it
  lastModifiedBy: text("last_modified_by"), // Last admin who modified it
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

// New Discount Management System Tables
export const discountCampaigns = pgTable("discount_campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  storeId: varchar("store_id").references(() => stores.id),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(), // 'percentage', 'fixed_amount', 'bogo', 'bundle', 'seasonal', 'tiered'
  status: text("status").default("draft"), // 'draft', 'active', 'paused', 'expired'
  priority: integer("priority").default(1),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  usageLimit: integer("usage_limit"),
  usageCount: integer("usage_count").default(0),
  minimumOrderValue: decimal("minimum_order_value", { precision: 10, scale: 2 }),
  maximumDiscountAmount: decimal("maximum_discount_amount", { precision: 10, scale: 2 }),
  stackable: boolean("stackable").default(false),
  customerSegment: text("customer_segment").default("all"), // 'all', 'new', 'returning', 'vip'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const discountRules = pgTable("discount_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").references(() => discountCampaigns.id),
  ruleType: text("rule_type").notNull(), // 'percentage_off', 'fixed_off', 'buy_x_get_y', 'free_shipping'
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull(),
  buyQuantity: integer("buy_quantity").default(1),
  getQuantity: integer("get_quantity").default(0),
  getDiscountPercent: decimal("get_discount_percent", { precision: 5, scale: 2 }).default("0"),
  applyToProducts: text("apply_to_products").default("all"), // 'all', 'specific', 'categories'
  conditions: jsonb("conditions").default("{}"), // Flexible conditions storage
  createdAt: timestamp("created_at").defaultNow(),
});

export const campaignProducts = pgTable("campaign_products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").references(() => discountCampaigns.id),
  productId: varchar("product_id").references(() => products.id),
  inclusionType: text("inclusion_type").notNull(), // 'include', 'exclude'
  createdAt: timestamp("created_at").defaultNow(),
});

export const bundleConfigurations = pgTable("bundle_configurations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").references(() => discountCampaigns.id),
  name: text("name").notNull(),
  bundleType: text("bundle_type").notNull(), // 'fixed_bundle', 'mix_match', 'category_bundle'
  totalItems: integer("total_items").notNull(),
  discountType: text("discount_type").notNull(), // 'percentage', 'fixed_price'
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const bundleItems = pgTable("bundle_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bundleId: varchar("bundle_id").references(() => bundleConfigurations.id),
  productId: varchar("product_id").references(() => products.id),
  quantity: integer("quantity").default(1),
  isRequired: boolean("is_required").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const seasonalPromotions = pgTable("seasonal_promotions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  storeId: varchar("store_id").references(() => stores.id),
  name: text("name").notNull(),
  theme: text("theme"), // 'eid', 'ramadan', 'valentine', 'summer', 'winter', 'black_friday'
  bannerText: text("banner_text"),
  bannerColor: text("banner_color").default("#000000"),
  textColor: text("text_color").default("#ffffff"),
  autoActivate: boolean("auto_activate").default(false),
  activationDate: timestamp("activation_date"),
  deactivationDate: timestamp("deactivation_date"),
  isActive: boolean("is_active").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const discountAnalytics = pgTable("discount_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").references(() => discountCampaigns.id),
  date: timestamp("date").defaultNow(),
  impressions: integer("impressions").default(0),
  clicks: integer("clicks").default(0),
  conversions: integer("conversions").default(0),
  revenue: decimal("revenue", { precision: 12, scale: 2 }).default("0"),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default("0"),
  orderCount: integer("order_count").default(0),
  customerCount: integer("customer_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const storesRelations = relations(stores, ({ many }) => ({
  products: many(products),
  milestones: many(milestones),
  cartSessions: many(cartSessions),
  rewardHistory: many(rewardHistory),
  discountCampaigns: many(discountCampaigns),
  seasonalPromotions: many(seasonalPromotions),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  store: one(stores, {
    fields: [products.storeId],
    references: [stores.id],
  }),
  campaignProducts: many(campaignProducts),
  bundleItems: many(bundleItems),
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

// New Discount Management Relations
export const discountCampaignsRelations = relations(discountCampaigns, ({ one, many }) => ({
  store: one(stores, {
    fields: [discountCampaigns.storeId],
    references: [stores.id],
  }),
  discountRules: many(discountRules),
  campaignProducts: many(campaignProducts),
  bundleConfigurations: many(bundleConfigurations),
  discountAnalytics: many(discountAnalytics),
}));

export const discountRulesRelations = relations(discountRules, ({ one }) => ({
  campaign: one(discountCampaigns, {
    fields: [discountRules.campaignId],
    references: [discountCampaigns.id],
  }),
}));

export const campaignProductsRelations = relations(campaignProducts, ({ one }) => ({
  campaign: one(discountCampaigns, {
    fields: [campaignProducts.campaignId],
    references: [discountCampaigns.id],
  }),
  product: one(products, {
    fields: [campaignProducts.productId],
    references: [products.id],
  }),
}));

export const bundleConfigurationsRelations = relations(bundleConfigurations, ({ one, many }) => ({
  campaign: one(discountCampaigns, {
    fields: [bundleConfigurations.campaignId],
    references: [discountCampaigns.id],
  }),
  bundleItems: many(bundleItems),
}));

export const bundleItemsRelations = relations(bundleItems, ({ one }) => ({
  bundle: one(bundleConfigurations, {
    fields: [bundleItems.bundleId],
    references: [bundleConfigurations.id],
  }),
  product: one(products, {
    fields: [bundleItems.productId],
    references: [products.id],
  }),
}));

export const seasonalPromotionsRelations = relations(seasonalPromotions, ({ one }) => ({
  store: one(stores, {
    fields: [seasonalPromotions.storeId],
    references: [stores.id],
  }),
}));

export const discountAnalyticsRelations = relations(discountAnalytics, ({ one }) => ({
  campaign: one(discountCampaigns, {
    fields: [discountAnalytics.campaignId],
    references: [discountCampaigns.id],
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

// New Discount Management Insert Schemas
export const insertDiscountCampaignSchema = createInsertSchema(discountCampaigns).omit({
  id: true,
  usageCount: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDiscountRuleSchema = createInsertSchema(discountRules).omit({
  id: true,
  createdAt: true,
});

export const insertCampaignProductSchema = createInsertSchema(campaignProducts).omit({
  id: true,
  createdAt: true,
});

export const insertBundleConfigurationSchema = createInsertSchema(bundleConfigurations).omit({
  id: true,
  createdAt: true,
});

export const insertBundleItemSchema = createInsertSchema(bundleItems).omit({
  id: true,
  createdAt: true,
});

export const insertSeasonalPromotionSchema = createInsertSchema(seasonalPromotions).omit({
  id: true,
  createdAt: true,
});

export const insertDiscountAnalyticsSchema = createInsertSchema(discountAnalytics).omit({
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

// New Discount Management Types
export type InsertDiscountCampaign = z.infer<typeof insertDiscountCampaignSchema>;
export type DiscountCampaign = typeof discountCampaigns.$inferSelect;

export type InsertDiscountRule = z.infer<typeof insertDiscountRuleSchema>;
export type DiscountRule = typeof discountRules.$inferSelect;

export type InsertCampaignProduct = z.infer<typeof insertCampaignProductSchema>;
export type CampaignProduct = typeof campaignProducts.$inferSelect;

export type InsertBundleConfiguration = z.infer<typeof insertBundleConfigurationSchema>;
export type BundleConfiguration = typeof bundleConfigurations.$inferSelect;

export type InsertBundleItem = z.infer<typeof insertBundleItemSchema>;
export type BundleItem = typeof bundleItems.$inferSelect;

export type InsertSeasonalPromotion = z.infer<typeof insertSeasonalPromotionSchema>;
export type SeasonalPromotion = typeof seasonalPromotions.$inferSelect;

export type InsertDiscountAnalytics = z.infer<typeof insertDiscountAnalyticsSchema>;
export type DiscountAnalytics = typeof discountAnalytics.$inferSelect;
