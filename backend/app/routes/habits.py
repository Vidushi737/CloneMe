from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import date
from pydantic import BaseModel

from app.database import get_db
from app.models import User, Habit, HabitLog
from app.schemas import HabitCreate, HabitOut, HabitUpdate, HabitLogOut
from app.services.auth import get_current_user

router = APIRouter(prefix="/habits", tags=["Habits"])

class ToggleLogRequest(BaseModel):
    date: date

@router.post("/", response_model=HabitOut, status_code=status.HTTP_201_CREATED)
def create_habit(
    habit_in: HabitCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_habit = Habit(
        user_id=current_user.id,
        name=habit_in.name,
        description=habit_in.description,
        frequency=habit_in.frequency
    )
    db.add(db_habit)
    db.commit()
    db.refresh(db_habit)
    return db_habit

@router.get("/", response_model=List[HabitOut])
def read_habits(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Habit).filter(Habit.user_id == current_user.id).all()

@router.put("/{habit_id}", response_model=HabitOut)
def update_habit(
    habit_id: int,
    habit_in: HabitUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    habit = db.query(Habit).filter(Habit.id == habit_id, Habit.user_id == current_user.id).first()
    if not habit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Habit not found")
        
    if habit_in.name is not None:
        habit.name = habit_in.name
    if habit_in.description is not None:
        habit.description = habit_in.description
    if habit_in.frequency is not None:
        habit.frequency = habit_in.frequency
        
    db.commit()
    db.refresh(habit)
    return habit

@router.delete("/{habit_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_habit(
    habit_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    habit = db.query(Habit).filter(Habit.id == habit_id, Habit.user_id == current_user.id).first()
    if not habit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Habit not found")
        
    db.delete(habit)
    db.commit()
    return None

@router.post("/{habit_id}/toggle", response_model=List[HabitLogOut])
def toggle_habit_log(
    habit_id: int,
    req: ToggleLogRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify habit belongs to user
    habit = db.query(Habit).filter(Habit.id == habit_id, Habit.user_id == current_user.id).first()
    if not habit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Habit not found")
        
    # Check if a log exists for this date
    existing_log = db.query(HabitLog).filter(
        HabitLog.habit_id == habit_id,
        HabitLog.date == req.date
    ).first()
    
    if existing_log:
        # Delete log if it exists (untoggle)
        db.delete(existing_log)
    else:
        # Create log if it doesn't exist
        new_log = HabitLog(
            habit_id=habit_id,
            date=req.date,
            completed=True
        )
        db.add(new_log)
        
    db.commit()
    
    # Return all logs for this habit
    return db.query(HabitLog).filter(HabitLog.habit_id == habit_id).all()
