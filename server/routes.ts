import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertStoreSchema, 
  insertProductSchema, 
  insertMilestoneSchema, 
  insertCartSessionSchema,
  insertDiscountCampaignSchema,
  insertDiscountRuleSchema,
  insertCampaignProductSchema,
  insertBundleConfigurationSchema,
  insertBundleItemSchema,
  insertSeasonalPromotionSchema,
  insertDiscountAnalyticsSchema
} from "@shared/schema";
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

  // Enhanced Milestone Management Routes
  app.post("/api/stores/:storeId/milestones", async (req, res) => {
    try {
      const { storeId } = req.params;
      console.log("Milestone creation request:", {
        storeId,
        body: req.body,
        bodyKeys: Object.keys(req.body)
      });
      
      const milestoneData = insertMilestoneSchema.parse({ ...req.body, storeId });
      console.log("Parsed milestone data:", milestoneData);
      
      const milestone = await storage.createMilestone(milestoneData);
      res.json(milestone);
    } catch (error) {
      console.error("Milestone creation error:", error);
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      res.status(400).json({ message: "Invalid milestone data", error: error instanceof Error ? error.message : error });
    }
  });

  app.get("/api/stores/:storeId/milestones", async (req, res) => {
    try {
      const { storeId } = req.params;
      const { includeDeleted, status } = req.query;
      
      let milestones;
      if (status) {
        milestones = await storage.getMilestonesByStatus(storeId, status as 'active' | 'paused' | 'deleted');
      } else {
        milestones = await storage.getMilestonesByStore(storeId, includeDeleted === 'true');
      }
      
      res.json(milestones);
    } catch (error) {
      res.status(500).json({ message: "Error fetching milestones", error });
    }
  });

  app.get("/api/milestones/:milestoneId", async (req, res) => {
    try {
      const { milestoneId } = req.params;
      const milestone = await storage.getMilestoneById(milestoneId);
      if (!milestone) {
        return res.status(404).json({ message: "Milestone not found" });
      }
      res.json(milestone);
    } catch (error) {
      res.status(500).json({ message: "Error fetching milestone", error });
    }
  });

  app.put("/api/milestones/:milestoneId", async (req, res) => {
    try {
      const { milestoneId } = req.params;
      const updates = insertMilestoneSchema.partial().parse(req.body);
      const milestone = await storage.updateMilestone(milestoneId, updates, req.body.modifiedBy);
      
      if (!milestone) {
        return res.status(404).json({ message: "Milestone not found" });
      }
      
      res.json(milestone);
    } catch (error) {
      res.status(400).json({ message: "Invalid milestone update data", error });
    }
  });

  app.delete("/api/milestones/:milestoneId", async (req, res) => {
    try {
      const { milestoneId } = req.params;
      await storage.deleteMilestone(milestoneId);
      res.json({ message: "Milestone deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting milestone", error });
    }
  });

  app.post("/api/milestones/:milestoneId/pause", async (req, res) => {
    try {
      const { milestoneId } = req.params;
      const { modifiedBy } = req.body;
      await storage.pauseMilestone(milestoneId, modifiedBy);
      res.json({ message: "Milestone paused successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error pausing milestone", error });
    }
  });

  app.post("/api/milestones/:milestoneId/resume", async (req, res) => {
    try {
      const { milestoneId } = req.params;
      const { modifiedBy } = req.body;
      await storage.resumeMilestone(milestoneId, modifiedBy);
      res.json({ message: "Milestone resumed successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error resuming milestone", error });
    }
  });

  app.post("/api/milestones/:milestoneId/duplicate", async (req, res) => {
    try {
      const { milestoneId } = req.params;
      const { newName, createdBy } = req.body;
      const duplicatedMilestone = await storage.duplicateMilestone(milestoneId, newName, createdBy);
      res.json(duplicatedMilestone);
    } catch (error) {
      res.status(500).json({ message: "Error duplicating milestone", error });
    }
  });

  app.get("/api/milestones/:milestoneId/stats", async (req, res) => {
    try {
      const { milestoneId } = req.params;
      const stats = await storage.getMilestoneStats(milestoneId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Error fetching milestone stats", error });
    }
  });

  app.get("/api/milestones/:milestoneId/history", async (req, res) => {
    try {
      const { milestoneId } = req.params;
      const history = await storage.getMilestoneHistory(milestoneId);
      res.json(history);
    } catch (error) {
      res.status(500).json({ message: "Error fetching milestone history", error });
    }
  });

  app.post("/api/milestones/:milestoneId/validate", async (req, res) => {
    try {
      const { milestoneId } = req.params;
      const cartData = req.body;
      const isValid = await storage.validateMilestoneConditions(milestoneId, cartData);
      res.json({ valid: isValid });
    } catch (error) {
      res.status(500).json({ message: "Error validating milestone conditions", error });
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
        totalRevenueImpact: 0, // Can be computed from reward history data or set initially
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
        { storeId, name: 'Free Delivery', thresholdAmount: '2500', rewardType: 'free_delivery', freeProductCount: 0 },
        { storeId, name: 'Free Product - Level 1', thresholdAmount: '3000', rewardType: 'free_products', freeProductCount: 1 },
        { storeId, name: 'Free Product - Level 2', thresholdAmount: '4000', rewardType: 'free_products', freeProductCount: 2 },
        { storeId, name: 'Free Product - Level 3', thresholdAmount: '5000', rewardType: 'free_products', freeProductCount: 3 },
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

  // Discount Campaign Management Routes
  app.post("/api/stores/:storeId/campaigns", async (req, res) => {
    try {
      const { storeId } = req.params;
      const requestData = { ...req.body, storeId };
      
      // Convert ISO date strings to Date objects if present
      if (requestData.startDate && typeof requestData.startDate === 'string') {
        requestData.startDate = new Date(requestData.startDate);
      }
      if (requestData.endDate && typeof requestData.endDate === 'string') {
        requestData.endDate = new Date(requestData.endDate);
      }
      
      const campaignData = insertDiscountCampaignSchema.parse(requestData);
      const campaign = await storage.createDiscountCampaign(campaignData);
      res.json(campaign);
    } catch (error) {
      console.error("Campaign creation error:", error);
      res.status(400).json({ message: "Invalid campaign data", error: error instanceof Error ? error.message : error });
    }
  });

  app.get("/api/stores/:storeId/campaigns", async (req, res) => {
    try {
      const { storeId } = req.params;
      const { status } = req.query;
      
      let statusFilter: string[] | undefined;
      if (status) {
        // If status is provided as query param, split by comma
        statusFilter = String(status).split(',').map(s => s.trim());
      } else {
        // Default: show draft, active and paused campaigns, exclude deleted ones
        statusFilter = ['draft', 'active', 'paused'];
      }
      
      const campaigns = await storage.getDiscountCampaignsByStore(storeId, statusFilter);
      res.json(campaigns);
    } catch (error) {
      res.status(500).json({ message: "Error fetching campaigns", error });
    }
  });

  app.get("/api/campaigns/:campaignId", async (req, res) => {
    try {
      const { campaignId } = req.params;
      const campaign = await storage.getDiscountCampaignById(campaignId);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      res.json(campaign);
    } catch (error) {
      res.status(500).json({ message: "Error fetching campaign", error });
    }
  });

  app.put("/api/campaigns/:campaignId", async (req, res) => {
    try {
      const { campaignId } = req.params;
      const updates = req.body;
      const updatedCampaign = await storage.updateDiscountCampaign(campaignId, updates);
      if (!updatedCampaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      res.json(updatedCampaign);
    } catch (error) {
      res.status(400).json({ message: "Error updating campaign", error });
    }
  });

  app.delete("/api/campaigns/:campaignId", async (req, res) => {
    try {
      const { campaignId } = req.params;
      await storage.deleteDiscountCampaign(campaignId);
      res.json({ message: "Campaign deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting campaign", error });
    }
  });

  app.patch("/api/campaigns/:campaignId/status", async (req, res) => {
    try {
      const { campaignId } = req.params;
      const { status } = z.object({ status: z.string() }).parse(req.body);
      await storage.updateCampaignStatus(campaignId, status);
      res.json({ message: "Campaign status updated" });
    } catch (error) {
      res.status(400).json({ message: "Error updating campaign status", error });
    }
  });

  app.get("/api/stores/:storeId/campaigns/active", async (req, res) => {
    try {
      const { storeId } = req.params;
      const campaigns = await storage.getActiveCampaignsByStore(storeId);
      res.json(campaigns);
    } catch (error) {
      res.status(500).json({ message: "Error fetching active campaigns", error });
    }
  });

  // Discount Rules Management
  app.post("/api/campaigns/:campaignId/rules", async (req, res) => {
    try {
      const { campaignId } = req.params;
      const ruleData = insertDiscountRuleSchema.parse({ ...req.body, campaignId });
      const rule = await storage.createDiscountRule(ruleData);
      res.json(rule);
    } catch (error) {
      res.status(400).json({ message: "Invalid rule data", error });
    }
  });

  app.get("/api/campaigns/:campaignId/rules", async (req, res) => {
    try {
      const { campaignId } = req.params;
      const rules = await storage.getDiscountRulesByCampaign(campaignId);
      res.json(rules);
    } catch (error) {
      res.status(500).json({ message: "Error fetching rules", error });
    }
  });

  app.put("/api/rules/:ruleId", async (req, res) => {
    try {
      const { ruleId } = req.params;
      const updates = req.body;
      const updatedRule = await storage.updateDiscountRule(ruleId, updates);
      if (!updatedRule) {
        return res.status(404).json({ message: "Rule not found" });
      }
      res.json(updatedRule);
    } catch (error) {
      res.status(400).json({ message: "Error updating rule", error });
    }
  });

  app.delete("/api/rules/:ruleId", async (req, res) => {
    try {
      const { ruleId } = req.params;
      await storage.deleteDiscountRule(ruleId);
      res.json({ message: "Rule deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting rule", error });
    }
  });

  // Campaign Product Management
  app.post("/api/campaigns/:campaignId/products", async (req, res) => {
    try {
      const { campaignId } = req.params;
      const { productId, inclusionType } = z.object({
        productId: z.string(),
        inclusionType: z.enum(['include', 'exclude'])
      }).parse(req.body);
      
      const campaignProduct = await storage.addProductToCampaign({
        campaignId,
        productId,
        inclusionType
      });
      res.json(campaignProduct);
    } catch (error) {
      res.status(400).json({ message: "Error adding product to campaign", error });
    }
  });

  app.get("/api/campaigns/:campaignId/products", async (req, res) => {
    try {
      const { campaignId } = req.params;
      const products = await storage.getCampaignProducts(campaignId);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Error fetching campaign products", error });
    }
  });

  app.delete("/api/campaigns/:campaignId/products/:productId", async (req, res) => {
    try {
      const { campaignId, productId } = req.params;
      await storage.removeProductFromCampaign(campaignId, productId);
      res.json({ message: "Product removed from campaign" });
    } catch (error) {
      res.status(500).json({ message: "Error removing product from campaign", error });
    }
  });

  app.get("/api/products/:productId/campaigns", async (req, res) => {
    try {
      const { productId } = req.params;
      const campaigns = await storage.getProductCampaigns(productId);
      res.json(campaigns);
    } catch (error) {
      res.status(500).json({ message: "Error fetching product campaigns", error });
    }
  });

  // Bundle Configuration Management
  app.post("/api/campaigns/:campaignId/bundles", async (req, res) => {
    try {
      const { campaignId } = req.params;
      const bundleData = insertBundleConfigurationSchema.parse({ ...req.body, campaignId });
      const bundle = await storage.createBundleConfiguration(bundleData);
      res.json(bundle);
    } catch (error) {
      res.status(400).json({ message: "Invalid bundle data", error });
    }
  });

  app.get("/api/campaigns/:campaignId/bundles", async (req, res) => {
    try {
      const { campaignId } = req.params;
      const bundles = await storage.getBundleConfigurationsByCampaign(campaignId);
      res.json(bundles);
    } catch (error) {
      res.status(500).json({ message: "Error fetching bundles", error });
    }
  });

  app.get("/api/bundles/:bundleId", async (req, res) => {
    try {
      const { bundleId } = req.params;
      const bundle = await storage.getBundleConfigurationById(bundleId);
      if (!bundle) {
        return res.status(404).json({ message: "Bundle not found" });
      }
      res.json(bundle);
    } catch (error) {
      res.status(500).json({ message: "Error fetching bundle", error });
    }
  });

  app.put("/api/bundles/:bundleId", async (req, res) => {
    try {
      const { bundleId } = req.params;
      const updates = req.body;
      const updatedBundle = await storage.updateBundleConfiguration(bundleId, updates);
      if (!updatedBundle) {
        return res.status(404).json({ message: "Bundle not found" });
      }
      res.json(updatedBundle);
    } catch (error) {
      res.status(400).json({ message: "Error updating bundle", error });
    }
  });

  app.delete("/api/bundles/:bundleId", async (req, res) => {
    try {
      const { bundleId } = req.params;
      await storage.deleteBundleConfiguration(bundleId);
      res.json({ message: "Bundle deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting bundle", error });
    }
  });

  // Bundle Items Management
  app.post("/api/bundles/:bundleId/items", async (req, res) => {
    try {
      const { bundleId } = req.params;
      const bundleItemData = insertBundleItemSchema.parse({ ...req.body, bundleId });
      const bundleItem = await storage.addBundleItem(bundleItemData);
      res.json(bundleItem);
    } catch (error) {
      res.status(400).json({ message: "Invalid bundle item data", error });
    }
  });

  app.get("/api/bundles/:bundleId/items", async (req, res) => {
    try {
      const { bundleId } = req.params;
      const items = await storage.getBundleItems(bundleId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Error fetching bundle items", error });
    }
  });

  app.delete("/api/bundles/:bundleId/items/:productId", async (req, res) => {
    try {
      const { bundleId, productId } = req.params;
      await storage.removeBundleItem(bundleId, productId);
      res.json({ message: "Bundle item removed" });
    } catch (error) {
      res.status(500).json({ message: "Error removing bundle item", error });
    }
  });

  app.patch("/api/bundles/:bundleId/items/:productId/quantity", async (req, res) => {
    try {
      const { bundleId, productId } = req.params;
      const { quantity } = z.object({ quantity: z.number().min(1) }).parse(req.body);
      await storage.updateBundleItemQuantity(bundleId, productId, quantity);
      res.json({ message: "Bundle item quantity updated" });
    } catch (error) {
      res.status(400).json({ message: "Error updating bundle item quantity", error });
    }
  });

  // Seasonal Promotions Management
  app.post("/api/stores/:storeId/seasonal-promotions", async (req, res) => {
    try {
      const { storeId } = req.params;
      const promotionData = insertSeasonalPromotionSchema.parse({ ...req.body, storeId });
      const promotion = await storage.createSeasonalPromotion(promotionData);
      res.json(promotion);
    } catch (error) {
      res.status(400).json({ message: "Invalid promotion data", error });
    }
  });

  app.get("/api/stores/:storeId/seasonal-promotions", async (req, res) => {
    try {
      const { storeId } = req.params;
      const promotions = await storage.getSeasonalPromotionsByStore(storeId);
      res.json(promotions);
    } catch (error) {
      res.status(500).json({ message: "Error fetching seasonal promotions", error });
    }
  });

  app.get("/api/stores/:storeId/seasonal-promotions/active", async (req, res) => {
    try {
      const { storeId } = req.params;
      const promotions = await storage.getActiveSeasonalPromotions(storeId);
      res.json(promotions);
    } catch (error) {
      res.status(500).json({ message: "Error fetching active seasonal promotions", error });
    }
  });

  app.get("/api/seasonal-promotions/:promotionId", async (req, res) => {
    try {
      const { promotionId } = req.params;
      const promotion = await storage.getSeasonalPromotionById(promotionId);
      if (!promotion) {
        return res.status(404).json({ message: "Promotion not found" });
      }
      res.json(promotion);
    } catch (error) {
      res.status(500).json({ message: "Error fetching promotion", error });
    }
  });

  app.put("/api/seasonal-promotions/:promotionId", async (req, res) => {
    try {
      const { promotionId } = req.params;
      const updates = req.body;
      const updatedPromotion = await storage.updateSeasonalPromotion(promotionId, updates);
      if (!updatedPromotion) {
        return res.status(404).json({ message: "Promotion not found" });
      }
      res.json(updatedPromotion);
    } catch (error) {
      res.status(400).json({ message: "Error updating promotion", error });
    }
  });

  app.delete("/api/seasonal-promotions/:promotionId", async (req, res) => {
    try {
      const { promotionId } = req.params;
      await storage.deleteSeasonalPromotion(promotionId);
      res.json({ message: "Promotion deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting promotion", error });
    }
  });

  app.patch("/api/seasonal-promotions/:promotionId/activate", async (req, res) => {
    try {
      const { promotionId } = req.params;
      await storage.activateSeasonalPromotion(promotionId);
      res.json({ message: "Promotion activated" });
    } catch (error) {
      res.status(500).json({ message: "Error activating promotion", error });
    }
  });

  app.patch("/api/seasonal-promotions/:promotionId/deactivate", async (req, res) => {
    try {
      const { promotionId } = req.params;
      await storage.deactivateSeasonalPromotion(promotionId);
      res.json({ message: "Promotion deactivated" });
    } catch (error) {
      res.status(500).json({ message: "Error deactivating promotion", error });
    }
  });

  // Discount Analytics Management
  app.post("/api/campaigns/:campaignId/analytics", async (req, res) => {
    try {
      const { campaignId } = req.params;
      const analyticsData = insertDiscountAnalyticsSchema.parse({ ...req.body, campaignId });
      const analytics = await storage.createDiscountAnalytics(analyticsData);
      res.json(analytics);
    } catch (error) {
      res.status(400).json({ message: "Invalid analytics data", error });
    }
  });

  app.get("/api/campaigns/:campaignId/analytics", async (req, res) => {
    try {
      const { campaignId } = req.params;
      const { startDate, endDate } = req.query;
      
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;
      
      const analytics = await storage.getAnalyticsByCampaign(campaignId, start, end);
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ message: "Error fetching analytics", error });
    }
  });

  app.get("/api/campaigns/:campaignId/analytics/summary", async (req, res) => {
    try {
      const { campaignId } = req.params;
      const summary = await storage.getAnalyticsSummary(campaignId);
      res.json(summary);
    } catch (error) {
      res.status(500).json({ message: "Error fetching analytics summary", error });
    }
  });

  app.patch("/api/campaigns/:campaignId/analytics", async (req, res) => {
    try {
      const { campaignId } = req.params;
      const updates = req.body;
      await storage.updateAnalytics(campaignId, updates);
      res.json({ message: "Analytics updated" });
    } catch (error) {
      res.status(400).json({ message: "Error updating analytics", error });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
