-- Transaction cleaning
CREATE TABLE IF NOT EXISTS analytics.transactions_clean AS
SELECT household_key, basket_id, day, product_id, quantity,
       sales_value, retail_disc, trans_time,
       coupon_match_disc, coupon_disc, store_id, week_no
FROM raw.transaction_data
WHERE household_key IS NOT NULL
  AND basket_id IS NOT NULL
  AND product_id IS NOT NULL
  AND quantity IS NOT NULL
  AND sales_value IS NOT NULL;
