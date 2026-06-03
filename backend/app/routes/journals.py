from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from app.database import get_db
from app.models import User, Journal, MoodLog
from app.schemas import JournalCreate, JournalOut, JournalUpdate
from app.services.auth import get_current_user
from app.services.ai import analyze_journal, upsert_journal_vector, delete_journal_vector

router = APIRouter(prefix="/journals", tags=["Journals"])

@router.post("/", response_model=JournalOut, status_code=status.HTTP_201_CREATED)
def create_journal(
    journal_in: JournalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. AI Analysis (Mood & Tags auto-detection if they are not explicitly provided)
    ai_analysis = analyze_journal(journal_in.content)
    detected_mood = journal_in.mood or ai_analysis.get("mood", "Neutral")
    
    # Format tags: comma-separated list
    detected_tags = journal_in.tags
    if not detected_tags:
        tags_list = ai_analysis.get("tags", ["personal"])
        detected_tags = ", ".join(tags_list)
        
    # 2. Save Journal to Database
    db_journal = Journal(
        user_id=current_user.id,
        title=journal_in.title,
        content=journal_in.content,
        date=journal_in.date,
        mood=detected_mood,
        tags=detected_tags
    )
    db.add(db_journal)
    
    # 3. Synchronize Mood Log for mood analytics
    # Check if a mood log already exists for this user on this day
    existing_mood_log = db.query(MoodLog).filter(
        MoodLog.user_id == current_user.id,
        MoodLog.date == journal_in.date
    ).first()
    
    if not existing_mood_log:
        new_mood_log = MoodLog(
            user_id=current_user.id,
            mood=detected_mood,
            date=journal_in.date,
            note=f"Auto-logged from journal: '{journal_in.title}'"
        )
        db.add(new_mood_log)
    else:
        # Update mood to match the latest journal analysis
        existing_mood_log.mood = detected_mood
        existing_mood_log.note = f"Updated from journal: '{journal_in.title}'"
        
    db.commit()
    db.refresh(db_journal)
    
    # 4. Upsert vector to ChromaDB vector store
    upsert_journal_vector(
        journal_id=db_journal.id,
        user_id=current_user.id,
        text=db_journal.content,
        date_str=db_journal.date.strftime("%Y-%m-%d")
    )
    
    return db_journal

@router.get("/", response_model=List[JournalOut])
def read_journals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Journal).filter(Journal.user_id == current_user.id).order_by(Journal.date.desc()).all()

@router.get("/{journal_id}", response_model=JournalOut)
def read_journal(
    journal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    journal = db.query(Journal).filter(Journal.id == journal_id, Journal.user_id == current_user.id).first()
    if not journal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Journal entry not found")
    return journal

@router.put("/{journal_id}", response_model=JournalOut)
def update_journal(
    journal_id: int,
    journal_in: JournalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    journal = db.query(Journal).filter(Journal.id == journal_id, Journal.user_id == current_user.id).first()
    if not journal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Journal entry not found")
        
    # Check if content is updated to trigger re-vectorization & re-analysis
    content_updated = journal_in.content is not None and journal_in.content != journal.content
    
    # Apply updates
    if journal_in.title is not None:
        journal.title = journal_in.title
    if journal_in.content is not None:
        journal.content = journal_in.content
    if journal_in.date is not None:
        journal.date = journal_in.date
    if journal_in.mood is not None:
        journal.mood = journal_in.mood
    if journal_in.tags is not None:
        journal.tags = journal_in.tags
        
    if content_updated:
        # Re-run AI analysis if content changed and mood/tags weren't explicitly set in update request
        ai_analysis = analyze_journal(journal.content)
        if journal_in.mood is None:
            journal.mood = ai_analysis.get("mood", journal.mood)
        if journal_in.tags is None:
            tags_list = ai_analysis.get("tags", ["personal"])
            journal.tags = ", ".join(tags_list)
            
    db.commit()
    db.refresh(journal)
    
    # Sync ChromaDB vector
    if content_updated or journal_in.date is not None:
        upsert_journal_vector(
            journal_id=journal.id,
            user_id=current_user.id,
            text=journal.content,
            date_str=journal.date.strftime("%Y-%m-%d")
        )
        
    return journal

@router.delete("/{journal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_journal(
    journal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    journal = db.query(Journal).filter(Journal.id == journal_id, Journal.user_id == current_user.id).first()
    if not journal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Journal entry not found")
        
    # Delete database record
    db.delete(journal)
    db.commit()
    
    # Delete ChromaDB vector
    delete_journal_vector(journal_id)
    
    return None
