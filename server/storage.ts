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
import { inArray } from "drizzle-orm";
import { eq, and, gte, lte, desc, or, sql, isNull } from "drizzle-orm";

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

  // Milestone methods - Enhanced with full CRUD and conditions
  createMilestone(milestone: InsertMilestone): Promise<Milestone>;
  getMilestonesByStore(storeId: string, includeDeleted?: boolean): Promise<Milestone[]>;
  getMilestoneById(milestoneId: string): Promise<Milestone | undefined>;
  updateMilestone(milestoneId: string, updates: Partial<InsertMilestone>, modifiedBy?: string): Promise<Milestone | undefined>;
  deleteMilestone(milestoneId: string): Promise<void>; // Soft delete
  pauseMilestone(milestoneId: string, modifiedBy?: string): Promise<void>;
  resumeMilestone(milestoneId: string, modifiedBy?: string): Promise<void>;
  getActiveMilestonesByThreshold(storeId: string, cartValue: number, customerSegment?: string): Promise<Milestone[]>;
  getMilestoneStats(milestoneId: string): Promise<{
    totalUsage: number;
    uniqueCustomers: number;
    totalDiscount: number;
    averageOrderValue: number;
  }>;
  duplicateMilestone(milestoneId: string, newName: string, createdBy?: string): Promise<Milestone>;
  getMilestonesByStatus(storeId: string, status: 'active' | 'paused' | 'deleted'): Promise<Milestone[]>;
  updateMilestoneUsage(milestoneId: string): Promise<void>;
  getMilestoneHistory(milestoneId: string): Promise<any[]>; // Change log
  validateMilestoneConditions(milestoneId: string, cartData: any): Promise<boolean>;

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
  getCampaignStats(campaignId: string): Promise<{
    totalUsage: number;
    uniqueCustomers: number;
    totalDiscount: number;
    averageOrderValue: number;
  }>;
  duplicateCampaign(campaignId: string, newName: string, createdBy?: string): Promise<DiscountCampaign>;

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
  getSeasonalPromotionStats(promotionId: string): Promise<{
    totalUsage: number;
    uniqueCustomers: number;
    totalDiscount: number;
    averageOrderValue: number;
  }>;
  duplicateSeasonalPromotion(promotionId: string, newName: string, createdBy?: string): Promise<SeasonalPromotion>;

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

  // Enhanced Milestone methods with full CRUD and management features
  async createMilestone(milestone: InsertMilestone): Promise<Milestone> {
    const [newMilestone] = await db.insert(milestones).values({
      ...milestone,
      updatedAt: new Date()
    }).returning();
    return newMilestone;
  }

  async getMilestonesByStore(storeId: string, includeDeleted?: boolean): Promise<Milestone[]> {
    let whereCondition = eq(milestones.storeId, storeId);
    
    if (!includeDeleted) {
      whereCondition = and(whereCondition, eq(milestones.status, 'active')) as any;
    }
    
    return await db.select().from(milestones)
      .where(whereCondition)
      .orderBy(milestones.displayOrder, milestones.thresholdAmount);
  }

  async getMilestoneById(milestoneId: string): Promise<Milestone | undefined> {
    const [milestone] = await db.select().from(milestones)
      .where(eq(milestones.id, milestoneId));
    return milestone || undefined;
  }

  async updateMilestone(milestoneId: string, updates: Partial<InsertMilestone>, modifiedBy?: string): Promise<Milestone | undefined> {
    const [updatedMilestone] = await db.update(milestones)
      .set({ 
        ...updates, 
        updatedAt: new Date(),
        lastModifiedBy: modifiedBy
      })
      .where(eq(milestones.id, milestoneId))
      .returning();
    return updatedMilestone || undefined;
  }

  async deleteMilestone(milestoneId: string): Promise<void> {
    await db.update(milestones)
      .set({ 
        status: 'deleted', 
        isActive: false, 
        updatedAt: new Date() 
      })
      .where(eq(milestones.id, milestoneId));
  }

  async pauseMilestone(milestoneId: string, modifiedBy?: string): Promise<void> {
    await db.update(milestones)
      .set({ 
        status: 'paused', 
        isActive: false, 
        updatedAt: new Date(),
        lastModifiedBy: modifiedBy
      })
      .where(eq(milestones.id, milestoneId));
  }

  async resumeMilestone(milestoneId: string, modifiedBy?: string): Promise<void> {
    await db.update(milestones)
      .set({ 
        status: 'active', 
        isActive: true, 
        updatedAt: new Date(),
        lastModifiedBy: modifiedBy
      })
      .where(eq(milestones.id, milestoneId));
  }

  async getActiveMilestonesByThreshold(storeId: string, cartValue: number, customerSegment: string = 'all'): Promise<Milestone[]> {
    const currentDate = new Date();
    
    return await db.select().from(milestones)
      .where(and(
        eq(milestones.storeId, storeId),
        eq(milestones.status, 'active'),
        eq(milestones.isActive, true),
        lte(milestones.thresholdAmount, cartValue.toString()),
        // Check date ranges
        or(
          isNull(milestones.startDate),
          lte(milestones.startDate, currentDate)
        ),
        or(
          isNull(milestones.endDate),
          gte(milestones.endDate, currentDate)
        )
      ))
      .orderBy(milestones.priority, milestones.thresholdAmount);
  }

  async getMilestoneStats(milestoneId: string): Promise<{
    totalUsage: number;
    uniqueCustomers: number;
    totalDiscount: number;
    averageOrderValue: number;
  }> {
    // Implementation for milestone statistics
    const [milestone] = await db.select().from(milestones)
      .where(eq(milestones.id, milestoneId));
    
    if (!milestone) {
      throw new Error('Milestone not found');
    }

    // Get reward history for this milestone
    const rewards = await db.select().from(rewardHistory)
      .where(eq(rewardHistory.milestoneId, milestoneId));

    const uniqueCustomers = new Set(rewards.map(r => r.cartSessionId)).size;
    const totalDiscount = rewards.reduce((sum, r) => sum + parseFloat(r.rewardValue || '0'), 0);

    return {
      totalUsage: milestone.usageCount || 0,
      uniqueCustomers,
      totalDiscount,
      averageOrderValue: uniqueCustomers > 0 ? totalDiscount / uniqueCustomers : 0
    };
  }

  async duplicateMilestone(milestoneId: string, newName: string, createdBy?: string): Promise<Milestone> {
    const [originalMilestone] = await db.select().from(milestones)
      .where(eq(milestones.id, milestoneId));
    
    if (!originalMilestone) {
      throw new Error('Original milestone not found');
    }

    const { id, createdAt, updatedAt, usageCount, ...milestoneData } = originalMilestone;

    const [duplicatedMilestone] = await db.insert(milestones).values({
      ...milestoneData,
      name: newName,
      status: 'paused', // Start as paused
      usageCount: 0,
      createdBy,
      lastModifiedBy: createdBy,
      updatedAt: new Date()
    }).returning();

    return duplicatedMilestone;
  }

  async getMilestonesByStatus(storeId: string, status: 'active' | 'paused' | 'deleted'): Promise<Milestone[]> {
    return await db.select().from(milestones)
      .where(and(
        eq(milestones.storeId, storeId),
        eq(milestones.status, status)
      ))
      .orderBy(milestones.displayOrder, milestones.thresholdAmount);
  }

  async updateMilestoneUsage(milestoneId: string): Promise<void> {
    await db.update(milestones)
      .set({ 
        usageCount: sql`${milestones.usageCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(milestones.id, milestoneId));
  }

  async getMilestoneHistory(milestoneId: string): Promise<any[]> {
    // For now, return basic milestone data
    // This could be enhanced with a separate audit log table
    const milestone = await this.getMilestoneById(milestoneId);
    return milestone ? [milestone] : [];
  }

  async validateMilestoneConditions(milestoneId: string, cartData: any): Promise<boolean> {
    const milestone = await this.getMilestoneById(milestoneId);
    if (!milestone) return false;

    // Check if milestone is active
    if (milestone.status !== 'active' || !milestone.isActive) {
      return false;
    }

    // Check date ranges
    const now = new Date();
    if (milestone.startDate && now < milestone.startDate) {
      return false;
    }
    if (milestone.endDate && now > milestone.endDate) {
      return false;
    }

    // Check usage limits
    if (milestone.usageLimit && (milestone.usageCount || 0) >= milestone.usageLimit) {
      return false;
    }

    // Check threshold
    if (parseFloat(cartData.total) < parseFloat(milestone.thresholdAmount)) {
      return false;
    }

    // Check customer segment
    const customerSegment = cartData.customerSegment || 'all';
    if (!milestone.customerSegments?.includes('all') && 
        !milestone.customerSegments?.includes(customerSegment)) {
      return false;
    }

    // Additional conditions can be added here based on the conditions JSON field
    
    return true;
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

  async getDiscountCampaignsByStore(storeId: string, statusFilter?: string[]): Promise<DiscountCampaign[]> {
    let whereCondition = eq(discountCampaigns.storeId, storeId);
    
    if (statusFilter && statusFilter.length > 0) {
      whereCondition = and(
        whereCondition,
        inArray(discountCampaigns.status, statusFilter)
      ) as any;
    }
    
    return await db.select().from(discountCampaigns)
      .where(whereCondition)
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

  async getCampaignStats(campaignId: string): Promise<{
    totalUsage: number;
    uniqueCustomers: number;
    totalDiscount: number;
    averageOrderValue: number;
  }> {
    // Implementation for campaign statistics
    const [campaign] = await db.select().from(discountCampaigns)
      .where(eq(discountCampaigns.id, campaignId));
    
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    // Get analytics data for this campaign
    const analytics = await db.select().from(discountAnalytics)
      .where(eq(discountAnalytics.campaignId, campaignId));

    const totalRevenue = analytics.reduce((sum, a) => sum + parseFloat(a.totalRevenue || '0'), 0);
    const totalConversions = analytics.reduce((sum, a) => sum + (a.totalConversions || 0), 0);

    return {
      totalUsage: campaign.usageCount || 0,
      uniqueCustomers: totalConversions,
      totalDiscount: parseFloat(campaign.discountValue || '0') * (campaign.usageCount || 0),
      averageOrderValue: totalConversions > 0 ? totalRevenue / totalConversions : 0
    };
  }

  async duplicateCampaign(campaignId: string, newName: string, createdBy?: string): Promise<DiscountCampaign> {
    const [originalCampaign] = await db.select().from(discountCampaigns)
      .where(eq(discountCampaigns.id, campaignId));
    
    if (!originalCampaign) {
      throw new Error('Original campaign not found');
    }

    const { id, createdAt, updatedAt, usageCount, ...campaignData } = originalCampaign;

    const [duplicatedCampaign] = await db.insert(discountCampaigns).values({
      ...campaignData,
      name: newName,
      status: 'draft', // Start as draft
      usageCount: 0,
      modifiedBy: createdBy,
      updatedAt: new Date()
    }).returning();

    return duplicatedCampaign;
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

  async getSeasonalPromotionStats(promotionId: string): Promise<{
    totalUsage: number;
    uniqueCustomers: number;
    totalDiscount: number;
    averageOrderValue: number;
  }> {
    // Implementation for seasonal promotion statistics
    const [promotion] = await db.select().from(seasonalPromotions)
      .where(eq(seasonalPromotions.id, promotionId));
    
    if (!promotion) {
      throw new Error('Seasonal promotion not found');
    }

    // Get reward history data for this promotion (seasonal promotions can have milestone rewards)
    const rewards = await db.select().from(rewardHistory)
      .where(eq(rewardHistory.promotionId, promotionId));

    const uniqueCustomers = new Set(rewards.map(r => r.cartSessionId)).size;
    const totalDiscount = rewards.reduce((sum, r) => sum + parseFloat(r.rewardValue || '0'), 0);

    return {
      totalUsage: promotion.usageCount || 0,
      uniqueCustomers,
      totalDiscount,
      averageOrderValue: uniqueCustomers > 0 ? totalDiscount / uniqueCustomers : 0
    };
  }

  async duplicateSeasonalPromotion(promotionId: string, newName: string, createdBy?: string): Promise<SeasonalPromotion> {
    const [originalPromotion] = await db.select().from(seasonalPromotions)
      .where(eq(seasonalPromotions.id, promotionId));
    
    if (!originalPromotion) {
      throw new Error('Original seasonal promotion not found');
    }

    const { id, createdAt, updatedAt, usageCount, ...promotionData } = originalPromotion;

    const [duplicatedPromotion] = await db.insert(seasonalPromotions).values({
      ...promotionData,
      name: newName,
      isActive: false, // Start as inactive
      usageCount: 0,
      modifiedBy: createdBy,
      updatedAt: new Date()
    }).returning();

    return duplicatedPromotion;
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
      return await db.select().from(discountAnalytics)
        .where(and(
          eq(discountAnalytics.campaignId, campaignId),
          gte(discountAnalytics.date, startDate),
          lte(discountAnalytics.date, endDate)
        ))
        .orderBy(desc(discountAnalytics.date));
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
