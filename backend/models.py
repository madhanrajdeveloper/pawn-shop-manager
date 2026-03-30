# backend/models.py
from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from database import Base

class Customer(Base):
    __tablename__ = "customers"

    id = Column(String, primary_key=True, index=True) 
    
    # customer_uid stays UNIQUE because it is auto-generated (VM01, VM02)
    customer_uid = Column(String, unique=True, index=True) 
    
    full_name = Column(String, index=True)
    
    # --- CRITICAL FIXES FOR CLIENT STABILITY ---
    # We remove unique=True from phone, ID, and PAN. 
    # This prevents the app from crashing if two customers leave these blank.
    phone_number = Column(String, index=True) 
    alt_phone = Column(String, nullable=True)
    address = Column(String)
    
    id_proof_type = Column(String)
    id_proof_number = Column(String, nullable=True) # REMOVED unique=True
    pan_number = Column(String, nullable=True)      # REMOVED unique=True
    
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
    monthly_rate_of_interest = Column(Float) 
    
    status = Column(String, default="Active")
    loan_date = Column(Date)
    closed_date = Column(Date, nullable=True)
    
    is_jewel_returned = Column(Boolean, default=False)
    total_interest_paid = Column(Float, nullable=True, default=0.0)
    total_settlement_amount = Column(Float, nullable=True, default=0.0)
    
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


class BuySell(Base):
    __tablename__ = "buy_sell"

    transaction_id = Column(String, primary_key=True, index=True) 
    type = Column(String) 
    customer_supplier = Column(String)
    gold_weight = Column(Float)
    purity = Column(String) 
    rate_per_gram = Column(Float)
    total_amount = Column(Float)
    transaction_date = Column(Date)
    payment_mode = Column(String)
    remarks = Column(String, nullable=True)


class Admin(Base):
    __tablename__ = "admins"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)