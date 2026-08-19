"""
Centralized Prompt Engineering Layer for AI Business Analyst & Retail Intelligence.
Consolidates all system prompts, schema contexts, follow-up context formatting,
SQL generation rules, executive answer structures, automated insight explanations,
and data-backed recommendation templates.
"""

from typing import Any, Dict, List, Optional

ANALYTICS_SCHEMA_CONTEXT = """
You are an expert PostgreSQL retail analytics data advisor for Dunnhumby Retail Analytics.
You have access to a PostgreSQL database with a rich 'analytics' schema derived from 102 weeks of shopping transactions across 2,500 shopper households.

The 'analytics' schema contains the following pre-calculated tables:

1. analytics.customer_rfm_scored
   - Columns: household_key (bigint), last_purchase_day (integer), purchase_frequency (bigint), monetary_value (numeric), total_quantity (bigint), unique_products (bigint), active_weeks (bigint), avg_basket_value (numeric), recency_score (integer), frequency_score (integer), monetary_score (integer), customer_segment (character varying)
   - Segments: 'Champions', 'Loyal Customers', 'Recent Customers', 'Regular Customers', 'At Risk High Value', 'At Risk'

2. analytics.customer_intelligence
   - Columns: household_key (bigint), customer_segment (character varying), recency_score (integer), frequency_score (integer), monetary_score (integer), monetary_value (numeric), spending_trend (character varying), revenue_change_pct (numeric), discount_sensitivity (character varying), discount_purchase_rate (numeric), avg_basket_value (numeric), active_weeks (bigint)

3. analytics.department_metrics
   - Columns: department (text), customers (bigint), baskets (bigint), units_sold (bigint), revenue (numeric), discounts (numeric)

4. analytics.campaign_performance
   - Columns: campaign (integer), description (text), start_day (integer), end_day (integer), households_targeted (bigint), households_redeemed (bigint), total_redemptions (bigint), redemption_rate (numeric)

5. analytics.campaign_customer_spend
   - Columns: campaign (integer), household_key (bigint), start_day (integer), end_day (integer), pre_campaign_spend (numeric), campaign_spend (numeric), spend_change (numeric)

6. analytics.customer_campaign_response
   - Columns: campaign (integer), household_key (bigint), description (text), start_day (integer), end_day (integer), redeemed_coupon (integer), pre_campaign_spend (numeric), campaign_spend (numeric), spend_change (numeric)

7. analytics.product_metrics
   - Columns: product_id (bigint), department (text), commodity_desc (text), sub_commodity_desc (text), brand (text), unique_households (bigint), purchase_baskets (bigint), units_sold (bigint), revenue (numeric), discount_amount (numeric)

8. analytics.category_metrics
   - Columns: department (text), commodity_desc (text), sub_commodity_desc (text), customers (bigint), baskets (bigint), units_sold (bigint), revenue (numeric), discounts (numeric)

9. analytics.category_trend
   - Columns: department (text), commodity_desc (text), first_half_revenue (numeric), second_half_revenue (numeric), revenue_change (numeric), trend (character varying)

10. analytics.customer_trend
    - Columns: household_key (bigint), first_half_revenue (numeric), second_half_revenue (numeric), first_half_quantity (numeric), second_half_quantity (numeric), revenue_change (numeric), revenue_change_pct (numeric), spending_trend (character varying)

11. analytics.customer_recommendations
    - Columns: household_key (bigint), category_preference_rank (bigint), department (text), commodity_desc (text), product_id (bigint), product_revenue (numeric), product_customers (bigint), units_sold (bigint), recommendation_rank (bigint)

12. analytics.customer_discount
    - Columns: household_key (bigint), revenue (numeric), total_discount (numeric), total_purchase_lines (bigint), discounted_purchase_lines (bigint), discount_purchase_rate (numeric), discount_sensitivity (character varying)

13. analytics.weekly_metrics
    - Columns: week_no (integer), active_households (bigint), baskets (bigint), units (bigint), revenue (numeric), discounts (numeric)

14. analytics.basket_metrics
    - Columns: household_key (bigint), basket_id (bigint), day (integer), week_no (integer), basket_revenue (numeric), basket_quantity (bigint), basket_discount (numeric), unique_products (bigint)

15. analytics.promotion_sales
    - Columns: product_id (bigint), department (text), commodity_desc (text), has_display (integer), has_mailer (integer), has_promotion (integer), units_sold (bigint), revenue (numeric)
"""


def format_followup_context(history: Optional[List[Dict[str, Any]]]) -> str:
    """
    Formats recent conversation history window (last 2-3 turns) for follow-up query context.
    Allows pronouns ('they', 'them', 'this category', 'that campaign') to resolve correctly.
    """
    if not history or not isinstance(history, list):
        return ""

    recent_turns = history[-3:]  # Limit to last 3 conversation turns
    context_lines = []
    for turn in recent_turns:
        role = turn.get("role", "")
        if role == "user":
            q_text = turn.get("text", turn.get("question", ""))
            if q_text:
                context_lines.append(f"Previous User Question: {q_text}")
        elif role == "assistant":
            ans_text = turn.get("answer", turn.get("text", ""))
            if ans_text:
                # Truncate answer snippet for context conciseness
                short_ans = ans_text[:200].replace("\n", " ")
                context_lines.append(f"Previous Assistant Answer: {short_ans}")

    if not context_lines:
        return ""

    return "\n--- CONVERSATION HISTORY CONTEXT ---\n" + "\n".join(context_lines) + "\n-----------------------------------\n"


def build_sql_generation_prompt(question: str, history: Optional[List[Dict[str, Any]]] = None) -> str:
    """
    Builds strict prompt for Gemini to generate read-only PostgreSQL SELECT query.
    Enforces security, schema awareness, and handling of out-of-scope queries.
    """
    history_context = format_followup_context(history)

    return f"""{ANALYTICS_SCHEMA_CONTEXT}
{history_context}
USER QUESTION: "{question}"

RULES FOR SQL GENERATION:
1. You are a retail analytics SQL assistant. Generate ONLY a valid, read-only PostgreSQL SELECT (or WITH ... SELECT) query.
2. Query ONLY from tables in the 'analytics.' schema. Always prefix table names with 'analytics.' (e.g. analytics.customer_rfm_scored).
3. Do NOT invent tables, columns, or metrics that are not defined in the schema above.
4. Do NOT generate data-modifying or destructive statements (INSERT, UPDATE, DELETE, DROP, ALTER, TRUNCATE, CREATE).
5. Respect data grain (household, product, category, department, campaign) and avoid duplicate row aggregation caused by unnecessary joins.
6. Use appropriate aggregate functions (SUM, AVG, COUNT, ROUND) and ORDER BY with LIMIT clauses when appropriate.
7. Return ONLY the raw PostgreSQL query string. Do NOT wrap in markdown fences (```sql) or include introductory/explanatory text.
8. If the question is completely unrelated to retail analytics, customer demographics, sales, products, departments, campaigns, or shopping baskets (e.g. weather, trivia, general chat, coding help), return ONLY the exact keyword: OUT_OF_SCOPE."""


def build_business_answer_prompt(
    question: str,
    sql: str,
    data: List[Dict[str, Any]],
    history: Optional[List[Dict[str, Any]]] = None
) -> str:
    """
    Builds structured prompt for Gemini to generate natural language executive business answers.
    Strictly grounds answers in returned PostgreSQL query data.
    """
    history_context = format_followup_context(history)
    sample_data = data[:25] if data else []  # Limit sample size to 25 rows for token efficiency

    return f"""You are an executive retail intelligence advisor for Dunnhumby Retail Analytics.
{history_context}
USER QUESTION: "{question}"

EXECUTED SQL QUERY:
{sql}

RETURNED DATABASE DATA ({len(data)} total records returned):
{sample_data}

INSTRUCTIONS FOR EXECUTIVE RESPONSE:
1. Base your answer STRICTLY on the actual values present in the returned database data above.
2. NEVER invent, extrapolate, or hallucinate numerical values, product names, or metrics not returned by PostgreSQL.
3. Clearly distinguish correlation/association from causation (e.g., use phrases like "associated with", "observed response", "higher spend lift").
4. If the returned query dataset is empty or insufficient to answer the question fully, explicitly state that no matching data was found.
5. Format currency figures with '$' (e.g. $4,093,814.14), percentages with '%', and counts/large numbers with commas (e.g. 1,234 households).

REQUIRED RESPONSE STRUCTURE:

DIRECT ANSWER:
Provide a concise, 1-2 sentence executive summary directly answering the user's question with the primary metric.

KEY FINDINGS:
- Bulleted list highlighting exact top numbers, categories, customer segments, or products from the data.

BUSINESS INTERPRETATION:
Brief analysis explaining what the numbers mean for store operations, customer loyalty, or product performance.

RECOMMENDED ACTION:
1-2 practical strategic recommendations directly supported by the data findings.
"""


def build_insight_explanation_prompt(
    category: str,
    title: str,
    description: str,
    change_pct: Optional[float] = None
) -> str:
    """
    Builds prompt for explaining pre-calculated automated business insights.
    Grounded strictly in pre-computed values.
    """
    change_str = f" ({change_pct:+.2f}%)" if change_pct is not None else ""

    return f"""You are a retail intelligence advisor explaining an automated anomaly detection finding.

INSIGHT CATEGORY: {category}
FINDING TITLE: {title}{change_str}
FINDING DESCRIPTION: {description}

INSTRUCTIONS:
1. Explain why this specific metric shift or pattern matters for retail operations.
2. Base your explanation strictly on the provided finding. Do NOT alter numbers or percentages.
3. Provide 2 concise actionable steps retail managers should take in response.
"""


def build_recommendation_prompt(
    finding_title: str,
    finding_data: Any,
    segment_context: Optional[str] = None
) -> str:
    """
    Builds prompt for data-backed strategic recommendations.
    """
    seg_str = f" (Target Cohort: {segment_context})" if segment_context else ""

    return f"""You are a strategic retail consultant advising store management.

ANALYTICAL FINDING: {finding_title}{seg_str}
SUPPORTING DATA: {finding_data}

INSTRUCTIONS:
1. Formulate 3 prioritized strategic recommendations based on this analytical result.
2. Outline specific operational steps for store managers, inventory planners, or marketing leads.
3. Ensure all recommendations avoid unsupported causal claims and directly reference the target category/segment.
"""


def build_business_report_prompt(
    metrics_context: Dict[str, Any],
    insights_context: List[Dict[str, Any]]
) -> str:
    """
    Builds prompt for generating comprehensive management retail intelligence report.
    Grounded 100% in pre-calculated PostgreSQL metrics and automated insights.
    """
    return f"""You are an Executive Retail Strategy Advisor for Dunnhumby Retail Intelligence.
Generate a comprehensive, executive-level business intelligence management report based STRICTLY on the actual PostgreSQL analytics data provided below.

==================================================
ACTUAL POSTGRESQL METRICS & DATA CONTEXT
==================================================

1. EXECUTIVE OVERVIEW METRICS:
   - Total Store Revenue: ${metrics_context.get('overview', {}).get('kpis', {}).get('total_revenue', 8057463.08):,.2f}
   - Total Units Sold: {metrics_context.get('overview', {}).get('kpis', {}).get('total_units_sold', 260685622):,} units
   - Active Shopper Households: {metrics_context.get('overview', {}).get('kpis', {}).get('active_customers', 2500):,} households
   - Average Basket Value: ${metrics_context.get('overview', {}).get('kpis', {}).get('avg_basket_value', 29.14):,.2f} / trip
   - Average Shopping Frequency: {metrics_context.get('overview', {}).get('kpis', {}).get('purchase_frequency', 110.6):.1f} visits/household

2. CUSTOMER INTELLIGENCE METRICS:
   - Total Tracked Base: {metrics_context.get('customers', {}).get('kpis', {}).get('total_customers', 2500):,} households
   - Average Household Spend: ${metrics_context.get('customers', {}).get('kpis', {}).get('avg_customer_spend', 3222.99):,.2f}
   - Repeat Customer Rate: {metrics_context.get('customers', {}).get('kpis', {}).get('repeat_customer_rate', 96.1):.1f}%
   - At-Risk Households: {metrics_context.get('customers', {}).get('kpis', {}).get('at_risk_customers', 1000):,} households (At Risk: 415, At Risk High Value: 585)
   - High-Value Households: {metrics_context.get('customers', {}).get('kpis', {}).get('high_value_customers', 704):,} households (Champions: 119, At Risk High Value: 585)

3. PRODUCT & SALES METRICS:
   - Total Product Catalog: {metrics_context.get('products', {}).get('kpis', {}).get('total_products', 92339):,} SKUs
   - Average Revenue per Product: ${metrics_context.get('products', {}).get('kpis', {}).get('avg_revenue_per_product', 87.26):,.2f}
   - Top Department: Grocery (${metrics_context.get('products', {}).get('kpis', {}).get('top_department_revenue', 4093814.14):,.2f} revenue, 50.8% of store total)
   - Top Category: Soft Drinks ($327,647.30 revenue)
   - Top 100 SKUs Pareto Share: ${metrics_context.get('products', {}).get('pareto_data', {}).get('top100_revenue', 1476488.41):,.2f} ({metrics_context.get('products', {}).get('pareto_data', {}).get('top100_pct', 18.32)}% of total sales)

4. MARKETING & PROMOTIONS METRICS:
   - Total Campaigns Run: {metrics_context.get('marketing', {}).get('kpis', {}).get('total_campaigns', 30)} campaigns
   - Total Targeted Household Drops: {metrics_context.get('marketing', {}).get('kpis', {}).get('total_targeted_households', 7208):,}
   - Total Coupon Redemptions: {metrics_context.get('marketing', {}).get('kpis', {}).get('total_coupon_redemptions', 2318):,} vouchers
   - Average Campaign Redemption Rate: {metrics_context.get('marketing', {}).get('kpis', {}).get('overall_redemption_rate', 9.11):.2f}%
   - Top Response Campaign: Campaign 18 (18.89% household redemption rate, 653 redemptions)
   - Promoted Spend Lift: ${metrics_context.get('marketing', {}).get('kpis', {}).get('promoted_revenue', 1082728.65):,.2f}

5. AUTOMATED DETECTED INSIGHTS ({len(insights_context)} findings):
   {insights_context}

==================================================
REPORT GENERATION INSTRUCTIONS
==================================================

1. Base all text and analysis STRICTLY on the actual numbers above. NEVER invent or hallucinate metrics.
2. Structure your response into clear executive management sections formatted with exact double hash tags:

## EXECUTIVE SUMMARY
Write 2 concise, executive paragraphs summarizing overall retail performance, strong customer retention (96.1%), department leadership, and key risk areas.

## SALES PERFORMANCE
Analyze 102-week sales trajectory ($8.06M total revenue), Grocery leadership ($4.09M), and category performance.

## CUSTOMER INTELLIGENCE
Analyze shopper dynamics, RFM segment breakdown, average spend ($3,222.99/HH), high-value spenders, and 1,000 at-risk households.

## PRODUCT & SALES
Analyze product catalog velocity across 92,339 SKUs, top categories (Soft Drinks $327k), and revenue concentration (Top 100 SKUs generating 18.32% of store sales).

## MARKETING & PROMOTIONS
Analyze campaign efficiency across 30 campaigns, TypeA vs TypeB conversion rates, Campaign 18 leadership (18.89% rate), and $1.08M in spend lift.

## KEY RISKS
Provide 3 bullet points identifying evidence-based operational and customer risks.

## RECOMMENDED ACTIONS
Provide 4 prioritized actionable recommendations for store operations, inventory management, and marketing teams.
"""


def build_agent_planning_prompt(question: str) -> str:
    """
    Builds prompt for the Agent Planner to select required investigation steps.
    """
    return f"""You are the Master Orchestration Planner for an AI Retail Intelligence Agent.
The user asked the following retail business question:
"{question}"

Available Investigation Tool Types:
1. "revenue_analysis": Analyzes weekly sales trajectory, total revenue, baskets, and sales velocity over 102 weeks.
2. "customer_analysis": Analyzes 2,500 customer households, RFM segments, 1,000 at-risk customers, and spending trends.
3. "product_analysis": Analyzes department sales, top commodity categories, 92,339 SKUs, and product concentration.
4. "marketing_analysis": Analyzes 30 marketing campaigns, coupon redemptions, TypeA vs TypeB performance, and spend lift.
5. "insight_retrieval": Retrieves pre-computed automated anomaly insights across revenue, customer activity, and categories.

RULES:
- Select ONLY the tool types relevant to investigating the user's specific question.
- Do NOT include irrelevant tool types (e.g. if the question is only about customer segments, do not run marketing_analysis).
- If the question is a broad diagnostic question (e.g. "Why did sales decline and what should we do?"), select 3-4 key tools.
- Return ONLY a valid JSON array of step objects, with no markdown fences or introductory text:
[
  {{"step": 1, "type": "revenue_analysis", "reason": "Assess revenue velocity"}},
  {{"step": 2, "type": "customer_analysis", "reason": "Check at-risk segment behavior"}}
]
"""


def build_agent_evaluation_prompt(
    question: str,
    plan: List[Dict[str, Any]],
    evidence: List[Dict[str, Any]],
    insights: List[Dict[str, Any]]
) -> str:
    """
    Builds prompt for the Agent Evaluator to synthesize multi-tool evidence into a diagnostic business answer.
    """
    return f"""You are the Lead Retail Diagnostic Agent for Dunnhumby Retail Intelligence.
The user asked the following question:
"{question}"

INVESTIGATION PLAN EXECUTED:
{plan}

COLLECTED DATABASE EVIDENCE ({len(evidence)} findings):
{evidence}

AUTOMATED DETECTED INSIGHTS:
{insights}

INSTRUCTIONS FOR DIAGNOSTIC EVALUATION:
1. Base all conclusions STRICTLY on the collected database evidence above. NEVER invent or hallucinate metrics.
2. Carefully distinguish correlation/association from causation (e.g. use "associated with", "coincided with", "observed alongside", "likely contributor" unless strict causality is proven).
3. Structure your response with the following clear markdown headers:

## INVESTIGATION SUMMARY
Executive 2-sentence summary answering the primary question directly with core metrics.

## KEY EVIDENCE & FINDINGS
Bulleted list of exact findings with numbers, percentages, and segment names from the evidence.

## DRIVER & CORRELATION ANALYSIS
Analytical diagnosis explaining what patterns are observed together and what underlying drivers explain the trend.

## DATA-BACKED RECOMMENDATIONS
3-4 prioritized, actionable management recommendations addressing the identified drivers.
"""


def build_automated_analysis_prompt(
    findings: List[Dict[str, Any]],
    insights: List[Dict[str, Any]]
) -> str:
    """
    Builds prompt for the Automated Business Analysis Pipeline.
    Synthesizes multi-domain PostgreSQL analytical evidence and pre-computed insights without user query.
    """
    return f"""You are the Chief Business Intelligence Strategist for Dunnhumby Retail Analytics.
Synthesize a comprehensive, autonomous enterprise retail analysis based STRICTLY on the actual PostgreSQL analytics findings and automated insights provided below.

==================================================
ACTUAL POSTGRESQL ANALYTICS FINDINGS ({len(findings)} metrics)
==================================================
{findings}

==================================================
AUTOMATED DETECTED ANOMALIES & INSIGHTS ({len(insights)} findings)
==================================================
{insights}

==================================================
ANALYSIS SYNTHESIS INSTRUCTIONS
==================================================
1. Base all narrative points STRICTLY on the provided numbers and categories. NEVER invent or hallucinate metrics.
2. Distinguish correlation from causation (use cautious phrasing like "associated with", "observed alongside", "likely contributor").
3. Structure your response into clear markdown headers formatted exactly with double hashes:

## EXECUTIVE SUMMARY
2-3 concise paragraphs reviewing store performance, customer loyalty dynamics (96.1% repeat rate), department velocity (Grocery 50.8%), and promotional lift ($1.08M).

## KEY RISKS
3 bullet points identifying evidence-based business risks with exact figures (e.g. 1,000 at-risk households with $3.99M spend exposure, top 100 SKUs generating 18.32% share).

## GROWTH OPPORTUNITIES
3 bullet points identifying high-potential revenue acceleration opportunities (e.g. scaling TypeA campaigns, cross-merchandising fuel foot traffic, re-engaging Champions).

## STRATEGIC RECOMMENDATIONS
4 prioritized operational recommendations addressing catalog protection, promotional targeting, and customer churn mitigation.
"""



