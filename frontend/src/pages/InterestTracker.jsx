// frontend/src/pages/InterestTracker.jsx
import { useState, useEffect } from 'react'; // Added useState here
import Select from 'react-select';
import useStore from '../store/useStore';
import { BadgeIndianRupee, X } from 'lucide-react';
import { 
    ModalOverlay, ModalContent, PrimaryButton, 
    InputField, Label, FormGrid, TableContainer 
} from '../styles/Components';

export default function InterestTracker() {
    // 1. Properly define state for the searchable dropdown
    const [selectedLoan, setSelectedLoan] = useState(null);

    // 2. Destructure addPayment from the store
    const {
        loans, payments, fetchLoans, fetchPayments, addPayment,
        isPaymentModalOpen, setPaymentModal
    } = useStore();

    useEffect(() => {
        fetchLoans();
        fetchPayments();
    }, []);

    const loanOptions = loans.filter(l => l.status === 'Active').map(l => ({
        value: l.receipt_no,
        label: `${l.receipt_no} - ₹${l.loan_amount} (Interest: ₹${l.monthly_interest})`
    }));

    const handlePayment = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);

        // Manually add the value from the Searchable Dropdown
        if (selectedLoan) {
            data.receipt_no = selectedLoan.value;
        } else {
            alert("Please select a Receipt No");
            return;
        }

        const success = await addPayment(data);
        if (success) {
            alert("Payment Recorded Successfully!");
            setSelectedLoan(null); // Reset selection
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Interest Tracker</h1>
                <PrimaryButton bg="#ea580c" onClick={() => setPaymentModal(true)}>
                    <BadgeIndianRupee size={20} /> Record Payment
                </PrimaryButton>
            </div>

            <TableContainer>
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Receipt No</th>
                            <th>Month</th>
                            <th>Paid</th>
                            <th>Balance Due</th>
                        </tr>
                    </thead>
                    <tbody>
                        {payments.length === 0 ? (
                            <tr><td colSpan="5" className="p-4 text-center text-gray-500">No payments recorded yet.</td></tr>
                        ) : (
                            payments.map(p => (
                                <tr key={p.payment_id}>
                                    <td>{p.payment_id}</td>
                                    <td className="font-bold">{p.receipt_no}</td>
                                    <td>{p.payment_month}</td>
                                    <td className="text-green-600 font-bold">₹{p.amount_paid}</td>
                                    <td className="text-red-600">₹{p.balance_due}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </TableContainer>

            {isPaymentModalOpen && (
                <ModalOverlay>
                    <ModalContent>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-800">Record Interest Payment</h2>
                            <button onClick={() => setPaymentModal(false)} className="text-gray-400 hover:text-red-500 transition">
                                <X size={24} />
                            </button>
                        </div>

                        <FormGrid onSubmit={handlePayment}>
                            <div className="full-width">
                                <Label>Select Receipt No (Searchable)</Label>
                                <Select
                                    name="receipt_no"
                                    options={loanOptions}
                                    isSearchable={true}
                                    value={selectedLoan}
                                    onChange={(option) => setSelectedLoan(option)}
                                    placeholder="Type Receipt No or Amount..."
                                    required
                                />
                            </div>
                            <div>
                                <Label>Payment Month</Label>
                                <InputField name="payment_month" placeholder="e.g. March 2026" required />
                            </div>
                            <div>
                                <Label>Amount Paid (₹)</Label>
                                <InputField name="amount_paid" type="number" required />
                            </div>
                            <div className="full-width">
                                <Label>Payment Mode</Label>
                                <InputField name="payment_mode" defaultValue="Cash" />
                            </div>
                            <div className="full-width pt-4">
                                <PrimaryButton type="submit" className="w-full" bg="#ea580c">
                                    Save Interest Record
                                </PrimaryButton>
                            </div>
                        </FormGrid>
                    </ModalContent>
                </ModalOverlay>
            )}
        </div>
    );
}