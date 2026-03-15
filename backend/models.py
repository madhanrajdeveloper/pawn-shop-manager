# backend/models.py
from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class Customer(Base):
    __tablename__ = "customers"

    id = Column(String, primary_key=True, index=True)
    full_name = Column(String, index=True)
    phone_number = Column(String)
    alt_phone = Column(String, nullable=True)
    address = Column(String)
    id_proof_type = Column(String)
    id_proof_number = Column(String)
    date_registered = Column(Date)
    notes = Column(String, nullable=True)

    loans = relationship("Loan", back_populates="customer")

class Loan(Base):
    __tablename__ = "loans"

    receipt_no = Column(String, primary_key=True, index=True)
    customer_id = Column(String, ForeignKey("customers.id"))
    gold_description = Column(String)
    gold_weight = Column(Float)
    loan_amount = Column(Float)
    monthly_interest = Column(Float)
    status = Column(String, default="Active")
    loan_date = Column(Date)
    due_date = Column(Date)
    closed_date = Column(Date, nullable=True)
    remarks = Column(String, nullable=True)

    customer = relationship("Customer", back_populates="loans")
    payments = relationship("Payment", back_populates="loan")

class Payment(Base):
    __tablename__ = "payments"

    payment_id = Column(String, primary_key=True, index=True)
    receipt_no = Column(String, ForeignKey("loans.receipt_no"))
    payment_month = Column(String)
    amount_paid = Column(Float)
    balance_due = Column(Float)
    payment_date = Column(Date)
    payment_mode = Column(String)

    loan = relationship("Loan", back_populates="payments")

# --- NEW TABLE FOR BUY & SELL ---
class BuySell(Base):
    __tablename__ = "buy_sell"

    transaction_id = Column(String, primary_key=True, index=True) # e.g., T001
    type = Column(String) # 'Buy' or 'Sell'
    customer_supplier = Column(String)
    gold_weight = Column(Float)
    purity = Column(String) # Karat (22K, 24K, etc.)
    rate_per_gram = Column(Float)
    total_amount = Column(Float)
    transaction_date = Column(Date)
    payment_mode = Column(String)
    remarks = Column(String, nullable=True)