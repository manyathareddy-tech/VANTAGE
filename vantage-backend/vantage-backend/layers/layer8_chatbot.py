import json
from sqlalchemy.orm import Session
from database import Business, Forecast, SKU, Transaction
from layers.layer2_pattern_spotter import detect_dead_stock
from layers.layer6_llm_narrative import _complete
from layers.layer7_validator_gate import validate_suggestion_numbers

INSUFFICIENT = "I don't have enough company data to answer that reliably yet. Please upload more transaction history."


def check_data_sufficiency(business_id: int, db: Session) -> bool:
    txs = db.query(Transaction).filter_by(business_id=business_id).all()
    days = len({t.date for t in txs})
    sku_ok = any(sum(1 for t in txs if t.sku_id == s.id and t.type == "revenue" and t.category == "sales") >= 5 for s in db.query(SKU).filter_by(business_id=business_id).all())
    return days >= 14 and sku_ok


def _context(business_id: int, db: Session) -> tuple[dict, list[float]]:
    txs = db.query(Transaction).filter_by(business_id=business_id).all()
    revenue = sum(t.amount for t in txs if t.type == "revenue")
    expenses = {}
    for t in txs:
        if t.type == "expense": expenses[t.category] = expenses.get(t.category, 0) + t.amount
    forecasts = db.query(Forecast).filter_by(business_id=business_id).order_by(Forecast.forecast_date.desc()).first()
    flagged = [detect_dead_stock(business_id, s.id, db) for s in db.query(SKU).filter_by(business_id=business_id).all()]
    flagged = [x for x in flagged if x["is_flagged"]]
    context = {"current_cash": round(sum(t.amount if t.type == "revenue" else -t.amount for t in txs), 2), "revenue_total": round(revenue, 2), "expense_breakdown": expenses, "latest_forecast": json.loads(forecasts.forecast_json) if forecasts else [], "flagged_inventory": flagged}
    nums = [float(context["current_cash"]), float(context["revenue_total"])] + [float(v) for v in expenses.values()]
    return context, nums


def answer_question(business_id: int, question: str, db: Session) -> str:
    if not check_data_sufficiency(business_id, db): return INSUFFICIENT
    context, allowed = _context(business_id, db)
    prompt = f"Answer the question in plain English using ONLY this context and its numbers. Do not invent or calculate numbers. Question: {question}\nContext: {json.dumps(context, default=str)}"
    answer = _complete(prompt)
    valid, _ = validate_suggestion_numbers(answer, allowed)
    if valid and answer: return answer
    return "Based on the available records, the dashboard has enough history for a reliable analysis, but no grounded narrative was generated."
