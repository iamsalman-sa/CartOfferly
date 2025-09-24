-- =====================================================
-- Premium Cart Rewards - Database Schema for Render
-- PostgreSQL Database Setup Script
-- =====================================================

-- Enable UUID generation extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- USERS TABLE
-- =====================================================
CREATE TABLE users (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
);

-- =====================================================
-- STORES TABLE (Shopify Store Information)
-- =====================================================
CREATE TABLE stores (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    shopify_store_id TEXT NOT NULL UNIQUE,
    store_name TEXT NOT NULL,
    access_token TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- PRODUCTS TABLE (Shopify Products)
-- =====================================================
CREATE TABLE products (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    shopify_product_id TEXT NOT NULL,
    store_id VARCHAR REFERENCES stores(id),
    title TEXT NOT NULL,
    handle TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    image_url TEXT,
    is_bundle BOOLEAN DEFAULT false,
    is_eligible_for_rewards BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- MILESTONES TABLE (Reward Milestones)
-- =====================================================
CREATE TABLE milestones (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id VARCHAR REFERENCES stores(id),
    name TEXT DEFAULT 'Milestone',
    description TEXT,
    threshold_amount DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'PKR',
    reward_type TEXT NOT NULL, -- 'free_delivery', 'free_products', 'discount'
    free_product_count INTEGER DEFAULT 0,
    discount_value DECIMAL(10, 2) DEFAULT 0,
    discount_type TEXT DEFAULT 'percentage', -- 'percentage', 'fixed'
    
    -- Status and Control
    status TEXT DEFAULT 'active', -- 'active', 'paused', 'deleted'
    is_active BOOLEAN DEFAULT true,
    
    -- Advanced Conditions
    conditions JSONB DEFAULT '{}',
    eligible_products TEXT[],
    exclude_products TEXT[],
    enable_product_selection BOOLEAN DEFAULT false,
    include_bundles BOOLEAN DEFAULT true,
    customer_segments TEXT[] DEFAULT ARRAY['all'], -- "all", "new", "returning", "vip"
    
    -- Scheduling
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    
    -- Usage Limits
    usage_limit INTEGER,
    usage_count INTEGER DEFAULT 0,
    max_usage_per_customer INTEGER DEFAULT 1,
    
    -- Priority and Display
    priority INTEGER DEFAULT 1,
    display_order INTEGER DEFAULT 1,
    icon TEXT DEFAULT '🎁',
    color TEXT DEFAULT '#e91e63',
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by TEXT,
    last_modified_by TEXT
);

-- =====================================================
-- CART SESSIONS TABLE (Customer Cart Tracking)
-- =====================================================
CREATE TABLE cart_sessions (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id VARCHAR REFERENCES stores(id),
    customer_id TEXT,
    cart_token TEXT NOT NULL,
    current_value DECIMAL(10, 2) DEFAULT 0,
    unlocked_milestones JSONB DEFAULT '[]',
    selected_free_products JSONB DEFAULT '[]',
    timer_expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- REWARD HISTORY TABLE
-- =====================================================
CREATE TABLE reward_history (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id VARCHAR REFERENCES stores(id),
    cart_session_id VARCHAR REFERENCES cart_sessions(id),
    milestone_id VARCHAR REFERENCES milestones(id),
    reward_type TEXT NOT NULL,
    reward_value DECIMAL(10, 2),
    is_redeemed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- DISCOUNT CAMPAIGNS TABLE
-- =====================================================
CREATE TABLE discount_campaigns (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id VARCHAR REFERENCES stores(id),
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL, -- 'percentage', 'fixed_amount', 'bogo', 'bundle', 'seasonal', 'tiered'
    status TEXT DEFAULT 'draft', -- 'draft', 'active', 'paused', 'expired'
    priority INTEGER DEFAULT 1,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    usage_limit INTEGER,
    usage_count INTEGER DEFAULT 0,
    minimum_order_value DECIMAL(10, 2),
    maximum_discount_amount DECIMAL(10, 2),
    stackable BOOLEAN DEFAULT false,
    customer_segment TEXT DEFAULT 'all', -- 'all', 'new', 'returning', 'vip'
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- DISCOUNT RULES TABLE
-- =====================================================
CREATE TABLE discount_rules (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id VARCHAR REFERENCES discount_campaigns(id),
    rule_type TEXT NOT NULL, -- 'percentage_off', 'fixed_off', 'buy_x_get_y', 'free_shipping'
    discount_value DECIMAL(10, 2) NOT NULL,
    buy_quantity INTEGER DEFAULT 1,
    get_quantity INTEGER DEFAULT 0,
    get_discount_percent DECIMAL(5, 2) DEFAULT 0,
    apply_to_products TEXT DEFAULT 'all', -- 'all', 'specific', 'categories'
    conditions JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- CAMPAIGN PRODUCTS TABLE (Product-Campaign Relations)
-- =====================================================
CREATE TABLE campaign_products (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id VARCHAR REFERENCES discount_campaigns(id),
    product_id VARCHAR REFERENCES products(id),
    inclusion_type TEXT NOT NULL, -- 'include', 'exclude'
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- BUNDLE CONFIGURATIONS TABLE
-- =====================================================
CREATE TABLE bundle_configurations (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id VARCHAR REFERENCES discount_campaigns(id),
    name TEXT NOT NULL,
    bundle_type TEXT NOT NULL, -- 'fixed_bundle', 'mix_match', 'category_bundle'
    total_items INTEGER NOT NULL,
    discount_type TEXT NOT NULL, -- 'percentage', 'fixed_price'
    discount_value DECIMAL(10, 2) NOT NULL,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- BUNDLE ITEMS TABLE
-- =====================================================
CREATE TABLE bundle_items (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    bundle_id VARCHAR REFERENCES bundle_configurations(id),
    product_id VARCHAR REFERENCES products(id),
    quantity INTEGER DEFAULT 1,
    is_required BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- SEASONAL PROMOTIONS TABLE
-- =====================================================
CREATE TABLE seasonal_promotions (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id VARCHAR REFERENCES stores(id),
    name TEXT NOT NULL,
    theme TEXT, -- 'eid', 'ramadan', 'valentine', 'summer', 'winter', 'black_friday'
    banner_text TEXT,
    banner_color TEXT DEFAULT '#000000',
    text_color TEXT DEFAULT '#ffffff',
    auto_activate BOOLEAN DEFAULT false,
    show_banner_on_website BOOLEAN DEFAULT true,
    activation_date TIMESTAMP,
    deactivation_date TIMESTAMP,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- DISCOUNT ANALYTICS TABLE
-- =====================================================
CREATE TABLE discount_analytics (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id VARCHAR REFERENCES discount_campaigns(id),
    date TIMESTAMP DEFAULT NOW(),
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    revenue DECIMAL(12, 2) DEFAULT 0,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    order_count INTEGER DEFAULT 0,
    customer_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Stores indexes
CREATE INDEX idx_stores_shopify_store_id ON stores(shopify_store_id);
CREATE INDEX idx_stores_is_active ON stores(is_active);

-- Products indexes
CREATE INDEX idx_products_store_id ON products(store_id);
CREATE INDEX idx_products_shopify_product_id ON products(shopify_product_id);
CREATE INDEX idx_products_is_eligible_for_rewards ON products(is_eligible_for_rewards);

-- Milestones indexes
CREATE INDEX idx_milestones_store_id ON milestones(store_id);
CREATE INDEX idx_milestones_is_active ON milestones(is_active);
CREATE INDEX idx_milestones_threshold_amount ON milestones(threshold_amount);

-- Cart sessions indexes
CREATE INDEX idx_cart_sessions_store_id ON cart_sessions(store_id);
CREATE INDEX idx_cart_sessions_cart_token ON cart_sessions(cart_token);
CREATE INDEX idx_cart_sessions_is_active ON cart_sessions(is_active);

-- Discount campaigns indexes
CREATE INDEX idx_discount_campaigns_store_id ON discount_campaigns(store_id);
CREATE INDEX idx_discount_campaigns_status ON discount_campaigns(status);
CREATE INDEX idx_discount_campaigns_start_date ON discount_campaigns(start_date);
CREATE INDEX idx_discount_campaigns_end_date ON discount_campaigns(end_date);

-- Campaign products indexes
CREATE INDEX idx_campaign_products_campaign_id ON campaign_products(campaign_id);
CREATE INDEX idx_campaign_products_product_id ON campaign_products(product_id);

-- Analytics indexes
CREATE INDEX idx_discount_analytics_campaign_id ON discount_analytics(campaign_id);
CREATE INDEX idx_discount_analytics_date ON discount_analytics(date);

-- =====================================================
-- INITIAL DATA (Optional)
-- =====================================================

-- You can add initial data here if needed
-- INSERT INTO stores (shopify_store_id, store_name, access_token) 
-- VALUES ('your-store', 'Your Store Name', 'your-access-token');

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================
SELECT 'Database schema created successfully! Ready for Premium Cart Rewards app.' AS status;