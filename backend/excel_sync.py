# backend/excel_sync.py
import os
import pandas as pd
from sqlalchemy.orm import Session
from models import Customer, Loan, Payment, BuySell
from database import APP_DATA_DIR

def export_to_excel(db: Session):
    """
    Reads data from SQLite DB and writes it to an Excel file inside OneDrive.
    Gracefully handles the file being locked/open in another program.
    """
    output_path = os.path.join(APP_DATA_DIR, "PawnShop_Live_Data.xlsx")

    # 1. Fetch data
    customers = pd.read_sql(db.query(Customer).statement, db.bind)
    loans = pd.read_sql(db.query(Loan).statement, db.bind)
    payments = pd.read_sql(db.query(Payment).statement, db.bind)
    buy_sell = pd.read_sql(db.query(BuySell).statement, db.bind)

    # 2. Safely write to Excel
    try:
        with pd.ExcelWriter(output_path, engine='openpyxl') as writer:
            customers.to_excel(writer, sheet_name='Customer Register', index=False)
            loans.to_excel(writer, sheet_name='Loan Ledger', index=False)
            payments.to_excel(writer, sheet_name='Interest Tracker', index=False)
            buy_sell.to_excel(writer, sheet_name='Buy & Sell', index=False)
            
        print(f"Excel backup successfully synced to {output_path}")
        return output_path
        
    except PermissionError:
        print(f"⚠️ WARNING: The Excel file '{output_path}' is currently open.")
        print("Data is saved securely in the database, but Excel sync was skipped.")
        return None