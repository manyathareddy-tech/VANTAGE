from datetime import date, timedelta
import random
from database import Business, DataStatus, SessionLocal, SKU, Transaction, init_db

CATEGORIES = ["sales", "returns", "discounts", "other_income", "raw_materials", "packaging", "manufacturing_overhead", "salaries", "rent", "utilities", "transportation", "marketing_ads", "insurance", "maintenance", "software", "professional_fees", "loan_principal", "loan_interest", "investment_inflow", "shareholder_withdrawal", "taxes"]


def generate_demo_data():
    random.seed(7); init_db(); db = SessionLocal()
    business = db.query(Business).filter_by(name="VANTAGE Demo Business").first()
    if not business:
        business = Business(name="VANTAGE Demo Business"); db.add(business); db.flush()
    db.query(Transaction).filter_by(business_id=business.id).delete(); db.query(SKU).filter_by(business_id=business.id).delete()
    skus = []
    for i in range(8):
        sku = SKU(business_id=business.id, sku_code=f"SKU-{i+1:03}", product_name="Product X" if i == 0 else f"Product {chr(65+i)}", current_stock=20 + i * 12, reorder_point=15 + i * 2)
        db.add(sku); skus.append(sku)
    db.flush()
    start = date.today() - timedelta(days=89)
    for offset in range(90):
        d = start + timedelta(days=offset)
        for sku_i, sku in enumerate(skus):
            velocity = max(0.1, 2.8 - sku_i * 0.25)
            if sku_i == 0 and offset >= 76: velocity *= (90 - offset) / 14
            if random.random() < min(0.95, velocity / 4):
                qty = max(1, int(random.gauss(velocity, 0.8)))
                db.add(Transaction(business_id=business.id, date=d, amount=qty * (35 + sku_i * 4), type="revenue", category="sales", sku_id=sku.id, description=f"Sale of {sku.product_name}"))
        for category, amount in [("raw_materials", 180), ("packaging", 55), ("salaries", 260), ("rent", 120), ("utilities", 48), ("transportation", 65), ("marketing_ads", 42), ("software", 18), ("taxes", 35)]:
            if random.random() < 0.85: db.add(Transaction(business_id=business.id, date=d, amount=max(1, random.gauss(amount, amount * .12)), type="expense", category=category, description=f"Demo {category}"))
        if offset in {10, 35, 60}: db.add(Transaction(business_id=business.id, date=d, amount=700, type="revenue", category="investment_inflow", description="Owner investment"))
        if offset in {20, 50, 80}: db.add(Transaction(business_id=business.id, date=d, amount=85, type="expense", category="loan_interest", description="Loan interest"))
        if offset % 9 == 0: db.add(Transaction(business_id=business.id, date=d, amount=25, type="revenue", category="other_income", description="Other income"))
    db.add(DataStatus(business_id=business.id, last_upload_at=None, row_count=90, is_demo_data=True))
    db.commit(); print(f"Created demo business_id={business.id} with 90 days, 8 SKUs, and all categories represented.")


if __name__ == "__main__": generate_demo_data()
