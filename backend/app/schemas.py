from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# User schemas
class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_active: bool

    class Config:
        from_attributes = True

# Email schemas
class EmailBase(BaseModel):
    subject: str
    sender: str
    recipient: str
    body: str
    raw_json: Optional[str] = None

class EmailCreate(EmailBase):
    date: datetime

class Email(EmailBase):
    id: int
    date: datetime

    class Config:
        from_attributes = True

# Task schemas
class TaskBase(BaseModel):
    description: str
    assignee: str
    deadline: Optional[datetime] = None
    priority: Optional[int] = 2
    category: Optional[str] = None
    status: Optional[str] = "pending"

class TaskCreate(TaskBase):
    email_source: int

class Task(TaskBase):
    id: int
    email_source: int

    class Config:
        from_attributes = True

# Token schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None





