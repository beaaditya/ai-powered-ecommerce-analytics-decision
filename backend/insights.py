import logging
from decimal import Decimal
from typing import Any, Dict, List, Optional

try:
    from backend.database import get_db_connection
    from backend.ai import generate_text
except ImportError:
    from database import get_db_connection
    from ai import generate_text

logger = logging.getLogger("retail_insights")

# =========================================================================
# Configurable Business Thresholds (Single Source of Truth)
# =========================================================================
REVENUE_CHANGE_THRESHOLD = 3.0        # % change in weekly revenue to trigger insight
CUSTOMER_CHANGE_THRESHOLD = 3.0       # % change in active customer households
CATEGORY_CHANGE_THRESHOLD = 15.0      # % change in category half-over-half revenue
CAMPAIGN_REDEMPTION_THRESHOLD = 10.0  # % redemption rate threshold for high performance
SEGMENT_AT_RISK_THRESHOLD = 100       # Minimum customer count in high-value at-risk segment


def serialize_val(val: Any) -> Any:
    """
    Safely serialize database numeric values to floats/ints/strings.
    """
    if val is None:
        return None
    if isinstance(val, Decimal):
        return float(val)
    return val


def detect_revenue_insights() -> List[Dict[str, Any]]:
    """
    1. REVENUE TREND: Detect meaningful week-over-week or period revenue shifts.
    """
    conn = None
    cursor = None
    insights = []
    try:
        conn = get_db_connection()
        conn.set_session(readonly=True, autocommit=True)
        cursor = conn.cursor()

        # Compare latest 4-week average (weeks 99-102) vs previous 4-week average (weeks 95-98)
        cursor.execute("""
            WITH recent AS (
                SELECT AVG(revenue) as recent_rev
                FROM analytics.weekly_metrics
                WHERE week_no BETWEEN 99 AND 102
            ),
            prior AS (
                SELECT AVG(revenue) as prior_rev
                FROM analytics.weekly_metrics
                WHERE week_no BETWEEN 95 AND 98
            )
            SELECT 
                ROUND(recent_rev, 2) as recent_avg,
                ROUND(prior_rev, 2) as prior_avg,
                ROUND(((recent_rev - prior_rev) / NULLIF(prior_rev, 0)) * 100, 2) as change_pct
            FROM recent, prior;
        """)
        row = cursor.fetchone()
        if row and row[0] is not None and row[1] is not None:
            recent_avg = float(row[0])
            prior_avg = float(row[1])
            change_pct = float(row[2]) if row[2] is not None else 0.0

            if abs(change_pct) >= REVENUE_CHANGE_THRESHOLD:
                direction = "growth" if change_pct > 0 else "decline"
                severity = "high" if abs(change_pct) >= 10.0 else ("medium" if change_pct < 0 else "low")
                insights.append({
                    "type": f"revenue_{direction}",
                    "severity": severity,
                    "title": f"Recent Weekly Revenue Trend ({change_pct:+.2f}%)",
                    "description": f"Average weekly revenue over the recent 4-week period was ${recent_avg:,.2f} compared to ${prior_avg:,.2f} in the prior period ({change_pct:+.2f}% change).",
                    "metric": "weekly_revenue",
                    "value": recent_avg,
                    "change_pct": change_pct
                })
    except Exception as e:
        logger.error(f"Error detecting revenue insights: {e}")
    finally:
        if cursor:
            try: cursor.close()
            except Exception: pass
        if conn:
            try: conn.close()
            except Exception: pass

    return insights


def detect_customer_insights() -> List[Dict[str, Any]]:
    """
    2. CUSTOMER TREND: Detect meaningful changes in active customer engagement.
    """
    conn = None
    cursor = None
    insights = []
    try:
        conn = get_db_connection()
        conn.set_session(readonly=True, autocommit=True)
        cursor = conn.cursor()

        # Compare active customer households in recent 4-week window vs prior 4-week window
        cursor.execute("""
            WITH recent AS (
                SELECT AVG(active_households) as recent_hh
                FROM analytics.weekly_metrics
                WHERE week_no BETWEEN 99 AND 102
            ),
            prior AS (
                SELECT AVG(active_households) as prior_hh
                FROM analytics.weekly_metrics
                WHERE week_no BETWEEN 95 AND 98
            )
            SELECT 
                ROUND(recent_hh, 0) as recent_hh,
                ROUND(prior_hh, 0) as prior_hh,
                ROUND(((recent_hh - prior_hh) / NULLIF(prior_hh, 0)) * 100, 2) as change_pct
            FROM recent, prior;
        """)
        row = cursor.fetchone()
        if row and row[0] is not None and row[1] is not None:
            recent_hh = int(row[0])
            prior_hh = int(row[1])
            change_pct = float(row[2]) if row[2] is not None else 0.0

            if abs(change_pct) >= CUSTOMER_CHANGE_THRESHOLD:
                direction = "expansion" if change_pct > 0 else "contraction"
                severity = "medium" if change_pct < 0 else "low"
                insights.append({
                    "type": f"customer_activity_{direction}",
                    "severity": severity,
                    "title": f"Active Customer Participation ({change_pct:+.2f}%)",
                    "description": f"Active shopping households averaged {recent_hh:,} in recent weeks versus {prior_hh:,} in the previous period ({change_pct:+.2f}% change in active participation).",
                    "metric": "active_households",
                    "value": recent_hh,
                    "change_pct": change_pct
                })
    except Exception as e:
        logger.error(f"Error detecting customer insights: {e}")
    finally:
        if cursor:
            try: cursor.close()
            except Exception: pass
        if conn:
            try: conn.close()
            except Exception: pass

    return insights


def detect_category_insights() -> List[Dict[str, Any]]:
    """
    3. CATEGORY PERFORMANCE: Identify top growing and declining categories.
    """
    conn = None
    cursor = None
    insights = []
    try:
        conn = get_db_connection()
        conn.set_session(readonly=True, autocommit=True)
        cursor = conn.cursor()

        # Top Growing Category (with minimum baseline spend >= $1,000)
        cursor.execute("""
            SELECT department, commodity_desc, first_half_revenue, second_half_revenue, revenue_change,
                   ROUND(((second_half_revenue - first_half_revenue) / NULLIF(first_half_revenue, 0)) * 100, 2) as pct_change
            FROM analytics.category_trend
            WHERE first_half_revenue >= 1000
            ORDER BY pct_change DESC
            LIMIT 1;
        """)
        top_growth = cursor.fetchone()
        if top_growth:
            dept, comm, h1, h2, diff, pct = top_growth
            pct_val = float(pct) if pct is not None else 0.0
            if pct_val >= CATEGORY_CHANGE_THRESHOLD:
                insights.append({
                    "type": "category_growth",
                    "severity": "low",
                    "title": f"High Growth Category: {comm.title()}",
                    "description": f"{comm} in {dept} surged {pct_val:+.2f}% from ${float(h1):,.2f} in H1 to ${float(h2):,.2f} in H2 (+${float(diff):,.2f} gain).",
                    "metric": "category_revenue",
                    "value": float(h2),
                    "change_pct": pct_val
                })

        # Top Declining Category (with minimum baseline spend >= $1,000)
        cursor.execute("""
            SELECT department, commodity_desc, first_half_revenue, second_half_revenue, revenue_change,
                   ROUND(((second_half_revenue - first_half_revenue) / NULLIF(first_half_revenue, 0)) * 100, 2) as pct_change
            FROM analytics.category_trend
            WHERE first_half_revenue >= 1000
            ORDER BY pct_change ASC
            LIMIT 1;
        """)
        top_decline = cursor.fetchone()
        if top_decline:
            dept, comm, h1, h2, diff, pct = top_decline
            pct_val = float(pct) if pct is not None else 0.0
            if pct_val <= -CATEGORY_CHANGE_THRESHOLD:
                insights.append({
                    "type": "category_decline",
                    "severity": "medium",
                    "title": f"Category Contraction: {comm.title()}",
                    "description": f"{comm} in {dept} contracted {pct_val:+.2f}% from ${float(h1):,.2f} in H1 to ${float(h2):,.2f} in H2 (${float(diff):,.2f} drop).",
                    "metric": "category_revenue",
                    "value": float(h2),
                    "change_pct": pct_val
                })
    except Exception as e:
        logger.error(f"Error detecting category insights: {e}")
    finally:
        if cursor:
            try: cursor.close()
            except Exception: pass
        if conn:
            try: conn.close()
            except Exception: pass

    return insights


def detect_campaign_insights() -> List[Dict[str, Any]]:
    """
    4. CAMPAIGN PERFORMANCE: Identify top performing marketing campaigns.
    """
    conn = None
    cursor = None
    insights = []
    try:
        conn = get_db_connection()
        conn.set_session(readonly=True, autocommit=True)
        cursor = conn.cursor()

        cursor.execute("""
            SELECT campaign, description, households_targeted, households_redeemed, total_redemptions, redemption_rate
            FROM analytics.campaign_performance
            WHERE households_targeted > 0
            ORDER BY redemption_rate DESC
            LIMIT 1;
        """)
        row = cursor.fetchone()
        if row:
            camp_id, desc, targeted, redeemed, redemptions, rate = row
            rate_val = float(rate) if rate is not None else 0.0
            if rate_val >= CAMPAIGN_REDEMPTION_THRESHOLD:
                insights.append({
                    "type": "campaign_top_performer",
                    "severity": "low",
                    "title": f"Top Campaign: Campaign {camp_id} ({desc})",
                    "description": f"Campaign {camp_id} achieved the highest engagement with an {rate_val:.2f}% redemption rate ({redeemed:,} households redeemed out of {targeted:,} targeted, totaling {redemptions:,} coupon redemptions).",
                    "metric": "redemption_rate",
                    "value": rate_val,
                    "change_pct": rate_val
                })
    except Exception as e:
        logger.error(f"Error detecting campaign insights: {e}")
    finally:
        if cursor:
            try: cursor.close()
            except Exception: pass
        if conn:
            try: conn.close()
            except Exception: pass

    return insights


def detect_promotion_insights() -> List[Dict[str, Any]]:
    """
    5. PROMOTION PERFORMANCE: Analyze promotional revenue and volume contribution.
    """
    conn = None
    cursor = None
    insights = []
    try:
        conn = get_db_connection()
        conn.set_session(readonly=True, autocommit=True)
        cursor = conn.cursor()

        cursor.execute("""
            SELECT 
                SUM(revenue) as promo_revenue,
                SUM(units_sold) as promo_units,
                ROUND(SUM(revenue) / NULLIF(SUM(units_sold), 0), 2) as avg_unit_price
            FROM analytics.promotion_sales
            WHERE has_promotion = 1;
        """)
        row = cursor.fetchone()
        if row and row[0] is not None:
            promo_rev = float(row[0])
            promo_units = int(row[1]) if row[1] is not None else 0
            avg_price = float(row[2]) if row[2] is not None else 0.0

            insights.append({
                "type": "promotion_sales_volume",
                "severity": "low",
                "title": "Promotional Revenue Impact",
                "description": f"Promoted items generated ${promo_rev:,.2f} across {promo_units:,} units sold at an average item price of ${avg_price:,.2f}.",
                "metric": "promoted_revenue",
                "value": promo_rev,
                "change_pct": 0.0
            })
    except Exception as e:
        logger.error(f"Error detecting promotion insights: {e}")
    finally:
        if cursor:
            try: cursor.close()
            except Exception: pass
        if conn:
            try: conn.close()
            except Exception: pass

    return insights


def detect_segment_insights() -> List[Dict[str, Any]]:
    """
    6. CUSTOMER SEGMENT RISK: Identify at-risk customer revenue exposure.
    """
    conn = None
    cursor = None
    insights = []
    try:
        conn = get_db_connection()
        conn.set_session(readonly=True, autocommit=True)
        cursor = conn.cursor()

        cursor.execute("""
            SELECT 
                customer_segment,
                COUNT(*) as customer_count,
                ROUND(SUM(monetary_value), 2) as total_segment_spend,
                ROUND(AVG(monetary_value), 2) as avg_spend
            FROM analytics.customer_rfm_scored
            WHERE customer_segment = 'At Risk High Value'
            GROUP BY customer_segment;
        """)
        row = cursor.fetchone()
        if row:
            segment, count, total_spend, avg_spend = row
            if count >= SEGMENT_AT_RISK_THRESHOLD:
                insights.append({
                    "type": "customer_segment_risk",
                    "severity": "high",
                    "title": f"Revenue At Risk: {segment}",
                    "description": f"{count:,} households classified in the '{segment}' segment represent ${float(total_spend):,.2f} in historical spend (average ${float(avg_spend):,.2f} per household), requiring targeted retention.",
                    "metric": "at_risk_spend",
                    "value": float(total_spend),
                    "change_pct": None
                })
    except Exception as e:
        logger.error(f"Error detecting segment insights: {e}")
    finally:
        if cursor:
            try: cursor.close()
            except Exception: pass
        if conn:
            try: conn.close()
            except Exception: pass

    return insights


def get_all_business_insights() -> List[Dict[str, Any]]:
    """
    Aggregate insights across all 6 business detection categories.
    Catches errors gracefully per category so one failure does not break the endpoint.
    """
    all_insights: List[Dict[str, Any]] = []

    # Category 1: Revenue Trends
    try:
        all_insights.extend(detect_revenue_insights())
    except Exception as e:
        logger.error(f"Revenue detection failed: {e}")

    # Category 2: Customer Trends
    try:
        all_insights.extend(detect_customer_insights())
    except Exception as e:
        logger.error(f"Customer detection failed: {e}")

    # Category 3: Category Growth/Decline
    try:
        all_insights.extend(detect_category_insights())
    except Exception as e:
        logger.error(f"Category detection failed: {e}")

    # Category 4: Campaign Performance
    try:
        all_insights.extend(detect_campaign_insights())
    except Exception as e:
        logger.error(f"Campaign detection failed: {e}")

    # Category 5: Promotion Performance
    try:
        all_insights.extend(detect_promotion_insights())
    except Exception as e:
        logger.error(f"Promotion detection failed: {e}")

    # Category 6: Customer Segment Risk
    try:
        all_insights.extend(detect_segment_insights())
    except Exception as e:
        logger.error(f"Segment risk detection failed: {e}")

    return all_insights
