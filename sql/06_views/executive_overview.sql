-- Executive overview view
CREATE OR REPLACE VIEW analytics.v_executive_overview AS
SELECT COUNT(DISTINCT household_key) AS active_households,
       COUNT(DISTINCT basket_id) AS total_baskets,
       SUM(quantity) AS total_units,
       ROUND(SUM(sales_value)::numeric, 2) AS total_revenue,
       ROUND(SUM(sales_value)::numeric /
             NULLIF(COUNT(DISTINCT basket_id), 0), 2) AS average_basket_value
FROM raw.transaction_data;
