from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SKU, Transaction, get_db
from layers.layer2_pattern_spotter import detect_dead_stock

router = APIRouter(tags=["inventory"])


def _item(sku, business_id, db):
    flag = detect_dead_stock(business_id, sku.id, db)
    sales = db.query(Transaction).filter_by(business_id=business_id, sku_id=sku.id, type="revenue", category="sales").all()
    daily = len(sales) / max(1, len({t.date for t in db.query(Transaction).filter_by(business_id=business_id, sku_id=sku.id).all()}))
    days = sku.current_stock / max(daily, 0.01)
    return {"id": sku.id, "sku_code": sku.sku_code, "product_name": sku.product_name, "current_stock": sku.current_stock, "reorder_point": sku.reorder_point, "is_flagged": flag["is_flagged"], "flag_reason": flag["flag_reason"], "days_to_stockout": (date.today() + timedelta(days=days)).isoformat()}


@router.get("/inventory")
def inventory(business_id: int, search: str = "", db: Session = Depends(get_db)):
    skus = db.query(SKU).filter_by(business_id=business_id).all()
    if search: skus = [s for s in skus if search.lower() in f"{s.sku_code} {s.product_name}".lower()]
    return [_item(s, business_id, db) for s in skus]


@router.get("/inventory/{sku_id}")
def inventory_detail(sku_id: int, business_id: int, db: Session = Depends(get_db)):
    sku = db.get(SKU, sku_id)
    if not sku or sku.business_id != business_id: raise HTTPException(404, "SKU not found")
    item = _item(sku, business_id, db)
    item["reorder_recommendation"] = {"should_reorder": sku.current_stock <= sku.reorder_point or item["is_flagged"] is False, "target_stock": max(sku.reorder_point * 2, sku.current_stock)}
    return item
