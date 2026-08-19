-- Revenue analysis
SELECT week_no, ROUND(SUM(sales_value)::numeric, 2) AS weekly_revenue
FROM raw.transaction_data
GROUP BY week_no ORDER BY week_no;

SELECT ROUND(SUM(sales_value)::numeric, 2) AS total_revenue,
       ROUND(AVG(sales_value)::numeric, 2) AS average_transaction_value
FROM raw.transaction_data;
