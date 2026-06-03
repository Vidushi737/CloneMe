from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models import User, Goal
from app.schemas import GoalCreate, GoalOut, GoalUpdate
from app.services.auth import get_current_user

router = APIRouter(prefix="/goals", tags=["Goals"])

@router.post("/", response_model=GoalOut, status_code=status.HTTP_201_CREATED)
def create_goal(
    goal_in: GoalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_goal = Goal(
        user_id=current_user.id,
        title=goal_in.title,
        description=goal_in.description,
        category=goal_in.category,
        target_date=goal_in.target_date,
        progress=goal_in.progress,
        is_completed=False,
        is_archived=False
    )
    db.add(db_goal)
    db.commit()
    db.refresh(db_goal)
    return db_goal

@router.get("/", response_model=List[GoalOut])
def read_goals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Goal).filter(Goal.user_id == current_user.id).all()

@router.get("/{goal_id}", response_model=GoalOut)
def read_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")
    return goal

@router.put("/{goal_id}", response_model=GoalOut)
def update_goal(
    goal_id: int,
    goal_in: GoalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")
        
    if goal_in.title is not None:
        goal.title = goal_in.title
    if goal_in.description is not None:
        goal.description = goal_in.description
    if goal_in.category is not None:
        goal.category = goal_in.category
    if goal_in.target_date is not None:
        goal.target_date = goal_in.target_date
    if goal_in.progress is not None:
        goal.progress = goal_in.progress
        # Auto-complete if progress reaches 100
        if goal.progress >= 100:
            goal.is_completed = True
    if goal_in.is_completed is not None:
        goal.is_completed = goal_in.is_completed
        if goal.is_completed:
            goal.progress = 100
    if goal_in.is_archived is not None:
        goal.is_archived = goal_in.is_archived
        
    db.commit()
    db.refresh(goal)
    return goal

@router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")
        
    db.delete(goal)
    db.commit()
    return None
