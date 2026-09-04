import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import Suggestion, get_db
from layers.layer6_llm_narrative import generate_and_save_suggestions

router = APIRouter(tags=["suggestions"])


@router.post("/suggestions/generate")
def generate(business_id: int, db: Session = Depends(get_db)):
    """Generate AI suggestions for all categories with enough transaction data."""
    created = generate_and_save_suggestions(business_id, db)
    return {"generated": len(created)}


@router.get("/suggestions")
def suggestions(
    business_id: int, 
    category: str | None = None, 
    db: Session = Depends(get_db)
):
    """Fetch all suggestions for a business, optionally filtered by category."""
    query = db.query(Suggestion).filter_by(business_id=business_id)
    if category:
        query = query.filter_by(category=category)
    
    grouped = {}
    for s in query.order_by(Suggestion.created_at.desc()).all():
        grouped.setdefault(s.category, []).append({
            "id": s.id, 
            "text": s.text, 
            "confidence_badge": s.confidence_badge, 
            "referenced_numbers": json.loads(s.referenced_numbers_json), 
            "status": s.status, 
            "created_at": s.created_at
        })
    return grouped


def _set_status(suggestion_id, status, db):
    """Helper function to update suggestion status."""
    s = db.get(Suggestion, suggestion_id)
    if not s:
        raise HTTPException(404, "Suggestion not found")
    s.status = status
    db.commit()
    return {"id": s.id, "status": s.status}


@router.post("/suggestions/{suggestion_id}/approve")
def approve(suggestion_id: int, db: Session = Depends(get_db)):
    """Approve a suggestion."""
    return _set_status(suggestion_id, "approved", db)


@router.post("/suggestions/{suggestion_id}/dismiss")
def dismiss(suggestion_id: int, db: Session = Depends(get_db)):
    """Dismiss a suggestion."""
    return _set_status(suggestion_id, "dismissed", db)