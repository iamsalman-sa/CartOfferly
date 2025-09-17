import { 
  stores, products, milestones, cartSessions, rewardHistory, users,
  discountCampaigns, discountRules, campaignProducts, bundleConfigurations, bundleItems, 
  seasonalPromotions, discountAnalytics,
  type Store, type InsertStore,
  type Product, type InsertProduct,
  type Milestone, type InsertMilestone,
  type CartSession, type InsertCartSession,
  type RewardHistory, type InsertRewardHistory,
  type User, type InsertUser,
  type DiscountCampaign, type InsertDiscountCampaign,
  type DiscountRule, type InsertDiscountRule,
  type CampaignProduct, type InsertCampaignProduct,
  type BundleConfiguration, type InsertBundleConfiguration,
  type BundleItem, type InsertBundleItem,
  type SeasonalPromotion, type InsertSeasonalPromotion,
  type DiscountAnalytics, type InsertDiscountAnalytics
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, desc } from "drizzle-orm";

export interface IStorage {
  // User methods (keep existing)
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Store methods
  createStore(store: InsertStore): Promise<Store>;
  getStoreByShopifyId(shopifyStoreId: string): Promise<Store | undefined>;
  updateStoreToken(storeId: string, accessToken: string): Promise<void>;

  // Product methods
  createProduct(product: InsertProduct): Promise<Product>;
  getProductsByStore(storeId: string): Promise<Product[]>;
  getEligibleFreeProducts(storeId: string): Promise<Product[]>;
  updateProductEligibility(productId: string, isEligible: boolean): Promise<void>;

  // Milestone methods
  createMilestone(milestone: InsertMilestone): Promise<Milestone>;
  getMilestonesByStore(storeId: string): Promise<Milestone[]>;
  getActiveMilestonesByThreshold(storeId: string, cartValue: number): Promise<Milestone[]>;

  // Cart session methods
  createCartSession(cartSession: InsertCartSession): Promise<CartSession>;
  getCartSessionByToken(cartToken: string): Promise<CartSession | undefined>;
  updateCartValue(cartToken: string, currentValue: number): Promise<void>;
  updateUnlockedMilestones(cartToken: string, milestones: string[]): Promise<void>;
  updateSelectedFreeProducts(cartToken: string, productIds: string[]): Promise<void>;
  updateTimerExpiration(cartToken: string, expiresAt: Date): Promise<void>;

  // Reward history methods
  createRewardHistory(reward: InsertRewardHistory): Promise<RewardHistory>;
  getRewardHistoryByStore(storeId: string): Promise<RewardHistory[]>;

  // Discount campaign methods
  createDiscountCampaign(campaign: InsertDiscountCampaign): Promise<DiscountCampaign>;
  getDiscountCampaignsByStore(storeId: string): Promise<DiscountCampaign[]>;
  getDiscountCampaignById(campaignId: string): Promise<DiscountCampaign | undefined>;
  updateDiscountCampaign(campaignId: string, updates: Partial<InsertDiscountCampaign>): Promise<DiscountCampaign | undefined>;
  deleteDiscountCampaign(campaignId: string): Promise<void>;
  updateCampaignStatus(campaignId: string, status: string): Promise<void>;
  getActiveCampaignsByStore(storeId: string): Promise<DiscountCampaign[]>;

  // Discount rule methods
  createDiscountRule(rule: InsertDiscountRule): Promise<DiscountRule>;
  getDiscountRulesByCampaign(campaignId: string): Promise<DiscountRule[]>;
  updateDiscountRule(ruleId: string, updates: Partial<InsertDiscountRule>): Promise<DiscountRule | undefined>;
  deleteDiscountRule(ruleId: string): Promise<void>;

  // Campaign product methods
  addProductToCampaign(campaignProduct: InsertCampaignProduct): Promise<CampaignProduct>;
  removeProductFromCampaign(campaignId: string, productId: string): Promise<void>;
  getCampaignProducts(campaignId: string): Promise<CampaignProduct[]>;
  getProductCampaigns(productId: string): Promise<CampaignProduct[]>;

  // Bundle configuration methods
  createBundleConfiguration(bundle: InsertBundleConfiguration): Promise<BundleConfiguration>;
  getBundleConfigurationsByCampaign(campaignId: string): Promise<BundleConfiguration[]>;
  getBundleConfigurationById(bundleId: string): Promise<BundleConfiguration | undefined>;
  updateBundleConfiguration(bundleId: string, updates: Partial<InsertBundleConfiguration>): Promise<BundleConfiguration | undefined>;
  deleteBundleConfiguration(bundleId: string): Promise<void>;

  // Bundle item methods
  addBundleItem(bundleItem: InsertBundleItem): Promise<BundleItem>;
  getBundleItems(bundleId: string): Promise<BundleItem[]>;
  removeBundleItem(bundleId: string, productId: string): Promise<void>;
  updateBundleItemQuantity(bundleId: string, productId: string, quantity: number): Promise<void>;

  // Seasonal promotion methods
  createSeasonalPromotion(promotion: InsertSeasonalPromotion): Promise<SeasonalPromotion>;
  getSeasonalPromotionsByStore(storeId: string): Promise<SeasonalPromotion[]>;
  getSeasonalPromotionById(promotionId: string): Promise<SeasonalPromotion | undefined>;
  updateSeasonalPromotion(promotionId: string, updates: Partial<InsertSeasonalPromotion>): Promise<SeasonalPromotion | undefined>;
  deleteSeasonalPromotion(promotionId: string): Promise<void>;
  activateSeasonalPromotion(promotionId: string): Promise<void>;
  deactivateSeasonalPromotion(promotionId: string): Promise<void>;
  getActiveSeasonalPromotions(storeId: string): Promise<SeasonalPromotion[]>;

  // Discount analytics methods
  createDiscountAnalytics(analytics: InsertDiscountAnalytics): Promise<DiscountAnalytics>;
  getAnalyticsByCampaign(campaignId: string, startDate?: Date, endDate?: Date): Promise<DiscountAnalytics[]>;
  updateAnalytics(campaignId: string, updates: Partial<InsertDiscountAnalytics>): Promise<void>;
  getAnalyticsSummary(campaignId: string): Promise<{
    totalImpressions: number;
    totalClicks: number;
    totalConversions: number;
    totalRevenue: number;
    totalDiscount: number;
    conversionRate: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User methods (existing)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Store methods
  async createStore(store: InsertStore): Promise<Store> {
    const [newStore] = await db.insert(stores).values(store).returning();
    return newStore;
  }

  async getStoreByShopifyId(shopifyStoreId: string): Promise<Store | undefined> {
    const [store] = await db.select().from(stores).where(eq(stores.shopifyStoreId, shopifyStoreId));
    return store || undefined;
  }

  async updateStoreToken(storeId: string, accessToken: string): Promise<void> {
    await db.update(stores).set({ accessToken }).where(eq(stores.id, storeId));
  }

  // Product methods
  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async getProductsByStore(storeId: string): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.storeId, storeId));
  }

  async getEligibleFreeProducts(storeId: string): Promise<Product[]> {
    return await db.select().from(products)
      .where(and(
        eq(products.storeId, storeId),
        eq(products.isEligibleForRewards, true),
        eq(products.isBundle, false)
      ));
  }

  async updateProductEligibility(productId: string, isEligible: boolean): Promise<void> {
    await db.update(products).set({ isEligibleForRewards: isEligible }).where(eq(products.id, productId));
  }

  // Milestone methods
  async createMilestone(milestone: InsertMilestone): Promise<Milestone> {
    const [newMilestone] = await db.insert(milestones).values(milestone).returning();
    return newMilestone;
  }

  async getMilestonesByStore(storeId: string): Promise<Milestone[]> {
    return await db.select().from(milestones)
      .where(and(eq(milestones.storeId, storeId), eq(milestones.isActive, true)))
      .orderBy(milestones.thresholdAmount);
  }

  async getActiveMilestonesByThreshold(storeId: string, cartValue: number): Promise<Milestone[]> {
    return await db.select().from(milestones)
      .where(and(
        eq(milestones.storeId, storeId),
        eq(milestones.isActive, true),
        lte(milestones.thresholdAmount, cartValue.toString())
      ))
      .orderBy(milestones.thresholdAmount);
  }

  // Cart session methods
  async createCartSession(cartSession: InsertCartSession): Promise<CartSession> {
    const [newSession] = await db.insert(cartSessions).values(cartSession).returning();
    return newSession;
  }

  async getCartSessionByToken(cartToken: string): Promise<CartSession | undefined> {
    const [session] = await db.select().from(cartSessions).where(eq(cartSessions.cartToken, cartToken));
    return session || undefined;
  }

  async updateCartValue(cartToken: string, currentValue: number): Promise<void> {
    await db.update(cartSessions)
      .set({ currentValue: currentValue.toString(), updatedAt: new Date() })
      .where(eq(cartSessions.cartToken, cartToken));
  }

  async updateUnlockedMilestones(cartToken: string, milestoneIds: string[]): Promise<void> {
    await db.update(cartSessions)
      .set({ unlockedMilestones: milestoneIds, updatedAt: new Date() })
      .where(eq(cartSessions.cartToken, cartToken));
  }

  async updateSelectedFreeProducts(cartToken: string, productIds: string[]): Promise<void> {
    await db.update(cartSessions)
      .set({ selectedFreeProducts: productIds, updatedAt: new Date() })
      .where(eq(cartSessions.cartToken, cartToken));
  }

  async updateTimerExpiration(cartToken: string, expiresAt: Date): Promise<void> {
    await db.update(cartSessions)
      .set({ timerExpiresAt: expiresAt, updatedAt: new Date() })
      .where(eq(cartSessions.cartToken, cartToken));
  }

  // Reward history methods
  async createRewardHistory(reward: InsertRewardHistory): Promise<RewardHistory> {
    const [newReward] = await db.insert(rewardHistory).values(reward).returning();
    return newReward;
  }

  async getRewardHistoryByStore(storeId: string): Promise<RewardHistory[]> {
    return await db.select().from(rewardHistory)
      .where(eq(rewardHistory.storeId, storeId))
      .orderBy(desc(rewardHistory.createdAt));
  }

  // Discount campaign methods
  async createDiscountCampaign(campaign: InsertDiscountCampaign): Promise<DiscountCampaign> {
    const [newCampaign] = await db.insert(discountCampaigns).values(campaign).returning();
    return newCampaign;
  }

  async getDiscountCampaignsByStore(storeId: string): Promise<DiscountCampaign[]> {
    return await db.select().from(discountCampaigns)
      .where(eq(discountCampaigns.storeId, storeId))
      .orderBy(desc(discountCampaigns.createdAt));
  }

  async getDiscountCampaignById(campaignId: string): Promise<DiscountCampaign | undefined> {
    const [campaign] = await db.select().from(discountCampaigns)
      .where(eq(discountCampaigns.id, campaignId));
    return campaign || undefined;
  }

  async updateDiscountCampaign(campaignId: string, updates: Partial<InsertDiscountCampaign>): Promise<DiscountCampaign | undefined> {
    const [updatedCampaign] = await db.update(discountCampaigns)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(discountCampaigns.id, campaignId))
      .returning();
    return updatedCampaign || undefined;
  }

  async deleteDiscountCampaign(campaignId: string): Promise<void> {
    await db.delete(discountCampaigns).where(eq(discountCampaigns.id, campaignId));
  }

  async updateCampaignStatus(campaignId: string, status: string): Promise<void> {
    await db.update(discountCampaigns)
      .set({ status, updatedAt: new Date() })
      .where(eq(discountCampaigns.id, campaignId));
  }

  async getActiveCampaignsByStore(storeId: string): Promise<DiscountCampaign[]> {
    return await db.select().from(discountCampaigns)
      .where(and(
        eq(discountCampaigns.storeId, storeId),
        eq(discountCampaigns.status, 'active')
      ))
      .orderBy(discountCampaigns.priority, desc(discountCampaigns.createdAt));
  }

  // Discount rule methods
  async createDiscountRule(rule: InsertDiscountRule): Promise<DiscountRule> {
    const [newRule] = await db.insert(discountRules).values(rule).returning();
    return newRule;
  }

  async getDiscountRulesByCampaign(campaignId: string): Promise<DiscountRule[]> {
    return await db.select().from(discountRules)
      .where(eq(discountRules.campaignId, campaignId))
      .orderBy(discountRules.createdAt);
  }

  async updateDiscountRule(ruleId: string, updates: Partial<InsertDiscountRule>): Promise<DiscountRule | undefined> {
    const [updatedRule] = await db.update(discountRules)
      .set(updates)
      .where(eq(discountRules.id, ruleId))
      .returning();
    return updatedRule || undefined;
  }

  async deleteDiscountRule(ruleId: string): Promise<void> {
    await db.delete(discountRules).where(eq(discountRules.id, ruleId));
  }

  // Campaign product methods
  async addProductToCampaign(campaignProduct: InsertCampaignProduct): Promise<CampaignProduct> {
    const [newCampaignProduct] = await db.insert(campaignProducts).values(campaignProduct).returning();
    return newCampaignProduct;
  }

  async removeProductFromCampaign(campaignId: string, productId: string): Promise<void> {
    await db.delete(campaignProducts)
      .where(and(
        eq(campaignProducts.campaignId, campaignId),
        eq(campaignProducts.productId, productId)
      ));
  }

  async getCampaignProducts(campaignId: string): Promise<CampaignProduct[]> {
    return await db.select().from(campaignProducts)
      .where(eq(campaignProducts.campaignId, campaignId))
      .orderBy(campaignProducts.createdAt);
  }

  async getProductCampaigns(productId: string): Promise<CampaignProduct[]> {
    return await db.select().from(campaignProducts)
      .where(eq(campaignProducts.productId, productId))
      .orderBy(campaignProducts.createdAt);
  }

  // Bundle configuration methods
  async createBundleConfiguration(bundle: InsertBundleConfiguration): Promise<BundleConfiguration> {
    const [newBundle] = await db.insert(bundleConfigurations).values(bundle).returning();
    return newBundle;
  }

  async getBundleConfigurationsByCampaign(campaignId: string): Promise<BundleConfiguration[]> {
    return await db.select().from(bundleConfigurations)
      .where(eq(bundleConfigurations.campaignId, campaignId))
      .orderBy(bundleConfigurations.createdAt);
  }

  async getBundleConfigurationById(bundleId: string): Promise<BundleConfiguration | undefined> {
    const [bundle] = await db.select().from(bundleConfigurations)
      .where(eq(bundleConfigurations.id, bundleId));
    return bundle || undefined;
  }

  async updateBundleConfiguration(bundleId: string, updates: Partial<InsertBundleConfiguration>): Promise<BundleConfiguration | undefined> {
    const [updatedBundle] = await db.update(bundleConfigurations)
      .set(updates)
      .where(eq(bundleConfigurations.id, bundleId))
      .returning();
    return updatedBundle || undefined;
  }

  async deleteBundleConfiguration(bundleId: string): Promise<void> {
    await db.delete(bundleConfigurations).where(eq(bundleConfigurations.id, bundleId));
  }

  // Bundle item methods
  async addBundleItem(bundleItem: InsertBundleItem): Promise<BundleItem> {
    const [newBundleItem] = await db.insert(bundleItems).values(bundleItem).returning();
    return newBundleItem;
  }

  async getBundleItems(bundleId: string): Promise<BundleItem[]> {
    return await db.select().from(bundleItems)
      .where(eq(bundleItems.bundleId, bundleId))
      .orderBy(bundleItems.createdAt);
  }

  async removeBundleItem(bundleId: string, productId: string): Promise<void> {
    await db.delete(bundleItems)
      .where(and(
        eq(bundleItems.bundleId, bundleId),
        eq(bundleItems.productId, productId)
      ));
  }

  async updateBundleItemQuantity(bundleId: string, productId: string, quantity: number): Promise<void> {
    await db.update(bundleItems)
      .set({ quantity })
      .where(and(
        eq(bundleItems.bundleId, bundleId),
        eq(bundleItems.productId, productId)
      ));
  }

  // Seasonal promotion methods
  async createSeasonalPromotion(promotion: InsertSeasonalPromotion): Promise<SeasonalPromotion> {
    const [newPromotion] = await db.insert(seasonalPromotions).values(promotion).returning();
    return newPromotion;
  }

  async getSeasonalPromotionsByStore(storeId: string): Promise<SeasonalPromotion[]> {
    return await db.select().from(seasonalPromotions)
      .where(eq(seasonalPromotions.storeId, storeId))
      .orderBy(desc(seasonalPromotions.createdAt));
  }

  async getSeasonalPromotionById(promotionId: string): Promise<SeasonalPromotion | undefined> {
    const [promotion] = await db.select().from(seasonalPromotions)
      .where(eq(seasonalPromotions.id, promotionId));
    return promotion || undefined;
  }

  async updateSeasonalPromotion(promotionId: string, updates: Partial<InsertSeasonalPromotion>): Promise<SeasonalPromotion | undefined> {
    const [updatedPromotion] = await db.update(seasonalPromotions)
      .set(updates)
      .where(eq(seasonalPromotions.id, promotionId))
      .returning();
    return updatedPromotion || undefined;
  }

  async deleteSeasonalPromotion(promotionId: string): Promise<void> {
    await db.delete(seasonalPromotions).where(eq(seasonalPromotions.id, promotionId));
  }

  async activateSeasonalPromotion(promotionId: string): Promise<void> {
    await db.update(seasonalPromotions)
      .set({ isActive: true })
      .where(eq(seasonalPromotions.id, promotionId));
  }

  async deactivateSeasonalPromotion(promotionId: string): Promise<void> {
    await db.update(seasonalPromotions)
      .set({ isActive: false })
      .where(eq(seasonalPromotions.id, promotionId));
  }

  async getActiveSeasonalPromotions(storeId: string): Promise<SeasonalPromotion[]> {
    return await db.select().from(seasonalPromotions)
      .where(and(
        eq(seasonalPromotions.storeId, storeId),
        eq(seasonalPromotions.isActive, true)
      ))
      .orderBy(desc(seasonalPromotions.createdAt));
  }

  // Discount analytics methods
  async createDiscountAnalytics(analytics: InsertDiscountAnalytics): Promise<DiscountAnalytics> {
    const [newAnalytics] = await db.insert(discountAnalytics).values(analytics).returning();
    return newAnalytics;
  }

  async getAnalyticsByCampaign(campaignId: string, startDate?: Date, endDate?: Date): Promise<DiscountAnalytics[]> {
    let query = db.select().from(discountAnalytics)
      .where(eq(discountAnalytics.campaignId, campaignId));
    
    if (startDate && endDate) {
      query = query.where(and(
        eq(discountAnalytics.campaignId, campaignId),
        gte(discountAnalytics.date, startDate),
        lte(discountAnalytics.date, endDate)
      ));
    }
    
    return await query.orderBy(desc(discountAnalytics.date));
  }

  async updateAnalytics(campaignId: string, updates: Partial<InsertDiscountAnalytics>): Promise<void> {
    await db.update(discountAnalytics)
      .set(updates)
      .where(eq(discountAnalytics.campaignId, campaignId));
  }

  async getAnalyticsSummary(campaignId: string): Promise<{
    totalImpressions: number;
    totalClicks: number;
    totalConversions: number;
    totalRevenue: number;
    totalDiscount: number;
    conversionRate: number;
  }> {
    const analytics = await db.select().from(discountAnalytics)
      .where(eq(discountAnalytics.campaignId, campaignId));
    
    const summary = analytics.reduce((acc, record) => ({
      totalImpressions: acc.totalImpressions + (record.impressions || 0),
      totalClicks: acc.totalClicks + (record.clicks || 0),
      totalConversions: acc.totalConversions + (record.conversions || 0),
      totalRevenue: acc.totalRevenue + parseFloat(record.revenue || '0'),
      totalDiscount: acc.totalDiscount + parseFloat(record.discountAmount || '0'),
      conversionRate: 0, // Will be calculated below
    }), {
      totalImpressions: 0,
      totalClicks: 0,
      totalConversions: 0,
      totalRevenue: 0,
      totalDiscount: 0,
      conversionRate: 0,
    });
    
    summary.conversionRate = summary.totalClicks > 0 
      ? (summary.totalConversions / summary.totalClicks) * 100 
      : 0;
    
    return summary;
  }
}

export const storage = new DatabaseStorage();
