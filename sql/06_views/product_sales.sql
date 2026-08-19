-- Product and sales view
CREATE OR REPLACE VIEW analytics.v_product_sales AS
SELECT p.product_id, p.department, p.brand, p.commodity_desc,
       SUM(t.quantity) AS units_sold,
       ROUND(SUM(t.sales_value)::numeric, 2) AS revenue
FROM raw.product p
JOIN raw.transaction_data t ON t.product_id = p.product_id
GROUP BY p.product_id, p.department, p.brand, p.commodity_desc;
