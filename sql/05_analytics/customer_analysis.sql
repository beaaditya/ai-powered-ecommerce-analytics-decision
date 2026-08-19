-- Customer analysis
SELECT household_key,
       COUNT(DISTINCT basket_id) AS visits,
       ROUND(SUM(sales_value)::numeric, 2) AS total_spend,
       SUM(quantity) AS total_units
FROM raw.transaction_data
GROUP BY household_key
ORDER BY total_spend DESC;
