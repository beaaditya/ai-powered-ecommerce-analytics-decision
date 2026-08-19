-- ============================================================
-- DUNNHUMBY RETAIL INTELLIGENCE
-- RAW DATA ROW COUNT VALIDATION
-- ============================================================

SELECT
    'hh_demographic' AS table_name,
    COUNT(*) AS row_count
FROM raw.hh_demographic

UNION ALL

SELECT
    'transaction_data',
    COUNT(*)
FROM raw.transaction_data

UNION ALL

SELECT
    'product',
    COUNT(*)
FROM raw.product

UNION ALL

SELECT
    'store',
    COUNT(*)
FROM raw.store

UNION ALL

SELECT
    'campaign_desc',
    COUNT(*)
FROM raw.campaign_desc

UNION ALL

SELECT
    'campaign_table',
    COUNT(*)
FROM raw.campaign_table

UNION ALL

SELECT
    'coupon',
    COUNT(*)
FROM raw.coupon

UNION ALL

SELECT
    'coupon_redempt',
    COUNT(*)
FROM raw.coupon_redempt

UNION ALL

SELECT
    'causal_data',
    COUNT(*)
FROM raw.causal_data

ORDER BY table_name;