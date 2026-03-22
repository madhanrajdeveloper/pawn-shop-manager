// frontend/src/pages/InterestTracker.jsx
import { useEffect, useState } from 'react';
import Select from 'react-select';
import useStore from '../store/useStore';
import { IndianRupee, Search, PlusCircle, X } from 'lucide-react';

export default function InterestTracker() {
  const {
    payments, loans, customers, loading,
    fetchPayments, fetchLoans, fetchCustomers, addPayment,
    isPaymentModalOpen, setPaymentModal
  } = useStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLoan, setSelectedLoan] = useState(null);

  useEffect(() => {
    fetchPayments();
    if (loans.length === 0) fetchLoans();
    if (customers.length === 0) fetchCustomers();
  }, [fetchPayments, fetchLoans, fetchCustomers, loans.length, customers.length]);

  // Create searchable options for the react-select dropdown
  const loanOptions = loans
    .filter(l => l.status === 'Active')
    .map(l => {
      const cust = customers.find(c => c.id === l.customer_id);
      return {
        value: l.receipt_no,
        label: `${l.receipt_no} - ${cust ? cust.full_name : 'Unknown'} (Principal: ₹${l.loan_amount})`
      };
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);

    // Grab the receipt_no from the react-select state
    if (selectedLoan) {
        data.receipt_no = selectedLoan.value;
    } else {
        alert("Please search and select a Active Loan Receipt.");
        return;
    }

    const success = await addPayment(data);
    if (success) {
        alert("Payment Recorded Successfully!");
        setSelectedLoan(null); // Reset the dropdown
    }
  };

  // Filter payments based on search (Receipt No, Customer Name, or VM ID)
  const filteredPayments = payments.filter(payment => {
    const term = searchTerm.toLowerCase();
    const loan = loans.find(l => l.receipt_no === payment.receipt_no);
    const customer = loan ? customers.find(c => c.id === loan.customer_id) : null;
    
    const customerName = customer ? customer.full_name.toLowerCase() : '';
    const customerUid = customer ? (customer.customer_uid || "").toLowerCase() : '';
    
    return (
      payment.receipt_no.toLowerCase().includes(term) ||
      payment.payment_id.toLowerCase().includes(term) ||
      customerName.includes(term) ||
      customerUid.includes(term)
    );
  });

  // Helper to display Customer info in the table
  const getCustomerDisplay = (receiptNo) => {
    const loan = loans.find(l => l.receipt_no === receiptNo);
    if (!loan) return <span className="text-slate-400">Unknown</span>;
    
    const customer = customers.find(c => c.id === loan.customer_id);
    if (!customer) return <span className="text-slate-400">Unknown</span>;

    return (
      <div>
        <span className="font-bold text-slate-800 block">{customer.full_name}</span>
        <span className="text-xs font-bold text-blue-600">{customer.customer_uid}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h1 className="text-3xl font-black text-slate-900">Interest Tracker</h1>
        
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text"
              placeholder="Search Receipt, Name, VM ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />
          </div>

          <button 
            onClick={() => setPaymentModal(true)} 
            className="w-full md:w-auto flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg font-bold transition-colors shadow-sm whitespace-nowrap"
          >
            <PlusCircle size={20} /> Record Payment
          </button>
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-widest text-xs border-b">
              <tr>
                <th className="p-4 font-bold">Payment ID</th>
                <th className="p-4 font-bold">Receipt No</th>
                <th className="p-4 font-bold">Client Information</th>
                <th className="p-4 font-bold">Month Paid For</th>
                <th className="p-4 font-bold">Amount Paid (₹)</th>
                <th className="p-4 font-bold">Date</th>
                <th className="p-4 font-bold">Mode</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="7" className="p-10 text-center text-slate-400 font-medium">Loading Payments...</td></tr>
              ) : filteredPayments.length === 0 ? (
                <tr><td colSpan="7" className="p-10 text-center text-slate-400 font-medium">No payments found.</td></tr>
              ) : filteredPayments.map(payment => (
                <tr key={payment.payment_id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-black text-slate-700">{payment.payment_id}</td>
                  <td className="p-4 font-black text-blue-700">{payment.receipt_no}</td>
                  <td className="p-4">{getCustomerDisplay(payment.receipt_no)}</td>
                  <td className="p-4 font-medium text-slate-600">{payment.payment_month}</td>
                  <td className="p-4 font-black text-emerald-600">₹{(payment.amount_paid || 0).toLocaleString()}</td>
                  <td className="p-4 text-slate-500">{payment.payment_date}</td>
                  <td className="p-4">
                    <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold">
                      {payment.payment_mode}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* PAYMENT MODAL */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex justify-center items-center z-9999 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                <IndianRupee className="text-emerald-500" /> Record Interest
              </h2>
              <button 
                onClick={() => setPaymentModal(false)} 
                className="text-slate-400 hover:text-red-500 transition-colors bg-white p-1.5 rounded-lg border border-slate-200 hover:border-red-200 hover:bg-red-50"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Select Active Loan *</label>
                <Select
                  options={loanOptions}
                  isSearchable={true}
                  value={selectedLoan}
                  onChange={(option) => setSelectedLoan(option)}
                  placeholder="Type Receipt No or Name..."
                  className="text-sm"
                  styles={{
                    control: (base) => ({
                      ...base,
                      borderColor: '#e2e8f0',
                      padding: '2px',
                      borderRadius: '0.5rem',
                      boxShadow: 'none',
                      '&:hover': { borderColor: '#cbd5e1' }
                    })
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Payment Month *</label>
                <input 
                  type="text"
                  name="payment_month" 
                  required 
                  placeholder="e.g., March 2026" 
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Amount Paid (₹) *</label>
                <input 
                  type="number"
                  name="amount_paid" 
                  required 
                  placeholder="1500" 
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Payment Mode</label>
                  <select 
                    name="payment_mode" 
                    defaultValue="Cash"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI / GPay</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Date</label>
                  <input 
                    type="date"
                    name="payment_date" 
                    defaultValue={new Date().toISOString().split('T')[0]} 
                    required 
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-600"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button 
                  type="submit" 
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg transition-colors flex justify-center items-center gap-2"
                >
                  Save Payment Record
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}