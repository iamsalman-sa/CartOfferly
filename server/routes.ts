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
import fs from "fs";
import path from "path";

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve JavaScript via API path (which we know works)
  app.get("/api/integration-script", (req, res) => {
    res.set({
      'Content-Type': 'application/javascript; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache'
    });
    res.send(`
console.log('🎁 Cart Rewards Script Loading...');

(function() {
  'use strict';
  
  function createRewardsUI() {
    const container = document.createElement('div');
    container.id = 'cart-rewards-container';
    container.style.cssText = \`
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      margin: 16px;
      border-radius: 12px;
      font-family: Arial, sans-serif;
      text-align: center;
    \`;
    
    container.innerHTML = \`
      <h3>🎁 Milestone Rewards</h3>
      <p>✅ PKR 2,500 - Free Delivery</p>
      <p>🎁 PKR 3,000 - 1 Free Product</p>
      <p>🎁 PKR 4,000 - 2 Free Products</p>
      <p>🎁 PKR 5,000 - 3 Free Products</p>
      <div style="margin-top: 15px; padding: 10px; background: rgba(255,255,255,0.2); border-radius: 8px;">
        <strong>Add items to unlock rewards!</strong>
      </div>
    \`;
    
    // Try to find cart container
    const cartContainers = [
      '.cart-drawer__content',
      '.cart__content', 
      '.cart-drawer',
      '.cart',
      '#cart-drawer',
      'body'
    ];
    
    let targetContainer = null;
    for (const selector of cartContainers) {
      targetContainer = document.querySelector(selector);
      if (targetContainer) {
        console.log('🎯 Found container:', selector);
        break;
      }
    }
    
    if (targetContainer) {
      if (targetContainer.firstChild) {
        targetContainer.insertBefore(container, targetContainer.firstChild);
      } else {
        targetContainer.appendChild(container);
      }
      console.log('✅ Rewards UI added to cart!');
    }
  }
  
  // Initialize when ready
  function init() {
    console.log('🚀 Initializing Cart Rewards...');
    
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', createRewardsUI);
    } else {
      setTimeout(createRewardsUI, 1000);
    }
    
    // Also try when cart events happen
    document.addEventListener('click', function(e) {
      if (e.target.matches('[data-cart-drawer], .cart-drawer-toggle, [href="/cart"]')) {
        setTimeout(createRewardsUI, 500);
      }
    });
  }
  
  init();
})();

console.log('✅ Cart Rewards Script Loaded Successfully!');
    `);
  });

  // Serve Shopify integration script directly via API route
  app.get("/shopify-cart-integration.js", (req, res) => {
    const jsContent = `/**
 * Shopify Cart Rewards Integration Script
 * Connects www.realbeauty.store to cartofferly.onrender.com milestone system
 */

(function() {
  'use strict';
  
  // Configuration for Real Beauty Store
  const CONFIG = {
    adminApiUrl: 'https://cartofferly.onrender.com',
    shopifyStoreId: 'real-beauty-9914.myshopify.com',
    milestoneContainerId: 'cart-rewards-milestones',
    cartPollInterval: 3000,
    debug: true // Enable detailed logging
  };

  let currentCartTotal = 0;
  let milestones = [];
  let cartSession = null;
  let isInitialized = false;

  // Debug logging
  function debugLog(message, data = null) {
    if (CONFIG.debug) {
      console.log("🎯 [Cart Rewards] " + message, data || '');
    }
  }

  // Initialize the integration
  function init() {
    if (isInitialized) {
      debugLog('Already initialized, skipping...');
      return;
    }

    debugLog('Initializing Shopify Cart Rewards Integration...');
    debugLog('Config:', CONFIG);
    
    // Load milestones first
    loadMilestones()
      .then((loadedMilestones) => {
        if (loadedMilestones && loadedMilestones.length > 0) {
          milestones = loadedMilestones;
          debugLog("✅ Loaded " + milestones.length + " milestones:", milestones);
          
          // Get initial cart total
          return getCurrentCartTotal();
        } else {
          throw new Error('No milestones loaded from API');
        }
      })
      .then((cartTotal) => {
        currentCartTotal = cartTotal;
        debugLog("💰 Initial cart total: PKR " + currentCartTotal);
        
        // Create UI
        createMilestoneUI();
        
        // Start monitoring
        startCartMonitoring();
        
        isInitialized = true;
        debugLog('✅ Cart Rewards Integration loaded successfully!');
      })
      .catch(error => {
        console.error('❌ Failed to initialize Cart Rewards:', error);
        debugLog('Initialization failed:', error.message);
      });
  }

  // Load milestones from Render API with better error handling
  async function loadMilestones() {
    try {
      debugLog("📡 Fetching milestones from: " + CONFIG.adminApiUrl + "/api/stores/" + CONFIG.shopifyStoreId + "/milestones");
      
      const response = await fetch(CONFIG.adminApiUrl + "/api/stores/" + CONFIG.shopifyStoreId + "/milestones", {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        mode: 'cors'
      });
      
      debugLog("📡 API Response Status: " + response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        debugLog("❌ API Error Response:", errorText);
        throw new Error("API Error " + response.status + ": " + errorText);
      }
      
      const data = await response.json();
      debugLog("📊 Raw milestone data:", data);
      
      if (!Array.isArray(data)) {
        throw new Error("Invalid milestone data format: " + typeof data);
      }
      
      if (data.length === 0) {
        debugLog('⚠️ No milestones found for store. Checking alternatives...');
        
        // Try alternative store IDs
        const alternatives = ['development-store', 'realbeauty-store', 'real-beauty'];
        for (const altStoreId of alternatives) {
          try {
            debugLog("🔄 Trying alternative store ID: " + altStoreId);
            const altResponse = await fetch(CONFIG.adminApiUrl + "/api/stores/" + altStoreId + "/milestones");
            if (altResponse.ok) {
              const altData = await altResponse.json();
              if (altData.length > 0) {
                debugLog("✅ Found milestones with store ID: " + altStoreId, altData);
                CONFIG.shopifyStoreId = altStoreId; // Update config
                return processMilestones(altData);
              }
            }
          } catch (e) {
            debugLog("❌ Alternative " + altStoreId + " failed:", e.message);
          }
        }
        
        throw new Error('No milestones found with any store ID');
      }
      
      return processMilestones(data);
      
    } catch (error) {
      debugLog("❌ loadMilestones error:", error);
      throw error;
    }
  }

  // Process and sort milestone data
  function processMilestones(rawMilestones) {
    const processed = rawMilestones
      .filter(m => m.status === 'active' && m.thresholdAmount > 0)
      .map(m => ({
        id: m.id,
        name: m.name,
        amount: parseFloat(m.thresholdAmount),
        rewardType: m.rewardType,
        icon: m.icon || (m.rewardType === 'free_delivery' ? '🚚' : '🎁'),
        color: m.color || '#e91e63'
      }))
      .sort((a, b) => a.amount - b.amount);
    
    debugLog("🎯 Processed milestones:", processed);
    return processed;
  }

  // Get current cart total from Shopify
  async function getCurrentCartTotal() {
    try {
      const response = await fetch('/cart.js');
      const cart = await response.json();
      const total = cart.total_price / 100; // Convert from cents
      debugLog("💰 Cart total from Shopify: PKR " + total);
      return total;
    } catch (error) {
      debugLog('❌ Failed to get cart total:', error);
      return 0;
    }
  }

  // Create milestone UI with enhanced styling
  function createMilestoneUI() {
    // Remove existing container if present
    const existing = document.getElementById(CONFIG.milestoneContainerId);
    if (existing) {
      existing.remove();
    }

    // Find the best place to insert milestones
    const cartSelectors = [
      '.cart-drawer__content',
      '.cart__content', 
      '.cart-drawer',
      '.cart',
      '#cart-drawer',
      '.js-cart-drawer',
      '[data-cart]',
      '.drawer__content',
      '.cart-items'
    ];
    
    let cartContainer = null;
    for (const selector of cartSelectors) {
      cartContainer = document.querySelector(selector);
      if (cartContainer) {
        debugLog("✅ Found cart container: " + selector);
        break;
      }
    }
    
    if (!cartContainer) {
      debugLog('⚠️ No cart container found, adding to body');
      cartContainer = document.body;
    }

    // Create milestone container with enhanced design
    const milestoneContainer = document.createElement('div');
    milestoneContainer.id = CONFIG.milestoneContainerId;
    milestoneContainer.innerHTML = \`
      <style>
        #\${CONFIG.milestoneContainerId} {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 16px;
          padding: 24px;
          margin: 16px;
          color: white;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          box-shadow: 0 8px 32px rgba(0,0,0,0.1);
          position: relative;
          overflow: hidden;
        }
        .rewards-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          position: relative;
          z-index: 1;
        }
        .rewards-title {
          font-size: 20px;
          font-weight: bold;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .cart-value-display {
          background: rgba(255,255,255,0.2);
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: bold;
          font-size: 14px;
        }
        .milestones-grid {
          display: grid;
          gap: 12px;
          position: relative;
          z-index: 1;
        }
        .milestone-card {
          background: rgba(255,255,255,0.15);
          border-radius: 12px;
          padding: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: all 0.3s ease;
          border: 1px solid rgba(255,255,255,0.2);
        }
        .milestone-card.unlocked {
          background: rgba(34, 197, 94, 0.3);
          border-color: rgba(34, 197, 94, 0.5);
        }
        .milestone-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .milestone-icon {
          font-size: 24px;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,0.2);
          border-radius: 50%;
        }
        .milestone-details h4 {
          margin: 0 0 4px 0;
          font-size: 16px;
          font-weight: 600;
        }
        .milestone-threshold {
          font-size: 13px;
          opacity: 0.9;
        }
        .milestone-status {
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: bold;
          white-space: nowrap;
        }
        .status-unlocked {
          background: #22c55e;
          color: white;
        }
        .status-locked {
          background: rgba(255,255,255,0.3);
          color: rgba(255,255,255,0.9);
        }
      </style>
      
      <div class="rewards-header">
        <div class="rewards-title">
          🎁 Milestone Rewards
        </div>
        <div class="cart-value-display" id="cart-total-display">
          PKR 0
        </div>
      </div>
      
      <div class="milestones-grid" id="milestones-grid">
        <!-- Milestones will be populated here -->
      </div>
    \`;

    // Insert at the beginning of cart container
    if (cartContainer.firstChild) {
      cartContainer.insertBefore(milestoneContainer, cartContainer.firstChild);
    } else {
      cartContainer.appendChild(milestoneContainer);
    }

    debugLog('✅ Milestone UI created');
    updateMilestoneDisplay();
  }

  // Update milestone display
  function updateMilestoneDisplay() {
    const cartTotalDisplay = document.getElementById('cart-total-display');
    const milestonesGrid = document.getElementById('milestones-grid');

    if (!cartTotalDisplay || !milestonesGrid) {
      debugLog('❌ UI elements not found for update');
      return;
    }

    // Update cart total
    cartTotalDisplay.textContent = "PKR " + currentCartTotal.toLocaleString();

    // Update milestones
    milestonesGrid.innerHTML = '';
    milestones.forEach(milestone => {
      const isUnlocked = currentCartTotal >= milestone.amount;
      
      const milestoneCard = document.createElement('div');
      milestoneCard.className = "milestone-card " + (isUnlocked ? 'unlocked' : '');
      milestoneCard.innerHTML = \`
        <div class="milestone-info">
          <div class="milestone-icon">\${milestone.icon}</div>
          <div class="milestone-details">
            <h4>\${milestone.name}</h4>
            <div class="milestone-threshold">PKR \${milestone.amount.toLocaleString()}</div>
          </div>
        </div>
        <div class="milestone-status \${isUnlocked ? 'status-unlocked' : 'status-locked'}">
          \${isUnlocked ? '✓ Unlocked' : 'Locked'}
        </div>
      \`;
      
      milestonesGrid.appendChild(milestoneCard);
    });

    debugLog('🔄 Display updated', { 
      cartTotal: currentCartTotal, 
      unlockedCount: milestones.filter(m => m.amount <= currentCartTotal).length
    });
  }

  // Start monitoring cart changes
  function startCartMonitoring() {
    debugLog("🔄 Starting cart monitoring (" + CONFIG.cartPollInterval + "ms interval)");
    
    setInterval(async () => {
      try {
        const newTotal = await getCurrentCartTotal();
        
        if (newTotal !== currentCartTotal) {
          const previousTotal = currentCartTotal;
          currentCartTotal = newTotal;
          
          debugLog("💰 Cart total changed: " + previousTotal + " → " + currentCartTotal);
          
          // Update UI
          updateMilestoneDisplay();
        }
      } catch (error) {
        debugLog('❌ Cart monitoring error:', error);
      }
    }, CONFIG.cartPollInterval);
  }

  // Initialize when DOM is ready
  function domReady() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      // Small delay to ensure cart is loaded
      setTimeout(init, 1000);
    }
  }

  // Start everything
  debugLog('🚀 Shopify Cart Rewards Integration script loaded!');
  domReady();

})();

console.log('🎁 Real Beauty Store - Milestone Rewards Active!');`;

    res.set({
      'Content-Type': 'application/javascript; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache'
    });
    res.send(jsContent);
  });
  // Store management routes
  app.get("/api/stores", async (req, res) => {
    try {
      const stores = await storage.getStores();
      res.json(stores);
    } catch (error) {
      res.status(500).json({ message: "Error fetching stores", error });
    }
  });

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
      const { includeDeleted, status, format } = req.query;
      
      // If requested as JavaScript, return integration script
      if (format === 'js') {
        res.set({
          'Content-Type': 'application/javascript; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache'
        });
        
        const jsContent = `console.log('🎁 Real Beauty Store - Cart Rewards Loading...');

(function() {
  'use strict';
  
  function createRewardsUI() {
    const existing = document.getElementById('cart-rewards-container');
    if (existing) existing.remove();
    
    const container = document.createElement('div');
    container.id = 'cart-rewards-container';
    container.style.cssText = \`
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      margin: 16px;
      border-radius: 12px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      box-shadow: 0 8px 32px rgba(0,0,0,0.1);
      text-align: center;
      position: relative;
      z-index: 1000;
    \`;
    
    container.innerHTML = \`
      <h3 style="margin: 0 0 16px 0; font-size: 20px;">🎁 Milestone Rewards</h3>
      <div style="display: grid; gap: 8px; text-align: left;">
        <div style="display: flex; justify-content: space-between; padding: 8px; background: rgba(255,255,255,0.15); border-radius: 6px;">
          <span>🚚 Free Delivery</span>
          <strong>PKR 2,500</strong>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 8px; background: rgba(255,255,255,0.15); border-radius: 6px;">
          <span>🎁 1 Free Product</span>
          <strong>PKR 3,000</strong>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 8px; background: rgba(255,255,255,0.15); border-radius: 6px;">
          <span>🎁 2 Free Products</span>
          <strong>PKR 4,000</strong>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 8px; background: rgba(255,255,255,0.15); border-radius: 6px;">
          <span>🎁 3 Free Products</span>
          <strong>PKR 5,000</strong>
        </div>
      </div>
      <div style="margin-top: 15px; padding: 12px; background: rgba(255,255,255,0.2); border-radius: 8px;">
        <strong>🛒 Add items to unlock rewards!</strong>
      </div>
    \`;
    
    const cartContainers = [
      '.cart-drawer__content',
      '.cart__content', 
      '.cart-drawer',
      '.cart',
      '#cart-drawer',
      '.js-cart-drawer',
      '[data-cart]',
      '.drawer__content',
      '.cart-items',
      'body'
    ];
    
    let targetContainer = null;
    for (let i = 0; i < cartContainers.length; i++) {
      targetContainer = document.querySelector(cartContainers[i]);
      if (targetContainer) {
        console.log('🎯 Found cart container:', cartContainers[i]);
        break;
      }
    }
    
    if (targetContainer) {
      if (targetContainer.firstChild) {
        targetContainer.insertBefore(container, targetContainer.firstChild);
      } else {
        targetContainer.appendChild(container);
      }
      console.log('✅ Milestone rewards displayed!');
    }
  }
  
  function init() {
    console.log('🚀 Initializing milestone rewards...');
    
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', createRewardsUI);
    } else {
      setTimeout(createRewardsUI, 1000);
    }
    
    document.addEventListener('click', function(e) {
      if (e.target.matches && (e.target.matches('[data-cart-drawer]') || 
          e.target.matches('.cart-drawer-toggle') || 
          e.target.matches('[href="/cart"]') || 
          e.target.matches('.cart-link'))) {
        setTimeout(createRewardsUI, 500);
      }
    });
  }
  
  init();
})();

console.log('✅ Real Beauty Store Milestone Rewards Ready!');`;
        
        return res.send(jsContent);
      }
      
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
      const campaigns = await storage.getActiveCampaignsByStore(storeId);
      
      // Calculate real analytics from available data
      const totalRewardsUnlocked = rewardHistory.length;
      const milestonesHit = rewardHistory.filter(r => r.isRedeemed).length;
      
      // Calculate conversion rate based on redeemed vs total rewards
      const conversionRate = totalRewardsUnlocked > 0 ? 
        (milestonesHit / totalRewardsUnlocked * 100) : 0;
      
      // Calculate average order value from reward values
      const totalRewardValue = rewardHistory.reduce((sum: number, reward) => {
        return sum + parseFloat(reward.rewardValue || '0');
      }, 0);
      const averageOrderValue = milestonesHit > 0 ? (totalRewardValue / milestonesHit) : 0;
      
      // Calculate total revenue impact from campaigns
      const totalRevenueImpact = campaigns.reduce((sum: number, campaign) => {
        const usageCount = campaign.usageCount || 0;
        const minOrderValue = parseFloat(campaign.minimumOrderValue || '0');
        const campaignRevenue = usageCount * minOrderValue;
        return sum + campaignRevenue;
      }, 0);
      
      const analytics = {
        totalRewardsUnlocked,
        conversionRate: parseFloat(conversionRate.toFixed(1)),
        averageOrderValue: Math.round(averageOrderValue),
        milestonesHit,
        totalRevenueImpact: Math.round(totalRevenueImpact),
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

  // Campaign status management
  app.post("/api/campaigns/:campaignId/pause", async (req, res) => {
    try {
      const { campaignId } = req.params;
      await storage.updateCampaignStatus(campaignId, 'paused');
      res.json({ message: "Campaign paused successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error pausing campaign", error });
    }
  });

  app.post("/api/campaigns/:campaignId/resume", async (req, res) => {
    try {
      const { campaignId } = req.params;
      await storage.updateCampaignStatus(campaignId, 'active');
      res.json({ message: "Campaign resumed successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error resuming campaign", error });
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

  // Campaign stats and duplicate endpoints
  app.get("/api/campaigns/:campaignId/stats", async (req, res) => {
    try {
      const { campaignId } = req.params;
      const stats = await storage.getCampaignStats(campaignId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Error fetching campaign stats", error });
    }
  });

  app.post("/api/campaigns/:campaignId/duplicate", async (req, res) => {
    try {
      const { campaignId } = req.params;
      const { newName, modifiedBy } = req.body;
      const duplicatedCampaign = await storage.duplicateCampaign(campaignId, newName, modifiedBy);
      res.json(duplicatedCampaign);
    } catch (error) {
      res.status(500).json({ message: "Error duplicating campaign", error });
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

  // Seasonal promotion stats and duplicate endpoints
  app.get("/api/seasonal-promotions/:promotionId/stats", async (req, res) => {
    try {
      const { promotionId } = req.params;
      const stats = await storage.getSeasonalPromotionStats(promotionId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Error fetching seasonal promotion stats", error });
    }
  });

  app.post("/api/seasonal-promotions/:promotionId/duplicate", async (req, res) => {
    try {
      const { promotionId } = req.params;
      const { newName, modifiedBy } = req.body;
      const duplicatedPromotion = await storage.duplicateSeasonalPromotion(promotionId, newName, modifiedBy);
      res.json(duplicatedPromotion);
    } catch (error) {
      res.status(500).json({ message: "Error duplicating seasonal promotion", error });
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
