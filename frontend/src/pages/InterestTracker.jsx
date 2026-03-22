// frontend/src/pages/InterestTracker.jsx
import { useEffect, useState } from 'react';
import Select from 'react-select';
import useStore from '../store/useStore';
import { 
  IndianRupee, Search, PlusCircle, X, 
  Calendar, CreditCard, User, Hash, CheckCircle2 
} from 'lucide-react';
import { 
  FormField, DataTable, Button, 
  ModalOverlay, ModalContent, ModalHeader, FormGrid 
} from '../components/common/UIComponents';

export default function InterestTracker() {
  const {
    payments, loans, customers, loading,
    fetchPayments, fetchLoans, fetchCustomers, addPayment,
    isPaymentModalOpen, setPaymentModal, showToast
  } = useStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLoan, setSelectedLoan] = useState(null);

  useEffect(() => {
    fetchPayments();
    if (loans.length === 0) fetchLoans();
    if (customers.length === 0) fetchCustomers();
  }, [fetchPayments, fetchLoans, fetchCustomers, loans.length, customers.length]);

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

    if (selectedLoan) {
      data.receipt_no = selectedLoan.value;
    } else {
      showToast("Please select an active loan receipt.", "danger");
      return;
    }

    const success = await addPayment(data);
    if (success) {
      setSelectedLoan(null);
    }
  };

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

  const getCustomerDisplay = (receiptNo) => {
    const loan = loans.find(l => l.receipt_no === receiptNo);
    const customer = loan ? customers.find(c => c.id === loan.customer_id) : null;

    if (!customer) return <span className="text-slate-400">Unknown</span>;

    return (
      <div>
        <span className="font-bold text-slate-800 block leading-tight">{customer.full_name}</span>
        <span className="text-[10px] font-black uppercase text-indigo-500 tracking-widest">{customer.customer_uid}</span>
      </div>
    );
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      
      {/* HEADER SECTION - Matches Buy&Sell/Customers */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Interest Tracker</h1>
        <div className="flex items-center gap-3">
          <div className="w-64">
            <FormField 
              icon={Search} 
              placeholder="Search Receipt, Name, UID..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
          <Button variant="success" onClick={() => setPaymentModal(true)}>
            <PlusCircle size={16} /> Record Payment
          </Button>
        </div>
      </div>

      {/* COMPACT DATA TABLE */}
      <DataTable headers={['ID', 'Receipt', 'Client Information', 'Month', 'Amount (₹)', 'Date & Mode']}>
        {filteredPayments.length === 0 ? (
          <tr><td colSpan="6" className="p-10 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">No payment records found</td></tr>
        ) : filteredPayments.map(payment => (
          <tr key={payment.payment_id} className="hover:bg-indigo-50/40 transition-colors">
            <td className="p-3 font-black text-slate-400 text-xs">#{payment.payment_id}</td>
            <td className="p-3 font-black text-indigo-600">{payment.receipt_no}</td>
            <td className="p-3">{getCustomerDisplay(payment.receipt_no)}</td>
            <td className="p-3 font-bold text-slate-600 text-xs uppercase">{payment.payment_month}</td>
            <td className="p-3 font-black text-emerald-600 text-base">₹{(payment.amount_paid || 0).toLocaleString()}</td>
            <td className="p-3">
                <span className="block text-slate-500 font-bold text-xs">{payment.payment_date}</span>
                <span className="text-[9px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-black uppercase tracking-widest">{payment.payment_mode}</span>
            </td>
          </tr>
        ))}
      </DataTable>

      {/* RE-DESIGNED MODAL */}
      {isPaymentModalOpen && (
        <ModalOverlay>
          <ModalContent size="600px">
            <ModalHeader>
              <h2 className="text-lg font-black text-slate-800 uppercase tracking-tighter flex items-center gap-2">
                <IndianRupee size={18} className="text-emerald-600" /> Record Interest Payment
              </h2>
              <button onClick={() => setPaymentModal(false)} className="hover:text-red-500 transition-colors"><X size={20} /></button>
            </ModalHeader>

            <form onSubmit={handleSubmit} className="p-5">
              <FormGrid>
                
                {/* Searchable Dropdown using React-Select Styled for your UI */}
                <div className="full-width">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-700 ml-1 mb-1 block">Select Active Loan *</label>
                  <Select
                    options={loanOptions}
                    value={selectedLoan}
                    onChange={(option) => setSelectedLoan(option)}
                    placeholder="Search by Receipt No or Name..."
                    className="text-xs font-semibold"
                    theme={(theme) => ({
                        ...theme,
                        borderRadius: 8,
                        colors: { ...theme.colors, primary: '#4f46e5' },
                    })}
                  />
                </div>

                <div className="span-2">
                  <FormField 
                    label="Payment Month *" 
                    name="payment_month" 
                    icon={Calendar} 
                    required 
                    placeholder="e.g., March 2026" 
                  />
                </div>

                <FormField 
                  label="Amount Paid (₹) *" 
                  name="amount_paid" 
                  type="number" 
                  icon={IndianRupee} 
                  required 
                  placeholder="0.00" 
                />

                <div className="col-span-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-800 ml-1 mb-1 block">Payment Mode</label>
                  <select name="payment_mode" defaultValue="Cash" className="w-full px-3 py-2 bg-white border border-[#cccccc] rounded-lg text-xs font-semibold text-slate-900 outline-none focus:border-indigo-600 transition-all">
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI / GPay</option>
                    <option value="Bank">Bank Transfer</option>
                  </select>
                </div>

                <div className="span-2">
                    <FormField 
                    label="Payment Date *" 
                    name="payment_date" 
                    type="date" 
                    icon={Calendar} 
                    defaultValue={new Date().toISOString().split('T')[0]} 
                    required 
                    />
                </div>

                <div className="full-width pt-4">
                  <Button type="submit" className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200">
                    <CheckCircle2 size={18} /> Confirm Interest Receipt
                  </Button>
                </div>

              </FormGrid>
            </form>
          </ModalContent>
        </ModalOverlay>
      )}
    </div>
  );
}