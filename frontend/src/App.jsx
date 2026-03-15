// frontend/src/App.jsx
import { HashRouter, Routes, Route, BrowserRouter } from 'react-router-dom'; // Changed to HashRouter
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Loans from './pages/Loans';
import ReceiptPrinter from './pages/ReceiptPrinter';
import InterestTracker from './pages/InterestTracker';
import BuySell from './pages/BuySell';

export default function App() {
  return (
    <>
      {/* This is the main App component that sets up routing for the application. We switched from BrowserRouter to HashRouter to ensure compatibility with Electron's file protocol. The Layout component serves as a wrapper for all pages, providing a consistent sidebar and layout structure. Each Route corresponds to a different page in the application, allowing users to navigate between the dashboard, customer management, loan management, and receipt printing features seamlessly. */}

      <HashRouter> {/* Changed to HashRouter */}
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