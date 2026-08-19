-- ============================================================
-- DUNNHUMBY RETAIL INTELLIGENCE
-- ANALYTICS TABLE DEFINITIONS
-- ============================================================
--
-- Purpose:
-- Define analysis-ready structures derived from raw data.
--
-- IMPORTANT:
-- These tables represent the analytical layer.
-- Do not duplicate existing production tables blindly.
-- ============================================================


-- ------------------------------------------------------------
-- HOUSEHOLD ANALYTICS
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS analytics.households AS
SELECT *
FROM raw.hh_demographic
WITH NO DATA;


-- ------------------------------------------------------------
-- PRODUCT ANALYTICS
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS analytics.products AS
SELECT *
FROM raw.product
WITH NO DATA;


-- ------------------------------------------------------------
-- TRANSACTION ANALYTICS
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS analytics.transactions AS
SELECT *
FROM raw.transaction_data
WITH NO DATA;


-- ------------------------------------------------------------
-- CAMPAIGN ANALYTICS
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS analytics.campaigns AS
SELECT *
FROM raw.campaign_desc
WITH NO DATA;


-- ------------------------------------------------------------
-- CAMPAIGN TARGETING ANALYTICS
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS analytics.campaign_targets AS
SELECT *
FROM raw.campaign_table
WITH NO DATA;


-- ------------------------------------------------------------
-- COUPON ANALYTICS
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS analytics.coupons AS
SELECT *
FROM raw.coupon
WITH NO DATA;


-- ------------------------------------------------------------
-- COUPON REDEMPTION ANALYTICS
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS analytics.coupon_redemptions AS
SELECT *
FROM raw.coupon_redempt
WITH NO DATA;


-- ------------------------------------------------------------
-- PROMOTION ANALYTICS
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS analytics.causal_data AS
SELECT *
FROM raw.causal_data
WITH NO DATA;