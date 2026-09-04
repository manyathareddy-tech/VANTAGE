from datetime import datetime
from io import BytesIO
import pandas as pd
from sqlalchemy.orm import Session
from database import Business, DataStatus, SKU, Transaction

TRANSACTION_COLUMNS = {"date", "amount", "type", "category", "sku_id", "description"}
INVENTORY_COLUMNS = {"sku_code", "product_name", "stock", "reorder_point"}


def ingest_csv(file, business_id: int, data_type: str, db: Session) -> dict:
    if data_type not in {"transactions", "inventory"}:
        raise ValueError("data_type must be 'transactions' or 'inventory'")
    if db.get(Business, business_id) is None:
        raise ValueError(f"Business {business_id} does not exist")
    content = file.file.read() if hasattr(file, "read") else file
    df = pd.read_csv(BytesIO(content))
    required = TRANSACTION_COLUMNS if data_type == "transactions" else INVENTORY_COLUMNS
    missing = sorted(required - set(df.columns))
    if missing:
        raise ValueError(f"Missing required columns: {', '.join(missing)}")
    df = df.fillna({"sku_id": None, "description": "", "type": "expense", "category": "other_income"})
    inserted = 0
    if data_type == "inventory":
        for _, row in df.iterrows():
            sku = db.query(SKU).filter_by(business_id=business_id, sku_code=str(row.sku_code)).first()
            if not sku:
                sku = SKU(business_id=business_id, sku_code=str(row.sku_code), product_name=str(row.product_name), current_stock=float(row.stock), reorder_point=float(row.reorder_point))
                db.add(sku)
            else:
                sku.product_name = str(row.product_name)
                sku.current_stock = float(row.stock)
                sku.reorder_point = float(row.reorder_point)
            inserted += 1
    else:
        for _, row in df.iterrows():
            tx_date = pd.to_datetime(row.date, errors="coerce")
            if pd.isna(tx_date):
                raise ValueError(f"Invalid date value: {row.date}")
            tx_type = str(row.type).lower()
            if tx_type not in {"revenue", "expense"}:
                raise ValueError(f"Invalid transaction type: {tx_type}")
            sku_id = None if pd.isna(row.sku_id) or str(row.sku_id).strip() in {"", "nan"} else int(float(row.sku_id))
            db.add(Transaction(business_id=business_id, date=tx_date.date(), amount=abs(float(row.amount)), type=tx_type, category=str(row.category), sku_id=sku_id, description=str(row.description or "")))
            inserted += 1
    status = db.query(DataStatus).filter_by(business_id=business_id).first()
    if not status:
        status = DataStatus(business_id=business_id)
        db.add(status)
    status.last_upload_at = datetime.utcnow()
    status.row_count += inserted
    status.is_demo_data = False
    db.commit()
    return {"inserted": inserted, "data_type": data_type, "business_id": business_id}
