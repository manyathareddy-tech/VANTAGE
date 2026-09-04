from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session
from database import DataStatus, get_db
from layers.layer1_ledger import ingest_csv

router = APIRouter(tags=["upload"])


@router.post("/upload-csv")
def upload_csv(file: UploadFile = File(...), business_id: int = Form(...), data_type: str = Form(...), db: Session = Depends(get_db)):
    try:
        return ingest_csv(file, business_id, data_type, db)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/data-status")
def data_status(business_id: int, db: Session = Depends(get_db)):
    status = db.query(DataStatus).filter_by(business_id=business_id).first()
    if not status: raise HTTPException(status_code=404, detail="Business not found")
    return {"business_id": business_id, "last_upload_at": status.last_upload_at, "row_count": status.row_count, "is_demo_data": status.is_demo_data}
