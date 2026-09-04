from datetime import date, datetime
from pydantic import BaseModel, Field


class AuthStartRequest(BaseModel):
    business_name: str = Field(min_length=1)


class AuthStartResponse(BaseModel):
    business_id: int


class ChatRequest(BaseModel):
    business_id: int
    question: str = Field(min_length=1)


class SuggestionActionResponse(BaseModel):
    id: int
    status: str


class DataStatusResponse(BaseModel):
    business_id: int
    last_upload_at: datetime | None
    row_count: int
    is_demo_data: bool


class ForecastPoint(BaseModel):
    date: date
    yhat: float
    yhat_lower: float
    yhat_upper: float


class ForecastResponse(BaseModel):
    business_id: int
    sku_id: int | None
    historical: list[dict]
    forecast: list[ForecastPoint]
    model_used: str
    mape: float | None
    confidence_score: float
    confidence_breakdown: dict
    validation_passed: bool
    failed_checks: list[str]
    is_cold_start: bool
    explanation: str
