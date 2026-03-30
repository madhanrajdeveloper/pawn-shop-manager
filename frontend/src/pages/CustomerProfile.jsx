// frontend/src/pages/CustomerProfile.jsx
import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import { ArrowLeft, UserCircle, Phone, MapPin, IndianRupee, Layers, AlertCircle } from 'lucide-react';
import { Card, DataTable, Button } from '../components/common/UIComponents';

export default function CustomerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { customers, loans, fetchCustomers, fetchLoans } = useStore();

  useEffect(() => {
    if (customers.length === 0) fetchCustomers();
    if (loans.length === 0) fetchLoans();
  }, [customers.length, loans.length, fetchCustomers, fetchLoans]);

  const customer = customers.find(c => c.id === id);

  if (!customer) {
    return <div className="p-10 text-center text-slate-500 font-bold uppercase tracking-widest">Loading Client Data...</div>;
  }

  // --- LIVE PLEDGE CALCULATOR ---
  const activeLoans = loans.filter(l => l.customer_id === id && l.status === "Active");
  let totalPrincipal = 0;
  let totalLiveInterest = 0;

  const pledges = activeLoans.map(loan => {
    totalPrincipal += loan.loan_amount;
    const loanDate = new Date(loan.loan_date);
    const today = new Date();
    const daysActive = Math.floor((today - loanDate) / (1000 * 60 * 60 * 24));
    const monthsActive = Math.max(1, +(daysActive / 30).toFixed(1)); 
    
    const liveInterest = loan.loan_amount * (loan.monthly_rate_of_interest / 100) * monthsActive;
    totalLiveInterest += liveInterest;

    return { ...loan, monthsActive, liveInterest };
  });

  const StatCard = ({ title, value, icon: Icon, colorTheme }) => (
    <Card className="flex items-center gap-4 hover:-translate-y-1 transition-transform border-none shadow-sm p-6">
      <div className={`w-12 h-12 flex items-center justify-center rounded-xl ${colorTheme}`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">{title}</p>
        <p className="text-3xl font-black text-slate-900 tracking-tight">{value}</p>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* HEADER & CLIENT INFO */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-5">
          <div className="bg-indigo-100 p-4 rounded-2xl text-indigo-600">
            <UserCircle size={40} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">{customer.full_name}</h1>
              <span className="bg-indigo-600 text-white text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest">{customer.customer_uid}</span>
            </div>
            <div className="flex items-center gap-4 mt-2 text-xs font-bold text-slate-500">
              <span className="flex items-center gap-1"><Phone size={14} /> {customer.phone_number}</span>
              <span className="flex items-center gap-1"><MapPin size={14} /> {customer.address}</span>
            </div>
          </div>
        </div>
        <Button variant="secondary" onClick={() => navigate('/customers')} className="py-2.5">
          <ArrowLeft size={16} /> Back to Directory
        </Button>
      </div>

      {/* FINANCIAL SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard title="Active Pledges" value={pledges.length} icon={Layers} colorTheme="bg-blue-100 text-blue-600" />
        <StatCard title="Total Principal" value={`₹${totalPrincipal.toLocaleString()}`} icon={IndianRupee} colorTheme="bg-indigo-100 text-indigo-600" />
        <StatCard title="Live Interest Owed" value={`₹${totalLiveInterest.toLocaleString(undefined, {maximumFractionDigits: 0})}`} icon={AlertCircle} colorTheme="bg-rose-100 text-rose-600" />
      </div>

      {/* ACTIVE PLEDGES TABLE */}
      <div className="pt-2">
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 pl-2">Current Active Ledger</h3>
        <DataTable headers={['Receipt', 'Loan Date', 'Item Details', 'Weight', 'Principal (₹)', 'Rate (%)']}>
          {pledges.length === 0 ? (
            <tr><td colSpan="6" className="p-10 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">No active pledges</td></tr>
          ) : pledges.map(loan => (
            <tr key={loan.receipt_no} className="hover:bg-slate-50 transition-colors">
              <td className="p-4 font-black text-indigo-600">{loan.receipt_no}</td>
              <td className="p-4 font-bold text-slate-500 text-xs">{loan.loan_date}</td>
              <td className="p-4 text-slate-800 font-bold truncate max-w-[200px]">{loan.gold_description}</td>
              <td className="p-4 font-medium text-slate-600">{loan.gold_weight}g</td>
              <td className="p-4 font-black text-slate-900 bg-slate-50/50">₹{loan.loan_amount.toLocaleString()}</td>
              <td className="p-4 font-bold text-slate-500">{loan.monthly_rate_of_interest}%</td>
            </tr>
          ))}
        </DataTable>
      </div>
      
    </div>
  );
}