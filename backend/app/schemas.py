from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime, date

# --- Token Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
    user_id: Optional[int] = None

# --- User Schemas ---
class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    password: Optional[str] = None

class UserOut(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# --- Journal Schemas ---
class JournalBase(BaseModel):
    title: str
    content: str
    date: date
    mood: Optional[str] = None
    tags: Optional[str] = None

class JournalCreate(JournalBase):
    pass

class JournalUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    date: Optional[date] = None
    mood: Optional[str] = None
    tags: Optional[str] = None

class JournalOut(JournalBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# --- Goal Schemas ---
class GoalBase(BaseModel):
    title: str
    description: Optional[str] = None
    category: str # Learning, Career, Health, Finance, Personal
    target_date: Optional[date] = None
    progress: int = Field(default=0, ge=0, le=100)

class GoalCreate(GoalBase):
    pass

class GoalUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    target_date: Optional[date] = None
    progress: Optional[int] = Field(default=None, ge=0, le=100)
    is_completed: Optional[bool] = None
    is_archived: Optional[bool] = None

class GoalOut(GoalBase):
    id: int
    user_id: int
    is_completed: bool
    is_archived: bool
    created_at: datetime

    class Config:
        from_attributes = True

# --- Habit Log Schemas ---
class HabitLogBase(BaseModel):
    date: date
    completed: bool = True

class HabitLogCreate(HabitLogBase):
    pass

class HabitLogOut(HabitLogBase):
    id: int
    habit_id: int

    class Config:
        from_attributes = True

# --- Habit Schemas ---
class HabitBase(BaseModel):
    name: str
    description: Optional[str] = None
    frequency: str = "daily" # daily, weekly

class HabitCreate(HabitBase):
    pass

class HabitUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    frequency: Optional[str] = None

class HabitOut(HabitBase):
    id: int
    user_id: int
    created_at: datetime
    logs: List[HabitLogOut] = []

    class Config:
        from_attributes = True

# --- Mood Log Schemas ---
class MoodLogBase(BaseModel):
    mood: str
    date: date
    note: Optional[str] = None

class MoodLogCreate(MoodLogBase):
    pass

class MoodLogOut(MoodLogBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True
