-- ============================================================
-- DUNNHUMBY RETAIL INTELLIGENCE
-- RAW TABLE DEFINITIONS
-- ============================================================
--
-- Purpose:
-- Create PostgreSQL tables representing the original
-- Dunnhumby Complete Journey source data.
--
-- IMPORTANT:
-- Raw tables should preserve source-level information.
-- Cleaning and business transformations belong in analytics.
-- ============================================================


-- ------------------------------------------------------------
-- 1. HOUSEHOLD DEMOGRAPHICS
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS raw.hh_demographic (
    household_key       BIGINT PRIMARY KEY,
    age_desc            TEXT,
    marital_status_code TEXT,
    income_desc         TEXT,
    homeowner_desc      TEXT,
    hh_comp_desc        TEXT,
    household_size_desc TEXT,
    kid_category_desc   TEXT
);


-- ------------------------------------------------------------
-- 2. TRANSACTION DATA
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS raw.transaction_data (
    household_key      BIGINT,
    basket_id          BIGINT,
    day                INTEGER,
    product_id         BIGINT,
    quantity           INTEGER,
    sales_value        NUMERIC(12,2),
    retail_disc        NUMERIC(12,2),
    trans_time         INTEGER,
    coupon_match_disc  NUMERIC(12,2),
    coupon_disc        NUMERIC(12,2),
    store_id            BIGINT,
    week_no             INTEGER
);


-- ------------------------------------------------------------
-- 3. PRODUCT MASTER
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS raw.product (
    product_id          BIGINT PRIMARY KEY,
    manufacturer        INTEGER,
    department          TEXT,
    brand               TEXT,
    commodity_desc      TEXT,
    sub_commodity_desc  TEXT,
    curr_size_of_product TEXT
);


-- ------------------------------------------------------------
-- 4. STORE
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS raw.store (
    store_id BIGINT PRIMARY KEY
);


-- ------------------------------------------------------------
-- 5. CAMPAIGN DESCRIPTION
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS raw.campaign_desc (
    campaign_id INTEGER PRIMARY KEY,
    description TEXT,
    start_day   INTEGER,
    end_day     INTEGER
);


-- ------------------------------------------------------------
-- 6. CAMPAIGN TARGETING
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS raw.campaign_table (
    household_key BIGINT,
    campaign_id   INTEGER,
    description   TEXT,
    PRIMARY KEY (household_key, campaign_id)
);


-- ------------------------------------------------------------
-- 7. COUPON
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS raw.coupon (
    coupon_upc BIGINT,
    product_id BIGINT,
    campaign_id INTEGER,
    PRIMARY KEY (coupon_upc, product_id, campaign_id)
);


-- ------------------------------------------------------------
-- 8. COUPON REDEMPTION
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS raw.coupon_redempt (
    household_key BIGINT,
    day          INTEGER,
    coupon_upc   BIGINT,
    campaign_id  INTEGER
);


-- ------------------------------------------------------------
-- 9. CAUSAL / PROMOTION DATA
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS raw.causal_data (
    product_id       BIGINT,
    store_id         BIGINT,
    week_no          INTEGER,
    display_location TEXT,
    mailer_location  TEXT
);


-- ------------------------------------------------------------
-- TABLE INVENTORY
-- ------------------------------------------------------------

SELECT
    table_schema,
    table_name
FROM information_schema.tables
WHERE table_schema = 'raw'
ORDER BY table_name;