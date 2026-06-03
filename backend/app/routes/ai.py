from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict, Any

from app.database import get_db
from app.models import User
from app.services.auth import get_current_user
from app.services.ai import (
    generate_twin_response,
    generate_evolution_report,
    generate_timeline_chapters,
    generate_future_projections
)

router = APIRouter(prefix="/ai", tags=["AI Twin Operations"])

class ChatMessage(BaseModel):
    sender: str  # "user" or "twin"
    text: str

class ChatRequest(BaseModel):
    message: str
    chat_history: List[ChatMessage]

@router.post("/chat")
def chat_with_twin(
    req: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    history_list = [{"sender": msg.sender, "text": msg.text} for msg in req.chat_history]
    response_text = generate_twin_response(req.message, history_list, current_user.id, db)
    return {"response": response_text}

@router.get("/evolution")
def get_evolution_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    report = generate_evolution_report(current_user.id, db)
    return report

@router.get("/timeline")
def get_timeline_chapters_list(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    chapters = generate_timeline_chapters(current_user.id, db)
    return chapters

@router.get("/predictor")
def get_future_projections_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    projections = generate_future_projections(current_user.id, db)
    return projections
