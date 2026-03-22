// frontend/src/pages/ReceiptPrinter.jsx
import { useEffect, useState } from 'react';
import useStore from '../store/useStore';
import { Printer, Search, ArrowLeft, FileText, FileSignature } from 'lucide-react';
import { FormField, DataTable, Button } from '../components/common/UIComponents';

export default function ReceiptPrinter() {
  const { loans, customers, fetchLoans, fetchCustomers } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLoan, setSelectedLoan] = useState(null);

  useEffect(() => {
    fetchLoans();
    if (customers.length === 0) fetchCustomers();
  }, [fetchLoans, fetchCustomers, customers.length]);

  const filteredLoans = loans.filter(loan => {
    const term = searchTerm.toLowerCase();
    const customer = customers.find(c => c.id === loan.customer_id);
    const customerName = customer ? customer.full_name.toLowerCase() : '';
    const customerUid = customer ? (customer.customer_uid || "").toLowerCase() : '';
    
    return loan.receipt_no.toLowerCase().includes(term) || customerName.includes(term) || customerUid.includes(term);
  });

  const handlePrint = () => window.print();

  // ==========================================
  // VIEW 2: FULL PAGE RECEIPT PREVIEW
  // ==========================================
  if (selectedLoan) {
    return (
      <div className="animate-in fade-in duration-300 pb-10">
        
        {/* Top Action Bar (Hidden during printing) */}
        <div className="flex justify-between items-center mb-6 print:hidden bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <Button variant="secondary" onClick={() => setSelectedLoan(null)}>
            <ArrowLeft size={16} /> Back to List
          </Button>
          <Button onClick={handlePrint} className="bg-slate-900 hover:bg-black shadow-lg">
            <Printer size={16} /> Print Document
          </Button>
        </div>

        {/* The Receipt Document (A4 Styling) */}
        <div className="flex justify-center">
          <div className="w-full max-w-3xl bg-white p-10 rounded-2xl shadow-xl border border-slate-200 print:shadow-none print:border-none print:p-0">
            
            {/* Header */}
            <div className="text-center mb-8 border-b-2 border-slate-800 pb-6">
              <h1 className="text-4xl font-black text-slate-900 uppercase tracking-widest mb-2">PAWN SHOP NAME</h1>
              <p className="text-sm font-bold text-slate-600">123 Main Street, City, State</p>
              <p className="text-sm font-bold text-slate-600">Phone: +91 98765 43210 | License: PB/XXXX/01</p>
            </div>

            <div className="flex justify-between items-end mb-8">
              <div>
                <h2 className="text-3xl font-black text-indigo-800 mb-1">{selectedLoan.loan.receipt_no}</h2>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Original Receipt</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-slate-800">Date: {selectedLoan.loan.loan_date}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-8">
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                <p className="text-[10px] font-black text-slate-500 uppercase mb-3 tracking-widest">Pledged By</p>
                <p className="text-2xl font-black text-slate-800 mb-1">{selectedLoan.customer?.full_name}</p>
                <p className="text-[10px] font-black text-indigo-600 mb-3 bg-indigo-100 inline-block px-2 py-0.5 rounded tracking-widest">{selectedLoan.customer?.customer_uid}</p>
                <p className="text-sm font-bold text-slate-600">{selectedLoan.customer?.address}</p>
                <p className="text-sm font-bold text-slate-600">Ph: {selectedLoan.customer?.phone_number}</p>
                <p className="text-xs font-bold text-slate-500 mt-3 pt-2 border-t border-slate-200">ID: {selectedLoan.customer?.id_proof_type} ({selectedLoan.customer?.id_proof_number})</p>
              </div>

              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 flex flex-col justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase mb-3 tracking-widest">Financial Summary</p>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-bold text-slate-600">Principal Amount:</span>
                    <span className="text-xl font-black text-slate-900">₹{selectedLoan.loan.loan_amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-bold text-slate-600">Interest Rate:</span>
                    <span className="text-xl font-black text-slate-900">{selectedLoan.loan.monthly_rate_of_interest}% <span className="text-xs text-slate-400">/ mo</span></span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-12">
              <p className="text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Jewel Description</p>
              <div className="border-2 border-slate-800 rounded-xl p-6 bg-slate-50/50">
                <p className="text-xl font-bold text-slate-800 leading-relaxed">
                  {selectedLoan.loan.gold_description}
                </p>
                <div className="mt-4 pt-4 border-t border-slate-200 flex justify-between items-center">
                  <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Gross Weight</span>
                  <span className="text-2xl font-black text-slate-900">{selectedLoan.loan.gold_weight}g</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-end mt-20 pt-16 px-4">
              <div className="text-center">
                <div className="w-56 border-t-2 border-slate-400 mb-2"></div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Customer Signature</p>
              </div>
              <div className="text-center">
                <div className="w-56 border-t-2 border-slate-400 mb-2"></div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Authorized Signatory</p>
              </div>
            </div>

            <div className="mt-16 pt-6 border-t border-slate-200 text-[10px] font-bold text-slate-500 text-justify leading-relaxed">
              <p className="font-black mb-2 uppercase tracking-widest text-slate-700">Terms & Conditions:</p>
              <ol className="list-decimal pl-4 space-y-1">
                <li>This receipt must be produced at the time of redeeming the pledged items.</li>
                <li>Interest is calculated on a monthly basis. Minimum one month interest will be charged.</li>
                <li>The management is not responsible for loss due to natural calamities or unforeseen circumstances.</li>
                <li>Pledged items will be auctioned if interest is not paid consecutively for 12 months.</li>
              </ol>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 1: FULL WIDTH TABLE LIST
  // ==========================================
  return (
    <div className="space-y-4 animate-in fade-in duration-300 print:hidden">
      
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
            <FileSignature size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Receipt Printer</h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Generate physical documents</p>
          </div>
        </div>
        
        <div className="w-64">
          <FormField 
            icon={Search} 
            placeholder="Search Receipt or Name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <DataTable headers={['Receipt', 'Client Information', 'Loan Date', 'Item Details', 'Principal (₹)', 'Action']}>
        {filteredLoans.length === 0 ? (
          <tr><td colSpan="6" className="p-10 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">No loans found</td></tr>
        ) : (
          filteredLoans.map(loan => {
            const customer = customers.find(c => c.id === loan.customer_id);
            return (
              <tr key={loan.receipt_no} className="hover:bg-indigo-50/40 transition-colors">
                <td className="p-3 font-black text-indigo-600">{loan.receipt_no}</td>
                <td className="p-3">
                  <span className="block font-bold text-slate-800">{customer ? customer.full_name : 'Unknown'}</span>
                  <span className="text-[9px] font-black uppercase text-indigo-500 tracking-widest">{customer?.customer_uid}</span>
                </td>
                <td className="p-3 font-bold text-slate-500 text-xs">{loan.loan_date}</td>
                <td className="p-3 text-slate-600 font-medium truncate max-w-[200px]" title={loan.gold_description}>
                  {loan.gold_weight}g - {loan.gold_description}
                </td>
                <td className="p-3 font-black text-slate-900 bg-slate-50/50">₹{(loan.loan_amount || 0).toLocaleString()}</td>
                <td className="p-3">
                  <Button 
                    onClick={() => setSelectedLoan({ loan, customer })}
                    className="py-1 px-4 text-[9px] bg-slate-900 shadow-md"
                  >
                    <FileText size={12} /> View Document
                  </Button>
                </td>
              </tr>
            )
          })
        )}
      </DataTable>

    </div>
  );
}