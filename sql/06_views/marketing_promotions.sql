-- Marketing and promotions view
CREATE OR REPLACE VIEW analytics.v_marketing_promotions AS
SELECT c.campaign_id, c.description, c.start_day, c.end_day,
       COUNT(DISTINCT ct.household_key) AS targeted_households,
       COUNT(DISTINCT cr.household_key) AS redeeming_households,
       COUNT(cr.coupon_upc) AS redemption_events
FROM raw.campaign_desc c
LEFT JOIN raw.campaign_table ct ON ct.campaign_id = c.campaign_id
LEFT JOIN raw.coupon_redempt cr ON cr.campaign_id = c.campaign_id
GROUP BY c.campaign_id, c.description, c.start_day, c.end_day;
