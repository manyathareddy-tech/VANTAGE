from datetime import date
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sqlalchemy.orm import Session
from database import SKU, Transaction


def detect_dead_stock(business_id: int, sku_id: int, db: Session) -> dict:
    sku = db.get(SKU, sku_id)
    if not sku or sku.business_id != business_id:
        raise ValueError("SKU not found for business")
    sales = db.query(Transaction).filter(Transaction.business_id == business_id, Transaction.sku_id == sku_id, Transaction.type == "revenue", Transaction.category == "sales").order_by(Transaction.date).all()
    dates = [x.date for x in sales]
    today = max([x.date for x in db.query(Transaction).filter_by(business_id=business_id).all()] or [date.today()])
    days_since = (today - dates[-1]).days if dates else 999
    if len(dates) < 5:
        threshold, method = 30.0, "fixed_30_day_rule"
    else:
        gaps = np.diff([d.toordinal() for d in dates])
        threshold, method = float(pd.Series(gaps).quantile(0.90)), "sku_own_90th_percentile"
    return {"sku_id": sku_id, "days_since_last_sale": days_since, "threshold_days": threshold, "is_flagged": days_since > threshold, "flag_reason": f"No sale for {days_since} days; threshold is {threshold:.1f} days ({method})."}


def detect_anomalies(business_id: int, db: Session) -> list[dict]:
    txs = db.query(Transaction).filter_by(business_id=business_id).all()
    by_category = {}
    for tx in txs:
        by_category.setdefault(tx.category, []).append(tx)
    output = []
    for category, items in by_category.items():
        if len(items) < 5:
            continue
        values = np.array([[x.amount] for x in items])
        labels = IsolationForest(contamination="auto", random_state=42).fit_predict(values)
        for tx, label in zip(items, labels):
            if label == -1:
                output.append({"transaction_id": tx.id, "reason": f"{tx.category} amount {tx.amount:.2f} is anomalous relative to its category."})
    return output
