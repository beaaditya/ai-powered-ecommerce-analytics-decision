-- Cleaning summary
SELECT 'households' AS dataset,
       (SELECT COUNT(*) FROM raw.hh_demographic) AS raw_rows,
       (SELECT COUNT(*) FROM analytics.households_clean) AS cleaned_rows
UNION ALL
SELECT 'transactions',
       (SELECT COUNT(*) FROM raw.transaction_data),
       (SELECT COUNT(*) FROM analytics.transactions_clean)
UNION ALL
SELECT 'products',
       (SELECT COUNT(*) FROM raw.product),
       (SELECT COUNT(*) FROM analytics.products_clean)
UNION ALL
SELECT 'campaigns',
       (SELECT COUNT(*) FROM raw.campaign_desc),
       (SELECT COUNT(*) FROM analytics.campaigns_clean);
