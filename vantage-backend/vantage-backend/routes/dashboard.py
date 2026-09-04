from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import Business, Forecast, SKU, Suggestion, Transaction, get_db
from layers.layer2_pattern_spotter import detect_dead_stock

router = APIRouter(tags=["dashboard"])


@router.get("/dashboard-summary")
def dashboard_summary(business_id: int, db: Session = Depends(get_db)):
    if not db.get(Business, business_id): raise HTTPException(404, "Business not found")
    txs = db.query(Transaction).filter_by(business_id=business_id).all()
    cash = sum(t.amount if t.type == "revenue" else -t.amount for t in txs)
    recent = [t for t in txs if t.date and (max((x.date for x in txs), default=datetime.utcnow().date()) - t.date).days < 30]
    prior = [t for t in txs if t.date and 30 <= (max((x.date for x in txs), default=datetime.utcnow().date()) - t.date).days < 60]
    rev_recent = sum(t.amount for t in recent if t.type == "revenue"); rev_prior = sum(t.amount for t in prior if t.type == "revenue")
    direction = "up" if rev_recent > rev_prior else "down" if rev_recent < rev_prior else "flat"
    burn = sum(t.amount for t in recent if t.type == "expense") / max(1, len({t.date for t in recent})) * 30
    flagged = [detect_dead_stock(business_id, s.id, db) for s in db.query(SKU).filter_by(business_id=business_id).all()]
    flagged = [x for x in flagged if x["is_flagged"]]
    latest = db.query(Forecast).filter_by(business_id=business_id).order_by(Forecast.forecast_date.desc()).first()
    confidence = latest.confidence_score if latest else 0
    color = "green" if latest and latest.validation_passed and confidence >= 70 else "amber" if confidence >= 40 else "red"
    suggestions = db.query(Suggestion).filter_by(business_id=business_id, status="pending").order_by(Suggestion.created_at.desc()).limit(3).all()
    return {"cash_position": round(cash, 2), "cash_trend_direction": direction, "status_color": color, "burn_rate": round(burn, 2), "revenue_trend": {"recent": round(rev_recent, 2), "prior": round(rev_prior, 2), "direction": direction}, "inventory_alert_count": len(flagged), "top_suggestions": [{"id": s.id, "category": s.category, "text": s.text, "confidence_badge": s.confidence_badge} for s in suggestions], "last_updated": datetime.utcnow()}
