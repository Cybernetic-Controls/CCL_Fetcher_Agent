
# app/models.py
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Boolean
from .database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)

class Email(Base):
    __tablename__ = "emails"

    id = Column(Integer, primary_key=True, index=True)
    subject = Column(String)
    sender = Column(String)
    recipient = Column(String)
    date = Column(DateTime, default=datetime.utcnow)
    body = Column(Text)
    raw_json = Column(Text, nullable=True)

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    description = Column(String)
    assignee = Column(String)
    deadline = Column(DateTime, nullable=True)
    status = Column(String, default="pending")
    priority = Column(Integer, default=2)
    category = Column(String, nullable=True)
    email_source = Column(Integer, ForeignKey("emails.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
