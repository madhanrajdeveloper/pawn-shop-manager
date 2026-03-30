# backend/api.py
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
import sqlite3
from datetime import date

import models
import schemas
from database import engine, get_db, SessionLocal
from excel_sync import export_to_excel

# --- UNICODE SAFETY FIX ---
if sys.stdout is not None:
    sys.stdout = io.TextIOWrapper(
        sys.stdout.detach(), encoding="utf-8", errors="ignore"
    )
if sys.stderr is not None:
    sys.stderr = io.TextIOWrapper(
        sys.stderr.detach(), encoding="utf-8", errors="ignore"
    )


# --- BULLETPROOF V2.0 SCHEMA MIGRATION (The Nuclear Janitor) ---
def force_v2_migration():
    """
    AGGRESSIVE PURGE: Checks for V1 database structures across all ghost paths.
    If V1 is found, it nukes the DB file and all markers to ensure a clean V2 boot.
    """
    base_dir = (
        os.path.dirname(sys.executable)
        if getattr(sys, "frozen", False)
        else os.getcwd()
    )
    db_path = os.path.join(base_dir, "pawnshop.db")

    # Check common locations where V1 might have hidden the DB
    possible_ghost_paths = [
        db_path,
        os.path.join(
            os.path.expanduser("~"),
            "AppData",
            "Roaming",
            "pawn-shop-manager",
            "pawnshop.db",
        ),
        os.path.join(
            os.path.expanduser("~"),
            "AppData",
            "Roaming",
            "Pawn Shop Management Software",
            "pawnshop.db",
        ),
    ]

    for path in possible_ghost_paths:
        if os.path.exists(path):
            try:
                conn = sqlite3.connect(path)
                cursor = conn.cursor()
                # Check the actual columns inside the 'customers' table
                cursor.execute("PRAGMA table_info(customers)")
                columns = [info[1] for info in cursor.fetchall()]
                conn.close()

                # If 'id' exists but 'customer_uid' is missing, it's 100% V1 data
                if "id" in columns and "customer_uid" not in columns:
                    print(f"MIGRATION: V1 Data found at {path}. Purging...")
                    os.remove(path)

                    # Delete the marker file if it exists so it recreates everything
                    marker = os.path.join(base_dir, "v2_migration_done.txt")
                    if os.path.exists(marker):
                        os.remove(marker)
            except Exception as e:
                print(f"Migration Log: Checked {path}, result: {e}")


# IMPORTANT: Call this BEFORE models.Base.metadata.create_all
force_v2_migration()
models.Base.metadata.create_all(bind=engine)


# --- ADMIN AUTHENTICATION SETUP ---
def init_default_admin():
    db = SessionLocal()
    try:
        admin_exists = (
            db.query(models.Admin).filter(models.Admin.username == "admin").first()
        )
        if not admin_exists:
            salt = bcrypt.gensalt()
            # Store hash as string for SQLite compatibility
            default_hash = bcrypt.hashpw("admin123".encode("utf-8"), salt).decode(
                "utf-8"
            )
            new_admin = models.Admin(username="admin", password_hash=default_hash)
            db.add(new_admin)
            db.commit()
            print("ADMIN: Default account created (admin / admin123)")
    finally:
        db.close()


init_default_admin()

app = FastAPI(title="Pawn Shop Management API v2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- AUTO-GENERATION HELPERS ---
def get_next_customer_uid(db: Session) -> str:
    customers = db.query(models.Customer.customer_uid).all()
    uids = [c[0] for c in customers if c[0] and c[0].startswith("VM")]
    if not uids:
        return "VM01"
    nums = [int(uid[2:]) for uid in uids if uid[2:].isdigit()]
    return f"VM{max(nums) + 1:02d}" if nums else "VM01"


def get_next_receipt_no(db: Session) -> str:
    loans = db.query(models.Loan.receipt_no).all()
    if not loans:
        return "L001"
    nums = [int(l[0][1:]) for l in loans if l[0].startswith("L") and l[0][1:].isdigit()]
    return f"L{max(nums) + 1:03d}" if nums else "L001"


def get_next_payment_id(db: Session) -> str:
    payments = db.query(models.Payment.payment_id).all()
    if not payments:
        return "P001"
    nums = [
        int(p[0][1:]) for p in payments if p[0].startswith("P") and p[0][1:].isdigit()
    ]
    return f"P{max(nums) + 1:03d}" if nums else "P001"


def get_next_transaction_id(db: Session) -> str:
    txs = db.query(models.BuySell.transaction_id).all()
    if not txs:
        return "T001"
    nums = [int(t[0][1:]) for t in txs if t[0].startswith("T") and t[0][1:].isdigit()]
    return f"T{max(nums) + 1:03d}" if nums else "T001"


# ==========================================
# API ROUTES (PRIORITIZED BEFORE FRONTEND)
# ==========================================


# --- ADMIN ROUTES ---
@app.post("/admin/login")
def login_admin(admin_data: schemas.AdminAuth, db: Session = Depends(get_db)):
    db_admin = (
        db.query(models.Admin)
        .filter(models.Admin.username == admin_data.username)
        .first()
    )
    if not db_admin:
        raise HTTPException(status_code=401, detail="Invalid Username or Password")

    password_match = bcrypt.checkpw(
        admin_data.password.encode("utf-8"), db_admin.password_hash.encode("utf-8")
    )

    if not password_match:
        raise HTTPException(status_code=401, detail="Invalid Username or Password")

    return {"success": True}


@app.post("/admin/register")
def register_admin(admin_data: schemas.AdminAuth, db: Session = Depends(get_db)):
    existing_admin = (
        db.query(models.Admin)
        .filter(models.Admin.username == admin_data.username)
        .first()
    )
    if existing_admin:
        raise HTTPException(status_code=400, detail="Username exists")
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(admin_data.password.encode("utf-8"), salt).decode(
        "utf-8"
    )
    new_admin = models.Admin(
        username=admin_data.username, password_hash=hashed_password
    )
    db.add(new_admin)
    db.commit()
    return {"success": True}


@app.get("/admins/")
def get_all_admins(db: Session = Depends(get_db)):
    try:
        admins = db.query(models.Admin).all()
        return [{"id": a.id, "username": a.username} for a in admins]
    except Exception as e:
        print(f"CRITICAL SQL ERROR in admins: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/admins/{admin_id}")
def delete_admin(admin_id: int, db: Session = Depends(get_db)):
    if db.query(models.Admin).count() <= 1:
        raise HTTPException(status_code=400, detail="Cannot delete last admin")
    admin = db.query(models.Admin).filter(models.Admin.id == admin_id).first()
    if not admin:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(admin)
    db.commit()
    return {"success": True}


# --- DASHBOARD SUMMARY ---
@app.get("/dashboard-summary/")
def get_summary(db: Session = Depends(get_db)):
    try:
        # 1. Fetch Loans
        active_loans = (
            db.query(models.Loan).filter(models.Loan.status == "Active").all()
        )
        closed_loans = (
            db.query(models.Loan).filter(models.Loan.status == "Closed").all()
        )

        invested = sum([l.loan_amount for l in active_loans])
        returned = sum(
            [
                l.total_settlement_amount
                for l in closed_loans
                if l.total_settlement_amount
            ]
        )

        # 2. Calculate Dashboard Widgets
        total_active_loans_count = len(active_loans)

        # Calculate gold currently in locker (sum of weight from active loans)
        total_gold_in_locker = sum(
            [l.gold_weight for l in active_loans if l.gold_weight]
        )

        # Fetch Buy/Sell records to calculate gold bought and sold
        buys = db.query(models.BuySell).filter(models.BuySell.type == "Buy").all()
        sells = db.query(models.BuySell).filter(models.BuySell.type == "Sell").all()

        total_gold_bought = sum([b.gold_weight for b in buys if b.gold_weight])
        total_gold_sold = sum([s.gold_weight for s in sells if s.gold_weight])

        return {
            "total_customers": db.query(models.Customer).count(),
            "amount_invested": invested,
            "amount_returned": returned,
            "profit_loss": returned - invested,
            "today_date": date.today().strftime("%d-%b-%Y"),
            # --- NEW DATA FOR REACT FRONTEND ---
            "total_active_loans": total_active_loans_count,
            "total_gold_in_locker": round(total_gold_in_locker, 2),
            "total_gold_bought": round(total_gold_bought, 2),
            "total_gold_sold": round(total_gold_sold, 2),
        }
    except Exception as e:
        print(f"CRITICAL SQL ERROR in dashboard summary: {e}")
        return {
            "total_customers": 0,
            "amount_invested": 0,
            "amount_returned": 0,
            "profit_loss": 0,
            "today_date": date.today().strftime("%d-%b-%Y"),
            "total_active_loans": 0,
            "total_gold_in_locker": 0,
            "total_gold_bought": 0,
            "total_gold_sold": 0,
        }


# --- AGING / RECOVERY DASHBOARD ROUTES ---
# --- AGING / RECOVERY DASHBOARD ROUTES ---
@app.get("/dashboard/aging/")
def get_aging_loans(db: Session = Depends(get_db)):
    try:
        active_loans = db.query(models.Loan).filter(models.Loan.status == "Active").all()
        
        # The buckets React is expecting
        aging_data = {
            "one_year": [],
            "two_years": [],
            "three_years": []
        }
        
        today = date.today()
        
        for loan in active_loans:
            if not loan.loan_date: continue
            
            # Calculate how many days old the loan is
            days_old = (today - loan.loan_date).days
            
            # Create the payload React needs
            loan_payload = {
                "receipt_no": loan.receipt_no,
                "customer_id": loan.customer_id,
                "customer_name": loan.customer.full_name if loan.customer else "Unknown Client",
                "customer_uid": loan.customer.customer_uid if loan.customer else "N/A",
                "gold_description": loan.gold_description,
                "gold_weight": loan.gold_weight,
                "loan_amount": loan.loan_amount,
                "loan_date": loan.loan_date,
                "status": loan.status
            }
            
            # Sort into buckets based on days
            if days_old > 1095: # 3+ years
                aging_data["three_years"].append(loan_payload)
            elif days_old > 730: # 2-3 years
                aging_data["two_years"].append(loan_payload)
            elif days_old > 365: # 1-2 years
                aging_data["one_year"].append(loan_payload)
            
        return aging_data
    except Exception as e:
        print(f"CRITICAL SQL ERROR in aging dashboard fetch: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# --- CUSTOMER ROUTES ---
@app.post("/customers/", response_model=schemas.Customer)
def create_customer(customer: schemas.CustomerCreate, db: Session = Depends(get_db)):
    try:
        new_customer = models.Customer(
            id=str(uuid.uuid4()),
            customer_uid=get_next_customer_uid(db),
            **customer.dict(),
        )
        db.add(new_customer)
        db.commit()
        db.refresh(new_customer)
        try:
            export_to_excel(db)
        except:
            pass
        return new_customer
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/customers/", response_model=List[schemas.Customer])
def get_customers(db: Session = Depends(get_db)):
    try:
        return db.query(models.Customer).all()
    except Exception as e:
        print(f"CRITICAL SQL ERROR in customers fetch: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# --- LOAN ROUTES ---
@app.post("/loans/", response_model=schemas.Loan)
def create_loan(loan: schemas.LoanCreate, db: Session = Depends(get_db)):
    try:
        new_loan = models.Loan(receipt_no=get_next_receipt_no(db), **loan.dict())
        db.add(new_loan)
        db.commit()
        db.refresh(new_loan)
        try:
            export_to_excel(db)
        except:
            pass
        return new_loan
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/loans/", response_model=List[schemas.Loan])
def get_loans(db: Session = Depends(get_db)):
    try:
        return db.query(models.Loan).all()
    except Exception as e:
        print(f"CRITICAL SQL ERROR in loans fetch: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/loans/{receipt_no}/close", response_model=schemas.Loan)
def close_loan(receipt_no: str, db: Session = Depends(get_db)):
    try:
        db_loan = (
            db.query(models.Loan).filter(models.Loan.receipt_no == receipt_no).first()
        )
        if not db_loan:
            raise HTTPException(status_code=404, detail="Not found")
        db_loan.status = "Closed"
        db_loan.closed_date = date.today()
        days = (db_loan.closed_date - db_loan.loan_date).days
        months = max(1, round(days / 30.0, 1))
        interest = (
            db_loan.loan_amount * (db_loan.monthly_rate_of_interest / 100) * months
        )
        db_loan.total_interest_paid = round(interest, 2)
        db_loan.total_settlement_amount = round(db_loan.loan_amount + interest, 2)
        db.commit()
        db.refresh(db_loan)
        try:
            export_to_excel(db)
        except:
            pass
        return db_loan
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# --- PAYMENT ROUTES ---
@app.post("/payments/", response_model=schemas.Payment)
def create_payment(payment: schemas.PaymentCreate, db: Session = Depends(get_db)):
    try:
        db_loan = (
            db.query(models.Loan)
            .filter(models.Loan.receipt_no == payment.receipt_no)
            .first()
        )
        if not db_loan:
            raise HTTPException(status_code=404, detail="Loan not found")

        monthly_interest = db_loan.loan_amount * (
            db_loan.monthly_rate_of_interest / 100
        )

        # 1. Convert frontend data to dictionary to avoid duplicating fields
        payment_data = payment.dict()

        # 2. Overwrite the balance_due with the correct calculation
        payment_data["balance_due"] = max(0, monthly_interest - payment.amount_paid)

        # 3. Create the payment safely
        new_payment = models.Payment(payment_id=get_next_payment_id(db), **payment_data)

        db.add(new_payment)
        db.commit()
        db.refresh(new_payment)
        try:
            export_to_excel(db)
        except:
            pass
        return new_payment
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/payments/")
def get_payments(db: Session = Depends(get_db)):
    try:
        return db.query(models.Payment).all()
    except Exception as e:
        print(f"CRITICAL SQL ERROR in payments fetch: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# --- BUY/SELL ROUTES ---
@app.post("/buy-sell/", response_model=schemas.BuySell)
def create_buy_sell(data: schemas.BuySellCreate, db: Session = Depends(get_db)):
    try:
        new_tx = models.BuySell(
            transaction_id=get_next_transaction_id(db), **data.dict()
        )
        db.add(new_tx)
        db.commit()
        db.refresh(new_tx)
        try:
            export_to_excel(db)
        except:
            pass
        return new_tx
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/buy-sell/")
def get_buy_sell(db: Session = Depends(get_db)):
    try:
        return db.query(models.BuySell).all()
    except Exception as e:
        print(f"CRITICAL SQL ERROR in buy/sell fetch: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/export-excel")
def trigger_excel_export(db: Session = Depends(get_db)):
    return {"path": export_to_excel(db)}


# ==========================================
# FRONTEND SERVING (MUST REMAIN LAST)
# ==========================================

if getattr(sys, "frozen", False):
    frontend_dist = os.path.join(sys._MEIPASS, "dist")
else:
    frontend_dist = os.path.join(
        os.path.dirname(os.path.dirname(__file__)), "frontend", "dist"
    )

if os.path.exists(frontend_dist):
    app.mount(
        "/assets",
        StaticFiles(directory=os.path.join(frontend_dist, "assets")),
        name="assets",
    )

    @app.get("/{catchall:path}")
    def serve_react_app(catchall: str):
        # Additional safety check to prevent React from handling API paths
        api_prefixes = (
            "admin",
            "admins",
            "customers",
            "loans",
            "payments",
            "buy-sell",
            "dashboard-summary",
            "dashboard/aging",
            "export-excel",
        )
        if any(catchall.startswith(prefix) for prefix in api_prefixes):
            raise HTTPException(status_code=404, detail="API Route Not Found")

        return FileResponse(os.path.join(frontend_dist, "index.html"))