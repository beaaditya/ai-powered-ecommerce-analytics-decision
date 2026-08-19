-- Customer intelligence view
CREATE OR REPLACE VIEW analytics.v_customer_intelligence AS
SELECT household_key,
       COUNT(DISTINCT basket_id) AS visit_count,
       SUM(quantity) AS units,
       ROUND(SUM(sales_value)::numeric, 2) AS total_spend,
       MAX(day) AS last_purchase_day
FROM raw.transaction_data
GROUP BY household_key;
