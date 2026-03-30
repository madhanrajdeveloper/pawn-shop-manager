// frontend/src/pages/MasterDatabase.jsx
import { useEffect, useState } from 'react';
import useStore from '../store/useStore';
import { Database, Search, Download } from 'lucide-react';
import { FormField, DataTable, Button } from '../components/common/UIComponents';

export default function MasterDatabase() {
  const { customers, loans, loading, fetchCustomers, fetchLoans } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All'); // 'All', 'Active', or 'Closed'

  useEffect(() => {
    fetchCustomers();
    fetchLoans();
  }, [fetchCustomers, fetchLoans]);

  const masterRecords = loans.map(loan => {
    const customer = customers.find(c => c.id === loan.customer_id);
    return {
      ...loan,
      customer_uid: customer ? customer.customer_uid : 'UNKNOWN',
      customer_name: customer ? customer.full_name : 'Unknown Customer',
    };
  });

  const filteredRecords = masterRecords.filter(record => {
    const matchesSearch = 
      record.receipt_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.customer_uid.toLowerCase().includes(searchTerm.toLowerCase());
      
    if (filterType === 'Active') return matchesSearch && record.status === 'Active';
    if (filterType === 'Closed') return matchesSearch && record.status === 'Closed';
    return matchesSearch;
  });

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
            <Database size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Master Ledger</h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Complete Transaction History</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="w-64">
            <FormField 
              icon={Search} 
              placeholder="Search Ledger..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="success" className="py-2.5">
            <Download size={16} /> Export Excel
          </Button>
        </div>
      </div>

      {/* FILTER TABS */}
      <div className="flex gap-2">
        {['All', 'Active', 'Closed'].map(tab => (
          <button
            key={tab}
            onClick={() => setFilterType(tab)}
            className={`px-5 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all ${
              filterType === tab 
                ? 'bg-slate-900 text-white shadow-md' 
                : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {tab === 'All' ? 'Master View' : tab === 'Active' ? 'Active Register' : 'Settlement Register'}
          </button>
        ))}
      </div>

      {/* MASTER DATA TABLE */}
      <DataTable headers={['Receipt', 'Client', 'Item Details', 'Loan Date', 'Principal (₹)', 'Status', 'Closed Date', 'Final Settle (₹)']}>
        {loading ? (
          <tr><td colSpan="8" className="p-10 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">Loading Ledger...</td></tr>
        ) : filteredRecords.length === 0 ? (
          <tr><td colSpan="8" className="p-10 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">No records found</td></tr>
        ) : filteredRecords.map((record) => (
          <tr key={record.receipt_no} className={`hover:bg-slate-50 transition-colors ${record.status === 'Closed' ? 'opacity-60' : ''}`}>
            <td className="p-3 font-black text-slate-800">{record.receipt_no}</td>
            <td className="p-3">
              <span className="block font-bold text-slate-800">{record.customer_name}</span>
              <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">{record.customer_uid}</span>
            </td>
            <td className="p-3 text-slate-600 font-medium truncate max-w-[150px] text-xs" title={record.gold_description}>
              {record.gold_weight}g - {record.gold_description}
            </td>
            <td className="p-3 text-slate-500 font-bold text-xs">{record.loan_date}</td>
            <td className="p-3 font-black text-indigo-600 bg-indigo-50/30">₹{(record.loan_amount || 0).toLocaleString()}</td>
            <td className="p-3">
              <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${
                record.status === 'Active' ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' : 'bg-slate-100 text-slate-600'
              }`}>
                {record.status}
              </span>
            </td>
            <td className="p-3 font-bold text-slate-500 text-xs bg-emerald-50/30">
              {record.closed_date || '-'}
            </td>
            <td className="p-3 font-black text-emerald-700 bg-emerald-50/30">
              {record.total_settlement_amount ? `₹${record.total_settlement_amount.toLocaleString()}` : '-'}
            </td>
          </tr>
        ))}
      </DataTable>

    </div>
  );
}