-- Range validation
SELECT COUNT(*) AS negative_quantity_count
FROM raw.transaction_data WHERE quantity < 0;

SELECT COUNT(*) AS negative_sales_value_count
FROM raw.transaction_data WHERE sales_value < 0;

SELECT COUNT(*) AS invalid_week_count
FROM raw.transaction_data
WHERE week_no IS NOT NULL AND (week_no < 1 OR week_no > 53);

SELECT COUNT(*) AS invalid_campaign_dates
FROM raw.campaign_desc
WHERE start_day IS NOT NULL AND end_day IS NOT NULL
  AND start_day > end_day;
