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
    pan_number: Optional[str] = None # NEW
    date_registered: date
    notes: Optional[str] = None

class CustomerCreate(CustomerBase):
    pass

class Customer(CustomerBase):
    id: str  
    customer_uid: str # NEW: For "VM01" output
    class Config:
        from_attributes = True

# --- Loan Schemas ---
class LoanBase(BaseModel):
    customer_id: str
    gold_description: str
    gold_weight: float
    loan_amount: float
    monthly_rate_of_interest: float # RENAMED
    status: str = "Active"
    loan_date: date
    # due_date REMOVED
    remarks: Optional[str] = None

class LoanCreate(LoanBase):
    pass

class Loan(LoanBase):
    receipt_no: str  
    closed_date: Optional[date] = None
    is_jewel_returned: bool = False # NEW
    total_interest_paid: Optional[float] = 0.0 # NEW
    total_settlement_amount: Optional[float] = 0.0 # NEW
    
    class Config:
        from_attributes = True

# --- Payment Tracker Schemas (Unchanged) ---
class PaymentBase(BaseModel):
    receipt_no: str
    payment_month: str
    amount_paid: float
    payment_mode: str
    balance_due: Optional[float] = 0.0
    payment_date: Optional[date] = None

class PaymentCreate(PaymentBase):
    pass

class Payment(PaymentBase):
    payment_id: str
    class Config:
        from_attributes = True

# --- Buy & Sell Schemas (Unchanged) ---
class BuySellBase(BaseModel):
    type: str  
    customer_supplier: str
    gold_weight: float
    purity: str  
    rate_per_gram: float
    total_amount: float
    transaction_date: date
    payment_mode: str = "Cash" 
    remarks: Optional[str] = None

class BuySellCreate(BuySellBase):
    pass

class BuySell(BuySellBase):
    transaction_id: str
    class Config:
        from_attributes = True

# --- NEW: Master Database Schema ---
class MasterDatabaseRecord(BaseModel):
    customer_uid: str
    full_name: str
    phone_number: str
    pan_number: Optional[str]
    receipt_no: str
    gold_description: str
    loan_amount: float
    status: str
    loan_date: date
    closed_date: Optional[date] = None
    total_settlement_amount: Optional[float] = 0.0
    is_jewel_returned: bool

# --- Admin Auth Schemas ---
class AdminAuth(BaseModel):
    username: str
    password: str