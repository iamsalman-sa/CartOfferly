/**
 * Shopify Cart Rewards Integration Script
 * This script connects your Shopify store to your Render admin API
 * to display milestone rewards in the cart
 */

(function() {
  'use strict';
  
  // Configuration - Update these with your actual values
  const CONFIG = {
    // Your Render admin app URL (replace with your actual Render URL)
    adminApiUrl: 'https://your-render-app.onrender.com',
    
    // Your store ID from the admin database  
    shopifyStoreId: 'development-store', // Update this to match your store ID
    
    // Milestone container selector
    milestoneContainerId: 'cart-rewards-milestones',
    
    // Cart polling interval (ms)
    cartPollInterval: 2000
  };

  let currentCartTotal = 0;
  let milestones = [];
  let cartSession = null;

  // Initialize the integration
  function init() {
    console.log('🎯 Initializing Shopify Cart Rewards Integration...');
    
    // Load milestones from your admin API
    loadMilestones()
      .then(() => {
        // Create UI elements
        createMilestoneUI();
        
        // Start monitoring cart changes
        startCartMonitoring();
        
        console.log('✅ Cart Rewards Integration loaded successfully!');
      })
      .catch(error => {
        console.error('❌ Failed to initialize Cart Rewards:', error);
      });
  }

  // Load milestones from your Render admin API
  async function loadMilestones() {
    try {
      const response = await fetch(`${CONFIG.adminApiUrl}/api/stores/${CONFIG.shopifyStoreId}/milestones`);
      
      if (!response.ok) {
        throw new Error(`Failed to load milestones: ${response.status}`);
      }
      
      milestones = await response.json();
      
      // Sort milestones by threshold amount
      milestones.sort((a, b) => a.thresholdAmount - b.thresholdAmount);
      
      console.log('📊 Loaded milestones:', milestones);
      return milestones;
    } catch (error) {
      console.error('Failed to load milestones:', error);
      throw error;
    }
  }

  // Create milestone UI in the cart
  function createMilestoneUI() {
    // Find cart container (adjust selector based on your theme)
    const cartContainer = document.querySelector('.cart-drawer, .cart, #cart-drawer, .js-cart-drawer') || 
                         document.querySelector('[data-cart]') ||
                         document.body;

    if (!cartContainer) {
      console.warn('Cart container not found. Milestones will be added to body.');
    }

    // Create milestone container
    const milestoneContainer = document.createElement('div');
    milestoneContainer.id = CONFIG.milestoneContainerId;
    milestoneContainer.className = 'cart-rewards-container';
    milestoneContainer.innerHTML = `
      <style>
        .cart-rewards-container {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          padding: 20px;
          margin: 16px 0;
          color: white;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .rewards-title {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .rewards-progress-bar {
          width: 100%;
          height: 8px;
          background: rgba(255,255,255,0.3);
          border-radius: 4px;
          overflow: hidden;
          margin: 12px 0;
        }
        .rewards-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #4ade80, #22c55e);
          border-radius: 4px;
          transition: width 0.5s ease;
          width: 0%;
        }
        .milestone-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid rgba(255,255,255,0.2);
        }
        .milestone-item:last-child {
          border-bottom: none;
        }
        .milestone-info {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .milestone-icon {
          font-size: 20px;
        }
        .milestone-status {
          font-size: 12px;
          padding: 2px 8px;
          border-radius: 12px;
          font-weight: bold;
        }
        .milestone-unlocked {
          background: #22c55e;
          color: white;
        }
        .milestone-locked {
          background: rgba(255,255,255,0.3);
          color: rgba(255,255,255,0.8);
        }
        .current-cart-value {
          font-size: 14px;
          margin-bottom: 8px;
          opacity: 0.9;
        }
      </style>
      <div class="rewards-content">
        <div class="rewards-title">
          🎁 Milestone Rewards
        </div>
        <div class="current-cart-value">
          Cart Total: <span id="cart-total-display">PKR 0</span>
        </div>
        <div class="rewards-progress-bar">
          <div class="rewards-progress-fill" id="progress-fill"></div>
        </div>
        <div id="milestones-list">
          <!-- Milestones will be populated here -->
        </div>
      </div>
    `;

    // Insert into cart
    if (cartContainer) {
      cartContainer.insertBefore(milestoneContainer, cartContainer.firstChild);
    }

    // Populate milestones
    updateMilestoneDisplay();
  }

  // Update milestone display based on current cart value
  function updateMilestoneDisplay() {
    const milestonesList = document.getElementById('milestones-list');
    const cartTotalDisplay = document.getElementById('cart-total-display');
    const progressFill = document.getElementById('progress-fill');

    if (!milestonesList || !cartTotalDisplay || !progressFill) return;

    // Update cart total display
    cartTotalDisplay.textContent = `PKR ${currentCartTotal.toLocaleString()}`;

    // Calculate progress percentage
    const maxMilestone = milestones.length > 0 ? milestones[milestones.length - 1].thresholdAmount : 5000;
    const progressPercentage = Math.min((currentCartTotal / maxMilestone) * 100, 100);
    progressFill.style.width = `${progressPercentage}%`;

    // Clear and rebuild milestones list
    milestonesList.innerHTML = '';

    milestones.forEach(milestone => {
      const isUnlocked = currentCartTotal >= milestone.thresholdAmount;
      const milestoneElement = document.createElement('div');
      milestoneElement.className = 'milestone-item';
      
      milestoneElement.innerHTML = `
        <div class="milestone-info">
          <span class="milestone-icon">${milestone.icon || '🎁'}</span>
          <div>
            <div style="font-weight: bold;">${milestone.name}</div>
            <div style="font-size: 12px; opacity: 0.8;">PKR ${milestone.thresholdAmount.toLocaleString()}</div>
          </div>
        </div>
        <span class="milestone-status ${isUnlocked ? 'milestone-unlocked' : 'milestone-locked'}">
          ${isUnlocked ? '✓ Unlocked!' : 'Locked'}
        </span>
      `;

      milestonesList.appendChild(milestoneElement);
    });
  }

  // Get current cart total from Shopify
  function getCurrentCartTotal() {
    return fetch('/cart.js')
      .then(response => response.json())
      .then(cart => {
        const total = cart.total_price / 100; // Shopify returns price in cents
        return total;
      })
      .catch(error => {
        console.error('Failed to get cart total:', error);
        return 0;
      });
  }

  // Start monitoring cart changes
  function startCartMonitoring() {
    setInterval(async () => {
      try {
        const newTotal = await getCurrentCartTotal();
        
        if (newTotal !== currentCartTotal) {
          const previousTotal = currentCartTotal;
          currentCartTotal = newTotal;
          
          console.log(`💰 Cart total updated: PKR ${currentCartTotal.toLocaleString()}`);
          
          // Update UI
          updateMilestoneDisplay();
          
          // Check for newly unlocked milestones
          checkNewlyUnlockedMilestones(previousTotal, newTotal);
          
          // Update cart session in admin API
          updateCartSession(newTotal);
        }
      } catch (error) {
        console.error('Error monitoring cart:', error);
      }
    }, CONFIG.cartPollInterval);
  }

  // Check for newly unlocked milestones
  function checkNewlyUnlockedMilestones(previousTotal, newTotal) {
    const newlyUnlocked = milestones.filter(milestone => 
      milestone.thresholdAmount <= newTotal && milestone.thresholdAmount > previousTotal
    );

    if (newlyUnlocked.length > 0) {
      newlyUnlocked.forEach(milestone => {
        showMilestoneUnlockedNotification(milestone);
      });
    }
  }

  // Show milestone unlocked notification
  function showMilestoneUnlockedNotification(milestone) {
    // Create notification
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #4ade80, #22c55e);
      color: white;
      padding: 16px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 300px;
      animation: slideIn 0.3s ease;
    `;
    
    notification.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 4px;">
        🎉 Milestone Unlocked!
      </div>
      <div>
        ${milestone.icon || '🎁'} ${milestone.name}
      </div>
    `;

    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(notification);

    // Remove after 5 seconds
    setTimeout(() => {
      notification.remove();
    }, 5000);

    console.log(`🎉 Milestone unlocked: ${milestone.name}`);
  }

  // Update cart session in admin API
  async function updateCartSession(cartValue) {
    try {
      // Create or update cart session
      const customerId = 'shopify-customer'; // You can get this from Shopify's customer object
      
      const response = await fetch(`${CONFIG.adminApiUrl}/api/cart-sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storeId: CONFIG.shopifyStoreId,
          customerId: customerId,
          cartToken: `shopify-${Date.now()}`,
          currentValue: cartValue.toString(),
          unlockedMilestones: milestones
            .filter(m => m.thresholdAmount <= cartValue)
            .map(m => m.id),
          selectedFreeProducts: [],
          isActive: true
        })
      });

      if (response.ok) {
        cartSession = await response.json();
      }
    } catch (error) {
      console.error('Failed to update cart session:', error);
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Also initialize when cart drawer opens (for themes that load cart dynamically)
  document.addEventListener('click', function(e) {
    if (e.target.matches('[data-cart-drawer], .cart-drawer-toggle, .js-cart-drawer-open')) {
      setTimeout(init, 500); // Small delay to let cart drawer load
    }
  });

})();

console.log('🚀 Shopify Cart Rewards Integration script loaded!');