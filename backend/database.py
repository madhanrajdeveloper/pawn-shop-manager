# backend/database.py
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# 1. Safely find a reliable storage folder (Prioritizing OneDrive for Excel Sync)
onedrive_env = os.environ.get('ONEDRIVE')
user_home = os.path.expanduser('~')

if onedrive_env and os.path.exists(onedrive_env):
    # Client has OneDrive installed and active
    base_dir = onedrive_env
elif os.path.exists(os.path.join(user_home, 'OneDrive')):
    # Client has a OneDrive folder, even if env var is missing
    base_dir = os.path.join(user_home, 'OneDrive')
else:
    # BULLETPROOF FALLBACK: Client does not use OneDrive. Use 'Documents' instead.
    base_dir = os.path.join(user_home, 'Documents')

# 2. Create the dedicated folder for the Pawn Shop data
APP_DATA_DIR = os.path.join(base_dir, "PawnShop_Data")

if not os.path.exists(APP_DATA_DIR):
    try:
        os.makedirs(APP_DATA_DIR)
    except Exception as e:
        print(f"Warning: Could not create directory {APP_DATA_DIR}. Error: {e}")
        # Absolute last resort: use the local folder where the app is running
        APP_DATA_DIR = os.getcwd()

# 3. Set the database path
db_file_path = os.path.join(APP_DATA_DIR, "pawnshop.db")

# Ensure slashes are formatted correctly for SQLAlchemy on Windows
db_url_path = db_file_path.replace('\\', '/')
SQLALCHEMY_DATABASE_URL = f"sqlite:///{db_url_path}"

print(f"DATABASE CONNECTION: Storing data safely at {db_file_path}")

# 4. Initialize Database Engine
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