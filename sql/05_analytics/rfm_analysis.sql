-- RFM base analysis
WITH customer_metrics AS (
    SELECT household_key, MAX(day) AS last_purchase_day,
           COUNT(DISTINCT basket_id) AS frequency,
           SUM(sales_value) AS monetary
    FROM raw.transaction_data
    GROUP BY household_key
),
reference_day AS (
    SELECT MAX(day) AS max_day FROM raw.transaction_data
)
SELECT c.household_key,
       r.max_day - c.last_purchase_day AS recency,
       c.frequency,
       ROUND(c.monetary::numeric, 2) AS monetary
FROM customer_metrics c
CROSS JOIN reference_day r
ORDER BY recency, frequency DESC, monetary DESC;
