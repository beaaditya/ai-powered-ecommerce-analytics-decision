-- =========================================================================
-- AI-Powered E-Commerce Analytics & Decision System
-- Production PostgreSQL Database DDL (Target: Free-Tier Supabase / Cloud)
-- Size: ~48.3 MB data footprint (Safely within 500 MB Free Limits)
-- Verified directly against local PostgreSQL source schema
-- =========================================================================

-- 1. Create Required Schemas
CREATE SCHEMA IF NOT EXISTS analytics;
CREATE SCHEMA IF NOT EXISTS ai;

-- =========================================================================
-- 2. Executive Overview & Time-Series Analytics Tables
-- =========================================================================

-- Table: analytics.weekly_metrics (102 rows)
DROP TABLE IF EXISTS analytics.weekly_metrics CASCADE;
CREATE TABLE analytics.weekly_metrics (
    week_no INTEGER,
    active_households BIGINT,
    baskets BIGINT,
    units BIGINT,
    revenue NUMERIC,
    discounts NUMERIC
);
CREATE INDEX IF NOT EXISTS idx_weekly_metrics_week ON analytics.weekly_metrics(week_no);

-- Table: analytics.department_metrics (44 rows)
DROP TABLE IF EXISTS analytics.department_metrics CASCADE;
CREATE TABLE analytics.department_metrics (
    department TEXT,
    customers BIGINT,
    baskets BIGINT,
    units_sold BIGINT,
    revenue NUMERIC,
    discounts NUMERIC
);
CREATE INDEX IF NOT EXISTS idx_dept_metrics_dept ON analytics.department_metrics(department);

-- Table: analytics.category_metrics (3,912 rows)
DROP TABLE IF EXISTS analytics.category_metrics CASCADE;
CREATE TABLE analytics.category_metrics (
    department TEXT,
    commodity_desc TEXT,
    sub_commodity_desc TEXT,
    customers BIGINT,
    baskets BIGINT,
    units_sold BIGINT,
    revenue NUMERIC,
    discounts NUMERIC
);
CREATE INDEX IF NOT EXISTS idx_cat_metrics_commodity ON analytics.category_metrics(commodity_desc);
CREATE INDEX IF NOT EXISTS idx_cat_metrics_dept ON analytics.category_metrics(department);

-- Table: analytics.category_trend (360 rows)
DROP TABLE IF EXISTS analytics.category_trend CASCADE;
CREATE TABLE analytics.category_trend (
    department TEXT,
    commodity_desc TEXT,
    first_half_revenue NUMERIC,
    second_half_revenue NUMERIC,
    revenue_change NUMERIC,
    trend VARCHAR
);
CREATE INDEX IF NOT EXISTS idx_cat_trend_comm ON analytics.category_trend(commodity_desc);

-- =========================================================================
-- 3. Product Performance & Basket Metrics Tables
-- =========================================================================

-- Table: analytics.product_metrics (92,339 rows)
DROP TABLE IF EXISTS analytics.product_metrics CASCADE;
CREATE TABLE analytics.product_metrics (
    product_id BIGINT,
    department TEXT,
    commodity_desc TEXT,
    sub_commodity_desc TEXT,
    brand TEXT,
    unique_households BIGINT,
    purchase_baskets BIGINT,
    units_sold BIGINT,
    revenue NUMERIC,
    discount_amount NUMERIC
);
CREATE INDEX IF NOT EXISTS idx_prod_metrics_id ON analytics.product_metrics(product_id);
CREATE INDEX IF NOT EXISTS idx_prod_metrics_rev ON analytics.product_metrics(revenue DESC);
CREATE INDEX IF NOT EXISTS idx_prod_metrics_units ON analytics.product_metrics(units_sold DESC);
CREATE INDEX IF NOT EXISTS idx_prod_metrics_dept ON analytics.product_metrics(department);

-- Table: analytics.basket_metrics (276,484 rows)
DROP TABLE IF EXISTS analytics.basket_metrics CASCADE;
CREATE TABLE analytics.basket_metrics (
    household_key BIGINT,
    basket_id BIGINT,
    day INTEGER,
    week_no INTEGER,
    basket_revenue NUMERIC,
    basket_quantity BIGINT,
    basket_discount NUMERIC,
    unique_products BIGINT
);
CREATE INDEX IF NOT EXISTS idx_basket_metrics_hh ON analytics.basket_metrics(household_key);
CREATE INDEX IF NOT EXISTS idx_basket_metrics_week ON analytics.basket_metrics(week_no);

-- =========================================================================
-- 4. Customer Intelligence & RFM Segmentation Tables
-- =========================================================================

-- Table: analytics.customer_rfm_scored (2,500 rows)
DROP TABLE IF EXISTS analytics.customer_rfm_scored CASCADE;
CREATE TABLE analytics.customer_rfm_scored (
    household_key BIGINT,
    last_purchase_day INTEGER,
    purchase_frequency BIGINT,
    monetary_value NUMERIC,
    total_quantity BIGINT,
    unique_products BIGINT,
    active_weeks BIGINT,
    avg_basket_value NUMERIC,
    recency_score INTEGER,
    frequency_score INTEGER,
    monetary_score INTEGER,
    customer_segment VARCHAR
);
CREATE INDEX IF NOT EXISTS idx_rfm_scored_hh ON analytics.customer_rfm_scored(household_key);
CREATE INDEX IF NOT EXISTS idx_rfm_scored_segment ON analytics.customer_rfm_scored(customer_segment);
CREATE INDEX IF NOT EXISTS idx_rfm_scored_monetary ON analytics.customer_rfm_scored(monetary_value DESC);

-- Table: analytics.customer_intelligence (2,500 rows)
DROP TABLE IF EXISTS analytics.customer_intelligence CASCADE;
CREATE TABLE analytics.customer_intelligence (
    household_key BIGINT,
    customer_segment VARCHAR,
    recency_score INTEGER,
    frequency_score INTEGER,
    monetary_score INTEGER,
    monetary_value NUMERIC,
    spending_trend VARCHAR,
    revenue_change_pct NUMERIC,
    discount_sensitivity VARCHAR,
    discount_purchase_rate NUMERIC,
    avg_basket_value NUMERIC,
    active_weeks BIGINT
);
CREATE INDEX IF NOT EXISTS idx_ci_hh ON analytics.customer_intelligence(household_key);
CREATE INDEX IF NOT EXISTS idx_ci_segment ON analytics.customer_intelligence(customer_segment);
CREATE INDEX IF NOT EXISTS idx_ci_trend ON analytics.customer_intelligence(spending_trend);

-- Table: analytics.customer_metrics (2,500 rows)
-- Exact 9 columns matching local database
DROP TABLE IF EXISTS analytics.customer_metrics CASCADE;
CREATE TABLE analytics.customer_metrics (
    household_key BIGINT,
    total_visits BIGINT,
    total_quantity BIGINT,
    total_revenue NUMERIC,
    total_discount NUMERIC,
    avg_line_value NUMERIC,
    first_purchase_day INTEGER,
    last_purchase_day INTEGER,
    active_weeks BIGINT
);
CREATE INDEX IF NOT EXISTS idx_cust_metrics_hh ON analytics.customer_metrics(household_key);

-- Table: analytics.customer_rfm (2,500 rows)
-- Exact 8 columns matching local database (avg_basket_value NUMERIC)
DROP TABLE IF EXISTS analytics.customer_rfm CASCADE;
CREATE TABLE analytics.customer_rfm (
    household_key BIGINT,
    last_purchase_day INTEGER,
    purchase_frequency BIGINT,
    monetary_value NUMERIC,
    total_quantity BIGINT,
    unique_products BIGINT,
    active_weeks BIGINT,
    avg_basket_value NUMERIC
);
CREATE INDEX IF NOT EXISTS idx_cust_rfm_hh ON analytics.customer_rfm(household_key);

-- Table: analytics.customer_trend (2,500 rows)
DROP TABLE IF EXISTS analytics.customer_trend CASCADE;
CREATE TABLE analytics.customer_trend (
    household_key BIGINT,
    first_half_revenue NUMERIC,
    second_half_revenue NUMERIC,
    first_half_quantity NUMERIC,
    second_half_quantity NUMERIC,
    revenue_change NUMERIC,
    revenue_change_pct NUMERIC,
    spending_trend VARCHAR
);
CREATE INDEX IF NOT EXISTS idx_cust_trend_hh ON analytics.customer_trend(household_key);

-- Table: analytics.customer_discount (2,500 rows)
DROP TABLE IF EXISTS analytics.customer_discount CASCADE;
CREATE TABLE analytics.customer_discount (
    household_key BIGINT,
    revenue NUMERIC,
    total_discount NUMERIC,
    total_purchase_lines BIGINT,
    discounted_purchase_lines BIGINT,
    discount_purchase_rate NUMERIC,
    discount_sensitivity VARCHAR
);
CREATE INDEX IF NOT EXISTS idx_cust_discount_hh ON analytics.customer_discount(household_key);

-- Table: analytics.customer_recommendations (34,158 rows)
DROP TABLE IF EXISTS analytics.customer_recommendations CASCADE;
CREATE TABLE analytics.customer_recommendations (
    household_key BIGINT,
    category_preference_rank BIGINT,
    department TEXT,
    commodity_desc TEXT,
    product_id BIGINT,
    product_revenue NUMERIC,
    product_customers BIGINT,
    units_sold BIGINT,
    recommendation_rank BIGINT
);
CREATE INDEX IF NOT EXISTS idx_cust_recs_hh ON analytics.customer_recommendations(household_key);
CREATE INDEX IF NOT EXISTS idx_cust_recs_rank ON analytics.customer_recommendations(recommendation_rank);

-- =========================================================================
-- 5. Marketing & Promotion Intelligence Tables
-- =========================================================================

-- Table: analytics.campaign_performance (30 rows)
DROP TABLE IF EXISTS analytics.campaign_performance CASCADE;
CREATE TABLE analytics.campaign_performance (
    campaign INTEGER,
    description TEXT,
    start_day INTEGER,
    end_day INTEGER,
    households_targeted BIGINT,
    households_redeemed BIGINT,
    total_redemptions BIGINT,
    redemption_rate NUMERIC
);
CREATE INDEX IF NOT EXISTS idx_camp_perf_camp ON analytics.campaign_performance(campaign);

-- Table: analytics.campaign_customer_spend (7,208 rows)
DROP TABLE IF EXISTS analytics.campaign_customer_spend CASCADE;
CREATE TABLE analytics.campaign_customer_spend (
    campaign INTEGER,
    household_key BIGINT,
    start_day INTEGER,
    end_day INTEGER,
    pre_campaign_spend NUMERIC,
    campaign_spend NUMERIC,
    spend_change NUMERIC
);
CREATE INDEX IF NOT EXISTS idx_camp_spend_camp ON analytics.campaign_customer_spend(campaign);
CREATE INDEX IF NOT EXISTS idx_camp_spend_hh ON analytics.campaign_customer_spend(household_key);

-- Table: analytics.customer_campaign_response (7,208 rows)
DROP TABLE IF EXISTS analytics.customer_campaign_response CASCADE;
CREATE TABLE analytics.customer_campaign_response (
    campaign INTEGER,
    household_key BIGINT,
    description TEXT,
    start_day INTEGER,
    end_day INTEGER,
    redeemed_coupon INTEGER,
    pre_campaign_spend NUMERIC,
    campaign_spend NUMERIC,
    spend_change NUMERIC
);
CREATE INDEX IF NOT EXISTS idx_cust_camp_resp_camp ON analytics.customer_campaign_response(campaign);
CREATE INDEX IF NOT EXISTS idx_cust_camp_resp_hh ON analytics.customer_campaign_response(household_key);

-- Table: analytics.production_promotion_summary (1 row)
DROP TABLE IF EXISTS analytics.production_promotion_summary CASCADE;
CREATE TABLE analytics.production_promotion_summary (
    promo_revenue NUMERIC,
    promo_units NUMERIC,
    avg_unit_price NUMERIC
);

-- =========================================================================
-- 6. AI Agent Telemetry
-- =========================================================================

-- Table: ai.query_log
DROP TABLE IF EXISTS ai.query_log CASCADE;
CREATE TABLE ai.query_log (
    query_id BIGSERIAL PRIMARY KEY,
    user_question TEXT NOT NULL,
    generated_sql TEXT,
    execution_status VARCHAR,
    ai_answer TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- 7. Analytics Views
-- =========================================================================

CREATE OR REPLACE VIEW analytics.ai_customer_context AS
SELECT 
    household_key,
    customer_segment,
    spending_trend,
    revenue_change_pct,
    discount_sensitivity,
    discount_purchase_rate,
    monetary_value,
    avg_basket_value,
    active_weeks
FROM analytics.customer_intelligence;

CREATE OR REPLACE VIEW analytics.customer_recommendation_view AS
SELECT 
    r.household_key,
    i.customer_segment,
    i.spending_trend,
    i.discount_sensitivity,
    r.department,
    r.commodity_desc,
    r.product_id,
    r.product_revenue,
    r.product_customers,
    r.recommendation_rank
FROM analytics.customer_recommendations r
JOIN analytics.customer_intelligence i ON r.household_key = i.household_key
WHERE r.recommendation_rank <= 10;
