import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertStoreSchema, insertProductSchema, insertMilestoneSchema, insertCartSessionSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Store management routes
  app.post("/api/stores", async (req, res) => {
    try {
      const storeData = insertStoreSchema.parse(req.body);
      const store = await storage.createStore(storeData);
      res.json(store);
    } catch (error) {
      res.status(400).json({ message: "Invalid store data", error });
    }
  });

  app.get("/api/stores/:shopifyStoreId", async (req, res) => {
    try {
      const { shopifyStoreId } = req.params;
      const store = await storage.getStoreByShopifyId(shopifyStoreId);
      if (!store) {
        return res.status(404).json({ message: "Store not found" });
      }
      res.json(store);
    } catch (error) {
      res.status(500).json({ message: "Error fetching store", error });
    }
  });

  // Product management routes
  app.post("/api/products", async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      res.json(product);
    } catch (error) {
      res.status(400).json({ message: "Invalid product data", error });
    }
  });

  app.get("/api/stores/:storeId/products", async (req, res) => {
    try {
      const { storeId } = req.params;
      const products = await storage.getProductsByStore(storeId);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Error fetching products", error });
    }
  });

  app.get("/api/stores/:storeId/products/eligible", async (req, res) => {
    try {
      const { storeId } = req.params;
      const products = await storage.getEligibleFreeProducts(storeId);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Error fetching eligible products", error });
    }
  });

  // Milestone management routes
  app.post("/api/milestones", async (req, res) => {
    try {
      const milestoneData = insertMilestoneSchema.parse(req.body);
      const milestone = await storage.createMilestone(milestoneData);
      res.json(milestone);
    } catch (error) {
      res.status(400).json({ message: "Invalid milestone data", error });
    }
  });

  app.get("/api/stores/:storeId/milestones", async (req, res) => {
    try {
      const { storeId } = req.params;
      const milestones = await storage.getMilestonesByStore(storeId);
      res.json(milestones);
    } catch (error) {
      res.status(500).json({ message: "Error fetching milestones", error });
    }
  });

  // Cart session routes
  app.post("/api/cart-sessions", async (req, res) => {
    try {
      const cartSessionData = insertCartSessionSchema.parse(req.body);
      const session = await storage.createCartSession({
        ...cartSessionData,
        timerExpiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
      });
      res.json(session);
    } catch (error) {
      res.status(400).json({ message: "Invalid cart session data", error });
    }
  });

  app.get("/api/cart-sessions/:cartToken", async (req, res) => {
    try {
      const { cartToken } = req.params;
      const session = await storage.getCartSessionByToken(cartToken);
      if (!session) {
        return res.status(404).json({ message: "Cart session not found" });
      }
      res.json(session);
    } catch (error) {
      res.status(500).json({ message: "Error fetching cart session", error });
    }
  });

  app.put("/api/cart-sessions/:cartToken/value", async (req, res) => {
    try {
      const { cartToken } = req.params;
      const { currentValue } = z.object({ currentValue: z.number() }).parse(req.body);
      
      // Get current session
      const session = await storage.getCartSessionByToken(cartToken);
      if (!session) {
        return res.status(404).json({ message: "Cart session not found" });
      }

      // Update cart value
      await storage.updateCartValue(cartToken, currentValue);

      // Check for newly unlocked milestones
      const milestones = await storage.getActiveMilestonesByThreshold(session.storeId!, currentValue);
      const unlockedMilestoneIds = milestones.map(m => m.id);
      await storage.updateUnlockedMilestones(cartToken, unlockedMilestoneIds);

      // Create reward history entries for new milestones
      const currentUnlocked = (session.unlockedMilestones as string[]) || [];
      const newMilestones = unlockedMilestoneIds.filter(id => !currentUnlocked.includes(id));
      
      for (const milestoneId of newMilestones) {
        const milestone = milestones.find(m => m.id === milestoneId);
        if (milestone) {
          await storage.createRewardHistory({
            storeId: session.storeId!,
            cartSessionId: session.id,
            milestoneId,
            rewardType: milestone.rewardType,
            rewardValue: milestone.rewardType === 'free_delivery' ? '300' : '0',
          });
        }
      }

      const updatedSession = await storage.getCartSessionByToken(cartToken);
      res.json({ 
        session: updatedSession, 
        newMilestones: newMilestones.length > 0,
        unlockedMilestones: milestones 
      });
    } catch (error) {
      res.status(400).json({ message: "Error updating cart value", error });
    }
  });

  app.put("/api/cart-sessions/:cartToken/free-products", async (req, res) => {
    try {
      const { cartToken } = req.params;
      const { productIds } = z.object({ productIds: z.array(z.string()) }).parse(req.body);
      
      await storage.updateSelectedFreeProducts(cartToken, productIds);
      const session = await storage.getCartSessionByToken(cartToken);
      res.json(session);
    } catch (error) {
      res.status(400).json({ message: "Error updating free products", error });
    }
  });

  // Analytics and reporting
  app.get("/api/stores/:storeId/analytics", async (req, res) => {
    try {
      const { storeId } = req.params;
      const rewardHistory = await storage.getRewardHistoryByStore(storeId);
      
      const analytics = {
        totalRewardsUnlocked: rewardHistory.length,
        conversionRate: 23.5, // This would be calculated based on actual data
        averageOrderValue: 4850,
        milestonesHit: rewardHistory.filter(r => r.isRedeemed).length,
      };
      
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ message: "Error fetching analytics", error });
    }
  });

  // Initialize default milestones for a store
  app.post("/api/stores/:storeId/initialize-milestones", async (req, res) => {
    try {
      const { storeId } = req.params;
      
      const defaultMilestones = [
        { storeId, thresholdAmount: '2500', rewardType: 'free_delivery', freeProductCount: 0 },
        { storeId, thresholdAmount: '3000', rewardType: 'free_products', freeProductCount: 1 },
        { storeId, thresholdAmount: '4000', rewardType: 'free_products', freeProductCount: 2 },
        { storeId, thresholdAmount: '5000', rewardType: 'free_products', freeProductCount: 3 },
      ];

      const createdMilestones = [];
      for (const milestone of defaultMilestones) {
        const created = await storage.createMilestone(milestone);
        createdMilestones.push(created);
      }

      res.json(createdMilestones);
    } catch (error) {
      res.status(500).json({ message: "Error initializing milestones", error });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
