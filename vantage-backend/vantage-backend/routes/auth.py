from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import Business, DataStatus, get_db
from schemas import AuthStartRequest, AuthStartResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/start", response_model=AuthStartResponse)
def start_auth(payload: AuthStartRequest, db: Session = Depends(get_db)):
    business = db.query(Business).filter(Business.name == payload.business_name.strip()).first()
    if not business:
        business = Business(name=payload.business_name.strip())
        db.add(business)
        db.flush()
        db.add(DataStatus(business_id=business.id))
        db.commit()
    return {"business_id": business.id}
