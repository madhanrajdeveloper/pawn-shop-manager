// src/store/useStore.js
import { create } from 'zustand';
import apiClient from '../api/client';
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

    // --- NEW: TOAST STATE ---
    toast: { message: '', type: '', visible: false },

    showToast: (message, type = 'success') => {
        set({ toast: { message, type, visible: true } });
        setTimeout(() => set({ toast: { message: '', type: '', visible: false } }), 3000);
    },

    // --- ADMIN AUTH STATE ---
    isAdminAuthenticated: false,

    loginAdmin: async (username, password) => {
        try {
            const response = await apiClient.post('/admin/login', { username, password });
            if (response.data.success) {
                set({ isAdminAuthenticated: true });
                get().showToast("Welcome back, Admin!", "success");
                return true;
            }
            return false;
        } catch (error) {
            get().showToast("Invalid Credentials", "danger");
            return false;
        }
    },

    logoutAdmin: () => {
        set({ isAdminAuthenticated: false });
        get().showToast("Logged out safely", "info");
    },

    // --- MODAL VISIBILITY ---
    isCustomerModalOpen: false,
    isLoanModalOpen: false,
    isPaymentModalOpen: false,
    isBuySellModalOpen: false,

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

    // --- CREATE ACTIONS ---
    addCustomer: async (formData) => {
        try {
            await CustomerService.create(formData);
            await get().fetchCustomers();
            get().showToast("Customer Registered Successfully!");
            set({ isCustomerModalOpen: false });
            return true;
        } catch (err) {
            get().showToast("Failed to add customer", "danger");
            return false;
        }
    },

    addLoan: async (loanData) => {
        try {
            const finalData = {
                ...loanData,
                gold_weight: parseFloat(loanData.gold_weight) || 0,
                loan_amount: parseFloat(loanData.loan_amount) || 0,
                monthly_rate_of_interest: parseFloat(loanData.monthly_rate_of_interest) || 0,
            };
            await LoanService.create(finalData);
            await get().fetchLoans();
            await get().fetchDashboardStats();
            get().showToast("Loan Issued Successfully!");
            set({ isLoanModalOpen: false });
            return true;
        } catch (err) {
            get().showToast("Error processing loan", "danger");
            return false;
        }
    },

    addPayment: async (paymentData) => {
        try {
            const finalData = {
                ...paymentData,
                amount_paid: parseFloat(paymentData.amount_paid) || 0,
                payment_date: paymentData.payment_date || new Date().toISOString().split('T')[0],
            };
            await PaymentService.create(finalData);
            await Promise.all([get().fetchPayments(), get().fetchDashboardStats()]);
            get().showToast("Interest Payment Recorded!");
            set({ isPaymentModalOpen: false });
            return true;
        } catch (err) {
            get().showToast("Payment failed", "danger");
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
            };
            await BuySellService.create(finalData);
            await get().fetchBuySell();
            await get().fetchDashboardStats();
            get().showToast("Transaction Saved!");
            set({ isBuySellModalOpen: false });
            return true;
        } catch (err) {
            get().showToast("Transaction failed", "danger");
            return false;
        }
    }
}));

export default useStore;