// frontend/src/pages/Dashboard.jsx
import { useEffect } from 'react';
import useStore from '../store/useStore';
import { Users, FileText, Weight, ShoppingBag, Calendar } from 'lucide-react';
import { Card } from '../components/common/UIComponents';

export default function Dashboard() {
  const { stats, fetchDashboardStats } = useStore();

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  const StatCard = ({ title, value, icon: Icon, colorTheme }) => (
    <Card className="flex items-center gap-5 hover:scale-[1.02] transition-transform cursor-default border-none shadow-sm">
      <div className={`p-4 rounded-2xl ${colorTheme}`}>
        <Icon size={28} />
      </div>
      <div>
        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">{title}</p>
        <p className="text-3xl font-black text-slate-800 tracking-tight">{value}</p>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Staff Dashboard</h1>
          <p className="text-sm font-bold text-slate-500 mt-1">Daily Operations Overview</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm shadow-inner">
          <Calendar size={18} className="text-indigo-600" /> 
          {stats?.today_date || new Date().toLocaleDateString()}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <StatCard title="Active Loans" value={stats?.total_active_loans || 0} icon={FileText} colorTheme="bg-indigo-100 text-indigo-600" />
        <StatCard title="Total Customers" value={stats?.total_customers || 0} icon={Users} colorTheme="bg-purple-100 text-purple-600" />
        <StatCard title="Gold in Locker" value={`${stats?.total_gold_in_locker || 0}g`} icon={Weight} colorTheme="bg-amber-100 text-amber-600" />
        <StatCard title="Gold Bought" value={`${stats?.total_gold_bought || 0}g`} icon={ShoppingBag} colorTheme="bg-emerald-100 text-emerald-600" />
        <StatCard title="Gold Sold" value={`${stats?.total_gold_sold || 0}g`} icon={ShoppingBag} colorTheme="bg-rose-100 text-rose-600" />
      </div>
    </div>
  );
}