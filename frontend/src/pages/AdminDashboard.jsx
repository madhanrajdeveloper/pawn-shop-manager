// frontend/src/pages/AdminDashboard.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import apiClient from '../api/client';
import { 
  Database, Search, Download, IndianRupee, TrendingUp, 
  LogOut, ShieldCheck, UserCog, Trash2, LayoutDashboard, ShieldAlert,
  UserPlus, User, KeyRound, X
} from 'lucide-react';
import { 
  Card, FormField, DataTable, Button, 
  ModalOverlay, ModalContent, ModalHeader, FormGrid 
} from '../components/common/UIComponents';

export default function AdminDashboard() {
  const { customers, loans, stats, fetchCustomers, fetchLoans, fetchDashboardStats, logoutAdmin } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const navigate = useNavigate();

  // --- VIEWS & STATE ---
  const [activeView, setActiveView] = useState('overview'); // 'overview' or 'admins'
  const [regEnabled, setRegEnabled] = useState(localStorage.getItem('allowAdminReg') === 'true');
  const [adminList, setAdminList] = useState([]);

  // --- NEW: CREATE ADMIN MODAL STATE ---
  const [isAdminModalOpen, setAdminModalOpen] = useState(false);
  const [newAdminUsername, setNewAdminUsername] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminConfirmPassword, setNewAdminConfirmPassword] = useState('');
  const [adminError, setAdminError] = useState('');

  useEffect(() => {
    fetchCustomers(); 
    fetchLoans(); 
    fetchDashboardStats();
    fetchAdminList(); 
  }, [fetchCustomers, fetchLoans, fetchDashboardStats]);

  const handleLogout = () => { logoutAdmin(); navigate('/'); };

  const handleExport = async () => {
    try {
      const response = await apiClient.get('/export-excel');
      alert(`Backup Successful!\n\n${response.data.message}\nSaved to: ${response.data.path}`);
    } catch (error) { alert("Error generating backup. Check console."); }
  };

  const toggleRegistration = () => {
    const newState = !regEnabled;
    setRegEnabled(newState);
    localStorage.setItem('allowAdminReg', newState);
  };

  const fetchAdminList = async () => {
    try {
      const response = await apiClient.get('/admins/');
      setAdminList(response.data);
    } catch (error) {
      console.error("Failed to load admins", error);
    }
  };

  const handleDeleteAdmin = async (id, username) => {
    if (!window.confirm(`⚠️ WARNING: Are you sure you want to permanently revoke admin access for "${username}"?`)) return;
    try {
      await apiClient.delete(`/admins/${id}`);
      fetchAdminList(); 
    } catch (error) {
      alert(error.response?.data?.detail || "Error deleting admin.");
    }
  };

  // --- NEW: HANDLE CREATE ADMIN ---
  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setAdminError('');

    if (newAdminPassword !== newAdminConfirmPassword) {
      setAdminError('Passwords do not match.');
      return;
    }

    try {
      await apiClient.post('/admin/register', { 
        username: newAdminUsername, 
        password: newAdminPassword 
      });
      
      alert('New Administrator created successfully!');
      
      // Reset form & close modal
      setAdminModalOpen(false);
      setNewAdminUsername('');
      setNewAdminPassword('');
      setNewAdminConfirmPassword('');
      
      // Refresh the list immediately
      fetchAdminList();
    } catch (error) {
      setAdminError(error.response?.data?.detail || 'Error creating admin. Username might already exist.');
    }
  };

  const masterRecords = loans.map(loan => {
    const customer = customers.find(c => c.id === loan.customer_id);
    return { ...loan, customer_uid: customer?.customer_uid || 'UNKNOWN', customer_name: customer?.full_name || 'Unknown Customer' };
  });

  const filteredRecords = masterRecords.filter(record => {
    const matchesSearch = record.receipt_no.toLowerCase().includes(searchTerm.toLowerCase()) || record.customer_name.toLowerCase().includes(searchTerm.toLowerCase());
    if (filterType === 'Active') return matchesSearch && record.status === 'Active';
    if (filterType === 'Closed') return matchesSearch && record.status === 'Closed';
    return matchesSearch;
  });

  const MoneyCard = ({ title, value, icon: Icon, colorTheme }) => (
    <Card className="flex flex-col gap-3 hover:-translate-y-1 transition-transform border-none shadow-sm p-5">
      <div className={`w-12 h-12 flex items-center justify-center rounded-xl ${colorTheme}`}>
        <Icon size={24} />
      </div>
      <div className="mt-1">
        <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 truncate">{title}</p>
        <p className="text-lg md:text-xl font-black text-slate-900 tracking-tight break-words">{value}</p>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-10">
      
      {/* HEADER & LOGOUT */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 bg-slate-900 text-white p-6 rounded-3xl shadow-xl">
        <h1 className="text-2xl font-black flex items-center gap-3">
          <ShieldCheck className="text-emerald-400" size={32} />
          Admin Control Center
        </h1>
        
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer bg-slate-800 px-4 py-2 rounded-xl border border-slate-700 hover:bg-slate-700 transition-colors" title="Enable/Disable Registration from Login Page">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={regEnabled}
              onChange={toggleRegistration}
            />
            <div className="w-9 h-5 bg-slate-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all relative"></div>
            <span className="text-xs font-bold uppercase tracking-widest text-slate-300 peer-checked:text-emerald-400">
              {regEnabled ? 'Login Reg Open' : 'Login Reg Locked'}
            </span>
          </label>

          <Button variant="danger" onClick={handleLogout} className="bg-rose-500 hover:bg-rose-600 border-none shadow-lg">
            <LogOut size={16} /> Secure Logout
          </Button>
        </div>
      </div>

      {/* INNER NAVIGATION TABS */}
      <div className="flex gap-2 bg-slate-200/50 p-1.5 rounded-xl w-fit border border-slate-200">
        <button
          onClick={() => setActiveView('overview')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
            activeView === 'overview' 
              ? 'bg-white text-slate-900 shadow-sm' 
              : 'text-slate-500 hover:bg-slate-200/50 hover:text-slate-700'
          }`}
        >
          <LayoutDashboard size={16} /> Financial Overview
        </button>
        <button
          onClick={() => setActiveView('admins')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
            activeView === 'admins' 
              ? 'bg-white text-slate-900 shadow-sm' 
              : 'text-slate-500 hover:bg-slate-200/50 hover:text-slate-700'
          }`}
        >
          <UserCog size={16} /> Access Management
        </button>
      </div>

      {/* =========================================
          VIEW 1: FINANCIAL OVERVIEW & LEDGER 
          ========================================= */}
      {activeView === 'overview' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
            <MoneyCard title="Active Investment" value={`₹${(stats?.amount_invested || 0).toLocaleString()}`} icon={IndianRupee} colorTheme="bg-indigo-100 text-indigo-600" />
            <MoneyCard title="Principal Returned" value={`₹${(stats?.amount_returned || 0).toLocaleString()}`} icon={IndianRupee} colorTheme="bg-emerald-100 text-emerald-600" />
            <MoneyCard title="Total P&L" value={`₹${(stats?.profit_loss || 0).toLocaleString()}`} icon={TrendingUp} colorTheme={(stats?.profit_loss || 0) >= 0 ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"} />
            <MoneyCard title="Monthly Interest" value={`₹${(stats?.total_interest_earned_month || 0).toLocaleString()}`} icon={IndianRupee} colorTheme="bg-purple-100 text-purple-600" />
          </div>

          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex items-center gap-3">
                 <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Database size={24} /></div>
                 <div>
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">Master Ledger</h2>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Complete Transaction History</p>
                 </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-64">
                  <FormField icon={Search} placeholder="Search Master Ledger..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <Button variant="success" onClick={handleExport} className="py-2.5">
                  <Download size={16} /> Backup to Excel
                </Button>
              </div>
            </div>

            <div className="flex gap-2 mb-2">
              {['All', 'Active', 'Closed'].map(tab => (
                <button
                  key={tab} onClick={() => setFilterType(tab)}
                  className={`px-5 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all ${
                    filterType === tab ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {tab === 'All' ? 'Master View' : tab === 'Active' ? 'Active Register' : 'Settlement Register'}
                </button>
              ))}
            </div>

            <DataTable headers={['Receipt', 'Client', 'Item Details', 'Date', 'Principal (₹)', 'Settled Date', 'Final Settle (₹)']}>
              {filteredRecords.map((record) => (
                <tr key={record.receipt_no} className={`hover:bg-slate-50 transition-colors ${record.status === 'Closed' ? 'opacity-60' : ''}`}>
                  <td className="p-4 font-black text-slate-800">{record.receipt_no}</td>
                  <td className="p-4">
                    <span className="block font-bold text-slate-800">{record.customer_name}</span>
                    <span className="text-[10px] font-black uppercase text-indigo-500 tracking-widest">{record.customer_uid}</span>
                  </td>
                  <td className="p-4 text-slate-600 font-medium truncate max-w-[150px]">{record.gold_weight}g - {record.gold_description}</td>
                  <td className="p-4 text-slate-500 font-bold text-xs">{record.loan_date}</td>
                  <td className="p-4 font-black text-indigo-600 bg-indigo-50/30">₹{(record.loan_amount || 0).toLocaleString()}</td>
                  <td className="p-4 font-bold text-slate-500 text-xs bg-emerald-50/30">{record.closed_date || <span className="text-slate-300">Active</span>}</td>
                  <td className="p-4 font-black text-emerald-700 bg-emerald-50/30">{record.total_settlement_amount ? `₹${record.total_settlement_amount.toLocaleString()}` : '-'}</td>
                </tr>
              ))}
            </DataTable>
          </div>
        </div>
      )}

      {/* =========================================
          VIEW 2: ACCESS MANAGEMENT (ADMIN LIST)
          ========================================= */}
      {activeView === 'admins' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                  <ShieldAlert size={28} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">Authorized Administrators</h2>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Manage personnel with high-level access</p>
                </div>
              </div>
              
              {/* NEW: ADD ADMIN BUTTON */}
              <Button onClick={() => setAdminModalOpen(true)} className="whitespace-nowrap bg-indigo-600 hover:bg-indigo-700">
                <UserPlus size={16} /> Register New Admin
              </Button>
            </div>

            <DataTable headers={['Admin ID', 'Username', 'Account Status', 'Action']}>
              {adminList.map((admin) => (
                <tr key={admin.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-black text-slate-400">#{admin.id}</td>
                  <td className="p-4 font-bold text-slate-800 text-lg">{admin.username}</td>
                  <td className="p-4">
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest">
                      Active
                    </span>
                  </td>
                  <td className="p-4">
                    <Button 
                      variant="danger" 
                      onClick={() => handleDeleteAdmin(admin.id, admin.username)}
                      className="py-1.5 px-4 text-xs shadow-sm bg-white text-rose-600 border border-rose-200 hover:!bg-rose-600 hover:!text-white hover:border-rose-600"
                    >
                      <Trash2 size={14} /> Revoke Access
                    </Button>
                  </td>
                </tr>
              ))}
            </DataTable>

            <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
              <p className="text-xs font-bold text-amber-800 flex items-center gap-2">
                <ShieldCheck size={16} /> 
                System Safeguard: The system will automatically prevent you from deleting the last remaining administrator account to ensure you do not get locked out.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =========================================
          MODAL: CREATE NEW ADMIN
          ========================================= */}
      {isAdminModalOpen && (
        <ModalOverlay>
          <ModalContent size="450px">
            <ModalHeader>
              <h2 className="text-lg font-black text-slate-800 uppercase tracking-tighter flex items-center gap-2">
                <UserPlus size={18} className="text-indigo-600" /> Register Admin
              </h2>
              <button 
                onClick={() => {
                  setAdminModalOpen(false);
                  setAdminError('');
                }} 
                className="hover:text-red-500 transition-colors"
              >
                <X size={20} />
              </button>
            </ModalHeader>

            <form onSubmit={handleCreateAdmin} className="p-6 space-y-4">
              {adminError && (
                <div className="bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-widest p-3 rounded-lg text-center border border-rose-100">
                  {adminError}
                </div>
              )}

              <FormField 
                label="Username" 
                icon={User} 
                type="text" 
                value={newAdminUsername}
                onChange={(e) => setNewAdminUsername(e.target.value)}
                placeholder="Enter new admin ID"
                required
              />

              <FormField 
                label="Secure Password" 
                icon={KeyRound} 
                type="password" 
                value={newAdminPassword}
                onChange={(e) => setNewAdminPassword(e.target.value)}
                placeholder="••••••••"
                required
              />

              <FormField 
                label="Confirm Password" 
                icon={KeyRound} 
                type="password" 
                value={newAdminConfirmPassword}
                onChange={(e) => setNewAdminConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
              />

              <div className="pt-4">
                <Button type="submit" className="w-full py-3.5 text-sm bg-indigo-600 hover:bg-indigo-700 shadow-lg">
                  Grant Admin Access
                </Button>
              </div>
            </form>
          </ModalContent>
        </ModalOverlay>
      )}

    </div>
  );
}