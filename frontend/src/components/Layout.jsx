// frontend/src/components/Layout.jsx
import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import useStore from '../store/useStore';
import { 
  LayoutDashboard, Users, CircleDollarSign, 
  Printer, SquaresIntersect, ShoppingBasket, Clock, Lock,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import logo from '../assets/logo.png';

export default function Layout() {
  const location = useLocation();
  const currentPath = location.pathname;
  
  // --- SIDEBAR STATE ---
  const [isCollapsed, setIsCollapsed] = useState(false);

  const { setCustomerModal, setLoanModal, setPaymentModal, setBuySellModal } = useStore();

  // Force close any open modals when navigating to avoid "Invisible Shield" freeze
  useEffect(() => {
    if (setCustomerModal) setCustomerModal(false);
    if (setLoanModal) setLoanModal(false);
    if (setPaymentModal) setPaymentModal(false);
    if (setBuySellModal) setBuySellModal(false);
  }, [currentPath, setCustomerModal, setLoanModal, setPaymentModal, setBuySellModal]);

  const NavItem = ({ to, icon: Icon, label }) => {
    const isActive = currentPath === to;
    return (
      <Link 
        to={to} 
        title={isCollapsed ? label : ""}
        className={`flex items-center gap-3 p-3 rounded-xl transition-all font-bold text-sm ${
          isActive 
            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20' 
            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
        } ${isCollapsed ? 'justify-center px-2' : ''}`}
      >
        <Icon size={20} className="shrink-0" /> 
        {!isCollapsed && <span className="truncate">{label}</span>}
      </Link>
    );
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900 overflow-hidden">
      
      {/* SIDEBAR (z-10 allows Modals at z-9999 to cover it) */}
      <aside 
        className={`bg-slate-950 text-white flex flex-col shadow-2xl z-10 transition-all duration-300 ease-in-out border-r border-slate-800/50 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* LOGO SECTION */}
        <div className={`p-6 flex items-center transition-all ${isCollapsed ? 'justify-center px-2' : 'gap-x-3'}`}>
          <img src={logo} alt="Logo" className="w-10 h-10 object-contain shrink-0" />
          {!isCollapsed && (
            <div className="animate-in fade-in duration-500">
              <h2 className="text-lg font-black tracking-tight text-white leading-none">Pawn Shop</h2>
              <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest mt-1">Management V2</p>
            </div>
          )}
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto scrollbar-hide">
          <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
          <NavItem to="/customers" icon={Users} label="Customers" />
          <NavItem to="/loans" icon={CircleDollarSign} label="Loan Ledger" />
          <NavItem to="/receipts" icon={Printer} label="Receipts" />
          <NavItem to="/interest" icon={SquaresIntersect} label="Interest Tracker" />
          <NavItem to="/buy-sell" icon={ShoppingBasket} label="Buy & Sell" />
          <NavItem to="/aging" icon={Clock} label="Recovery/Aging" />

          {/* SECURE ADMIN ACCESS BUTTON */}
          <div className={`pt-6 mt-4 border-t border-slate-800/50 ${isCollapsed ? 'px-0' : ''}`}>
            <Link 
              to="/admin-dashboard" 
              title={isCollapsed ? "Admin Control" : ""}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-sm ${
                currentPath.includes('admin')
                  ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400 font-black'
                  : 'bg-slate-900 border-slate-800 text-slate-400 font-bold hover:border-emerald-500/30 hover:text-emerald-400'
              } ${isCollapsed ? 'justify-center px-2' : ''}`}
            >
              <Lock size={18} className="shrink-0" /> 
              {!isCollapsed && <span>Admin Control</span>}
            </Link>
          </div>
        </nav>

        {/* FOOTER: COLLAPSE TOGGLE AT BOTTOM */}
        <div className="p-3 border-t border-slate-800/50 bg-slate-900/30">
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all font-bold text-sm ${
              isCollapsed ? 'justify-center' : ''
            }`}
          >
            {isCollapsed ? (
              <ChevronRight size={20} />
            ) : (
              <>
                <ChevronLeft size={20} />
                <span>Collapse Menu</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto relative bg-[#f8fafc]">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}