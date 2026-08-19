-- Promotion analysis
SELECT campaign_id,
       COUNT(*) AS redemption_events,
       COUNT(DISTINCT household_key) AS households_redeeming
FROM raw.coupon_redempt
GROUP BY campaign_id
ORDER BY redemption_events DESC;

SELECT campaign_id, COUNT(DISTINCT household_key) AS targeted_households
FROM raw.campaign_table
GROUP BY campaign_id
ORDER BY targeted_households DESC;
