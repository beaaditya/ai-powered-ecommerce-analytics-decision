-- Product analysis
SELECT p.department,
       ROUND(SUM(t.sales_value)::numeric, 2) AS revenue,
       SUM(t.quantity) AS units
FROM raw.transaction_data t
JOIN raw.product p ON p.product_id = t.product_id
GROUP BY p.department
ORDER BY revenue DESC;

SELECT p.commodity_desc,
       ROUND(SUM(t.sales_value)::numeric, 2) AS revenue,
       SUM(t.quantity) AS units
FROM raw.transaction_data t
JOIN raw.product p ON p.product_id = t.product_id
GROUP BY p.commodity_desc
ORDER BY revenue DESC
LIMIT 10;
