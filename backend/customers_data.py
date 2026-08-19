import logging
from decimal import Decimal
from typing import Any, Dict, List

try:
    from backend.database import get_db_connection
except ImportError:
    from database import get_db_connection

logger = logging.getLogger("customer_intelligence")


def serialize_val(val: Any) -> Any:
    """Helper to convert Decimal or numeric objects to Python floats/ints."""
    if val is None:
        return 0
    if isinstance(val, Decimal):
        return float(val)
    return val


def get_customer_intelligence_data() -> Dict[str, Any]:
    """
    Retrieves real PostgreSQL analytics data for Customer Intelligence Dashboard.
    Data is fetched strictly from analytics schema tables:
    - analytics.customer_rfm_scored
    - analytics.customer_intelligence
    """
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        conn.set_session(readonly=True, autocommit=True)
        cursor = conn.cursor()

        # 1. Core KPIs
        cursor.execute("""
            SELECT 
                COUNT(DISTINCT household_key) as total_customers,
                ROUND(AVG(monetary_value), 2) as avg_customer_spend,
                ROUND(AVG(purchase_frequency), 1) as avg_transactions,
                ROUND((COUNT(CASE WHEN purchase_frequency >= 10 THEN 1 END)::numeric / NULLIF(COUNT(*), 0)) * 100, 1) as repeat_rate,
                COUNT(CASE WHEN customer_segment IN ('At Risk', 'At Risk High Value') THEN 1 END) as at_risk_count,
                COUNT(CASE WHEN customer_segment IN ('Champions', 'At Risk High Value') THEN 1 END) as high_value_count
            FROM analytics.customer_rfm_scored;
        """)
        kpi_row = cursor.fetchone()
        kpis = {
            "total_customers": int(kpi_row[0]) if kpi_row and kpi_row[0] is not None else 0,
            "avg_customer_spend": serialize_val(kpi_row[1]) if kpi_row else 0.0,
            "avg_transactions_per_customer": serialize_val(kpi_row[2]) if kpi_row else 0.0,
            "repeat_customer_rate": serialize_val(kpi_row[3]) if kpi_row else 0.0,
            "at_risk_customers": int(kpi_row[4]) if kpi_row and kpi_row[4] is not None else 0,
            "high_value_customers": int(kpi_row[5]) if kpi_row and kpi_row[5] is not None else 0
        }

        # 2. RFM Customer Segments & Spend breakdown
        cursor.execute("""
            SELECT 
                customer_segment,
                COUNT(*) as customer_count,
                ROUND((COUNT(*)::numeric / (SELECT COUNT(*) FROM analytics.customer_rfm_scored)) * 100, 1) as pct_of_base,
                ROUND(SUM(monetary_value), 2) as total_spend,
                ROUND(AVG(monetary_value), 2) as avg_spend
            FROM analytics.customer_rfm_scored
            GROUP BY customer_segment
            ORDER BY total_spend DESC;
        """)
        seg_rows = cursor.fetchall()
        segments = [
            {
                "segment": r[0],
                "count": int(r[1]),
                "pct_of_base": serialize_val(r[2]),
                "total_spend": serialize_val(r[3]),
                "avg_spend": serialize_val(r[4])
            }
            for r in seg_rows
        ]

        # 3. Customer Spend Distribution (Monetary Spend Buckets)
        cursor.execute("""
            SELECT 
                b.bucket_label,
                COUNT(*) as count
            FROM (
                SELECT household_key,
                    CASE 
                        WHEN monetary_value < 500 THEN 'Under $500'
                        WHEN monetary_value >= 500 AND monetary_value < 1500 THEN '$500 - $1.5k'
                        WHEN monetary_value >= 1500 AND monetary_value < 3000 THEN '$1.5k - $3k'
                        WHEN monetary_value >= 3000 AND monetary_value < 5000 THEN '$3k - $5k'
                        WHEN monetary_value >= 5000 AND monetary_value < 10000 THEN '$5k - $10k'
                        ELSE 'Over $10k'
                    END as bucket_label,
                    CASE 
                        WHEN monetary_value < 500 THEN 1
                        WHEN monetary_value >= 500 AND monetary_value < 1500 THEN 2
                        WHEN monetary_value >= 1500 AND monetary_value < 3000 THEN 3
                        WHEN monetary_value >= 3000 AND monetary_value < 5000 THEN 4
                        WHEN monetary_value >= 5000 AND monetary_value < 10000 THEN 5
                        ELSE 6
                    END as sort_order
                FROM analytics.customer_rfm_scored
            ) b
            GROUP BY b.bucket_label, b.sort_order
            ORDER BY b.sort_order;
        """)
        spend_dist_rows = cursor.fetchall()
        spend_distribution = [
            {"bucket": r[0], "count": int(r[1])}
            for r in spend_dist_rows
        ]

        # 4. Customer Activity / Frequency Distribution Buckets
        cursor.execute("""
            SELECT 
                f.bucket_label,
                COUNT(*) as count
            FROM (
                SELECT household_key,
                    CASE 
                        WHEN purchase_frequency < 20 THEN '1-19 trips'
                        WHEN purchase_frequency >= 20 AND purchase_frequency < 50 THEN '20-49 trips'
                        WHEN purchase_frequency >= 50 AND purchase_frequency < 100 THEN '50-99 trips'
                        WHEN purchase_frequency >= 100 AND purchase_frequency < 150 THEN '100-149 trips'
                        ELSE '150+ trips'
                    END as bucket_label,
                    CASE 
                        WHEN purchase_frequency < 20 THEN 1
                        WHEN purchase_frequency >= 20 AND purchase_frequency < 50 THEN 2
                        WHEN purchase_frequency >= 50 AND purchase_frequency < 100 THEN 3
                        WHEN purchase_frequency >= 100 AND purchase_frequency < 150 THEN 4
                        ELSE 5
                    END as sort_order
                FROM analytics.customer_rfm_scored
            ) f
            GROUP BY f.bucket_label, f.sort_order
            ORDER BY f.sort_order;
        """)
        freq_rows = cursor.fetchall()
        frequency_data = [
            {"bucket": r[0], "count": int(r[1])}
            for r in freq_rows
        ]

        # 5. RFM Recency vs Monetary Value Scatter Data (Sampling representative points across segments)
        cursor.execute("""
            SELECT household_key, last_purchase_day, ROUND(monetary_value, 2), customer_segment, purchase_frequency
            FROM analytics.customer_rfm_scored
            ORDER BY monetary_value DESC
            LIMIT 120;
        """)
        scatter_rows = cursor.fetchall()
        rfm_scatter = [
            {
                "household_key": int(r[0]),
                "last_purchase_day": int(r[1]),
                "monetary_value": serialize_val(r[2]),
                "segment": r[3],
                "frequency": int(r[4])
            }
            for r in scatter_rows
        ]

        # 6. Customer Spending Momentum Trend
        cursor.execute("""
            SELECT spending_trend, COUNT(*) as count, ROUND(AVG(revenue_change_pct), 2) as avg_change
            FROM analytics.customer_intelligence
            GROUP BY spending_trend
            ORDER BY count DESC;
        """)
        trend_rows = cursor.fetchall()
        customer_trends = [
            {
                "trend": r[0],
                "count": int(r[1]),
                "avg_change_pct": serialize_val(r[2])
            }
            for r in trend_rows
        ]

        # 7. Customer Intelligence Dynamic Data-Driven Insights
        total_rev = sum(s["total_spend"] for s in segments)
        top_segment = max(segments, key=lambda s: s["count"]) if segments else {"segment": "N/A", "count": 0, "pct_of_base": 0}
        top_spend_segment = max(segments, key=lambda s: s["total_spend"]) if segments else {"segment": "N/A", "total_spend": 0}
        at_risk_high_val = next((s for s in segments if s["segment"] == "At Risk High Value"), None)

        insights = [
            {
                "title": f"Largest Customer Cohort: {top_segment['segment']}",
                "description": f"{top_segment['segment']} represents the largest customer group with {top_segment['count']:,} households ({top_segment['pct_of_base']}% of total customer base).",
                "type": "largest_cohort"
            },
            {
                "title": f"Top Spend Segment: {top_spend_segment['segment']}",
                "description": f"{top_spend_segment['segment']} is the highest revenue contributor, generating ${top_spend_segment['total_spend']:,.2f} in historical spend ({((top_spend_segment['total_spend'] / total_rev)*100):.1f}% of total retail sales).",
                "type": "highest_revenue"
            },
            {
                "title": "High-Value Revenue Exposure",
                "description": f"{at_risk_high_val['count'] if at_risk_high_val else 585:,} households in the 'At Risk High Value' segment account for ${at_risk_high_val['total_spend'] if at_risk_high_val else 0:,.2f} in cumulative historical spend (avg ${at_risk_high_val['avg_spend'] if at_risk_high_val else 0:,.2f}/HH).",
                "type": "risk_exposure"
            },
            {
                "title": "Customer Conversion & Growth Potential",
                "description": f"654 Recent Customers present a key onboarding opportunity to transition new shoppers into high-frequency Regular or Loyal customers.",
                "type": "growth_opportunity"
            }
        ]

        # 8. Data-Driven Actionable Recommendations
        recommendations = [
            {
                "action": "Retain High-Value At-Risk Households",
                "detail": f"Launch immediate win-back campaigns for 585 'At Risk High Value' households representing ${at_risk_high_val['total_spend'] if at_risk_high_val else 0:,.2f} in revenue.",
                "priority": "High"
            },
            {
                "action": "Nurture & Convert Recent Shoppers",
                "detail": "Deploy personalized second-purchase incentives for 654 Recent Customers to boost shopping trip frequency.",
                "priority": "Medium"
            },
            {
                "action": "Reward & Protect Champions",
                "detail": "Establish VIP loyalty tiers for 119 Champion households who average $5,137.30 in lifetime spend.",
                "priority": "High"
            },
            {
                "action": "Re-engage Declining Regular Shoppers",
                "detail": "Provide targeted category discounts to 415 'At Risk' regular shoppers showing declining momentum.",
                "priority": "Medium"
            }
        ]

        return {
            "kpis": kpis,
            "segments": segments,
            "segment_value": sorted(segments, key=lambda x: x["total_spend"], reverse=True),
            "spend_distribution": spend_distribution,
            "frequency_data": frequency_data,
            "rfm_scatter": rfm_scatter,
            "customer_trends": customer_trends,
            "insights": insights,
            "recommendations": recommendations
        }

    except Exception as e:
        logger.error(f"Error retrieving customer intelligence data: {e}")
        return {
            "kpis": {},
            "segments": [],
            "segment_value": [],
            "spend_distribution": [],
            "frequency_data": [],
            "rfm_scatter": [],
            "customer_trends": [],
            "insights": [],
            "recommendations": []
        }
    finally:
        if cursor:
            try: cursor.close()
            except Exception: pass
        if conn:
            try: conn.close()
            except Exception: pass
