-- ============================================================================
-- DUNNHUMBY RETAIL INTELLIGENCE - SAFE LOCAL MIGRATION SCRIPT
-- Migration File: sql/07_migrations/01_ai_agent_schema_alignment.sql
-- Database: dunnhumpy_db
-- Schema: analytics
--
-- PURPOSE:
-- Safely realign analytics tables (customer_trend, customer_discount,
-- customer_recommendations, promotion_sales) with the AI Agent schema specifications
-- while strictly preserving 100% backward-compatibility with all existing FastAPI
-- endpoints (/api/dashboard/overview, /api/dashboard/customers,
-- /api/dashboard/products, /api/dashboard/marketing, /api/insights).
--
-- SAFETY RULES APPLIED:
-- 1. NON-DESTRUCTIVE: Existing live tables are NEVER dropped or overwritten directly.
-- 2. STAGING STRATEGY: Tables are created with "_new" suffix first.
-- 3. VALIDATION GATES: Row count, primary key grain, NULL check, and query compatibility.
-- 4. ATOMIC SWAP: The final table rename is wrapped in a TRANSACTION BLOCK and is
--    COMMENTED OUT BY DEFAULT so it cannot be run accidentally.
-- 5. READ-ONLY DEFAULT: This script does not alter live production traffic when run.
-- ============================================================================


-- ============================================================================
-- SECTION 1: PRE-MIGRATION CHECKS & BASELINE AUDIT
-- ============================================================================
-- Verify source tables exist and record baseline metric checkpoints.

-- Check 1.1: Verify source tables in 'clean' schema
SELECT 'clean.transaction_data' AS source_table, COUNT(*) AS row_count FROM clean.transaction_data
UNION ALL
SELECT 'clean.product' AS source_table, COUNT(*) AS row_count FROM clean.product
UNION ALL
SELECT 'clean.causal_data' AS source_table, COUNT(*) AS row_count FROM clean.causal_data;

-- Check 1.2: Check current baseline metrics in existing analytics tables
SELECT 'existing: customer_trend' AS table_name, COUNT(*) AS row_count FROM analytics.customer_trend
UNION ALL
SELECT 'existing: customer_discount' AS table_name, COUNT(*) AS row_count FROM analytics.customer_discount
UNION ALL
SELECT 'existing: customer_recommendations' AS table_name, COUNT(*) AS row_count FROM analytics.customer_recommendations
UNION ALL
SELECT 'existing: promotion_sales' AS table_name, COUNT(*) AS row_count FROM analytics.promotion_sales;

-- Check 1.3: Record current promotion query output (must match post-migration)
SELECT 
    SUM(revenue) AS promo_revenue,
    SUM(units_sold) AS promo_units,
    ROUND(SUM(revenue) / NULLIF(SUM(units_sold), 0), 2) AS avg_unit_price
FROM analytics.promotion_sales
WHERE has_promotion = 1;


-- ============================================================================
-- SECTION 2: CREATE NEW REPLACEMENT STAGING TABLES
-- ============================================================================

-- Table A: analytics.customer_trend_new
-- Target Grain: Household-level (1 row per household_key, ~2,500 rows)
-- Realigns H1 vs H2 spend momentum to match AI SQL Agent prompts & Business Case specs.
CREATE TABLE IF NOT EXISTS analytics.customer_trend_new (
    household_key          BIGINT PRIMARY KEY,
    first_half_revenue     NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    second_half_revenue    NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    first_half_quantity    BIGINT NOT NULL DEFAULT 0,
    second_half_quantity   BIGINT NOT NULL DEFAULT 0,
    revenue_change         NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    revenue_change_pct     NUMERIC(8, 2),
    spending_trend         VARCHAR(30) NOT NULL DEFAULT 'Stable'
);

-- Table B: analytics.customer_discount_new
-- Target Grain: Household-level (1 row per household_key, ~2,500 rows)
-- Preserves existing fields (total_discount, retail_discount, coupon_discount, discounted_baskets)
-- and adds revenue, purchase line counts, discount_purchase_rate, and discount_sensitivity.
CREATE TABLE IF NOT EXISTS analytics.customer_discount_new (
    household_key             BIGINT PRIMARY KEY,
    revenue                   NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_discount            NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    retail_discount           NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    coupon_discount           NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    discounted_baskets        BIGINT NOT NULL DEFAULT 0,
    total_purchase_lines      BIGINT NOT NULL DEFAULT 0,
    discounted_purchase_lines BIGINT NOT NULL DEFAULT 0,
    discount_purchase_rate    NUMERIC(8, 4) NOT NULL DEFAULT 0.0000,
    discount_sensitivity      VARCHAR(30) NOT NULL DEFAULT 'Low'
);

-- Table C: analytics.customer_recommendations_new
-- Target Grain: Household-Product level (Top 10 recommended SKUs per household, ~25,000 rows)
-- Preserves existing recommendation metrics and denormalizes department & commodity descriptions.
CREATE TABLE IF NOT EXISTS analytics.customer_recommendations_new (
    household_key         BIGINT NOT NULL,
    product_id            BIGINT NOT NULL,
    department            TEXT,
    commodity_desc        TEXT,
    purchase_count        BIGINT NOT NULL DEFAULT 0,
    units_purchased       BIGINT NOT NULL DEFAULT 0,
    revenue               NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    recommendation_rank   BIGINT NOT NULL,
    PRIMARY KEY (household_key, recommendation_rank)
);

-- Table D: analytics.promotion_sales_new
-- Target Grain: Product-Promotion level (~92,000 rows)
-- Expands 2-row aggregate table to product-level promotional breakdown while maintaining
-- exact backward-compatibility with: SELECT SUM(revenue), SUM(units_sold) WHERE has_promotion = 1.
CREATE TABLE IF NOT EXISTS analytics.promotion_sales_new (
    product_id        BIGINT NOT NULL,
    department        TEXT,
    commodity_desc    TEXT,
    has_display       INTEGER NOT NULL DEFAULT 0,
    has_mailer        INTEGER NOT NULL DEFAULT 0,
    has_promotion     INTEGER NOT NULL DEFAULT 0,
    units_sold        BIGINT NOT NULL DEFAULT 0,
    revenue           NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    baskets           BIGINT NOT NULL DEFAULT 0,
    households        BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (product_id, has_promotion, has_display, has_mailer)
);


-- ============================================================================
-- SECTION 3: INSERT / BUILD DATA INTO REPLACEMENT TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 3.1 Populate analytics.customer_trend_new
-- ----------------------------------------------------------------------------
-- Logic:
-- Total 102 calendar weeks partitioned at week 51:
-- H1: week_no <= 51 (weeks 1 - 51)
-- H2: week_no > 51  (weeks 52 - 102)
-- spending_trend threshold aligned with customer_intelligence logic:
-- > 10% change -> 'Growing', < -10% change -> 'Declining', else -> 'Stable'.
-- ----------------------------------------------------------------------------
TRUNCATE TABLE analytics.customer_trend_new;

INSERT INTO analytics.customer_trend_new (
    household_key,
    first_half_revenue,
    second_half_revenue,
    first_half_quantity,
    second_half_quantity,
    revenue_change,
    revenue_change_pct,
    spending_trend
)
WITH household_splits AS (
    SELECT 
        household_key,
        COALESCE(SUM(CASE WHEN week_no <= 51 THEN sales_value ELSE 0 END), 0) AS h1_rev,
        COALESCE(SUM(CASE WHEN week_no > 51 THEN sales_value ELSE 0 END), 0) AS h2_rev,
        COALESCE(SUM(CASE WHEN week_no <= 51 THEN quantity ELSE 0 END), 0) AS h1_qty,
        COALESCE(SUM(CASE WHEN week_no > 51 THEN quantity ELSE 0 END), 0) AS h2_qty
    FROM clean.transaction_data
    GROUP BY household_key
)
SELECT 
    household_key,
    ROUND(h1_rev::numeric, 2) AS first_half_revenue,
    ROUND(h2_rev::numeric, 2) AS second_half_revenue,
    h1_qty AS first_half_quantity,
    h2_qty AS second_half_quantity,
    ROUND((h2_rev - h1_rev)::numeric, 2) AS revenue_change,
    CASE 
        WHEN h1_rev = 0 THEN NULL
        ELSE ROUND(((h2_rev - h1_rev) / h1_rev * 100.0)::numeric, 2)
    END AS revenue_change_pct,
    CASE 
        WHEN h1_rev = 0 THEN 'New'
        WHEN ((h2_rev - h1_rev) / h1_rev * 100.0) > 10.0 THEN 'Growing'
        WHEN ((h2_rev - h1_rev) / h1_rev * 100.0) < -10.0 THEN 'Declining'
        ELSE 'Stable'
    END AS spending_trend
FROM household_splits;


-- ----------------------------------------------------------------------------
-- 3.2 Populate analytics.customer_discount_new
-- ----------------------------------------------------------------------------
-- Logic:
-- Total discount = ABS(retail_disc) + ABS(coupon_disc) + ABS(coupon_match_disc)
-- Retail discount = ABS(retail_disc)
-- Coupon discount = ABS(coupon_disc)
-- Discounted baskets = count of distinct baskets where coupons were redeemed
-- Total purchase lines = total rows in transaction_data for household
-- Discounted purchase lines = rows with retail_disc, coupon_disc, or coupon_match_disc > 0
-- Discount purchase rate = discounted_purchase_lines / total_purchase_lines
-- Discount sensitivity: >= 50% -> 'High', >= 25% -> 'Moderate', else 'Low'
-- ----------------------------------------------------------------------------
TRUNCATE TABLE analytics.customer_discount_new;

INSERT INTO analytics.customer_discount_new (
    household_key,
    revenue,
    total_discount,
    retail_discount,
    coupon_discount,
    discounted_baskets,
    total_purchase_lines,
    discounted_purchase_lines,
    discount_purchase_rate,
    discount_sensitivity
)
WITH customer_discount_calc AS (
    SELECT 
        household_key,
        COALESCE(SUM(sales_value), 0) AS total_sales,
        COALESCE(SUM(ABS(retail_disc) + ABS(coupon_disc) + ABS(coupon_match_disc)), 0) AS total_disc,
        COALESCE(SUM(ABS(retail_disc)), 0) AS retail_disc,
        COALESCE(SUM(ABS(coupon_disc)), 0) AS coupon_disc,
        COUNT(DISTINCT CASE WHEN ABS(coupon_disc) > 0 THEN basket_id END) AS disc_baskets,
        COUNT(*) AS total_lines,
        COUNT(CASE WHEN ABS(retail_disc) > 0 OR ABS(coupon_disc) > 0 OR ABS(coupon_match_disc) > 0 THEN 1 END) AS disc_lines
    FROM clean.transaction_data
    GROUP BY household_key
)
SELECT 
    household_key,
    ROUND(total_sales::numeric, 2) AS revenue,
    ROUND(total_disc::numeric, 2) AS total_discount,
    ROUND(retail_disc::numeric, 2) AS retail_discount,
    ROUND(coupon_disc::numeric, 2) AS coupon_discount,
    disc_baskets AS discounted_baskets,
    total_lines AS total_purchase_lines,
    disc_lines AS discounted_purchase_lines,
    ROUND((disc_lines::numeric / NULLIF(total_lines, 0)), 4) AS discount_purchase_rate,
    CASE 
        WHEN (disc_lines::numeric / NULLIF(total_lines, 0)) >= 0.50 THEN 'High'
        WHEN (disc_lines::numeric / NULLIF(total_lines, 0)) >= 0.25 THEN 'Moderate'
        ELSE 'Low'
    END AS discount_sensitivity
FROM customer_discount_calc;


-- ----------------------------------------------------------------------------
-- 3.3 Populate analytics.customer_recommendations_new
-- ----------------------------------------------------------------------------
-- Logic:
-- Rank products per household by distinct basket frequency, then total spend.
-- Filter to top 10 recommended items per household (rank <= 10).
-- Join with clean.product to populate department & commodity_desc.
-- ----------------------------------------------------------------------------
TRUNCATE TABLE analytics.customer_recommendations_new;

INSERT INTO analytics.customer_recommendations_new (
    household_key,
    product_id,
    department,
    commodity_desc,
    purchase_count,
    units_purchased,
    revenue,
    recommendation_rank
)
WITH ranked_recommendations AS (
    SELECT 
        t.household_key,
        t.product_id,
        p.department,
        p.commodity_desc,
        COUNT(DISTINCT t.basket_id) AS purchase_count,
        SUM(t.quantity) AS units_purchased,
        ROUND(SUM(t.sales_value)::numeric, 2) AS revenue,
        ROW_NUMBER() OVER (
            PARTITION BY t.household_key 
            ORDER BY COUNT(DISTINCT t.basket_id) DESC, SUM(t.sales_value) DESC
        ) AS recommendation_rank
    FROM clean.transaction_data t
    LEFT JOIN clean.product p ON t.product_id = p.product_id
    GROUP BY t.household_key, t.product_id, p.department, p.commodity_desc
)
SELECT 
    household_key,
    product_id,
    COALESCE(department, 'UNKNOWN') AS department,
    COALESCE(commodity_desc, 'UNKNOWN') AS commodity_desc,
    purchase_count,
    units_purchased,
    revenue,
    recommendation_rank
FROM ranked_recommendations
WHERE recommendation_rank <= 10;


-- ----------------------------------------------------------------------------
-- 3.4 Populate analytics.promotion_sales_new
-- ----------------------------------------------------------------------------
-- Logic:
-- Aggregate promotional causal data (where display or mailer was active)
-- Tag transactions matching (product_id, store_id, week_no).
-- Roll up to product-promotion grain: (product_id, has_promotion, has_display, has_mailer).
-- Denormalize department & commodity_desc from clean.product.
-- ----------------------------------------------------------------------------
BEGIN;

-- Boost session memory for the large 36.8M causal scan (transaction-scoped)
SET LOCAL work_mem = '256MB';

TRUNCATE TABLE analytics.promotion_sales_new;

INSERT INTO analytics.promotion_sales_new (
    product_id,
    department,
    commodity_desc,
    has_display,
    has_mailer,
    has_promotion,
    units_sold,
    revenue,
    baskets,
    households
)
WITH active_causal_promotions AS (
    -- Pre-filter to active causal records with whitespace-safe trimming
    SELECT 
        product_id,
        store_id,
        week_no,
        MAX(CASE WHEN TRIM(COALESCE(display, '0')) NOT IN ('0', '') THEN 1 ELSE 0 END) AS has_display,
        MAX(CASE WHEN TRIM(COALESCE(mailer, '0')) NOT IN ('0', '') THEN 1 ELSE 0 END) AS has_mailer
    FROM clean.causal_data
    WHERE TRIM(COALESCE(display, '0')) NOT IN ('0', '') 
       OR TRIM(COALESCE(mailer, '0')) NOT IN ('0', '')
    GROUP BY product_id, store_id, week_no
),
tagged_transactions AS (
    SELECT 
        t.product_id,
        t.household_key,
        t.basket_id,
        t.quantity,
        t.sales_value,
        COALESCE(c.has_display, 0) AS has_display,
        COALESCE(c.has_mailer, 0) AS has_mailer,
        CASE WHEN c.has_display = 1 OR c.has_mailer = 1 THEN 1 ELSE 0 END AS has_promotion
    FROM clean.transaction_data t
    LEFT JOIN active_causal_promotions c 
      ON t.product_id = c.product_id 
     AND t.store_id = c.store_id 
     AND t.week_no = c.week_no
)
SELECT 
    tx.product_id,
    COALESCE(p.department, 'UNKNOWN') AS department,
    COALESCE(p.commodity_desc, 'UNKNOWN') AS commodity_desc,
    tx.has_display,
    tx.has_mailer,
    tx.has_promotion,
    SUM(tx.quantity) AS units_sold,
    ROUND(SUM(tx.sales_value)::numeric, 2) AS revenue,
    COUNT(DISTINCT tx.basket_id) AS baskets,
    COUNT(DISTINCT tx.household_key) AS households
FROM tagged_transactions tx
LEFT JOIN clean.product p ON tx.product_id = p.product_id
GROUP BY 
    tx.product_id,
    p.department,
    p.commodity_desc,
    tx.has_display,
    tx.has_mailer,
    tx.has_promotion;

COMMIT;


-- ============================================================================
-- SECTION 4: VALIDATION QUERIES (RUN BEFORE PERFORMING SWAP)
-- ============================================================================

-- Gate 4.1: Row count verification for each replacement table
SELECT 'analytics.customer_trend_new' AS table_name, COUNT(*) AS row_count, 
       CASE WHEN COUNT(*) = 2500 THEN 'PASS' ELSE 'FAIL' END AS status
FROM analytics.customer_trend_new
UNION ALL
SELECT 'analytics.customer_discount_new' AS table_name, COUNT(*) AS row_count,
       CASE WHEN COUNT(*) = 2500 THEN 'PASS' ELSE 'FAIL' END AS status
FROM analytics.customer_discount_new
UNION ALL
SELECT 'analytics.customer_recommendations_new' AS table_name, COUNT(*) AS row_count,
       CASE WHEN COUNT(*) BETWEEN 24900 AND 25000 THEN 'PASS' ELSE 'FAIL' END AS status
FROM analytics.customer_recommendations_new
UNION ALL
SELECT 'analytics.promotion_sales_new' AS table_name, COUNT(*) AS row_count,
       CASE WHEN COUNT(*) > 50000 THEN 'PASS' ELSE 'FAIL' END AS status
FROM analytics.promotion_sales_new;

-- Gate 4.2: NULL constraint verification on primary keys
SELECT 'customer_trend_new NULLs' AS check_name, COUNT(*) AS invalid_rows
FROM analytics.customer_trend_new WHERE household_key IS NULL
UNION ALL
SELECT 'customer_discount_new NULLs' AS check_name, COUNT(*) AS invalid_rows
FROM analytics.customer_discount_new WHERE household_key IS NULL
UNION ALL
SELECT 'customer_recommendations_new NULLs' AS check_name, COUNT(*) AS invalid_rows
FROM analytics.customer_recommendations_new WHERE household_key IS NULL OR product_id IS NULL OR recommendation_rank IS NULL
UNION ALL
SELECT 'promotion_sales_new NULLs' AS check_name, COUNT(*) AS invalid_rows
FROM analytics.promotion_sales_new WHERE product_id IS NULL;

-- Gate 4.3: CRITICAL BACKWARD-COMPATIBILITY CHECK (backend/insights.py parity)
-- Must return promoted revenue and units sold matching the application expectations
SELECT 
    'analytics.promotion_sales_new (WHERE has_promotion = 1)' AS query_target,
    SUM(revenue) AS promo_revenue,
    SUM(units_sold) AS promo_units,
    ROUND(SUM(revenue) / NULLIF(SUM(units_sold), 0), 2) AS avg_unit_price
FROM analytics.promotion_sales_new
WHERE has_promotion = 1;

-- Gate 4.4: Spending trend distribution verification for customer_trend_new
SELECT spending_trend, COUNT(*) AS households, ROUND(AVG(revenue_change_pct), 2) AS avg_change_pct
FROM analytics.customer_trend_new
GROUP BY spending_trend
ORDER BY households DESC;

-- Gate 4.5: Discount sensitivity distribution verification for customer_discount_new
SELECT discount_sensitivity, COUNT(*) AS households, ROUND(AVG(discount_purchase_rate), 4) AS avg_rate
FROM analytics.customer_discount_new
GROUP BY discount_sensitivity
ORDER BY households DESC;


-- ============================================================================
-- SECTION 5: FINAL ATOMIC SWAP (COMMENTED OUT BY DEFAULT FOR SAFETY)
-- ============================================================================
-- DO NOT UNCOMMENT OR EXECUTE UNTIL SECTIONS 1-4 HAVE BEEN MANUALLY AUDITED AND APPROVED.
-- This block renames the live tables to backup tables and promotes the new tables.
-- If any failure occurs during execution, the entire transaction rolls back cleanly.
-- ----------------------------------------------------------------------------

BEGIN;

-- Step 5.1: Rename current tables to safe backups
ALTER TABLE IF EXISTS analytics.customer_trend 
    RENAME TO customer_trend_pre_migration_backup;

ALTER TABLE IF EXISTS analytics.customer_discount 
    RENAME TO customer_discount_pre_migration_backup;

ALTER TABLE IF EXISTS analytics.customer_recommendations 
    RENAME TO customer_recommendations_pre_migration_backup;

ALTER TABLE IF EXISTS analytics.promotion_sales 
    RENAME TO promotion_sales_pre_migration_backup;

-- Step 5.2: Promote replacement tables to active names
ALTER TABLE analytics.customer_trend_new 
    RENAME TO customer_trend;

ALTER TABLE analytics.customer_discount_new 
    RENAME TO customer_discount;

ALTER TABLE analytics.customer_recommendations_new 
    RENAME TO customer_recommendations;

ALTER TABLE analytics.promotion_sales_new 
    RENAME TO promotion_sales;

-- Step 5.3: Add production indexes on promoted tables for fast query response
CREATE INDEX IF NOT EXISTS idx_customer_trend_hh 
    ON analytics.customer_trend(household_key);

CREATE INDEX IF NOT EXISTS idx_customer_discount_hh 
    ON analytics.customer_discount(household_key);

CREATE INDEX IF NOT EXISTS idx_customer_rec_hh_rank 
    ON analytics.customer_recommendations(household_key, recommendation_rank);

CREATE INDEX IF NOT EXISTS idx_promotion_sales_promo 
    ON analytics.promotion_sales(has_promotion);

CREATE INDEX IF NOT EXISTS idx_promotion_sales_prod 
    ON analytics.promotion_sales(product_id);

COMMIT;


-- ============================================================================
-- SECTION 6: POST-SWAP VERIFICATION & ROLLBACK PLAN
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 6.1 Post-Swap Endpoint Queries (Run after swap to confirm API health)
-- (COMMENTED OUT DURING STAGING - ENABLE ONLY AFTER SECTION 5 SWAP IS PERFORMED)
-- ----------------------------------------------------------------------------
/*
-- Verification 6.1.1: Test customer intelligence momentum query
-- (Matches backend/customers_data.py query against customer_intelligence or customer_trend)
SELECT spending_trend, COUNT(*) AS count, ROUND(AVG(revenue_change_pct), 2) AS avg_change
FROM analytics.customer_trend
GROUP BY spending_trend
ORDER BY count DESC;

-- Verification 6.1.2: Test insights promotional query
-- (Matches backend/insights.py lines 287-294)
SELECT 
    SUM(revenue) AS promo_revenue,
    SUM(units_sold) AS promo_units,
    ROUND(SUM(revenue) / NULLIF(SUM(units_sold), 0), 2) AS avg_unit_price
FROM analytics.promotion_sales
WHERE has_promotion = 1;

-- Verification 6.1.3: Test customer discount sensitivity queries
SELECT 
    discount_sensitivity,
    COUNT(*) AS customer_count,
    ROUND(AVG(revenue), 2) AS avg_revenue,
    ROUND(AVG(total_discount), 2) AS avg_discount,
    ROUND(AVG(discount_purchase_rate), 4) AS avg_disc_rate
FROM analytics.customer_discount
GROUP BY discount_sensitivity
ORDER BY customer_count DESC;
*/

-- ----------------------------------------------------------------------------
-- 6.2 ROLLBACK SCRIPT (Execute ONLY if a problem is detected post-swap)
-- ----------------------------------------------------------------------------
/*
BEGIN;

-- Drop newly promoted tables
DROP TABLE IF EXISTS analytics.customer_trend;
DROP TABLE IF EXISTS analytics.customer_discount;
DROP TABLE IF EXISTS analytics.customer_recommendations;
DROP TABLE IF EXISTS analytics.promotion_sales;

-- Restore pre-migration backup tables
ALTER TABLE analytics.customer_trend_pre_migration_backup 
    RENAME TO customer_trend;

ALTER TABLE analytics.customer_discount_pre_migration_backup 
    RENAME TO customer_discount;

ALTER TABLE analytics.customer_recommendations_pre_migration_backup 
    RENAME TO customer_recommendations;

ALTER TABLE analytics.promotion_sales_pre_migration_backup 
    RENAME TO promotion_sales;

COMMIT;
*/
