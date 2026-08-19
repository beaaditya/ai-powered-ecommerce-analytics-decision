-- ============================================================
-- DUNNHUMBY RETAIL INTELLIGENCE
-- RAW DATA INGESTION
-- ============================================================
--
-- Purpose:
-- Load Dunnhumby Complete Journey CSV files into raw tables.
--
-- NOTE:
-- Update the local CSV directory before executing.
-- Do not commit machine-specific absolute paths.
-- ============================================================


-- ------------------------------------------------------------
-- HOUSEHOLD DEMOGRAPHICS
-- ------------------------------------------------------------

\copy raw.hh_demographic
FROM 'dunnhumby_The-Complete-Journey CSV/hh_demographic.csv'
WITH (
    FORMAT csv,
    HEADER true,
    NULL ''
);


-- ------------------------------------------------------------
-- TRANSACTION DATA
-- ------------------------------------------------------------

\copy raw.transaction_data
FROM 'dunnhumby_The-Complete-Journey CSV/transaction_data.csv'
WITH (
    FORMAT csv,
    HEADER true,
    NULL ''
);


-- ------------------------------------------------------------
-- PRODUCT
-- ------------------------------------------------------------

\copy raw.product
FROM 'dunnhumby_The-Complete-Journey CSV/product.csv'
WITH (
    FORMAT csv,
    HEADER true,
    NULL ''
);


-- ------------------------------------------------------------
-- STORE
-- ------------------------------------------------------------

\copy raw.store
FROM 'dunnhumby_The-Complete-Journey CSV/store.csv'
WITH (
    FORMAT csv,
    HEADER true,
    NULL ''
);


-- ------------------------------------------------------------
-- CAMPAIGN DESCRIPTION
-- ------------------------------------------------------------

\copy raw.campaign_desc
FROM 'dunnhumby_The-Complete-Journey CSV/campaign_desc.csv'
WITH (
    FORMAT csv,
    HEADER true,
    NULL ''
);


-- ------------------------------------------------------------
-- CAMPAIGN TABLE
-- ------------------------------------------------------------

\copy raw.campaign_table
FROM 'dunnhumby_The-Complete-Journey CSV/campaign_table.csv'
WITH (
    FORMAT csv,
    HEADER true,
    NULL ''
);


-- ------------------------------------------------------------
-- COUPON
-- ------------------------------------------------------------

\copy raw.coupon
FROM 'dunnhumby_The-Complete-Journey CSV/coupon.csv'
WITH (
    FORMAT csv,
    HEADER true,
    NULL ''
);


-- ------------------------------------------------------------
-- COUPON REDEMPTION
-- ------------------------------------------------------------

\copy raw.coupon_redempt
FROM 'dunnhumby_The-Complete-Journey CSV/coupon_redempt.csv'
WITH (
    FORMAT csv,
    HEADER true,
    NULL ''
);


-- ------------------------------------------------------------
-- CAUSAL DATA
-- ------------------------------------------------------------

\copy raw.causal_data
FROM 'dunnhumby_The-Complete-Journey CSV/causal_data.csv'
WITH (
    FORMAT csv,
    HEADER true,
    NULL ''
);
