-- Product cleaning
CREATE TABLE IF NOT EXISTS analytics.products_clean AS
SELECT product_id, manufacturer,
       NULLIF(TRIM(department), '') AS department,
       NULLIF(TRIM(brand), '') AS brand,
       NULLIF(TRIM(commodity_desc), '') AS commodity_desc,
       NULLIF(TRIM(sub_commodity_desc), '') AS sub_commodity_desc,
       NULLIF(TRIM(curr_size_of_product), '') AS curr_size_of_product
FROM raw.product
WHERE product_id IS NOT NULL;
