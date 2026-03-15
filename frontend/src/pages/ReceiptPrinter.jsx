// src/pages/ReceiptPrinter.jsx
import { useState, useEffect } from 'react';
import Select from 'react-select';
import useStore from '../store/useStore';
import { Printer, Search } from 'lucide-react';
import { PrimaryButton, Label, TableContainer } from '../styles/Components';

export default function ReceiptPrinter() {
    const { loans, customers, fetchLoans, fetchCustomers } = useStore();
    const [selectedLoanData, setSelectedLoanData] = useState(null);

    useEffect(() => {
        fetchLoans();
        fetchCustomers();
    }, []);

    const loanOptions = loans.map(l => {
        const owner = customers.find(c => c.id === l.customer_id);
        return {
            value: l.receipt_no,
            label: `${l.receipt_no} - ${owner?.full_name || 'Unknown'} (₹${l.loan_amount})`,
            rawData: { ...l, customerName: owner?.full_name }
        };
    });

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="space-y-6">
            <div className="no-print bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h1 className="text-2xl font-bold mb-4">Generate Receipt</h1>
                <div className="flex gap-4 items-end">
                    <div className="flex-1">
                        <Label>Search Receipt No or Customer Name</Label>
                        <Select 
                            options={loanOptions}
                            isSearchable={true}
                            onChange={(opt) => setSelectedLoanData(opt.rawData)}
                            placeholder="Type to search..."
                        />
                    </div>
                    <PrimaryButton onClick={handlePrint} disabled={!selectedLoanData}>
                        <Printer size={20} /> Print Receipt
                    </PrimaryButton>
                </div>
            </div>

            {selectedLoanData ? (
                <div className="print-area bg-white p-10 border-2 border-double border-gray-300 mx-auto max-w-[800px] text-gray-800">
                    <div className="text-center border-b-2 pb-4 mb-6">
                        <h1 className="text-3xl font-black uppercase">🏅 GOLD PAWN SHOP</h1>
                        <p className="text-sm tracking-widest font-bold text-gray-500">OFFICIAL LOAN RECEIPT</p>
                    </div>

                    <div className="grid grid-cols-2 gap-8 mb-8">
                        <div className="space-y-2">
                            <p><span className="font-bold text-gray-500 uppercase text-xs">Receipt No:</span> <br/> <span className="text-xl font-bold">{selectedLoanData.receipt_no}</span></p>
                            <p><span className="font-bold text-gray-500 uppercase text-xs">Customer:</span> <br/> <span className="text-lg font-bold">{selectedLoanData.customerName}</span></p>
                        </div>
                        <div className="space-y-2 text-right">
                            <p><span className="font-bold text-gray-500 uppercase text-xs">Loan Date:</span> <br/> {selectedLoanData.loan_date}</p>
                            <p><span className="font-bold text-gray-500 uppercase text-xs">Due Date:</span> <br/> {selectedLoanData.due_date}</p>
                        </div>
                    </div>

                    <div className="border-t-2 border-b-2 py-4 my-6 grid grid-cols-2 gap-4">
                        <div>
                            <p className="font-bold text-gray-500 text-xs">GOLD DESCRIPTION</p>
                            <p className="text-lg">{selectedLoanData.gold_description}</p>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-gray-500 text-xs">WEIGHT</p>
                            <p className="text-lg font-bold">{selectedLoanData.gold_weight} g</p>
                        </div>
                    </div>

                    <div className="flex justify-between items-center bg-gray-50 p-6 rounded-lg mb-8">
                        <div>
                            <p className="font-bold text-gray-500 text-xs uppercase">Total Loan Amount</p>
                            <p className="text-3xl font-black text-blue-900">₹{selectedLoanData.loan_amount.toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-gray-500 text-xs uppercase">Monthly Interest</p>
                            <p className="text-xl font-bold text-gray-700">₹{selectedLoanData.monthly_interest}</p>
                        </div>
                    </div>

                    <div className="text-[10px] text-gray-500 space-y-1 border-t pt-4 italic">
                        <p>1. This receipt is valid proof of gold pledge at this shop.</p>
                        <p>2. Interest is charged monthly. Please pay on time to avoid penalty.</p>
                        <p>3. Bring this receipt when redeeming your gold items.</p>
                    </div>

                    <div className="mt-16 flex justify-between">
                        <div className="border-t border-gray-400 pt-2 w-48 text-center text-xs">Customer Signature</div>
                        <div className="border-t border-gray-400 pt-2 w-48 text-center text-xs">Manager Signature & Stamp</div>
                    </div>
                </div>
            ) : (
                <div className="text-center py-20 text-gray-400 border-2 border-dashed rounded-xl">
                    <Search size={48} className="mx-auto mb-4 opacity-20" />
                    <p>Select a loan from the search bar to preview the receipt.</p>
                </div>
            )}
        </div>
    );
}