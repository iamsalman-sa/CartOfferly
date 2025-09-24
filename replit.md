# Overview

Premium Cart Rewards is a Shopify app that implements milestone-based cart rewards to increase average order value. The application provides a shopping cart experience with progressive reward unlocking, including free delivery and free product selections, designed to incentivize customers to add more items to their cart to reach reward thresholds.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Components**: Radix UI primitives with shadcn/ui styling system
- **Styling**: TailwindCSS with CSS variables for theming
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for client-side routing
- **Component Structure**: Modular component architecture with separate UI components and business logic components

## Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ESM modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **API Design**: RESTful API with dedicated routes for stores, products, milestones, and cart sessions
- **Error Handling**: Centralized error handling middleware
- **Development Tools**: Hot module replacement with Vite integration in development

## Database Schema Design
The system uses PostgreSQL with the following core entities:
- **Stores**: Shopify store information with access tokens
- **Products**: Product catalog with eligibility flags for rewards
- **Milestones**: Configurable reward thresholds with different reward types
- **Cart Sessions**: Active cart tracking with unlocked milestones and selected rewards
- **Reward History**: Transaction history for analytics
- **Users**: Basic user management system

## Core Business Logic
- **Progressive Rewards**: Milestone system that unlocks rewards based on cart value thresholds
- **Real-time Updates**: Cart value tracking with immediate milestone evaluation
- **Urgency Mechanisms**: Timer-based expiration for reward selections
- **Product Selection**: Interface for customers to choose free products from eligible inventory

## State Management Pattern
- Server state managed through TanStack Query with optimistic updates
- Local cart state synchronized with backend cart sessions
- Real-time milestone evaluation and celebration animations
- Persistent cart sessions across browser sessions

# External Dependencies

## Database
- **Neon Database**: PostgreSQL serverless database with connection pooling
- **Drizzle Kit**: Database migration and schema management tools

## UI Framework
- **Radix UI**: Headless component primitives for accessibility
- **shadcn/ui**: Pre-built component library with consistent design system
- **Lucide React**: Icon library for UI components

## Development Tools
- **Replit Integration**: Development environment plugins for cartographer and dev banner
- **TanStack Query**: Server state management and caching
- **Zod**: Runtime type validation for API requests and responses

## Shopify Integration
- **Shopify API**: Store and product data synchronization (integration points prepared)
- **Webhook Support**: Ready for Shopify cart and order event processing

## Styling and Animation
- **TailwindCSS**: Utility-first CSS framework
- **CSS Variables**: Dynamic theming system
- **Embla Carousel**: Product selection carousel component
- **Custom Animations**: Celebration effects for milestone achievements

# Shopify Store Deployment Guide

## Prerequisites

Before deploying this promotional management system to your Shopify store, ensure you have:

1. **Shopify Partner Account**: Create a Shopify Partner account at partners.shopify.com
2. **Shopify Store Access**: Admin access to your Shopify store
3. **Domain Setup**: A custom domain for your app (optional but recommended)
4. **Database Access**: PostgreSQL database (Replit provides this automatically)

## Environment Configuration

### Required Environment Variables

Create a `.env` file in your project root with the following variables:

```bash
# Shopify Configuration
VITE_SHOPIFY_STORE_ID=your-store-id.myshopify.com
VITE_SHOPIFY_CUSTOMER_ID=customer-id-from-shopify

# Database (Auto-configured in Replit)
DATABASE_URL=your-postgresql-connection-string

# Optional: Custom Domain
VITE_APP_DOMAIN=your-custom-domain.com
```

## Shopify App Setup

### Step 1: Create Shopify App

1. Go to Shopify Partners dashboard
2. Click "Create app" → "Custom app"
3. Enter app name: "Premium Cart Rewards"
4. Set app URL to your Replit domain: `https://your-repl-name.replit.app`

### Step 2: Configure App Permissions

In your Shopify app settings, request these scopes:
- `read_products` - Access product catalog
- `read_orders` - Track order data for analytics
- `read_customers` - Customer segmentation
- `write_script_tags` - Inject cart functionality
- `read_analytics` - Performance metrics

### Step 3: Install App Theme Integration

Add the cart drawer to your Shopify theme:

1. Go to **Online Store** → **Themes** → **Actions** → **Edit code**
2. Open `theme.liquid` file
3. Add before the closing `</body>` tag:

```liquid
<!-- Premium Cart Rewards Integration -->
<div id="cart-rewards-app"></div>
<script>
  window.SHOPIFY_STORE_ID = '{{ shop.permanent_domain }}';
  window.SHOPIFY_CUSTOMER_ID = '{% if customer %}{{ customer.id }}{% endif %}';
</script>
<script src="https://your-repl-name.replit.app/cart-integration.js"></script>
```

### Step 4: Product Configuration

1. **Navigate to Admin Dashboard**: `https://your-repl-name.replit.app/admin`
2. **Sync Products**: The system will automatically sync your Shopify products
3. **Configure Milestones**: Set up reward thresholds:
   - Free Delivery: PKR 2,500
   - Free Product (1 item): PKR 3,000
   - Free Product (2 items): PKR 4,000
4. **Mark Eligible Products**: Select which products can be given as free rewards

## Campaign Setup

### Creating Promotional Campaigns

1. **Access Campaign Management**: `/admin/campaigns`
2. **Create New Campaign**:
   - **Name**: Summer Beauty Sale
   - **Type**: Percentage discount
   - **Value**: 20%
   - **Minimum Order**: PKR 1,000
   - **Duration**: Set start and end dates

### Seasonal Promotions

1. **Navigate to**: `/admin/seasonal`
2. **Choose Theme**: Eid, Ramadan, Valentine's, Summer, Winter
3. **Customize Banner**: Set colors and message text
4. **Schedule Activation**: Auto-activate or manual control

## Analytics and Monitoring

### Key Metrics Dashboard

Access real-time analytics at `/admin/analytics`:
- **Revenue Impact**: Total additional revenue from campaigns
- **Conversion Rate**: Campaign-driven conversion improvements
- **Average Order Value**: AOV increase from milestones
- **Campaign ROI**: Return on investment per campaign

### Performance Tracking

- **Monthly Trends**: Revenue and order patterns
- **Product Performance**: Top-performing products in campaigns
- **Customer Behavior**: Milestone completion rates

## Production Deployment

### Database Migration

1. **Run Schema Migration**:
   ```bash
   npm run db:push
   ```

2. **Verify Tables Created**:
   - stores
   - products
   - milestones
   - campaigns
   - cart_sessions
   - reward_history

### Domain Setup (Optional)

1. **Custom Domain**: Configure your custom domain in Replit
2. **SSL Certificate**: Automatic HTTPS is provided
3. **Update Shopify App URL**: Change app URL to your custom domain

### Go Live Checklist

- [ ] Environment variables configured
- [ ] Shopify app permissions granted
- [ ] Theme integration completed
- [ ] Products synced and configured
- [ ] Milestones set up with appropriate thresholds
- [ ] Test campaigns created and verified
- [ ] Analytics dashboard accessible
- [ ] Mobile responsiveness tested
- [ ] Cross-browser compatibility verified

## Troubleshooting

### Common Issues

1. **App Not Loading in Theme**:
   - Verify script tag placement in theme.liquid
   - Check browser console for JavaScript errors
   - Ensure Replit app is running

2. **Products Not Syncing**:
   - Confirm Shopify API permissions
   - Check store ID in environment variables
   - Verify database connectivity

3. **Milestones Not Triggering**:
   - Review milestone threshold amounts
   - Check product eligibility settings
   - Ensure cart value calculation is correct

### Support Resources

- **Documentation**: This deployment guide
- **API Reference**: `/api` endpoints documentation
- **Database Schema**: See `shared/schema.ts`
- **Component Library**: shadcn/ui documentation

## Security Considerations

⚠️ **CRITICAL SECURITY WARNING - DEVELOPMENT SETUP ONLY** ⚠️

**This current setup is for DEVELOPMENT ONLY and has a critical security vulnerability:**

The Shopify admin token is currently handled on the frontend using `VITE_SHOPIFY_ADMIN_API_KEY`, which exposes the token in the compiled JavaScript bundle. This means anyone can inspect the client code and retrieve your Shopify admin token.

**Before Production Deployment:**
1. **Move token handling to backend**: Create a server-side endpoint that handles store creation using secure server environment variables
2. **Remove client-side token access**: Update the frontend to call backend endpoints instead of handling tokens directly  
3. **Use server-side secrets**: Store Shopify credentials securely on the server, never in client environment variables

**Current Development Status:**
- ✅ Application runs successfully in development mode
- ✅ Database connected and schema deployed  
- ✅ All API endpoints functional
- ❌ **NOT PRODUCTION READY** - Token security must be addressed

**Additional Security Requirements:**

1. **API Keys**: Never commit API keys to version control
2. **Database Access**: Use connection pooling for production
3. **CORS Settings**: Restrict to your Shopify domain
4. **Rate Limiting**: Implement API rate limiting for production use

## Performance Optimization

1. **Database Indexing**: Ensure proper indexes on frequently queried fields
2. **Caching**: Implement Redis caching for analytics data
3. **CDN**: Use CDN for static assets in production
4. **Monitoring**: Set up application monitoring and alerts