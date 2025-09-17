import { 
  stores, products, milestones, cartSessions, rewardHistory, users,
  type Store, type InsertStore,
  type Product, type InsertProduct,
  type Milestone, type InsertMilestone,
  type CartSession, type InsertCartSession,
  type RewardHistory, type InsertRewardHistory,
  type User, type InsertUser
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
}

export const storage = new DatabaseStorage();
