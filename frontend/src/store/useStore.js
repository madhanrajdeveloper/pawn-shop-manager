// src/store/useStore.js
import { create } from 'zustand';
import {
    CustomerService,
    LoanService,
    PaymentService,
    DashboardService,
    BuySellService
} from '../api/services';

const useStore = create((set, get) => ({
    // --- GLOBAL STATE ---
    customers: [],
    loans: [],
    payments: [],
    buySellTransactions: [],
    stats: {},
    loading: false,

    // --- MODAL VISIBILITY ---
    isCustomerModalOpen: false,
    isLoanModalOpen: false,
    isPaymentModalOpen: false,
    isBuySellModalOpen: false,

    // --- MODAL ACTIONS ---
    setCustomerModal: (isOpen) => set({ isCustomerModalOpen: isOpen }),
    setLoanModal: (isOpen) => set({ isLoanModalOpen: isOpen }),
    setPaymentModal: (isOpen) => set({ isPaymentModalOpen: isOpen }),
    setBuySellModal: (isOpen) => set({ isBuySellModalOpen: isOpen }),

    // --- DATA FETCHING ---
    fetchDashboardStats: async () => {
        try {
            const res = await DashboardService.getSummary();
            set({ stats: res.data });
        } catch (err) {
            console.error("Dashboard Fetch Error:", err);
        }
    },

    fetchCustomers: async () => {
        set({ loading: true });
        try {
            const res = await CustomerService.getAll();
            set({ customers: res.data });
        } catch (err) {
            console.error("Customer Fetch Error:", err);
        } finally {
            set({ loading: false });
        }
    },

    fetchLoans: async () => {
        set({ loading: true });
        try {
            const res = await LoanService.getAll();
            set({ loans: res.data });
        } catch (err) {
            console.error("Loan Fetch Error:", err);
        } finally {
            set({ loading: false });
        }
    },

    fetchPayments: async () => {
        set({ loading: true });
        try {
            const res = await PaymentService.getAll();
            set({ payments: res.data });
        } catch (err) {
            console.error("Payment Fetch Error:", err);
        } finally {
            set({ loading: false });
        }
    },

    fetchBuySell: async () => {
        set({ loading: true });
        try {
            const res = await BuySellService.getAll();
            set({ buySellTransactions: res.data });
        } catch (err) {
            console.error("BuySell Fetch Error:", err);
        } finally {
            set({ loading: false });
        }
    },

    // --- CREATE ACTIONS (Optimized with Type Conversion) ---
    addCustomer: async (formData) => {
        try {
            await CustomerService.create(formData);
            await get().fetchCustomers();
            await get().fetchDashboardStats();
            set({ isCustomerModalOpen: false });
            return true;
        } catch (err) {
            console.error("Add Customer Error:", err);
            return false;
        }
    },

    addLoan: async (loanData) => {
        try {
            const finalData = {
                ...loanData,
                gold_weight: parseFloat(loanData.gold_weight) || 0,
                loan_amount: parseFloat(loanData.loan_amount) || 0,
                monthly_interest: parseFloat(loanData.monthly_interest) || 0,
            };
            await LoanService.create(finalData);
            await get().fetchLoans();
            await get().fetchDashboardStats();
            set({ isLoanModalOpen: false });
            return true;
        } catch (err) {
            console.error("Add Loan Error:", err);
            return false;
        }
    },

    addPayment: async (paymentData) => {
        try {
            const finalData = {
                ...paymentData,
                amount_paid: parseFloat(paymentData.amount_paid) || 0,
                balance_due: 0, // Backend logic will overwrite this
                payment_date: paymentData.payment_date || new Date().toISOString().split('T')[0],
            };

            await PaymentService.create(finalData);
            
            // Parallel refresh to keep UI snappy
            await Promise.all([
                get().fetchPayments(),
                get().fetchDashboardStats()
            ]);

            set({ isPaymentModalOpen: false });
            return true;
        } catch (err) {
            console.error("Payment Submission Error:", err);
            return false;
        }
    },

    addBuySell: async (formData) => {
        try {
            const finalData = {
                ...formData,
                gold_weight: parseFloat(formData.gold_weight) || 0,
                rate_per_gram: parseFloat(formData.rate_per_gram) || 0,
                total_amount: parseFloat(formData.total_amount) || 0,
                payment_mode: formData.payment_mode || "Cash"
            };
            await BuySellService.create(finalData);
            await get().fetchBuySell();
            await get().fetchDashboardStats();
            set({ isBuySellModalOpen: false });
            return true;
        } catch (err) {
            console.error("Add BuySell Error:", err);
            return false;
        }
    }
}));

export default useStore;