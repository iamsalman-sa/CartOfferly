/**
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
      console.log(`🎯 [Cart Rewards] ${message}`, data || '');
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
          debugLog(`✅ Loaded ${milestones.length} milestones:`, milestones);
          
          // Get initial cart total
          return getCurrentCartTotal();
        } else {
          throw new Error('No milestones loaded from API');
        }
      })
      .then((cartTotal) => {
        currentCartTotal = cartTotal;
        debugLog(`💰 Initial cart total: PKR ${currentCartTotal}`);
        
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
      debugLog(`📡 Fetching milestones from: ${CONFIG.adminApiUrl}/api/stores/${CONFIG.shopifyStoreId}/milestones`);
      
      const response = await fetch(`${CONFIG.adminApiUrl}/api/stores/${CONFIG.shopifyStoreId}/milestones`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        mode: 'cors'
      });
      
      debugLog(`📡 API Response Status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        debugLog(`❌ API Error Response:`, errorText);
        throw new Error(`API Error ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      debugLog(`📊 Raw milestone data:`, data);
      
      if (!Array.isArray(data)) {
        throw new Error(`Invalid milestone data format: ${typeof data}`);
      }
      
      if (data.length === 0) {
        debugLog('⚠️ No milestones found for store. Checking alternatives...');
        
        // Try alternative store IDs
        const alternatives = ['development-store', 'realbeauty-store', 'real-beauty'];
        for (const altStoreId of alternatives) {
          try {
            debugLog(`🔄 Trying alternative store ID: ${altStoreId}`);
            const altResponse = await fetch(`${CONFIG.adminApiUrl}/api/stores/${altStoreId}/milestones`);
            if (altResponse.ok) {
              const altData = await altResponse.json();
              if (altData.length > 0) {
                debugLog(`✅ Found milestones with store ID: ${altStoreId}`, altData);
                CONFIG.shopifyStoreId = altStoreId; // Update config
                return processMilestones(altData);
              }
            }
          } catch (e) {
            debugLog(`❌ Alternative ${altStoreId} failed:`, e.message);
          }
        }
        
        throw new Error('No milestones found with any store ID');
      }
      
      return processMilestones(data);
      
    } catch (error) {
      debugLog(`❌ loadMilestones error:`, error);
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
    
    debugLog(`🎯 Processed milestones:`, processed);
    return processed;
  }

  // Get current cart total from Shopify
  async function getCurrentCartTotal() {
    try {
      const response = await fetch('/cart.js');
      const cart = await response.json();
      const total = cart.total_price / 100; // Convert from cents
      debugLog(`💰 Cart total from Shopify: PKR ${total}`);
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
        debugLog(`✅ Found cart container: ${selector}`);
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
    milestoneContainer.innerHTML = `
      <style>
        #${CONFIG.milestoneContainerId} {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 16px;
          padding: 24px;
          margin: 16px;
          color: white;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          box-shadow: 0 8px 32px rgba(0,0,0,0.1);
          backdrop-filter: blur(10px);
          position: relative;
          overflow: hidden;
        }
        #${CONFIG.milestoneContainerId}::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(45deg, rgba(255,255,255,0.1) 0%, transparent 100%);
          pointer-events: none;
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
        .progress-section {
          margin: 20px 0;
          position: relative;
          z-index: 1;
        }
        .progress-bar {
          width: 100%;
          height: 10px;
          background: rgba(255,255,255,0.3);
          border-radius: 5px;
          overflow: hidden;
          margin: 10px 0;
        }
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #4ade80, #22c55e);
          border-radius: 5px;
          transition: width 0.6s ease;
          width: 0%;
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
          transform: translateX(4px);
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
        .milestone-celebration {
          animation: celebration 0.6s ease;
        }
        @keyframes celebration {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); box-shadow: 0 0 20px rgba(34, 197, 94, 0.5); }
          100% { transform: scale(1); }
        }
        .next-milestone {
          text-align: center;
          margin-top: 16px;
          padding: 12px;
          background: rgba(255,255,255,0.1);
          border-radius: 8px;
          font-size: 14px;
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
      
      <div class="progress-section">
        <div class="progress-bar">
          <div class="progress-fill" id="progress-fill"></div>
        </div>
      </div>
      
      <div class="milestones-grid" id="milestones-grid">
        <!-- Milestones will be populated here -->
      </div>
      
      <div class="next-milestone" id="next-milestone-info">
        <!-- Next milestone info -->
      </div>
    `;

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
    const progressFill = document.getElementById('progress-fill');
    const milestonesGrid = document.getElementById('milestones-grid');
    const nextMilestoneInfo = document.getElementById('next-milestone-info');

    if (!cartTotalDisplay || !progressFill || !milestonesGrid || !nextMilestoneInfo) {
      debugLog('❌ UI elements not found for update');
      return;
    }

    // Update cart total
    cartTotalDisplay.textContent = `PKR ${currentCartTotal.toLocaleString()}`;

    // Calculate progress
    const maxMilestone = milestones.length > 0 ? milestones[milestones.length - 1].amount : 5000;
    const progressPercentage = Math.min((currentCartTotal / maxMilestone) * 100, 100);
    progressFill.style.width = `${progressPercentage}%`;

    // Update milestones
    milestonesGrid.innerHTML = '';
    milestones.forEach(milestone => {
      const isUnlocked = currentCartTotal >= milestone.amount;
      
      const milestoneCard = document.createElement('div');
      milestoneCard.className = `milestone-card ${isUnlocked ? 'unlocked' : ''}`;
      milestoneCard.innerHTML = `
        <div class="milestone-info">
          <div class="milestone-icon">${milestone.icon}</div>
          <div class="milestone-details">
            <h4>${milestone.name}</h4>
            <div class="milestone-threshold">PKR ${milestone.amount.toLocaleString()}</div>
          </div>
        </div>
        <div class="milestone-status ${isUnlocked ? 'status-unlocked' : 'status-locked'}">
          ${isUnlocked ? '✓ Unlocked' : 'Locked'}
        </div>
      `;
      
      milestonesGrid.appendChild(milestoneCard);
    });

    // Next milestone info
    const nextMilestone = milestones.find(m => m.amount > currentCartTotal);
    if (nextMilestone) {
      const remaining = nextMilestone.amount - currentCartTotal;
      nextMilestoneInfo.innerHTML = `
        Add PKR ${remaining.toLocaleString()} more to unlock: <strong>${nextMilestone.name}</strong>
      `;
      nextMilestoneInfo.style.display = 'block';
    } else {
      nextMilestoneInfo.style.display = 'none';
    }

    debugLog('🔄 Display updated', { 
      cartTotal: currentCartTotal, 
      progress: progressPercentage,
      unlockedCount: milestones.filter(m => m.amount <= currentCartTotal).length
    });
  }

  // Check for newly unlocked milestones
  function checkNewlyUnlockedMilestones(previousTotal, newTotal) {
    const newlyUnlocked = milestones.filter(milestone => 
      milestone.amount <= newTotal && milestone.amount > previousTotal
    );

    newlyUnlocked.forEach(milestone => {
      showCelebrationNotification(milestone);
      
      // Add celebration animation to the milestone card
      setTimeout(() => {
        const milestoneCards = document.querySelectorAll('.milestone-card');
        milestoneCards.forEach(card => {
          if (card.textContent.includes(milestone.name)) {
            card.classList.add('milestone-celebration');
            setTimeout(() => card.classList.remove('milestone-celebration'), 600);
          }
        });
      }, 100);
    });
  }

  // Show celebration notification
  function showCelebrationNotification(milestone) {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #4ade80, #22c55e);
      color: white;
      padding: 20px;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.2);
      z-index: 100000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 320px;
      animation: slideInRight 0.4s ease;
    `;
    
    notification.innerHTML = `
      <div style="font-size: 18px; font-weight: bold; margin-bottom: 8px;">
        🎉 Milestone Unlocked!
      </div>
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="font-size: 24px;">${milestone.icon}</span>
        <span style="font-size: 16px;">${milestone.name}</span>
      </div>
    `;

    // Add animation CSS
    if (!document.getElementById('celebration-styles')) {
      const style = document.createElement('style');
      style.id = 'celebration-styles';
      style.textContent = `
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    // Remove after 5 seconds
    setTimeout(() => {
      notification.remove();
    }, 5000);

    debugLog(`🎉 Celebration shown for: ${milestone.name}`);
  }

  // Start monitoring cart changes
  function startCartMonitoring() {
    debugLog(`🔄 Starting cart monitoring (${CONFIG.cartPollInterval}ms interval)`);
    
    setInterval(async () => {
      try {
        const newTotal = await getCurrentCartTotal();
        
        if (newTotal !== currentCartTotal) {
          const previousTotal = currentCartTotal;
          currentCartTotal = newTotal;
          
          debugLog(`💰 Cart total changed: ${previousTotal} → ${currentCartTotal}`);
          
          // Update UI
          updateMilestoneDisplay();
          
          // Check for celebrations
          if (newTotal > previousTotal) {
            checkNewlyUnlockedMilestones(previousTotal, newTotal);
          }
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

  // Handle dynamic cart loading
  function handleDynamicCart() {
    // Watch for cart drawer toggles
    document.addEventListener('click', function(e) {
      const cartTriggers = [
        '[data-cart-drawer]',
        '.cart-drawer-toggle', 
        '.js-cart-drawer-open',
        '[href="/cart"]',
        '.cart-link'
      ];
      
      if (cartTriggers.some(selector => e.target.matches(selector))) {
        debugLog('🛒 Cart trigger clicked, reinitializing...');
        setTimeout(init, 500);
      }
    });

    // Watch for AJAX cart updates
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      const result = originalFetch.apply(this, args);
      
      if (args[0] && (args[0].includes('/cart/') || args[0].includes('cart.js'))) {
        debugLog('🔄 Cart API call detected');
        setTimeout(() => {
          getCurrentCartTotal().then(newTotal => {
            if (newTotal !== currentCartTotal) {
              const previousTotal = currentCartTotal;
              currentCartTotal = newTotal;
              debugLog(`💰 Cart updated via API: ${previousTotal} → ${currentCartTotal}`);
              updateMilestoneDisplay();
              if (newTotal > previousTotal) {
                checkNewlyUnlockedMilestones(previousTotal, newTotal);
              }
            }
          });
        }, 500);
      }
      
      return result;
    };
  }

  // Start everything
  debugLog('🚀 Shopify Cart Rewards Integration script loaded!');
  domReady();
  handleDynamicCart();

})();

console.log('🎁 Real Beauty Store - Milestone Rewards Active!');