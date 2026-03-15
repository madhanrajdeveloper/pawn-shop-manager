# backend/main.py
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

import models
import schemas
from datetime import date
from database import engine, get_db
from excel_sync import export_to_excel

# Create tables in SQLite
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Pawn Shop Management API")

# CORS Middleware for Electron/React communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"message": "Pawn Shop Backend is running smoothly!"}


# --- AUTO-GENERATION LOGIC ---


def get_next_customer_id(db: Session) -> str:
    customers = db.query(models.Customer.id).all()
    if not customers:
        return "C001"
    nums = [
        int(c.id[1:]) for c in customers if c.id.startswith("C") and c.id[1:].isdigit()
    ]
    return f"C{max(nums) + 1:03d}" if nums else "C001"


def get_next_receipt_no(db: Session) -> str:
    loans = db.query(models.Loan.receipt_no).all()
    if not loans:
        return "L001"
    nums = [
        int(l.receipt_no[1:])
        for l in loans
        if l.receipt_no.startswith("L") and l.receipt_no[1:].isdigit()
    ]
    return f"L{max(nums) + 1:03d}" if nums else "L001"


def get_next_payment_id(db: Session) -> str:
    payments = db.query(models.Payment.payment_id).all()
    if not payments:
        return "P001"
    nums = [
        int(p.payment_id[1:])
        for p in payments
        if p.payment_id.startswith("P") and p.payment_id[1:].isdigit()
    ]
    return f"P{max(nums) + 1:03d}" if nums else "P001"


def get_next_transaction_id(db: Session) -> str:
    txs = db.query(models.BuySell.transaction_id).all()
    if not txs:
        return "T001"
    nums = [
        int(t.transaction_id[1:])
        for t in txs
        if t.transaction_id.startswith("T") and t.transaction_id[1:].isdigit()
    ]
    return f"T{max(nums) + 1:03d}" if nums else "T001"


# --- CUSTOMER ROUTES ---


@app.post("/customers/", response_model=schemas.Customer)
def create_customer(customer: schemas.CustomerCreate, db: Session = Depends(get_db)):
    new_id = get_next_customer_id(db)
    new_customer = models.Customer(id=new_id, **customer.dict())
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
    db_customer = (
        db.query(models.Customer).filter(models.Customer.id == loan.customer_id).first()
    )
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


# --- PAYMENT / INTEREST ROUTES ---


@app.post("/payments/", response_model=schemas.Payment)
def create_payment(payment: schemas.PaymentCreate, db: Session = Depends(get_db)):
    # 1. Fetch the loan
    db_loan = (
        db.query(models.Loan)
        .filter(models.Loan.receipt_no == payment.receipt_no)
        .first()
    )

    if not db_loan:
        raise HTTPException(
            status_code=404, detail="Receipt Number not found in database"
        )

    # 2. Safety check: Ensure amount_paid is valid
    try:
        amt = float(payment.amount_paid)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid amount paid")

    # 3. Calculate Balance
    calculated_balance = max(0, db_loan.monthly_interest - amt)

    # 4. Handle Date if missing
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
        export_to_excel(db)  # This is usually where 500 errors happen if Excel is open
        return new_payment
    except Exception as e:
        db.rollback()
        print(f"CRITICAL ERROR: {str(e)}")  # This will show in your terminal
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


# --- DASHBOARD & EXPORT ---


@app.get("/dashboard-summary/")
def get_dashboard_summary(db: Session = Depends(get_db)):
    today = date.today()
    first_of_month = today.replace(day=1)

    # 1. Basic Stats
    total_customers = db.query(models.Customer).count()
    active_loans_query = db.query(models.Loan).filter(models.Loan.status == "Active")
    active_loans_count = active_loans_query.count()

    # 2. Total Outstanding
    loans = active_loans_query.all()
    total_outstanding = sum([loan.loan_amount for loan in loans])

    # 3. Total Interest Earned (Current Month)
    # Sums all payments made from the 1st of this month until today
    monthly_payments = (
        db.query(models.Payment)
        .filter(models.Payment.payment_date >= first_of_month)
        .all()
    )
    total_interest_earned = sum([p.amount_paid for p in monthly_payments])

    # 4. Total Gold Weight in Locker (Active Pledges)
    total_gold_weight = sum([loan.gold_weight for loan in loans])

    # 5. Overdue Loans (Active loans where today > due_date)
    overdue_count = (
        db.query(models.Loan)
        .filter(models.Loan.status == "Active", models.Loan.due_date < today)
        .count()
    )

    # 6. Buy & Sell Totals
    buy_txs = db.query(models.BuySell).filter(models.BuySell.type == "Buy").all()
    sell_txs = db.query(models.BuySell).filter(models.BuySell.type == "Sell").all()

    total_gold_bought = sum([t.gold_weight for t in buy_txs])
    total_gold_sold = sum([t.gold_weight for t in sell_txs])

    return {
        "total_customers": total_customers,
        "total_active_loans": active_loans_count,
        "total_loan_amount_outstanding": total_outstanding,
        "total_interest_earned_month": total_interest_earned,
        "total_gold_in_locker": total_gold_weight,
        "overdue_loans": overdue_count,
        "total_gold_bought": total_gold_bought,
        "total_gold_sold": total_gold_sold,
        "today_date": today.strftime("%d-%b-%Y"),
    }


@app.get("/export-excel")
def trigger_excel_export(db: Session = Depends(get_db)):
    file_path = export_to_excel(db)
    return {"message": "Excel file synced successfully!", "path": file_path}
