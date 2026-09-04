from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from layers.layer8_chatbot import answer_question
from schemas import ChatRequest

router = APIRouter(prefix="/chatbot", tags=["chatbot"])


@router.post("/ask")
def ask(payload: ChatRequest, db: Session = Depends(get_db)):
    return {"answer": answer_question(payload.business_id, payload.question, db)}
