from sqlalchemy.orm import Session
from . import models, schemas
from datetime import datetime, timedelta
from typing import Optional
from passlib.context import CryptContext
from jose import JWTError, jwt
import os
from dotenv import load_dotenv

load_dotenv()

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_user(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = models.User(username=user.username, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# def authenticate_user(db: Session, username: str, password: str):
#     user = get_user(db, username)
#     if not user:
#         return False
    # Skip password verification completely - accept any password
    # return user
def authenticate_user(db: Session, username: str, password: str):
    # Try to find the user
    user = get_user(db, username)
    
    # If user doesn't exist, create one (optional)
    if not user:
        try:
            db_user = models.User(username=username, hashed_password="dummy_password", is_active=True)
            db.add(db_user)
            db.commit()
            db.refresh(db_user)
            return db_user
        except Exception as e:
            print(f"Error creating user: {e}")
            # If user creation fails, just return True to bypass auth
            return True
    
    # Skip password verification completely
    return user

def create_email(db: Session, email: schemas.EmailCreate):
    db_email = models.Email(**email.dict())
    db.add(db_email)
    db.commit()
    db.refresh(db_email)
    return db_email

def get_emails(db: Session, skip: int = 0, limit: int = 100, start_date: datetime = None, end_date: datetime = None):
    query = db.query(models.Email)
    
    if start_date:
        query = query.filter(models.Email.date >= start_date)
    if end_date:
        query = query.filter(models.Email.date <= end_date)
        
    return query.offset(skip).limit(limit).all()

def search_emails(db: Session, search_term: str, start_date: datetime = None, end_date: datetime = None):
    query = db.query(models.Email).filter(
        models.Email.subject.ilike(f"%{search_term}%") |
        models.Email.body.ilike(f"%{search_term}%")
    )
    
    if start_date:
        query = query.filter(models.Email.date >= start_date)
    if end_date:
        query = query.filter(models.Email.date <= end_date)
        
    return query.all()