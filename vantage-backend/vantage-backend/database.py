from datetime import date, datetime
from enum import Enum
from typing import Generator

from sqlalchemy import Boolean, Date, DateTime, Float, ForeignKey, Integer, String, Text, create_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship, sessionmaker

from config import DATABASE_URL

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    pass


class TransactionType(str, Enum):
    revenue = "revenue"
    expense = "expense"


class TransactionCategory(str, Enum):
    sales = "sales"
    returns = "returns"
    discounts = "discounts"
    other_income = "other_income"
    raw_materials = "raw_materials"
    packaging = "packaging"
    manufacturing_overhead = "manufacturing_overhead"
    salaries = "salaries"
    rent = "rent"
    utilities = "utilities"
    transportation = "transportation"
    marketing_ads = "marketing_ads"
    insurance = "insurance"
    maintenance = "maintenance"
    software = "software"
    professional_fees = "professional_fees"
    loan_principal = "loan_principal"
    loan_interest = "loan_interest"
    investment_inflow = "investment_inflow"
    shareholder_withdrawal = "shareholder_withdrawal"
    taxes = "taxes"


class Business(Base):
    __tablename__ = "businesses"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    transactions: Mapped[list["Transaction"]] = relationship(back_populates="business", cascade="all, delete-orphan")
    skus: Mapped[list["SKU"]] = relationship(back_populates="business", cascade="all, delete-orphan")


class SKU(Base):
    __tablename__ = "skus"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    business_id: Mapped[int] = mapped_column(ForeignKey("businesses.id"), index=True)
    sku_code: Mapped[str] = mapped_column(String(100), index=True)
    product_name: Mapped[str] = mapped_column(String(255))
    current_stock: Mapped[float] = mapped_column(Float, default=0)
    reorder_point: Mapped[float] = mapped_column(Float, default=0)
    business: Mapped[Business] = relationship(back_populates="skus")
    transactions: Mapped[list["Transaction"]] = relationship(back_populates="sku")


class Transaction(Base):
    __tablename__ = "transactions"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    business_id: Mapped[int] = mapped_column(ForeignKey("businesses.id"), index=True)
    date: Mapped[date] = mapped_column(Date, index=True)
    amount: Mapped[float] = mapped_column(Float)
    type: Mapped[str] = mapped_column(String(20))
    category: Mapped[str] = mapped_column(String(50))
    sku_id: Mapped[int | None] = mapped_column(ForeignKey("skus.id"), nullable=True)
    description: Mapped[str] = mapped_column(Text, default="")
    business: Mapped[Business] = relationship(back_populates="transactions")
    sku: Mapped[SKU | None] = relationship(back_populates="transactions")


class Forecast(Base):
    __tablename__ = "forecasts"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    business_id: Mapped[int] = mapped_column(ForeignKey("businesses.id"), index=True)
    sku_id: Mapped[int | None] = mapped_column(ForeignKey("skus.id"), nullable=True)
    forecast_date: Mapped[date] = mapped_column(Date)
    historical_json: Mapped[str] = mapped_column(Text, default="[]")
    forecast_json: Mapped[str] = mapped_column(Text, default="[]")
    confidence_score: Mapped[float] = mapped_column(Float, default=0)
    confidence_breakdown_json: Mapped[str] = mapped_column(Text, default="{}")
    validation_passed: Mapped[bool] = mapped_column(Boolean, default=False)
    is_cold_start: Mapped[bool] = mapped_column(Boolean, default=False)
    explanation_text: Mapped[str] = mapped_column(Text, default="")
    model_used: Mapped[str] = mapped_column(String(100), default="baseline")


class Suggestion(Base):
    __tablename__ = "suggestions"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    business_id: Mapped[int] = mapped_column(ForeignKey("businesses.id"), index=True)
    category: Mapped[str] = mapped_column(String(100))
    text: Mapped[str] = mapped_column(Text)
    confidence_badge: Mapped[str] = mapped_column(String(30), default="medium")
    referenced_numbers_json: Mapped[str] = mapped_column(Text, default="[]")
    status: Mapped[str] = mapped_column(String(20), default="pending")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class DataStatus(Base):
    __tablename__ = "data_status"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    business_id: Mapped[int] = mapped_column(ForeignKey("businesses.id"), unique=True, index=True)
    last_upload_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    row_count: Mapped[int] = mapped_column(Integer, default=0)
    is_demo_data: Mapped[bool] = mapped_column(Boolean, default=False)


def init_db() -> None:
    Base.metadata.create_all(bind=engine)


def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
