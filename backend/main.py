# backend/main.py
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List
import os
import uuid
import sys
import io
import bcrypt
from datetime import date

import models
import schemas
from database import engine, get_db, SessionLocal
from excel_sync import export_to_excel

# --- UNICODE SAFETY FIX ---
# This prevents 'charmap' codec crashes when running as a windowed EXE on Windows
if sys.stdout is not None:
    sys.stdout = io.TextIOWrapper(sys.stdout.detach(), encoding='utf-8', errors='ignore')
if sys.stderr is not None:
    sys.stderr = io.TextIOWrapper(sys.stderr.detach(), encoding='utf-8', errors='ignore')

# --- ONE-TIME AUTO DELETE FUNCTION (Database v2.0 Migration) ---
DB_FILE = "pawnshop.db"
MARKER_FILE = "v2_migration_done.txt"

if os.path.exists(DB_FILE) and not os.path.exists(MARKER_FILE):
    print("MIGRATION: Old database detected. Wiping for v2.0 upgrade...")
    try:
        os.remove(DB_FILE)
        print("MIGRATION: Old database deleted successfully.")
    except Exception as e:
        print(f"MIGRATION ERROR: Could not delete database: {e}")
    
    with open(MARKER_FILE, "w") as f:
        f.write("Database upgraded to v2.0. Do not delete this file.")

# Create tables in SQLite
models.Base.metadata.create_all(bind=engine)

# --- ADMIN AUTHENTICATION SETUP ---
def init_default_admin():
    db = SessionLocal()
    try:
        admin_exists = db.query(models.Admin).first()
        if not admin_exists:
            salt = bcrypt.gensalt()
            default_hash = bcrypt.hashpw("admin123".encode('utf-8'), salt).decode('utf-8')
            
            new_admin = models.Admin(username="admin", password_hash=default_hash)
            db.add(new_admin)
            db.commit()
            print("ADMIN: Default account created (admin / admin123)")
    finally:
        db.close()

init_default_admin()

app = FastAPI(title="Pawn Shop Management API v2.0")

# --- CORS MIDDLEWARE ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Pawn Shop Backend v2.0 is running smoothly!"}

# --- AUTO-GENERATION LOGIC ---
def get_next_customer_uid(db: Session) -> str:
    customers = db.query(models.Customer.customer_uid).all()
    uids = [c[0] for c in customers if c[0] and c[0].startswith("VM")]
    if not uids: return "VM01"
    nums = [int(uid[2:]) for uid in uids if uid[2:].isdigit()]
    return f"VM{max(nums) + 1:02d}" if nums else "VM01"

def get_next_receipt_no(db: Session) -> str:
    loans = db.query(models.Loan.receipt_no).all()
    if not loans: return "L001"
    nums = [int(l[0][1:]) for l in loans if l[0].startswith("L") and l[0][1:].isdigit()]
    return f"L{max(nums) + 1:03d}" if nums else "L001"

def get_next_payment_id(db: Session) -> str:
    payments = db.query(models.Payment.payment_id).all()
    if not payments: return "P001"
    nums = [int(p[0][1:]) for p in payments if p[0].startswith("P") and p[0][1:].isdigit()]
    return f"P{max(nums) + 1:03d}" if nums else "P001"

def get_next_transaction_id(db: Session) -> str:
    txs = db.query(models.BuySell.transaction_id).all()
    if not txs: return "T001"
    nums = [int(t[0][1:]) for t in txs if t[0].startswith("T") and t[0][1:].isdigit()]
    return f"T{max(nums) + 1:03d}" if nums else "T001"

# --- ADMIN ROUTES ---
@app.post("/admin/register")
def register_admin(admin_data: schemas.AdminAuth, db: Session = Depends(get_db)):
    existing_admin = db.query(models.Admin).filter(models.Admin.username == admin_data.username).first()
    if existing_admin: raise HTTPException(status_code=400, detail="Username exists")
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(admin_data.password.encode('utf-8'), salt).decode('utf-8')
    new_admin = models.Admin(username=admin_data.username, password_hash=hashed_password)
    db.add(new_admin)
    db.commit()
    return {"success": True}

@app.post("/admin/login")
def login_admin(admin_data: schemas.AdminAuth, db: Session = Depends(get_db)):
    db_admin = db.query(models.Admin).filter(models.Admin.username == admin_data.username).first()
    if not db_admin or not bcrypt.checkpw(admin_data.password.encode('utf-8'), db_admin.password_hash.encode('utf-8')):
        raise HTTPException(status_code=401, detail="Invalid Credentials")
    return {"success": True}

@app.get("/admins/")
def get_all_admins(db: Session = Depends(get_db)):
    admins = db.query(models.Admin).all()
    return [{"id": a.id, "username": a.username} for a in admins]

@app.delete("/admins/{admin_id}")
def delete_admin(admin_id: int, db: Session = Depends(get_db)):
    if db.query(models.Admin).count() <= 1:
        raise HTTPException(status_code=400, detail="Cannot delete last admin")
    admin = db.query(models.Admin).filter(models.Admin.id == admin_id).first()
    if not admin: raise HTTPException(status_code=404, detail="Not found")
    db.delete(admin)
    db.commit()
    return {"success": True}

# --- CUSTOMER & LOAN ROUTES ---
@app.post("/customers/", response_model=schemas.Customer)
def create_customer(customer: schemas.CustomerCreate, db: Session = Depends(get_db)):
    new_customer = models.Customer(id=str(uuid.uuid4()), customer_uid=get_next_customer_uid(db), **customer.dict())
    db.add(new_customer)
    db.commit()
    db.refresh(new_customer)
    export_to_excel(db)
    return new_customer

@app.get("/customers/", response_model=List[schemas.Customer])
def get_customers(db: Session = Depends(get_db)):
    return db.query(models.Customer).all()

@app.post("/loans/", response_model=schemas.Loan)
def create_loan(loan: schemas.LoanCreate, db: Session = Depends(get_db)):
    new_loan = models.Loan(receipt_no=get_next_receipt_no(db), **loan.dict())
    db.add(new_loan)
    db.commit()
    db.refresh(new_loan)
    export_to_excel(db)
    return new_loan

@app.get("/loans/", response_model=List[schemas.Loan])
def get_loans(db: Session = Depends(get_db)):
    return db.query(models.Loan).all()

@app.put("/loans/{receipt_no}/close", response_model=schemas.Loan)
def close_loan(receipt_no: str, db: Session = Depends(get_db)):
    db_loan = db.query(models.Loan).filter(models.Loan.receipt_no == receipt_no).first()
    if not db_loan: raise HTTPException(status_code=404, detail="Not found")
    db_loan.status = "Closed"
    db_loan.closed_date = date.today()
    days = (db_loan.closed_date - db_loan.loan_date).days
    months = max(1, round(days / 30.0, 1)) 
    interest = db_loan.loan_amount * (db_loan.monthly_rate_of_interest / 100) * months
    db_loan.total_interest_paid = round(interest, 2)
    db_loan.total_settlement_amount = round(db_loan.loan_amount + interest, 2)
    db.commit()
    db.refresh(db_loan)
    export_to_excel(db)
    return db_loan

# --- OTHER ROUTES ---
@app.post("/payments/", response_model=schemas.Payment)
def create_payment(payment: schemas.PaymentCreate, db: Session = Depends(get_db)):
    db_loan = db.query(models.Loan).filter(models.Loan.receipt_no == payment.receipt_no).first()
    monthly_interest = db_loan.loan_amount * (db_loan.monthly_rate_of_interest / 100)
    new_payment = models.Payment(
        payment_id=get_next_payment_id(db),
        balance_due=max(0, monthly_interest - payment.amount_paid),
        **payment.dict()
    )
    db.add(new_payment)
    db.commit()
    db.refresh(new_payment)
    export_to_excel(db)
    return new_payment

@app.get("/payments/")
def get_payments(db: Session = Depends(get_db)): return db.query(models.Payment).all()

@app.post("/buy-sell/", response_model=schemas.BuySell)
def create_buy_sell(data: schemas.BuySellCreate, db: Session = Depends(get_db)):
    new_tx = models.BuySell(transaction_id=get_next_transaction_id(db), **data.dict())
    db.add(new_tx)
    db.commit()
    db.refresh(new_tx)
    export_to_excel(db)
    return new_tx

@app.get("/buy-sell/")
def get_buy_sell(db: Session = Depends(get_db)): return db.query(models.BuySell).all()

@app.get("/dashboard-summary/")
def get_summary(db: Session = Depends(get_db)):
    active = db.query(models.Loan).filter(models.Loan.status == "Active").all()
    closed = db.query(models.Loan).filter(models.Loan.status == "Closed").all()
    invested = sum([l.loan_amount for l in active])
    returned = sum([l.total_settlement_amount for l in closed if l.total_settlement_amount])
    return {
        "total_customers": db.query(models.Customer).count(),
        "amount_invested": invested,
        "amount_returned": returned,
        "profit_loss": returned - invested,
        "today_date": date.today().strftime("%d-%b-%Y"),
    }

@app.get("/export-excel")
def trigger_excel_export(db: Session = Depends(get_db)):
    return {"path": export_to_excel(db)}

# --- FRONTEND SERVING ---
if getattr(sys, 'frozen', False):
    frontend_dist = os.path.join(sys._MEIPASS, "dist")
else:
    frontend_dist = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "dist")

if os.path.exists(frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")
    @app.get("/{catchall:path}")
    def serve_react_app(catchall: str):
        return FileResponse(os.path.join(frontend_dist, "index.html"))