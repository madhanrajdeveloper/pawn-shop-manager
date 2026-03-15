// frontend/src/components/Layout.jsx
import { Link, Outlet } from 'react-router-dom';
import { LayoutDashboard, Users, CircleDollarSign, HardDriveDownload, Printer, SquaresIntersect, ShoppingBasket } from 'lucide-react';
import apiClient from '../api/client';
import logo from '../assets/logo.png';

export default function Layout() {
    const handleBackup = async () => {
        try {
            const response = await apiClient.get('/export-excel');
            alert(`Success: ${response.data.message}\nSaved to: ${response.data.path}`);
        } catch (error) {
            alert("Error generating backup.");
        }
    };

    return (
        <div className="flex h-screen bg-gray-100 text-gray-900 font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-white flex flex-col">
                <div className="p-6 text-2xl font-bold border-b border-slate-800 text-yellow-400 flex gap-x-4 items-center align-middle">
                     <img src={logo} alt="Logo" />
                     <p>Pawn Shop</p>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    <Link to="/" className="flex items-center gap-3 p-3 rounded hover:bg-slate-800 transition">
                        <LayoutDashboard size={20} /> Dashboard
                    </Link>
                    <Link to="/customers" className="flex items-center gap-3 p-3 rounded hover:bg-slate-800 transition">
                        <Users size={20} /> Customers
                    </Link>
                    <Link to="/loans" className="flex items-center gap-3 p-3 rounded hover:bg-slate-800 transition">
                        <CircleDollarSign size={20} /> Loans
                    </Link>
                    <Link to="/receipts" className="flex items-center gap-3 p-3 rounded hover:bg-slate-800 transition">
                        <Printer size={20} /> Receipts
                    </Link>
                    <Link to="/interest" className="flex items-center gap-3 p-3 rounded hover:bg-slate-800 transition">
                        <SquaresIntersect size={20} /> Interest Tracker
                    </Link>
                    <Link to="/buy-sell" className="flex items-center gap-3 p-3 rounded hover:bg-slate-800 transition">
                        <ShoppingBasket size={20} /> Buy & Sell
                    </Link>
                </nav>
                <div className="p-4 border-t border-slate-800 hidden">
                    <button
                        onClick={handleBackup}
                        className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 p-2 rounded transition"
                    >
                        <HardDriveDownload size={18} /> Sync Excel
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 p-8 overflow-y-auto">
                <Outlet />
            </main>
        </div>
    );
}