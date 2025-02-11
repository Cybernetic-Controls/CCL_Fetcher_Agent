from app.database import SessionLocal
from app.crud import create_user
from app.schemas import UserCreate

def init_db():
    db = SessionLocal()
    try:
        # Create admin user
        admin_user = UserCreate(
            username="admin",
            password="admin123"  # Change this to a secure password
        )
        create_user(db, admin_user)
        print("Admin user created successfully!")
    except Exception as e:
        print(f"Error creating admin user: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    init_db()