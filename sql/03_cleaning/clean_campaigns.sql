-- Campaign cleaning
CREATE TABLE IF NOT EXISTS analytics.campaigns_clean AS
SELECT campaign_id, NULLIF(TRIM(description), '') AS description,
       start_day, end_day
FROM raw.campaign_desc
WHERE campaign_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS analytics.campaign_targets_clean AS
SELECT household_key, campaign_id,
       NULLIF(TRIM(description), '') AS description
FROM raw.campaign_table
WHERE household_key IS NOT NULL
  AND campaign_id IS NOT NULL;
