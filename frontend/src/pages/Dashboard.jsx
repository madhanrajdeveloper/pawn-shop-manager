// frontend/src/pages/Dashboard.jsx
import { useEffect, useState } from 'react';
import apiClient from '../api/client';
import { Users, FileText, IndianRupee, Weight, AlertTriangle, ShoppingBag, Calendar } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    total_customers: 0,
    total_active_loans: 0,
    total_loan_amount_outstanding: 0,
    total_interest_earned_month: 0,
    total_gold_in_locker: 0,
    overdue_loans: 0,
    total_gold_bought: 0,
    total_gold_sold: 0,
    today_date: ''
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await apiClient.get('/dashboard-summary/');
        setStats(response.data);
      } catch (error) { console.error(error); }
    };
    fetchStats();
  }, []);

  const Card = ({ title, value, icon: Icon, colorClass }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
      <div className={`p-4 rounded-lg ${colorClass}`}>
        <Icon size={28} />
      </div>
      <div>
        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-black text-gray-800">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-extrabold text-gray-900">Dashboard Overview</h1>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-gray-200 text-gray-600 font-medium">
          <Calendar size={18} /> {stats.today_date}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card title="Active Loans" value={stats.total_active_loans} icon={FileText} colorClass="bg-blue-100 text-blue-600" />
        <Card title="Outstanding" value={`₹${stats.total_loan_amount_outstanding.toLocaleString()}`} icon={IndianRupee} colorClass="bg-green-100 text-green-600" />
        <Card title="Monthly Interest" value={`₹${stats.total_interest_earned_month.toLocaleString()}`} icon={IndianRupee} colorClass="bg-emerald-100 text-emerald-600" />
        <Card title="Gold in Locker" value={`${stats.total_gold_in_locker}g`} icon={Weight} colorClass="bg-yellow-100 text-yellow-600" />
        <Card title="Total Customers" value={stats.total_customers} icon={Users} colorClass="bg-indigo-100 text-indigo-600" />
        <Card title="Overdue Loans" value={stats.overdue_loans} icon={AlertTriangle} colorClass="bg-red-100 text-red-600" />
        <Card title="Gold Bought" value={`${stats.total_gold_bought}g`} icon={ShoppingBag} colorClass="bg-orange-100 text-orange-600" />
        <Card title="Gold Sold" value={`${stats.total_gold_sold}g`} icon={ShoppingBag} colorClass="bg-slate-100 text-slate-600" />
      </div>
    </div>
  );
}