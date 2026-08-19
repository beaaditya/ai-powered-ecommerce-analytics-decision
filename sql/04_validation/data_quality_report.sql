-- Consolidated data-quality report
SELECT 'NULL household keys' AS check_name, COUNT(*) AS issue_count
FROM raw.hh_demographic WHERE household_key IS NULL
UNION ALL
SELECT 'NULL product keys', COUNT(*) FROM raw.product WHERE product_id IS NULL
UNION ALL
SELECT 'Negative quantities', COUNT(*) FROM raw.transaction_data WHERE quantity < 0
UNION ALL
SELECT 'Negative sales values', COUNT(*) FROM raw.transaction_data WHERE sales_value < 0
UNION ALL
SELECT 'Orphan transaction households', COUNT(*)
FROM raw.transaction_data t
LEFT JOIN raw.hh_demographic h ON h.household_key = t.household_key
WHERE h.household_key IS NULL
UNION ALL
SELECT 'Orphan transaction products', COUNT(*)
FROM raw.transaction_data t
LEFT JOIN raw.product p ON p.product_id = t.product_id
WHERE p.product_id IS NULL;
