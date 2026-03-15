# backend/schemas.py
from pydantic import BaseModel
from typing import Optional
from datetime import date

# --- Customer Schemas ---
class CustomerBase(BaseModel):
    full_name: str
    phone_number: str
    alt_phone: Optional[str] = None
    address: str
    id_proof_type: str
    id_proof_number: str
    date_registered: date
    notes: Optional[str] = None

class CustomerCreate(CustomerBase):
    pass

class Customer(CustomerBase):
    id: str  
    class Config:
        from_attributes = True

# --- Loan Schemas ---
class LoanBase(BaseModel):
    customer_id: str
    gold_description: str
    gold_weight: float
    loan_amount: float
    monthly_interest: float
    status: str = "Active"
    loan_date: date
    due_date: date
    remarks: Optional[str] = None

class LoanCreate(LoanBase):
    pass

class Loan(LoanBase):
    receipt_no: str  
    closed_date: Optional[date] = None
    class Config:
        from_attributes = True

# --- Payment / Interest Tracker Schemas ---
class PaymentBase(BaseModel):
    receipt_no: str
    payment_month: str
    amount_paid: float
    payment_mode: str
    # Made optional with defaults so the API accepts partial payloads
    balance_due: Optional[float] = 0.0
    payment_date: Optional[date] = None

class PaymentCreate(PaymentBase):
    pass

class Payment(PaymentBase):
    payment_id: str
    class Config:
        from_attributes = True

# --- Buy & Sell Schemas ---
class BuySellBase(BaseModel):
    type: str  # 'Buy' or 'Sell'
    customer_supplier: str
    gold_weight: float
    purity: str  
    rate_per_gram: float
    total_amount: float
    transaction_date: date
    payment_mode: str = "Cash" # Default value prevents 422 errors
    remarks: Optional[str] = None

class BuySellCreate(BuySellBase):
    pass

class BuySell(BuySellBase):
    transaction_id: str
    class Config:
        from_attributes = True