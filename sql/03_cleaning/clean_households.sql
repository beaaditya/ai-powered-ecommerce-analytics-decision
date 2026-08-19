-- Household cleaning
CREATE TABLE IF NOT EXISTS analytics.households_clean AS
SELECT household_key,
       NULLIF(TRIM(age_desc), '') AS age_desc,
       NULLIF(TRIM(marital_status_code), '') AS marital_status_code,
       NULLIF(TRIM(income_desc), '') AS income_desc,
       NULLIF(TRIM(homeowner_desc), '') AS homeowner_desc,
       NULLIF(TRIM(hh_comp_desc), '') AS hh_comp_desc,
       NULLIF(TRIM(household_size_desc), '') AS household_size_desc,
       NULLIF(TRIM(kid_category_desc), '') AS kid_category_desc
FROM raw.hh_demographic
WHERE household_key IS NOT NULL;
