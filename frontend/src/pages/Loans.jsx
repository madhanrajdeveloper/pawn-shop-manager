// frontend/src/pages/Loans.jsx
import { useEffect, useState } from 'react';
import Select from 'react-select'; 
import useStore from '../store/useStore';
import apiClient from '../api/client';
import { CircleDollarSign, X, Search, CheckCircle, Info, Calendar, Percent, Scale, Bookmark } from 'lucide-react';

// Import our new Atomic Design System
import { 
  FormField, 
  DataTable, 
  Button, 
  ModalOverlay, 
  ModalContent, 
  ModalHeader, 
  FormGrid 
} from '../components/common/UIComponents';

export default function Loans() {
  const { 
    customers, loans, fetchCustomers, fetchLoans, fetchDashboardStats, addLoan,
    isLoanModalOpen, setLoanModal 
  } = useStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);

  useEffect(() => {
    fetchCustomers();
    fetchLoans();
  }, [fetchCustomers, fetchLoans]);

  const customerOptions = customers.map(c => ({
    value: c.id,
    label: `${c.customer_uid} - ${c.full_name} (${c.phone_number})`
  }));

  const handleCreateLoan = async (e) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      alert("Please select a customer.");
      return;
    }
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    data.customer_id = selectedCustomerId;

    const success = await addLoan(data);
    if (success) {
      ("Loan Created Successfully!");
      setLoanModal(false);
      setSelectedCustomerId(null);
    }
  };

  const handleCloseLoan = async (receiptNo) => {
    if (!window.confirm(`Close loan ${receiptNo}? Final interest will be calculated.`)) return;
    try {
      const response = await apiClient.put(`/loans/${receiptNo}/close`);
      alert(`Loan Closed!\n\nInterest: ₹${response.data.total_interest_paid}\nSettlement: ₹${response.data.total_settlement_amount}`);
      fetchLoans();
      fetchDashboardStats();
    } catch (error) {
      alert("Error closing loan.");
    }
  };

  const filteredLoans = loans.filter(loan => {
    const term = searchTerm.toLowerCase();
    const customer = customers.find(c => c.id === loan.customer_id);
    const name = customer ? customer.full_name.toLowerCase() : '';
    const uid = customer ? (customer.customer_uid || "").toLowerCase() : '';
    return loan.receipt_no.toLowerCase().includes(term) || name.includes(term) || uid.includes(term);
  });

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Loan Ledger</h1>
        
        <div className="flex items-center gap-3">
          <div className="w-64">
            <FormField 
              icon={Search} 
              placeholder="Quick Search..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button onClick={() => setLoanModal(true)} className="whitespace-nowrap">
            <CircleDollarSign size={16} /> New Loan
          </Button>
        </div>
      </div>

      {/* REUSABLE DATA TABLE */}
      <DataTable headers={['Receipt', 'Customer', 'Gold Info', 'Weight', 'Principal (₹)', 'Rate (%)', 'Date', 'Action']}>
        {filteredLoans.length === 0 ? (
          <tr><td colSpan="8" className="p-10 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">No records found</td></tr>
        ) : filteredLoans.map(loan => {
          const cust = customers.find(c => c.id === loan.customer_id);
          return (
            <tr key={loan.receipt_no} className={`hover:bg-indigo-50/40 transition-colors group ${loan.status === 'Closed' ? 'opacity-50' : ''}`}>
              <td className="p-3 font-black text-indigo-600">{loan.receipt_no}</td>
              <td className="p-3">
                <span className="font-bold text-slate-800 block">{cust?.full_name || 'Unknown'}</span>
                <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[9px] font-black uppercase tracking-widest border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  {cust?.customer_uid}
                </span>
              </td>
              <td className="p-3 font-medium text-slate-600 truncate max-w-[150px]">{loan.gold_description}</td>
              <td className="p-3 font-bold text-slate-700">{loan.gold_weight}g</td>
              <td className="p-3 font-black text-slate-900">₹{(loan.loan_amount || 0).toLocaleString()}</td>
              <td className="p-3 font-bold text-slate-500">{loan.monthly_rate_of_interest}%</td>
              <td className="p-3 text-slate-500 font-medium">{loan.loan_date}</td>
              <td className="p-3">
                {loan.status === 'Active' ? (
                  <Button variant="success" onClick={() => handleCloseLoan(loan.receipt_no)} className="text-[9px] py-1 px-3">
                    <CheckCircle size={12} /> Close Loan
                  </Button>
                ) : (
                  <span className="text-[9px] font-black uppercase text-slate-400 bg-slate-100 px-3 py-1 rounded">Settled</span>
                )}
              </td>
            </tr>
          );
        })}
      </DataTable>

      {/* SEAMLESS MODAL (NO SCROLL) */}
      {isLoanModalOpen && (
        <ModalOverlay>
          <ModalContent size="850px">
            <ModalHeader>
              <h2 className="text-lg font-black text-slate-800 uppercase tracking-tighter flex items-center gap-2">
                <CircleDollarSign size={18} className="text-indigo-600" /> Issue Gold Loan
              </h2>
              <button onClick={() => setLoanModal(false)} className="p-1 hover:text-red-500 transition-colors">
                <X size={20} />
              </button>
            </ModalHeader>

            <form onSubmit={handleCreateLoan} className="p-5">
              <FormGrid>
                {/* Row 1: Customer Selection spans entire width for better readability */}
                <div className="full-width">
                  <label className="text-[9px] font-black uppercase tracking-tighter text-slate-400 ml-1 mb-1 block">Search Customer *</label>
                  <Select 
                    options={customerOptions}
                    onChange={(opt) => setSelectedCustomerId(opt.value)}
                    className="text-xs font-semibold"
                    placeholder="Type name, phone or VM ID..."
                    isSearchable
                  />
                </div>

                {/* Row 2: Description and Weight */}
                <div className="span-2">
                  <FormField 
                    label="Gold Description *" 
                    name="gold_description" 
                    icon={Info} 
                    required 
                    placeholder="e.g. 22K Bangle (2 Nos), 1 Chain" 
                  />
                </div>
                <FormField 
                  label="Weight (g) *" 
                  name="gold_weight" 
                  type="number" 
                  step="0.01" 
                  icon={Scale} 
                  required 
                  placeholder="0.00"
                />

                {/* Row 3: Financials */}
                <FormField 
                  label="Loan Principal (₹) *" 
                  name="loan_amount" 
                  type="number" 
                  icon={CircleDollarSign} 
                  required 
                  placeholder="50000"
                />
                <FormField 
                  label="Monthly Rate (%) *" 
                  name="monthly_rate_of_interest" 
                  type="number" 
                  step="0.1" 
                  icon={Percent} 
                  required 
                  placeholder="1.5"
                />
                <FormField 
                  label="Loan Date *" 
                  name="loan_date" 
                  type="date" 
                  icon={Calendar} 
                  defaultValue={new Date().toISOString().split('T')[0]} 
                  required 
                />

                {/* Row 4: Remarks & Final Action */}
                <div className="full-width">
                   <FormField 
                    label="Internal Remarks (Optional)" 
                    name="remarks" 
                    icon={Bookmark} 
                    placeholder="Any specific condition or notes about this loan..." 
                  />
                </div>

                <div className="full-width pt-2">
                  <Button type="submit" className="w-full py-3 text-sm uppercase tracking-widest bg-indigo-600 shadow-indigo-200 shadow-lg hover:shadow-none transition-all">
                    Finalize & Issue Loan
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