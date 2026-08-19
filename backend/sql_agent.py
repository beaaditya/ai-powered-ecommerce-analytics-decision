import re
from decimal import Decimal
from datetime import date, datetime
from typing import Any, Dict, List, Optional, Tuple

try:
    from backend.database import get_db_connection
    from backend.ai import generate_text
    from backend.prompts import (
        ANALYTICS_SCHEMA_CONTEXT,
        build_sql_generation_prompt,
        build_business_answer_prompt
    )
except ImportError:
    from database import get_db_connection
    from ai import generate_text
    from prompts import (
        ANALYTICS_SCHEMA_CONTEXT,
        build_sql_generation_prompt,
        build_business_answer_prompt
    )

# System Schema Definition for the Gemini SQL Agent
ANALYTICS_SCHEMA_PROMPT = """
You are an expert PostgreSQL data analyst specializing in retail intelligence.
You have access to a PostgreSQL database with a rich 'analytics' schema derived from the Dunnhumby Complete Journey dataset.

The 'analytics' schema contains the following pre-calculated tables:

1. analytics.customer_rfm_scored
   - Columns: household_key (bigint), last_purchase_day (integer), purchase_frequency (bigint), monetary_value (numeric), total_quantity (bigint), unique_products (bigint), active_weeks (bigint), avg_basket_value (numeric), recency_score (integer), frequency_score (integer), monetary_score (integer), customer_segment (character varying)
   - Segments: 'Champions', 'Loyal Customers', 'Potential Loyalists', 'Recent Customers', 'Promising', 'Customers Needing Attention', 'About To Sleep', 'At Risk', 'Cant Lose Them', 'Hibernating', 'Lost'

2. analytics.customer_intelligence
   - Columns: household_key (bigint), customer_segment (character varying), recency_score (integer), frequency_score (integer), monetary_score (integer), monetary_value (numeric), spending_trend (character varying), revenue_change_pct (numeric), discount_sensitivity (character varying), discount_purchase_rate (numeric), avg_basket_value (numeric), active_weeks (bigint)

3. analytics.department_metrics
   - Columns: department (text), customers (bigint), baskets (bigint), units_sold (bigint), revenue (numeric), discounts (numeric)

4. analytics.campaign_performance
   - Columns: campaign (integer), description (text), start_day (integer), end_day (integer), households_targeted (bigint), households_redeemed (bigint), total_redemptions (bigint), redemption_rate (numeric)

5. analytics.campaign_customer_spend
   - Columns: campaign (integer), household_key (bigint), start_day (integer), end_day (integer), pre_campaign_spend (numeric), campaign_spend (numeric), spend_change (numeric)

6. analytics.product_metrics
   - Columns: product_id (bigint), department (text), commodity_desc (text), sub_commodity_desc (text), brand (text), unique_households (bigint), purchase_baskets (bigint), units_sold (bigint), revenue (numeric), discount_amount (numeric)

7. analytics.category_metrics
   - Columns: department (text), commodity_desc (text), sub_commodity_desc (text), customers (bigint), baskets (bigint), units_sold (bigint), revenue (numeric), discounts (numeric)

8. analytics.category_trend
   - Columns: department (text), commodity_desc (text), first_half_revenue (numeric), second_half_revenue (numeric), revenue_change (numeric), trend (character varying)

9. analytics.customer_trend
   - Columns: household_key (bigint), first_half_revenue (numeric), second_half_revenue (numeric), first_half_quantity (numeric), second_half_quantity (numeric), revenue_change (numeric), revenue_change_pct (numeric), spending_trend (character varying)

10. analytics.customer_recommendations
    - Columns: household_key (bigint), category_preference_rank (bigint), department (text), commodity_desc (text), product_id (bigint), product_revenue (numeric), product_customers (bigint), units_sold (bigint), recommendation_rank (bigint)

11. analytics.customer_discount
    - Columns: household_key (bigint), revenue (numeric), total_discount (numeric), total_purchase_lines (bigint), discounted_purchase_lines (bigint), discount_purchase_rate (numeric), discount_sensitivity (character varying)

12. analytics.weekly_metrics
    - Columns: week_no (integer), active_households (bigint), baskets (bigint), units (bigint), revenue (numeric), discounts (numeric)

13. analytics.basket_metrics
    - Columns: household_key (bigint), basket_id (bigint), day (integer), week_no (integer), basket_revenue (numeric), basket_quantity (bigint), basket_discount (numeric), unique_products (bigint)

Guidelines:
- Return ONLY a valid PostgreSQL SELECT query. Do NOT return explanation or markdown text around the SQL query.
- Always qualify tables with the schema name 'analytics.' (e.g. analytics.customer_rfm_scored).
- Use proper aggregation (COUNT, SUM, AVG, ROUND) and ORDER BY clauses with LIMIT when appropriate.
- Never write destructive statements (INSERT, UPDATE, DELETE, DROP, ALTER, TRUNCATE, etc.).
- If the question is completely unrelated to retail analytics, customer behavior, store departments, products, transactions, campaigns, coupons, or household demographics (e.g. questions about weather, general trivia, coding, personal chat), return ONLY the exact word 'OUT_OF_SCOPE'.
"""

# Maximum rows allowed to be returned to prevent memory exhaustion
MAX_QUERY_RESULTS = 500

# Prohibited destructive and procedural SQL keywords
FORBIDDEN_SQL_KEYWORDS = [
    "INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "TRUNCATE",
    "CREATE", "GRANT", "REVOKE", "MERGE", "COPY", "CALL",
    "EXECUTE", "EXEC"
]


def clean_sql(raw_text: str) -> str:
    """
    Extract and clean SQL query from LLM response.
    """
    text = raw_text.strip()
    if text.upper().startswith("OUT_OF_SCOPE"):
        return "OUT_OF_SCOPE"
    # Remove markdown code blocks if present
    match = re.search(r"```(?:sql)?\s*([\s\S]*?)\s*```", text, re.IGNORECASE)
    if match:
        text = match.group(1).strip()
    # Remove trailing semicolons for consistency
    text = text.rstrip(";")
    return text


def validate_sql(sql: str) -> Tuple[bool, str]:
    """
    Validate that the SQL query is strictly a safe, read-only analytical SELECT statement.
    Returns (is_valid: bool, rejection_reason: str).
    """
    if not sql or not isinstance(sql, str) or not sql.strip():
        return False, "SQL query is empty or invalid."

    if sql.strip().upper() == "OUT_OF_SCOPE":
        return False, "Question is out of scope for retail analytics."

    # Remove comments to inspect actual executed statements
    cleaned = re.sub(r"--.*?$", "", sql, flags=re.MULTILINE)
    cleaned = re.sub(r"/\*.*?\*/", "", cleaned, flags=re.DOTALL).strip()

    if not cleaned:
        return False, "SQL query contains no executable statements."

    # Check for multiple SQL statements separated by semicolons
    statements = [stmt.strip() for stmt in cleaned.split(";") if stmt.strip()]
    if len(statements) > 1:
        return False, "Multiple SQL statements are not permitted."

    single_query = statements[0]

    # Verify query begins strictly with SELECT or WITH (Common Table Expression)
    if not re.match(r"^(SELECT|WITH)\b", single_query, re.IGNORECASE):
        return False, "Only read-only SELECT or WITH (Common Table Expression) queries are permitted."

    # Check for forbidden destructive or procedural keywords using word boundaries
    for keyword in FORBIDDEN_SQL_KEYWORDS:
        pattern = rf"\b{re.escape(keyword)}\b"
        if re.search(pattern, single_query, re.IGNORECASE):
            return False, f"Prohibited SQL keyword detected: '{keyword}'."

    return True, ""


def is_safe_query(sql: str) -> Tuple[bool, str]:
    """
    Backwards-compatible alias for validate_sql.
    """
    return validate_sql(sql)


def serialize_cell(val: Any) -> Any:
    """
    Convert database cell value to JSON-serializable type, safely handling NULLs.
    """
    if val is None:
        return None
    if isinstance(val, Decimal):
        return float(val)
    if isinstance(val, (date, datetime)):
        return val.isoformat()
    return val


def execute_sql(sql: str, max_rows: int = MAX_QUERY_RESULTS) -> List[Dict[str, Any]]:
    """
    Execute a validated SELECT query against PostgreSQL in read-only mode and return records as dictionaries.
    Caps results at max_rows.
    """
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        # Enforce PostgreSQL database-level read-only session
        conn.set_session(readonly=True, autocommit=True)
        cursor = conn.cursor()
        cursor.execute(sql)
        
        if cursor.description is None:
            return []

        columns = [desc[0] for desc in cursor.description]
        rows = cursor.fetchmany(max_rows)
        
        results = []
        for row in rows:
            record = {}
            for col_name, val in zip(columns, row):
                record[col_name] = serialize_cell(val)
            results.append(record)
            
        return results
    finally:
        if cursor is not None:
            try:
                cursor.close()
            except Exception:
                pass
        if conn is not None:
            try:
                conn.close()
            except Exception:
                pass


def generate_sql(question: str, history: Optional[List[Dict[str, Any]]] = None) -> str:
    """
    Use Gemini AI to translate a natural language retail question into a PostgreSQL query.
    Refactored to use centralized prompt engineering layer.
    """
    prompt = build_sql_generation_prompt(question, history=history)
    raw_response = generate_text(prompt)
    return clean_sql(raw_response)


def summarize_results(
    question: str,
    sql: str,
    data: List[Dict[str, Any]],
    history: Optional[List[Dict[str, Any]]] = None
) -> str:
    """
    Use Gemini AI to produce an executive business intelligence answer strictly based on actual query data.
    Refactored to use centralized prompt engineering layer.
    """
    prompt = build_business_answer_prompt(question, sql, data, history=history)

    try:
        return generate_text(prompt)
    except Exception:
        # Fallback if summarization encounters a temporary issue
        return f"Query executed successfully and returned {len(data)} record(s)."


def process_retail_question(
    question: str,
    history: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Full pipeline: Question -> Scope Check -> Generate SQL -> Validate SQL -> Execute on PostgreSQL -> Summarize Answer.
    Supports optional conversation history for follow-up questions.
    """
    if not question or not question.strip():
        return {
            "question": question,
            "sql": "",
            "data": [],
            "answer": "Please provide a valid analytical question."
        }

    try:
        # Step 1: Translate question to SQL (or detect out of scope)
        sql = generate_sql(question, history=history)
        
        # Check if question is unrelated to retail analytics
        if sql == "OUT_OF_SCOPE":
            return {
                "question": question,
                "sql": "",
                "data": [],
                "answer": "I am an AI assistant specifically designed for Dunnhumby Retail Analytics. I can help answer analytical questions about customer segmentation, product revenues, department sales, marketing campaigns, and RFM metrics. Please ask a retail-related question."
            }

        # Step 2: Validate SQL safety BEFORE execution
        is_valid, rejection_reason = validate_sql(sql)
        if not is_valid:
            return {
                "question": question,
                "sql": sql,
                "data": [],
                "answer": f"Generated SQL failed safety validation. {rejection_reason}"
            }

        # Step 3: ONLY IF VALID, execute query against PostgreSQL in read-only mode
        data = execute_sql(sql)

        # Step 4: Handle empty result sets accurately without hallucination
        if not data:
            return {
                "question": question,
                "sql": sql,
                "data": [],
                "answer": "No matching data was found for this question in the retail analytics database."
            }

        # Step 5: Generate natural language executive answer strictly grounded in returned data
        answer = summarize_results(question, sql, data, history=history)

        return {
            "question": question,
            "sql": sql,
            "data": data,
            "answer": answer
        }
    except Exception:
        # Return controlled error without leaking internal credentials, paths, or connection strings
        return {
            "question": question,
            "sql": locals().get("sql", "") if locals().get("sql") != "OUT_OF_SCOPE" else "",
            "data": [],
            "answer": "An error occurred while executing your analytical query. Please check your query or try rephrasing your question."
        }

