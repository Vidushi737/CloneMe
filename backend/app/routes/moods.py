from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any

from app.database import get_db
from app.models import User, MoodLog
from app.schemas import MoodLogCreate, MoodLogOut
from app.services.auth import get_current_user

router = APIRouter(prefix="/moods", tags=["Moods"])

@router.post("/", response_model=MoodLogOut, status_code=status.HTTP_201_CREATED)
def create_mood_log(
    mood_in: MoodLogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_mood = MoodLog(
        user_id=current_user.id,
        mood=mood_in.mood,
        date=mood_in.date,
        note=mood_in.note
    )
    db.add(db_mood)
    db.commit()
    db.refresh(db_mood)
    return db_mood

@router.get("/", response_model=List[MoodLogOut])
def read_mood_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(MoodLog).filter(MoodLog.user_id == current_user.id).order_by(MoodLog.date.desc()).all()

@router.get("/stats")
def read_mood_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Get mood breakdown
    counts = db.query(
        MoodLog.mood, func.count(MoodLog.id)
    ).filter(
        MoodLog.user_id == current_user.id
    ).group_by(
        MoodLog.mood
    ).all()
    
    # Format counts as a dictionary
    counts_dict = {mood: count for mood, count in counts}
    
    # Get recent mood history (last 7 logs) chronologically
    recent_logs = db.query(MoodLog).filter(
        MoodLog.user_id == current_user.id
    ).order_by(
        MoodLog.date.desc()
    ).limit(7).all()
    
    recent_list = [
        {"date": log.date.strftime("%Y-%m-%d"), "mood": log.mood, "note": log.note}
        for log in reversed(recent_logs)
    ]
    
    return {
        "counts": counts_dict,
        "recent": recent_list
    }
