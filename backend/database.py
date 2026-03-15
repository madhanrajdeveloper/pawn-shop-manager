# backend/database.py
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# 1. Automatically find the OneDrive folder
# Windows usually sets an environment variable 'ONEDRIVE'
onedrive_path = os.environ.get('ONEDRIVE')

# Fallback just in case the environment variable isn't set
if not onedrive_path:
    onedrive_path = os.path.join(os.path.expanduser('~'), 'OneDrive')

# 2. Create a dedicated folder for your pawn shop data inside OneDrive
APP_DATA_DIR = os.path.join(onedrive_path, "PawnShop_Data")

# Ensure the folder exists
if not os.path.exists(APP_DATA_DIR):
    os.makedirs(APP_DATA_DIR)

# 3. Set the database path to inside the OneDrive folder
db_file_path = os.path.join(APP_DATA_DIR, "pawnshop.db")
SQLALCHEMY_DATABASE_URL = f"sqlite:///{db_file_path}"

print(f"Database will be stored at: {db_file_path}")

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()