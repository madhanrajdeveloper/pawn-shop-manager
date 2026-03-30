// frontend/src/pages/Dashboard.jsx
import { useEffect, useState } from 'react';
import useStore from '../store/useStore';
import { Users, FileText, Weight, ShoppingBag, Calendar, Loader2 } from 'lucide-react';
import { Card } from '../components/common/UIComponents';

export default function Dashboard() {
  const { stats, fetchDashboardStats } = useStore();
  
  // Start with the loader active
  const [isConnecting, setIsConnecting] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let pollInterval;

    const bootUpAndFetch = async () => {
      // 1. Tell the store to try fetching the data
      await fetchDashboardStats();
      
      try {
        // 2. Ping the server directly to verify it is actually awake
        const res = await fetch('http://localhost:8000/dashboard-summary/');
        
        // 3. If we get a 200 OK, the server is UP! 
        if (res.ok && isMounted) {
          setIsConnecting(false);      // Turn off the spinner
          clearInterval(pollInterval); // Stop asking the server
        }
      } catch (error) {
        // Server is still sleeping (ERR_CONNECTION_REFUSED). 
        // We do nothing, let the spinner keep spinning, and the interval will try again!
      }
    };

    // Fire the first attempt immediately
    bootUpAndFetch();

    // Set up the Polling System: Try again every 2 seconds until it connects
    pollInterval = setInterval(bootUpAndFetch, 2000);

    // Ultimate Fallback: Force the spinner to stop after 12 seconds 
    // (Just in case the backend crashed completely, so the user isn't stuck forever)
    const safetyTimeout = setTimeout(() => {
      if (isMounted) setIsConnecting(false);
      clearInterval(pollInterval);
    }, 12000);

    // Cleanup process when the user navigates to another page
    return () => {
      isMounted = false;
      clearInterval(pollInterval);
      clearTimeout(safetyTimeout);
    };
  }, [fetchDashboardStats]);

  // The Card Component with the built-in loader
  const StatCard = ({ title, value, icon: Icon, colorTheme, isLoading }) => (
    <Card className="flex items-center gap-5 hover:scale-[1.02] transition-transform cursor-default border-none shadow-sm">
      <div className={`p-4 rounded-2xl ${colorTheme}`}>
        <Icon size={28} />
      </div>
      <div className="flex flex-col justify-center min-h-[50px]">
        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">{title}</p>
        
        {isLoading ? (
          <div className="flex items-center h-[36px]">
            <Loader2 size={24} className="text-slate-400 animate-spin" />
          </div>
        ) : (
          <p className="text-3xl font-black text-slate-800 tracking-tight leading-none animate-in fade-in duration-300">
            {value}
          </p>
        )}
      </div>
    </Card>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* HEADER SECTION */}
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

      {/* CARD GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <StatCard isLoading={isConnecting} title="Active Loans" value={stats?.total_active_loans || 0} icon={FileText} colorTheme="bg-indigo-100 text-indigo-600" />
        <StatCard isLoading={isConnecting} title="Total Customers" value={stats?.total_customers || 0} icon={Users} colorTheme="bg-purple-100 text-purple-600" />
        <StatCard isLoading={isConnecting} title="Gold in Locker" value={`${stats?.total_gold_in_locker || 0}g`} icon={Weight} colorTheme="bg-amber-100 text-amber-600" />
        <StatCard isLoading={isConnecting} title="Gold Bought" value={`${stats?.total_gold_bought || 0}g`} icon={ShoppingBag} colorTheme="bg-emerald-100 text-emerald-600" />
        <StatCard isLoading={isConnecting} title="Gold Sold" value={`${stats?.total_gold_sold || 0}g`} icon={ShoppingBag} colorTheme="bg-rose-100 text-rose-600" />
      </div>
      
    </div>
  );
}