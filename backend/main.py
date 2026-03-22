# backend/main.py
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import os
import uuid
from datetime import date
import bcrypt

import models
import schemas
from database import engine, get_db, SessionLocal
from excel_sync import export_to_excel

# --- ONE-TIME AUTO DELETE FUNCTION (Database v2.0 Migration) ---
DB_FILE = "pawnshop.db"
MARKER_FILE = "v2_migration_done.txt"

if os.path.exists(DB_FILE) and not os.path.exists(MARKER_FILE):
    print("⚠️ Old database detected. Wiping for v2.0 upgrade...")
    try:
        os.remove(DB_FILE)
        print("✅ Old database deleted successfully.")
    except Exception as e:
        print(f"❌ Could not delete database: {e}")
    
    with open(MARKER_FILE, "w") as f:
        f.write("Database upgraded to v2.0. Do not delete this file.")

# Create tables in SQLite
models.Base.metadata.create_all(bind=engine)

# --- ADMIN AUTHENTICATION SETUP (NATIVE BCRYPT) ---
def init_default_admin():
    db = SessionLocal()
    try:
        admin_exists = db.query(models.Admin).first()
        if not admin_exists:
            # Native bcrypt hashing
            salt = bcrypt.gensalt()
            default_hash = bcrypt.hashpw("admin123".encode('utf-8'), salt).decode('utf-8')
            
            new_admin = models.Admin(username="admin", password_hash=default_hash)
            db.add(new_admin)
            db.commit()
            print("✅ Default Admin account created (admin / admin123)")
    finally:
        db.close()

# Run the initializer
init_default_admin()
# ----------------------------------


app = FastAPI(title="Pawn Shop Management API v2.0")

# --- FIXED CORS MIDDLEWARE ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "http://127.0.0.1:5173",
        "app://." 
    ],
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
    if not uids:
        return "VM01"
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


# --- ADMIN AUTH ROUTES (NATIVE BCRYPT) ---

@app.post("/admin/register")
def register_admin(admin_data: schemas.AdminAuth, db: Session = Depends(get_db)):
    # Check if username already exists
    existing_admin = db.query(models.Admin).filter(models.Admin.username == admin_data.username).first()
    if existing_admin:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    # Hash password with native bcrypt
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(admin_data.password.encode('utf-8'), salt).decode('utf-8')
    
    new_admin = models.Admin(username=admin_data.username, password_hash=hashed_password)
    
    db.add(new_admin)
    db.commit()
    return {"success": True, "message": "Admin registered securely"}

@app.post("/admin/login")
def login_admin(admin_data: schemas.AdminAuth, db: Session = Depends(get_db)):
    db_admin = db.query(models.Admin).filter(models.Admin.username == admin_data.username).first()
    
    if not db_admin:
        raise HTTPException(status_code=401, detail="Invalid Username or Password")
    
    # Verify the password hash natively
    is_valid = bcrypt.checkpw(admin_data.password.encode('utf-8'), db_admin.password_hash.encode('utf-8'))
    
    if not is_valid:
        raise HTTPException(status_code=401, detail="Invalid Username or Password")
        
    return {"success": True, "message": "Authenticated successfully"}

# --- ADMIN MANAGEMENT ROUTES ---

@app.get("/admins/")
def get_all_admins(db: Session = Depends(get_db)):
    admins = db.query(models.Admin).all()
    # We only return id and username, NEVER the password hashes!
    return [{"id": a.id, "username": a.username} for a in admins]

@app.delete("/admins/{admin_id}")
def delete_admin(admin_id: int, db: Session = Depends(get_db)):
    admin_to_delete = db.query(models.Admin).filter(models.Admin.id == admin_id).first()
    
    if not admin_to_delete:
        raise HTTPException(status_code=404, detail="Admin not found")
    
    # SAFEGUARD: Prevent deleting the very last admin account
    admin_count = db.query(models.Admin).count()
    if admin_count <= 1:
        raise HTTPException(status_code=400, detail="Cannot delete the last remaining admin account.")
    
    db.delete(admin_to_delete)
    db.commit()
    return {"success": True, "message": "Admin access revoked"}


# --- CUSTOMER ROUTES ---

@app.post("/customers/", response_model=schemas.Customer)
def create_customer(customer: schemas.CustomerCreate, db: Session = Depends(get_db)):
    new_id = str(uuid.uuid4())
    new_uid = get_next_customer_uid(db)
    
    new_customer = models.Customer(
        id=new_id, 
        customer_uid=new_uid, 
        **customer.dict()
    )
    db.add(new_customer)
    db.commit()
    db.refresh(new_customer)
    export_to_excel(db)
    return new_customer

@app.get("/customers/", response_model=List[schemas.Customer])
def get_customers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Customer).offset(skip).limit(limit).all()


# --- LOAN ROUTES ---

@app.post("/loans/", response_model=schemas.Loan)
def create_loan(loan: schemas.LoanCreate, db: Session = Depends(get_db)):
    db_customer = db.query(models.Customer).filter(models.Customer.id == loan.customer_id).first()
    if not db_customer:
        raise HTTPException(status_code=404, detail="Customer not found.")

    new_receipt_no = get_next_receipt_no(db)
    new_loan = models.Loan(receipt_no=new_receipt_no, **loan.dict())
    db.add(new_loan)
    db.commit()
    db.refresh(new_loan)
    export_to_excel(db)
    return new_loan

@app.get("/loans/", response_model=List[schemas.Loan])
def get_loans(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Loan).offset(skip).limit(limit).all()

@app.put("/loans/{receipt_no}/close", response_model=schemas.Loan)
def close_loan(receipt_no: str, db: Session = Depends(get_db)):
    db_loan = db.query(models.Loan).filter(models.Loan.receipt_no == receipt_no).first()
    if not db_loan:
        raise HTTPException(status_code=404, detail="Loan not found.")
    
    db_loan.status = "Closed"
    db_loan.closed_date = date.today()
    db_loan.is_jewel_returned = True
    
    days_active = (db_loan.closed_date - db_loan.loan_date).days
    months_elapsed = max(1, round(days_active / 30.0, 1)) 
    
    calculated_interest = db_loan.loan_amount * (db_loan.monthly_rate_of_interest / 100) * months_elapsed
    
    db_loan.total_interest_paid = round(calculated_interest, 2)
    db_loan.total_settlement_amount = round(db_loan.loan_amount + calculated_interest, 2)
    
    db.commit()
    db.refresh(db_loan)
    export_to_excel(db)
    return db_loan


# --- PAYMENT / INTEREST ROUTES ---

@app.post("/payments/", response_model=schemas.Payment)
def create_payment(payment: schemas.PaymentCreate, db: Session = Depends(get_db)):
    db_loan = db.query(models.Loan).filter(models.Loan.receipt_no == payment.receipt_no).first()

    if not db_loan:
        raise HTTPException(status_code=404, detail="Receipt Number not found in database")

    try:
        amt = float(payment.amount_paid)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid amount paid")

    monthly_interest_rupees = db_loan.loan_amount * (db_loan.monthly_rate_of_interest / 100)
    calculated_balance = max(0, monthly_interest_rupees - amt)

    p_date = payment.payment_date if payment.payment_date else date.today()
    new_id = get_next_payment_id(db)
    
    new_payment = models.Payment(
        payment_id=new_id,
        receipt_no=payment.receipt_no,
        payment_month=payment.payment_month,
        amount_paid=amt,
        balance_due=calculated_balance,
        payment_date=p_date,
        payment_mode=payment.payment_mode,
    )

    try:
        db.add(new_payment)
        db.commit()
        db.refresh(new_payment)
        export_to_excel(db) 
        return new_payment
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database or Excel Sync Error")

@app.get("/payments/", response_model=List[schemas.Payment])
def get_payments(db: Session = Depends(get_db)):
    return db.query(models.Payment).all()


# --- BUY & SELL ROUTES ---

@app.post("/buy-sell/", response_model=schemas.BuySell)
def create_buy_sell(data: schemas.BuySellCreate, db: Session = Depends(get_db)):
    new_id = get_next_transaction_id(db)
    new_tx = models.BuySell(transaction_id=new_id, **data.dict())
    db.add(new_tx)
    db.commit()
    db.refresh(new_tx)
    export_to_excel(db)
    return new_tx

@app.get("/buy-sell/", response_model=List[schemas.BuySell])
def get_buy_sell(db: Session = Depends(get_db)):
    return db.query(models.BuySell).all()


# --- DASHBOARD & AGING ROUTES ---

@app.get("/dashboard-summary/")
def get_dashboard_summary(db: Session = Depends(get_db)):
    today = date.today()
    first_of_month = today.replace(day=1)

    total_customers = db.query(models.Customer).count()
    active_loans = db.query(models.Loan).filter(models.Loan.status == "Active").all()
    closed_loans = db.query(models.Loan).filter(models.Loan.status == "Closed").all()

    amount_invested = sum([loan.loan_amount for loan in active_loans])
    amount_returned = sum([loan.total_settlement_amount for loan in closed_loans if loan.total_settlement_amount])
    
    monthly_payments = db.query(models.Payment).filter(models.Payment.payment_date >= first_of_month).all()
    total_interest_earned = sum([p.amount_paid for p in monthly_payments])
    total_gold_weight = sum([loan.gold_weight for loan in active_loans])

    buy_txs = db.query(models.BuySell).filter(models.BuySell.type == "Buy").all()
    sell_txs = db.query(models.BuySell).filter(models.BuySell.type == "Sell").all()

    return {
        "total_customers": total_customers,
        "total_active_loans": len(active_loans),
        "amount_invested": amount_invested,
        "amount_returned": amount_returned,
        "profit_loss": amount_returned - amount_invested,
        "total_interest_earned_month": total_interest_earned,
        "total_gold_in_locker": total_gold_weight,
        "total_gold_bought": sum([t.gold_weight for t in buy_txs]),
        "total_gold_sold": sum([t.gold_weight for t in sell_txs]),
        "today_date": today.strftime("%d-%b-%Y"),
    }

@app.get("/dashboard/aging/")
def get_aging_loans(db: Session = Depends(get_db)):
    active_loans = db.query(models.Loan).filter(models.Loan.status == "Active").all()
    today = date.today()
    
    aging_data = {
        "one_year": [],
        "two_years": [],
        "three_years": []
    }
    
    for loan in active_loans:
        days_active = (today - loan.loan_date).days
        years_active = days_active / 365.25
        
        if years_active >= 3:
            aging_data["three_years"].append(loan)
        elif years_active >= 2:
            aging_data["two_years"].append(loan)
        elif years_active >= 1:
            aging_data["one_year"].append(loan)
            
    return aging_data

@app.get("/export-excel")
def trigger_excel_export(db: Session = Depends(get_db)):
    file_path = export_to_excel(db)
    return {"message": "Excel file synced successfully!", "path": file_path}