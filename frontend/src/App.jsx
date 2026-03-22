// frontend/src/App.jsx
import { HashRouter, Routes, Route } from 'react-router-dom'; 
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Loans from './pages/Loans';
import ReceiptPrinter from './pages/ReceiptPrinter';
import InterestTracker from './pages/InterestTracker';
import BuySell from './pages/BuySell';
import CustomerProfile from './pages/CustomerProfile';
import AgingDashboard from './pages/AgingDashboard';

// --- NEW ADMIN SECURITY IMPORTS ---
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import { ToastNotification } from './components/common/UIComponents';

export default function App() {
  return (
    <>
      {/* This is the main App component that sets up routing for the application. We switched from BrowserRouter to HashRouter to ensure compatibility with Electron's file protocol. The Layout component serves as a wrapper for all pages, providing a consistent sidebar and layout structure. */}

      <HashRouter> 
        <ToastNotification />
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="customers" element={<Customers />} />
            <Route path="customer/:id" element={<CustomerProfile />} />
            <Route path="loans" element={<Loans />} />
            <Route path="receipts" element={<ReceiptPrinter />} />
            <Route path="interest" element={<InterestTracker />} />
            <Route path="buy-sell" element={<BuySell />} />
            <Route path="aging" element={<AgingDashboard />} />
            
            {/* --- ADMIN ROUTES --- */}
            <Route path="admin-login" element={<AdminLogin />} />
            
            {/* The Bouncer: Protects the Admin Dashboard from unauthorized access */}
            <Route 
              path="admin-dashboard" 
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
          </Route>
        </Routes>
      </HashRouter>

      {/* This is the old BrowserRouter code, kept here for reference in case we need to switch back: */}
      {/* <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="customers" element={<Customers />} />
          <Route path="loans" element={<Loans />} />
          <Route path="receipts" element={<ReceiptPrinter />} />
          <Route path="interest" element={<InterestTracker />} />
          <Route path="buy-sell" element={<BuySell />} />
        </Route>
      </Routes>
    </BrowserRouter> */}
    </>
  );
}