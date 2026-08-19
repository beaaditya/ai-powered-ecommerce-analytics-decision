# PostgreSQL Database & Data Mart Catalog

Database Name: `dunnhumby_retail`  
Total Schemas: 4 (`raw`, `clean`, `analytics`, `ai`)

---

## 1. Schema Overview

| Schema | Purpose | Table Count |
| :--- | :--- | :---: |
| **`raw`** | Direct raw CSV ingest tables from Dunnhumby dataset. | 8 |
| **`clean`** | Cleaned, typed, normalized staging tables. | 8 |
| **`analytics`** | Aggregated data marts, RFM scores, category trends, campaign metrics. | 26 |
| **`ai`** | AI query execution audit logs. | 1 |

---

## 2. Core Analytics Data Marts (`analytics` schema)

### 1. `analytics.customer_rfm_scored`
Customer RFM segmentation and scoring across 2,500 households.
- `household_key` (bigint): Unique household identifier.
- `last_purchase_day` (integer): Day index of latest transaction.
- `purchase_frequency` (bigint): Total distinct store visit days.
- `monetary_value` (numeric): Total cumulative spending ($).
- `total_quantity` (bigint): Total units purchased.
- `unique_products` (bigint): Total distinct SKUs purchased.
- `active_weeks` (bigint): Distinct active shopping weeks.
- `avg_basket_value` (numeric): Average spend per transaction ($).
- `recency_score` (integer): 1-5 scale score.
- `frequency_score` (integer): 1-5 scale score.
- `monetary_score` (integer): 1-5 scale score.
- `customer_segment` (varchar): Segment label ('Champions', 'Loyal Customers', 'Recent Customers', 'Regular Customers', 'At Risk High Value', 'At Risk').

### 2. `analytics.customer_intelligence`
360-degree customer intelligence metrics.
- `household_key` (bigint)
- `customer_segment` (varchar)
- `spending_trend` (varchar): 'Growing', 'Stable', 'Declining'
- `revenue_change_pct` (numeric): Percentage revenue change between H1 and H2
- `discount_sensitivity` (varchar): 'High', 'Moderate', 'Low'
- `discount_purchase_rate` (numeric): Ratio of discounted items to total items
- `avg_basket_value` (numeric)
- `active_weeks` (bigint)

### 3. `analytics.department_metrics`
Department-level revenue and volume aggregation.
- `department` (text): Department name (e.g. GROCERY, DRUG GM, PRODUCE, MEAT, KIOSK-GAS)
- `customers` (bigint): Total unique households shopping in department
- `baskets` (bigint): Total shopping baskets containing department items
- `units_sold` (bigint): Total units purchased
- `revenue` (numeric): Total dollar revenue ($)
- `discounts` (numeric): Total discount dollars applied ($)

### 4. `analytics.category_trend`
Commodity category performance and half-over-half momentum.
- `department` (text)
- `commodity_desc` (text)
- `first_half_revenue` (numeric): First 51 weeks revenue ($)
- `second_half_revenue` (numeric): Second 51 weeks revenue ($)
- `revenue_change` (numeric): Net revenue delta ($)
- `trend` (varchar): 'Growing' vs. 'Declining'

### 5. `analytics.weekly_metrics`
Weekly macroeconomic retail indicators across all 102 weeks.
- `week_no` (integer): Week index (1 to 102)
- `active_households` (bigint): Active shopping households during the week
- `baskets` (bigint): Total completed transactions
- `units` (bigint): Total items purchased
- `revenue` (numeric): Total weekly store revenue ($)
- `discounts` (numeric): Total weekly promotional discount amount ($)

### 6. `analytics.campaign_performance`
Marketing campaign efficacy metrics.
- `campaign` (integer): Campaign ID (1 to 30)
- `description` (text): Campaign classification ('TypeA', 'TypeB', 'TypeC')
- `start_day` (integer): Campaign start day
- `end_day` (integer): Campaign end day
- `households_targeted` (bigint): Targeted household count
- `households_redeemed` (bigint): Households redeeming coupons
- `total_redemptions` (bigint): Cumulative vouchers redeemed
- `redemption_rate` (numeric): Percentage of targeted households redeeming

### 7. `analytics.product_metrics`
SKU-level retail performance.
- `product_id` (bigint): Unique product barcode/ID
- `department` (text)
- `commodity_desc` (text)
- `sub_commodity_desc` (text)
- `brand` (text): 'National' vs. 'Private'
- `unique_households` (bigint): Reached household count
- `purchase_baskets` (bigint): Baskets containing SKU
- `units_sold` (bigint): Total unit sales
- `revenue` (numeric): Total dollar revenue ($)
- `discount_amount` (numeric): Promotional discounts ($)

### 8. `analytics.promotion_sales`
Promotional vs baseline performance comparisons.
- `week_no` (integer)
- `product_id` (bigint)
- `store_id` (integer)
- `display` (text): Display location type
- `mailer` (text): Mailer feature type
- `has_display` (integer): 1 if displayed, 0 otherwise
- `has_mailer` (integer): 1 if featured in mailer, 0 otherwise
- `has_promotion` (integer): 1 if promoted, 0 otherwise
- `units_sold` (bigint)
- `revenue` (numeric)
- `customers` (bigint)
