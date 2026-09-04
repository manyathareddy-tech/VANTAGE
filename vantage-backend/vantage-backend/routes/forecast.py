import json
from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import Forecast, SKU, Transaction, get_db
from layers.layer3_model_tournament import run_forecast
from layers.layer4_fact_checker import validate_forecast
from layers.layer5_confidence import calculate_confidence
from layers.layer6_llm_narrative import generate_forecast_explanation

router = APIRouter(tags=["forecast"])


def _build(business_id, sku_id, period, db):
    result = run_forecast(business_id, sku_id, period, db)
    validation = validate_forecast(result)
    agreement = 100.0 if len(set(round(v, 4) for v in result.get("model_mapes", {}).values())) <= 1 else max(0.0, 100.0 - (max(result.get("model_mapes", {}).values(), default=100) - min(result.get("model_mapes", {}).values(), default=100)))
    values = [p["yhat"] for p in result["forecast"]]
    widths = [p["yhat_upper"] - p["yhat_lower"] for p in result["forecast"]]
    tightness = max(0.0, 100.0 - (sum(widths) / max(1, len(widths)) / max(1.0, abs(sum(values) / max(1, len(values)))) * 100))
    confidence = calculate_confidence(100 if validation["validation_passed"] else 60, result.get("mape"), agreement, tightness)
    result.update(validation, confidence_score=confidence["score"], confidence_breakdown=confidence["breakdown"])
    result["explanation"] = generate_forecast_explanation(result) or f"The {result['model_used']} forecast estimates the next {period} days from the available history."
    existing = db.query(Forecast).filter_by(business_id=business_id, sku_id=sku_id).first()
    if not existing: existing = Forecast(business_id=business_id, sku_id=sku_id); db.add(existing)
    existing.forecast_date = date.today(); existing.historical_json = json.dumps(result["historical"]); existing.forecast_json = json.dumps(result["forecast"]); existing.confidence_score = result["confidence_score"]; existing.confidence_breakdown_json = json.dumps(result["confidence_breakdown"]); existing.validation_passed = result["validation_passed"]; existing.is_cold_start = result["is_cold_start"]; existing.explanation_text = result["explanation"]; existing.model_used = result["model_used"]
    db.commit()
    return result


@router.get("/forecast")
def company_forecast(business_id: int, period: int = 30, db: Session = Depends(get_db)):
    return _build(business_id, None, period, db)


@router.get("/forecast/sku/{sku_id}")
def sku_forecast(sku_id: int, business_id: int, period: int = 30, db: Session = Depends(get_db)):
    sku = db.get(SKU, sku_id)
    if not sku or sku.business_id != business_id: raise HTTPException(404, "SKU not found")
    result = _build(business_id, sku_id, period, db)
    avg_daily = sum(t.amount for t in db.query(Transaction).filter_by(business_id=business_id, sku_id=sku_id, type="revenue").all()) / max(1, len({t.date for t in db.query(Transaction).filter_by(business_id=business_id, sku_id=sku_id).all()}))
    daily = max(0.01, sum(p["yhat"] for p in result["forecast"]) / max(1, len(result["forecast"])))
    stockout_days = sku.current_stock / daily
    result.update({"sku_id": sku_id, "estimated_stockout_date": (date.today() + timedelta(days=stockout_days)).isoformat(), "revenue_impact_if_stockout": round(avg_daily * stockout_days, 2)})
    return result
