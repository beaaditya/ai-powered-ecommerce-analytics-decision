-- ============================================================
-- DUNNHUMBY RETAIL INTELLIGENCE
-- PostgreSQL Schema Initialization
-- ============================================================
--
-- Purpose:
-- Create logical PostgreSQL schemas used by the project.
--
-- Schema layers:
--   raw       -> original/source-oriented tables
--   analytics -> cleaned/transformed tables used by analysis
--
-- IMPORTANT:
-- This script does not load data.
-- This script does not modify existing business data.
-- ============================================================


-- ------------------------------------------------------------
-- RAW DATA SCHEMA
-- ------------------------------------------------------------

CREATE SCHEMA IF NOT EXISTS raw;


-- ------------------------------------------------------------
-- ANALYTICS SCHEMA
-- ------------------------------------------------------------

CREATE SCHEMA IF NOT EXISTS analytics;


-- ------------------------------------------------------------
-- OPTIONAL: SET DEFAULT SEARCH PATH
-- ------------------------------------------------------------
-- Keep PostgreSQL's public schema available while making
-- analytics the primary working schema for this project.

ALTER DATABASE dunnhumby_retail
SET search_path TO analytics, raw, public;


-- ------------------------------------------------------------
-- VERIFY CREATED SCHEMAS
-- ------------------------------------------------------------

SELECT
    schema_name
FROM information_schema.schemata
WHERE schema_name IN ('raw', 'analytics')
ORDER BY schema_name;