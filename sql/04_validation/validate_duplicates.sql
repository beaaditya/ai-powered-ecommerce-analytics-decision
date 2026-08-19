-- Duplicate validation
SELECT household_key, COUNT(*) AS duplicate_count
FROM raw.hh_demographic
GROUP BY household_key HAVING COUNT(*) > 1;

SELECT product_id, COUNT(*) AS duplicate_count
FROM raw.product
GROUP BY product_id HAVING COUNT(*) > 1;

SELECT household_key, campaign_id, COUNT(*) AS duplicate_count
FROM raw.campaign_table
GROUP BY household_key, campaign_id HAVING COUNT(*) > 1;
