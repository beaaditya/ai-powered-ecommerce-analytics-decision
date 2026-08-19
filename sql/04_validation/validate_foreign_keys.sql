-- Foreign-key / orphan validation
SELECT COUNT(*) AS orphan_transaction_households
FROM raw.transaction_data t
LEFT JOIN raw.hh_demographic h ON h.household_key = t.household_key
WHERE h.household_key IS NULL;

SELECT COUNT(*) AS orphan_transaction_products
FROM raw.transaction_data t
LEFT JOIN raw.product p ON p.product_id = t.product_id
WHERE p.product_id IS NULL;

SELECT COUNT(*) AS orphan_transaction_stores
FROM raw.transaction_data t
LEFT JOIN raw.store s ON s.store_id = t.store_id
WHERE s.store_id IS NULL;

SELECT COUNT(*) AS orphan_campaigns
FROM raw.campaign_table c
LEFT JOIN raw.campaign_desc d ON d.campaign_id = c.campaign_id
WHERE d.campaign_id IS NULL;
