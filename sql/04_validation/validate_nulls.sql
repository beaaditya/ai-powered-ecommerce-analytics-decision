-- NULL validation
SELECT 'household_key' AS column_name, COUNT(*) AS null_count
FROM raw.hh_demographic WHERE household_key IS NULL
UNION ALL
SELECT 'product_id', COUNT(*) FROM raw.product WHERE product_id IS NULL
UNION ALL
SELECT 'transaction_household_key', COUNT(*)
FROM raw.transaction_data WHERE household_key IS NULL
UNION ALL
SELECT 'transaction_product_id', COUNT(*)
FROM raw.transaction_data WHERE product_id IS NULL
UNION ALL
SELECT 'transaction_sales_value', COUNT(*)
FROM raw.transaction_data WHERE sales_value IS NULL;
