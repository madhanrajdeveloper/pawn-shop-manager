// frontend/src/pages/AgingDashboard.jsx
import { useEffect, useState } from 'react';
import apiClient from '../api/client';
import useStore from '../store/useStore';
import { Clock, Search, AlertCircle, Calendar, ArrowRight, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Import our High-Contrast Atomic Components
import { 
  FormField, 
  DataTable, 
  Button, 
  theme 
} from '../components/common/UIComponents';

export default function AgingDashboard() {
  const navigate = useNavigate();
  const { customers, fetchCustomers } = useStore();
  const [agingData, setAgingData] = useState({ one_year: [], two_years: [], three_years: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('one_year');
  const [searchTerm, setSearchTerm] = useState('');
  const [alertShown, setAlertShown] = useState(false);

  useEffect(() => {
    if (customers.length === 0) fetchCustomers();
    
    const fetchAgingLoans = async () => {
      try {
        const response = await apiClient.get('/dashboard/aging/');
        setAgingData(response.data);
        setLoading(false);

        // System-wide pop-up notification for loans > 12 months
        const totalOverdue = 
          response.data.one_year.length + 
          response.data.two_years.length + 
          response.data.three_years.length;

        if (!alertShown && totalOverdue > 0) {
          alert(`⚠️ AGING RECOVERY ALERT: You have ${totalOverdue} active pledges older than 1 year. Please review for recovery or auction.`);
          setAlertShown(true);
        }
      } catch (error) {
        console.error("Failed to fetch aging data", error);
        setLoading(false);
      }
    };

    fetchAgingLoans();
  }, [customers.length, fetchCustomers, alertShown]);

  // Helper to match customer name for the table
  const getCustomerInfo = (customerId) => {
    const cust = customers.find(c => c.id === customerId);
    return cust ? { name: cust.full_name, uid: cust.customer_uid } : { name: 'Unknown', uid: 'N/A' };
  };

  // Filter current tab's data based on search
  const currentData = agingData[activeTab].filter(loan => {
    const custInfo = getCustomerInfo(loan.customer_id);
    const term = searchTerm.toLowerCase();
    return (
      loan.receipt_no.toLowerCase().includes(term) ||
      custInfo.name.toLowerCase().includes(term) ||
      custInfo.uid.toLowerCase().includes(term)
    );
  });

  // Client Requirement: Color Coding based on age bracket
  const getRowTheme = (tab) => {
    if (tab === 'three_years') return { row: 'bg-rose-50/50 hover:bg-rose-100/80', text: 'text-rose-700', badge: 'bg-rose-600 text-white' }; 
    if (tab === 'two_years') return { row: 'bg-amber-50/50 hover:bg-amber-100/80', text: 'text-amber-700', badge: 'bg-amber-600 text-white' }; 
    return { row: 'bg-indigo-50/30 hover:bg-indigo-100/50', text: 'text-indigo-800', badge: 'bg-indigo-600 text-white' }; 
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-rose-100 rounded-xl text-rose-600">
            <ShieldAlert size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Recovery Dashboard</h1>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Identifying loans exceeding 12 months</p>
          </div>
        </div>
        
        <div className="w-full md:w-80">
          <FormField 
            icon={Search} 
            placeholder="Search Overdue Receipt or Name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* DURATION SEGREGATION MENU (TABS) */}
      <div className="flex flex-wrap gap-3 bg-slate-100 p-1.5 rounded-2xl w-fit border border-slate-200">
        <button
          onClick={() => setActiveTab('one_year')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
            activeTab === 'one_year' 
              ? 'bg-indigo-600 text-white shadow-lg' 
              : 'text-slate-500 hover:bg-slate-200'
          }`}
        >
          <Clock size={16} /> 1 - 2 Years ({agingData.one_year.length})
        </button>
        <button
          onClick={() => setActiveTab('two_years')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
            activeTab === 'two_years' 
              ? 'bg-amber-600 text-white shadow-lg' 
              : 'text-slate-500 hover:bg-slate-200'
          }`}
        >
          <AlertCircle size={16} /> 2 - 3 Years ({agingData.two_years.length})
        </button>
        <button
          onClick={() => setActiveTab('three_years')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
            activeTab === 'three_years' 
              ? 'bg-rose-600 text-white shadow-lg' 
              : 'text-slate-500 hover:bg-slate-200'
          }`}
        >
          <ShieldAlert size={16} /> 3+ Years ({agingData.three_years.length})
        </button>
      </div>

      {/* AGING DATA TABLE */}
      <DataTable headers={['Receipt', 'Client Detail', 'Jewel Description', 'Principal', 'Loan Date', 'Action']}>
        {loading ? (
          <tr><td colSpan="6" className="p-10 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">Scanning Ledger...</td></tr>
        ) : currentData.length === 0 ? (
          <tr><td colSpan="6" className="p-10 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">No pledges found in this bracket</td></tr>
        ) : currentData.map((loan) => {
          const custInfo = getCustomerInfo(loan.customer_id);
          const activeTheme = getRowTheme(activeTab);
          return (
            <tr key={loan.receipt_no} className={`${activeTheme.row} transition-colors border-b border-white/50`}>
              <td className="p-4">
                <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${activeTheme.badge}`}>
                  {loan.receipt_no}
                </span>
              </td>
              <td className="p-4">
                <span className="font-bold text-slate-800 block">{custInfo.name}</span>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{custInfo.uid}</span>
              </td>
              <td className="p-4 font-medium text-slate-700 max-w-[250px] truncate" title={loan.gold_description}>
                {loan.gold_weight}g - {loan.gold_description}
              </td>
              <td className="p-4 font-black text-slate-900">₹{(loan.loan_amount || 0).toLocaleString()}</td>
              <td className="p-4">
                <div className="flex items-center gap-2 font-bold text-slate-600">
                  <Calendar size={14} className="text-slate-400" /> {loan.loan_date}
                </div>
              </td>
              <td className="p-4">
                <Button 
                  onClick={() => navigate(`/customer/${loan.customer_id}`)}
                  className="py-1 px-3 text-[9px] bg-white text-slate-700 hover:bg-slate-900 hover:text-white border border-slate-200 shadow-sm"
                >
                  View Profile <ArrowRight size={12} />
                </Button>
              </td>
            </tr>
          );
        })}
      </DataTable>

    </div>
  );
}