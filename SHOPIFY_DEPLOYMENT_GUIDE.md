# Beauty E-commerce Admin Dashboard - Deployment Guide

## 📋 Overview

This guide covers the deployment and configuration of the Beauty E-commerce Admin Dashboard - a standalone web application for managing milestone rewards, discount campaigns, seasonal promotions, and analytics for beauty e-commerce stores.

### 🏗️ System Architecture

- **Frontend**: React 18 with TypeScript, Vite build system, shadcn/ui components
- **Backend**: Node.js Express server with TypeScript
- **Database**: Neon PostgreSQL with Drizzle ORM and @neondatabase/serverless driver
- **State Management**: TanStack Query for server state
- **Routing**: Wouter for client-side routing
- **Styling**: TailwindCSS with custom theme variables

### 🎯 Current Features

- **Milestone Management**: Progressive cart rewards with free delivery and product selection
- **Campaign Management**: Discount campaigns with multiple types (percentage, fixed, BOGO, bundles)
- **Seasonal Promotions**: Time-based promotional campaigns
- **Analytics Dashboard**: Revenue impact tracking, conversion metrics, customer insights
- **Product Management**: Product catalog with reward eligibility settings
- **Cart Session Tracking**: Real-time cart value and milestone tracking

### 🔮 Future Implementation: Shopify Integration

Currently, this is a standalone admin dashboard. Shopify integration is planned for future implementation and would include:
- Store synchronization
- Product import/export
- Order webhook processing
- Real-time cart tracking via Shopify APIs

The database schema includes fields to support future Shopify integration (`shopifyStoreId`, `accessToken`), but no actual Shopify API integration is currently implemented.

---

## 1. Prerequisites & Requirements

### 🔧 Required Software

- **Node.js**: Version 18.0 or higher
- **npm**: Version 9.0 or higher (included with Node.js)
- **Neon Database**: WebSocket-compatible PostgreSQL service (required for @neondatabase/serverless driver)
- **Git**: For version control

### 🌐 Hosting Requirements

Choose one of the following hosting options:

#### Option A: Replit (Recommended for Development)
- Replit account with ability to host full-stack applications
- Neon database connection (must be added via Replit Secrets)
- Automatic deployment and scaling

#### Option B: Cloud Providers (Recommended for Production)
- **Frontend + Backend**: Render, Railway, Fly.io, or Heroku (full-stack)
- **Database**: Neon (required for @neondatabase/serverless driver) or other Neon-compatible services

### 💻 Development Tools

```bash
# Verify installations
node --version    # Should be 18.0+
npm --version     # Should be 9.0+
git --version     # For version control
```

---

## 2. Environment Setup

### 🔐 Environment Variables

Create `.env` file in your project root:

```bash
# Database Configuration (Required - Must be Neon database)
DATABASE_URL="postgresql://neon_user:password@ep-example.us-west-2.aws.neon.tech/beauty_admin_db?sslmode=require"

# Application Configuration
NODE_ENV="development"  # or "production"
PORT="5000"

# Optional: Development Configuration (for Replit)
# REPL_ID - Automatically set by Replit environment
```

### 🔑 Secrets Management

#### For Development (Local/Replit):
```bash
# Never commit .env to version control
echo ".env" >> .gitignore

# For Replit: Use Secrets tab in the sidebar
# Add DATABASE_URL as a secret
```

#### For Production:
```bash
# Use your hosting platform's environment variable system
# Examples (DATABASE_URL must be from Neon):

# Render
render config:set DATABASE_URL="postgresql://neon_user:password@ep-example.us-west-2.aws.neon.tech/beauty_admin_db?sslmode=require"

# Railway
railway variables set DATABASE_URL="postgresql://neon_user:password@ep-example.us-west-2.aws.neon.tech/beauty_admin_db?sslmode=require"
```

### 📊 Database Configuration

**IMPORTANT**: This application uses `@neondatabase/serverless` driver which ONLY works with Neon WebSocket-compatible endpoints. Standard PostgreSQL databases will NOT work.

```typescript
// server/db.ts configuration
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";

neonConfig.webSocketConstructor = ws;

// DATABASE_URL must be a Neon connection string
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL 
});
export const db = drizzle({ client: pool, schema });
```

---

## 3. Database Setup

### 📋 Schema Deployment

#### Step 1: Create Neon Database
```bash
# Create a new database at https://neon.tech
# 1. Sign up for Neon account
# 2. Create a new project
# 3. Copy the connection string from Neon dashboard
# 4. Set DATABASE_URL environment variable

export DATABASE_URL="postgresql://neon_user:password@ep-example.us-west-2.aws.neon.tech/beauty_admin_db?sslmode=require"
```

#### Step 2: Push Schema to Database
```bash
# Install dependencies
npm install

# Push schema using Drizzle
npm run db:push

# Verify schema deployment
npm run db:push --verbose
```

#### Step 3: Verify Database Tables

The following tables will be created based on `shared/schema.ts`:

```sql
-- Core tables
users                    -- Admin user management
stores                   -- Store connections (prepared for future Shopify integration)
products                 -- Product catalog with reward eligibility

-- Milestone system
milestones              -- Reward thresholds and configurations
cart_sessions           -- Active cart tracking
reward_history          -- Milestone reward usage history

-- Campaign management
discount_campaigns      -- Marketing campaigns
discount_rules          -- Campaign rules and conditions
campaign_products       -- Product-campaign associations

-- Bundle and seasonal features
bundle_configurations   -- Product bundle setups
bundle_items           -- Items within bundles
seasonal_promotions    -- Time-based promotions

-- Analytics
discount_analytics     -- Campaign performance metrics
```

### 🏪 Initial Store Setup

#### Step 1: Create Store Record (via API)
```bash
# Create a demo store for testing
curl -X POST http://localhost:5000/api/stores \
  -H "Content-Type: application/json" \
  -d '{
    "shopifyStoreId": "demo-store.myshopify.com",
    "storeName": "Demo Beauty Store",
    "accessToken": "demo_token",
    "isActive": true
  }'
```

#### Step 2: Add Sample Products
```bash
# Replace {STORE_ID} with the actual storeId returned from Step 1
# Example: if Step 1 returned {"id": "store_123abc", ...}, use "store_123abc"
curl -X POST http://localhost:5000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "shopifyProductId": "demo_prod_001",
    "storeId": "{STORE_ID}",
    "title": "Premium Face Serum",
    "handle": "premium-face-serum",
    "price": "2500.00",
    "imageUrl": "https://example.com/serum.jpg",
    "isEligibleForRewards": true
  }'
```

#### Step 3: Configure Default Milestones
```bash
# Replace {STORE_ID} with the actual internal storeId returned from Step 1
# This uses the internal UUID storeId, NOT the shopifyStoreId
curl -X POST http://localhost:5000/api/stores/{STORE_ID}/milestones \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Free Delivery Milestone",
    "description": "Get free delivery on orders over 2500 PKR",
    "thresholdAmount": "2500.00",
    "currency": "PKR",
    "rewardType": "free_delivery",
    "status": "active",
    "customerSegments": ["all"]
  }'
```

---

## 4. Application Deployment

### 🛠️ Local Development Setup

#### Step 1: Clone and Install
```bash
# Clone repository
git clone <your-repository-url>
cd beauty-admin-dashboard

# Install dependencies
npm install

# Create .env file with your Neon DATABASE_URL
echo 'DATABASE_URL="postgresql://neon_user:password@ep-example.us-west-2.aws.neon.tech/beauty_admin_db?sslmode=require"' > .env
echo 'NODE_ENV="development"' >> .env
echo 'PORT="5000"' >> .env
```

#### Step 2: Database Setup
```bash
# Push database schema
npm run db:push
```

#### Step 3: Start Development Server
```bash
# Start the development server
npm run dev

# The application will be available at:
# http://localhost:5000
```

#### Step 4: Verify Local Setup
- **Frontend**: Navigate to `http://localhost:5000`
- **Admin Dashboard**: Access `http://localhost:5000/admin`
- **API Test**: Check `http://localhost:5000/api/stores/demo-store.myshopify.com`

### ☁️ Production Deployment Options

#### Option A: Replit Deployment

1. **Import Project to Replit**
   ```bash
   # Push your code to GitHub first
   git add .
   git commit -m "Initial commit"
   git push origin main
   
   # Import to Replit from GitHub repository
   ```

2. **Configure Replit Environment**
   - Go to Secrets tab in Replit
   - Add `DATABASE_URL` with your Neon connection string
   - Ensure `NODE_ENV=production` for production builds
   - Note: Replit does NOT have built-in PostgreSQL - you must use Neon or another external service

3. **Deploy Database Schema**
   ```bash
   # In Replit shell
   npm run db:push
   ```

4. **Start Application**
   ```bash
   # Application auto-starts with workflow: "npm run dev"
   # Available at your Replit URL: https://your-repl.username.repl.co
   ```

#### Option B: Render Deployment

1. **Full-Stack Deployment (Render Web Service)**
   ```yaml
   # render.yaml
   services:
     - type: web
       name: beauty-admin-dashboard
       env: node
       buildCommand: npm install && npm run build
       startCommand: npm start
       envVars:
         - key: NODE_ENV
           value: production
         - key: DATABASE_URL
           fromDatabase:
             name: beauty-admin-db
             property: connectionString
   
   # Note: Use external Neon database instead of Render PostgreSQL
   # The @neondatabase/serverless driver requires Neon WebSocket endpoints
   ```

2. **Deploy Steps**
   - Connect your GitHub repository to Render
   - Configure environment variables in Render dashboard
   - Deploy automatically triggers on git push

#### Option C: Railway Deployment

1. **Connect Repository**
   ```bash
   # Connect Railway to your GitHub repo
   # Railway will auto-deploy on git push
   ```

2. **Configure Environment**
   - Add `DATABASE_URL` in Railway dashboard
   - Set `NODE_ENV=production`
   - Configure automatic deployments

### 🔧 Environment-Specific Configuration

#### Development Configuration (Illustrative Only)
```typescript
// config/development.ts - EXAMPLE ONLY (these files don't exist in this codebase)
export const devConfig = {
  database: {
    ssl: false,
    logging: true
  },
  frontend: {
    apiUrl: 'http://localhost:5000',
    hotReload: true
  }
};
```

#### Production Configuration (Illustrative Only)
```typescript
// config/production.ts - EXAMPLE ONLY (these files don't exist in this codebase)
export const prodConfig = {
  database: {
    ssl: true,
    logging: false,
    pool: {
      min: 2,
      max: 10
    }
  },
  frontend: {
    apiUrl: 'https://your-domain.com',
    hotReload: false
  }
};
```

---

## 5. Feature Configuration

### 🎯 Milestone Management Setup

#### Creating Milestone Rewards

Access the admin dashboard at `/admin/milestones` to configure milestone rewards:

1. **Free Delivery Milestone**
   ```json
   {
     "name": "Free Delivery",
     "description": "Get free shipping on orders over 2500 PKR",
     "thresholdAmount": "2500.00",
     "currency": "PKR",
     "rewardType": "free_delivery",
     "status": "active",
     "priority": 1,
     "customerSegments": ["all"],
     "startDate": "2024-01-01T00:00:00Z",
     "endDate": null
   }
   ```

2. **Free Product Milestone**
   ```json
   {
     "name": "Free Beauty Sample",
     "description": "Choose 1 free beauty sample on orders over 3000 PKR",
     "thresholdAmount": "3000.00",
     "currency": "PKR",
     "rewardType": "free_products",
     "freeProductCount": 1,
     "enableProductSelection": true,
     "eligibleProducts": ["prod_123", "prod_124", "prod_125"],
     "status": "active",
     "priority": 2
   }
   ```

3. **Percentage Discount Milestone**
   ```json
   {
     "name": "VIP Discount",
     "description": "Get 15% off on orders over 5000 PKR",
     "thresholdAmount": "5000.00",
     "currency": "PKR",
     "rewardType": "discount",
     "discountValue": "15.00",
     "discountType": "percentage",
     "customerSegments": ["vip", "returning"],
     "status": "active",
     "priority": 3
   }
   ```

#### Advanced Milestone Conditions
```json
{
  "conditions": {
    "minimumItems": 3,
    "excludeCategories": ["sale", "clearance"],
    "requireCategories": ["skincare", "makeup"],
    "customerPurchaseHistory": {
      "minimumOrders": 2,
      "timeframe": "6_months"
    }
  },
  "usageLimit": 1000,
  "maxUsagePerCustomer": 1,
  "timeRestrictions": {
    "daysOfWeek": [1, 2, 3, 4, 5],
    "hoursOfDay": {"start": 9, "end": 18}
  }
}
```

### 📈 Campaign Management Configuration

#### Discount Campaign Types

1. **Percentage Discount Campaign**
   ```bash
   # Replace {STORE_ID} with the actual internal storeId from your store creation
   curl -X POST http://localhost:5000/api/stores/{STORE_ID}/campaigns \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Summer Beauty Sale",
       "description": "15% off all skincare products",
       "type": "percentage",
       "discountValue": 15.00,
       "minimumOrderValue": "1000.00",
       "applicableProducts": ["category:skincare"],
       "startDate": "2024-06-01T00:00:00Z",
       "endDate": "2024-08-31T23:59:59Z",
       "status": "active"
     }'
   ```

2. **BOGO Campaign**
   ```json
   {
     "name": "Buy One Get One Free",
     "type": "bogo",
     "buyQuantity": 1,
     "getQuantity": 1,
     "applicableProducts": ["prod_lipstick_001", "prod_lipstick_002"],
     "conditions": {
       "sameProduct": false,
       "sameCategory": true,
       "categoryCode": "lipstick"
     }
   }
   ```

3. **Bundle Campaign**
   ```json
   {
     "name": "Complete Skincare Bundle",
     "type": "bundle",
     "bundleProducts": [
       {"productId": "prod_cleanser", "quantity": 1},
       {"productId": "prod_serum", "quantity": 1},
       {"productId": "prod_moisturizer", "quantity": 1}
     ],
     "bundlePrice": "4500.00",
     "savingsAmount": "1000.00",
     "savingsPercentage": 18.18
   }
   ```

### 🎪 Seasonal Promotions Setup

#### Creating Seasonal Campaigns

1. **Holiday Promotion**
   ```json
   {
     "name": "Eid Beauty Collection",
     "description": "Special festive beauty offers",
     "theme": "eid",
     "startDate": "2024-04-01T00:00:00Z",
     "endDate": "2024-04-15T23:59:59Z",
     "promotionType": "seasonal",
     "discountTiers": [
       {"minAmount": "2000.00", "discount": "10.00", "type": "percentage"},
       {"minAmount": "4000.00", "discount": "20.00", "type": "percentage"},
       {"minAmount": "6000.00", "discount": "30.00", "type": "percentage"}
     ],
     "bannerConfig": {
       "backgroundGradient": ["#e91e63", "#9c27b0"],
       "textColor": "#ffffff",
       "ctaColor": "#4caf50"
     }
   }
   ```

2. **Flash Sale Configuration**
   ```json
   {
     "name": "24-Hour Flash Sale",
     "description": "Limited time offers",
     "duration": "24_hours",
     "urgencyTimer": true,
     "stockLimits": {
       "enabled": true,
       "showRemaining": true,
       "lowStockThreshold": 5
     },
     "discountProgression": {
       "hour_0_6": "40.00",
       "hour_6_12": "30.00",
       "hour_12_18": "20.00",
       "hour_18_24": "10.00"
     }
   }
   ```

### 📊 Analytics Configuration

#### Dashboard Metrics Setup

Configure analytics tracking in `/admin/analytics`:

1. **Revenue Tracking**
   ```typescript
   // Analytics configuration
   const analyticsConfig = {
     metrics: {
       revenueImpact: {
         enabled: true,
         trackingPeriods: ['7d', '30d', '90d'],
         comparisonPeriods: true
       },
       conversionRate: {
         enabled: true,
         segmentBy: ['source', 'device', 'customer_type']
       },
       averageOrderValue: {
         enabled: true,
         includeShipping: false,
         excludeReturns: true
       }
     },
     automation: {
       dailyReports: true,
       weeklyReports: true,
       alertThresholds: {
         conversionDrop: 0.05,
         revenueIncrease: 0.20
       }
     }
   };
   ```

2. **Custom Event Tracking**
   ```typescript
   // Track custom events
   await storage.createAnalyticsEvent({
     eventType: 'milestone_unlocked',
     storeId: store.id,
     customerId: customer.id,
     eventData: {
       milestoneId: milestone.id,
       cartValue: cart.totalValue,
       rewardType: milestone.rewardType
     },
     timestamp: new Date()
   });
   ```

---

## 6. Testing & Verification

### 📝 **IMPORTANT: Understanding ID Types**

Before testing, understand the two types of store identifiers used in this API:

- **`shopifyStoreId`**: External identifier like `"test-store.myshopify.com"` (used in routes like `/api/stores/:shopifyStoreId`)
- **`storeId`**: Internal UUID like `"550e8400-e29b-41d4-a716-446655440000"` (returned by POST /api/stores, used in routes like `/api/stores/:storeId/analytics`)

### 🧪 Component Testing

#### Step 1: Create Test Store and Capture ID
```bash
# Test database connectivity first
npm run db:push --verbose

# Create a test store and capture the returned storeId
curl -X POST http://localhost:5000/api/stores \
  -H "Content-Type: application/json" \
  -d '{
    "shopifyStoreId": "test-store.myshopify.com",
    "storeName": "Test Verification Store",
    "accessToken": "test_token_123",
    "isActive": true
  }'

# SAVE THE RETURNED storeId (internal UUID) from the response above!
# Example response: {"id": "550e8400-e29b-41d4-a716-446655440000", "shopifyStoreId": "test-store.myshopify.com", ...}
# You will need the "id" field for subsequent API calls
```

#### Step 2: Verify Store Operations
```bash
# Test store retrieval using shopifyStoreId (external ID)
curl -X GET http://localhost:5000/api/stores/test-store.myshopify.com

# Test analytics endpoint using the internal storeId from Step 1
# REPLACE {STORE_ID} with the actual UUID returned in Step 1
curl -X GET http://localhost:5000/api/stores/{STORE_ID}/analytics
```

#### Step 3: Test Milestone Management
```bash
# Test milestone creation using internal storeId
# REPLACE {STORE_ID} with the actual UUID from Step 1
curl -X POST http://localhost:5000/api/stores/{STORE_ID}/milestones \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Milestone",
    "description": "Test free delivery milestone",
    "thresholdAmount": "1000.00",
    "currency": "PKR",
    "rewardType": "free_delivery",
    "status": "active",
    "customerSegments": ["all"]
  }'

# Test milestone retrieval
curl -X GET http://localhost:5000/api/stores/{STORE_ID}/milestones
```

#### Step 4: Test Cart Session Tracking
```bash
# Test cart session creation using internal storeId
# REPLACE {STORE_ID} with the actual UUID from Step 1
curl -X POST http://localhost:5000/api/cart-sessions \
  -H "Content-Type: application/json" \
  -d '{
    "storeId": "{STORE_ID}",
    "cartToken": "test_cart_123",
    "customerId": "test_customer",
    "currentValue": 1500.00
  }'

# Test cart value update
curl -X PUT http://localhost:5000/api/cart-sessions/test_cart_123/value \
  -H "Content-Type: application/json" \
  -d '{"currentValue": 2500.00}'
```

#### Step 3: Frontend Component Testing

**Admin Dashboard Access:**
```bash
# Verify admin dashboard loads
curl -I http://localhost:5000/admin

# Check specific admin pages
curl -I http://localhost:5000/admin/milestones
curl -I http://localhost:5000/admin/campaigns
curl -I http://localhost:5000/admin/analytics
```

### 🔍 Load Testing

#### Basic Load Testing
```bash
# Install apache bench for basic load testing
# Ubuntu/Debian: sudo apt-get install apache2-utils
# macOS: brew install httpie

# Test API performance using shopifyStoreId (external ID)
ab -n 100 -c 10 http://localhost:5000/api/stores/test-store.myshopify.com

# Test milestone checking using internal storeId
# Replace {STORE_ID} with actual UUID from your store creation
ab -n 50 -c 5 http://localhost:5000/api/stores/{STORE_ID}/milestones
```

---

## 7. Monitoring & Maintenance

### 📊 Application Monitoring

#### Application Monitoring
```typescript
// EXAMPLE ONLY - Health check endpoint (not currently implemented)
// This shows how you could add health monitoring to server/routes.ts
app.get('/api/health', async (req, res) => {
  try {
    // Test database connection
    await db.select().from(stores).limit(1);
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        api: 'running'
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});
```

#### Performance Monitoring
```bash
# IMPORTANT: Replace {STORE_ID} with an actual internal storeId from your database
# To get a valid storeId, first create a store or check existing stores

# Step 1: Create a monitoring store (if needed)
curl -X POST http://localhost:5000/api/stores \
  -H "Content-Type: application/json" \
  -d '{
    "shopifyStoreId": "monitor-store.myshopify.com",
    "storeName": "Monitoring Store",
    "accessToken": "monitor_token",
    "isActive": true
  }'
# Save the "id" field from the response above!

# Step 2: Use the returned storeId for monitoring
# Replace {STORE_ID} with the actual UUID from Step 1
curl http://localhost:5000/api/stores/{STORE_ID}/analytics
curl http://localhost:5000/api/stores/{STORE_ID}/milestones
```

### 🔧 Regular Maintenance Tasks

#### Database Maintenance
```bash
# Note: Direct psql commands may not work with Neon's WebSocket endpoints
# Use Neon's web console or create API endpoints for maintenance tasks

# Example: Create maintenance API endpoints in your application
# GET /api/admin/cleanup-sessions
# GET /api/admin/archive-analytics
# These should use the existing db connection from server/db.ts
```

#### Application Updates
```bash
# Update dependencies (monthly)
npm audit
npm update

# Push schema changes when needed
npm run db:push
```

---

## 8. Troubleshooting

### 🐛 Common Issues

#### Database Connection Issues
```bash
# Check DATABASE_URL format (must be Neon connection string)
echo $DATABASE_URL

# Verify DATABASE_URL contains Neon endpoint (should include 'neon.tech')
echo $DATABASE_URL | grep -q 'neon.tech' && echo "✓ Neon URL detected" || echo "✗ Not a Neon URL - this will cause connection failures"

# Test database connectivity through the application
npm run db:push --verbose
```

#### Application Startup Issues
```bash
# Check Node.js version
node --version  # Should be 18.0+

# Verify all dependencies installed
npm list --depth=0

# Check for TypeScript compilation errors
npm run check
```

#### API Response Issues
```bash
# Check application logs
tail -f logs/app.log  # If logging to file

# Test API endpoints manually using correct ID types
# Test with shopifyStoreId (external ID) - works if the store exists
curl -v http://localhost:5000/api/stores/test-store.myshopify.com

# Test analytics endpoint with internal storeId (UUID)
# REPLACE {STORE_ID} with actual internal UUID from your store creation
# To get a valid storeId, create a store first:
# curl -X POST http://localhost:5000/api/stores -H "Content-Type: application/json" -d '{...}'
curl -v http://localhost:5000/api/stores/{STORE_ID}/analytics
```

### 🔍 Debug Mode

Enable debug logging by setting:
```bash
NODE_ENV=development
```

This will enable:
- Detailed SQL query logging
- Request/response logging
- Error stack traces

---

## 9. Future Shopify Integration

### 🛠️ Preparation for Shopify Integration

The current database schema is designed to support future Shopify integration. When ready to implement:

#### Required Environment Variables
```bash
# Future Shopify integration variables
SHOPIFY_API_KEY="your_shopify_api_key"
SHOPIFY_API_SECRET="your_shopify_api_secret"
SHOPIFY_SCOPES="read_products,write_products,read_orders,write_orders"
SHOPIFY_APP_URL="https://your-app-domain.com"
```

#### Database Fields Ready for Shopify
- `stores.shopifyStoreId` - Store identifier
- `stores.accessToken` - OAuth access token
- `products.shopifyProductId` - Product identifier
- Cart session tracking for real-time updates

#### Implementation Steps (Future)
1. Create Shopify Partner account
2. Set up OAuth flow
3. Implement webhook handlers
4. Add Shopify API client
5. Sync products and orders
6. Enable real-time cart tracking

---

## 10. Security Considerations

### 🔒 Production Security

#### Database Security
```bash
# Use SSL connections in production (Neon connection string example)
DATABASE_URL="postgresql://neon_user:password@ep-example.us-west-2.aws.neon.tech/beauty_admin_db?sslmode=require"

# Limit database user permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
```

#### API Security
- Enable CORS properly for production domains
- Implement rate limiting
- Use HTTPS in production
- Validate all input data with Zod schemas

#### Environment Security
- Never commit `.env` files
- Use environment-specific secrets management
- Rotate database credentials regularly

---

This guide covers the current implementation of the Beauty E-commerce Admin Dashboard. For questions or issues, refer to the troubleshooting section or check the application logs.