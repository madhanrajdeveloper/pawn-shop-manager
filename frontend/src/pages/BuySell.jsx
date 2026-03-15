// src/pages/BuySell.jsx
import { useState, useEffect } from 'react';
import useStore from '../store/useStore';
import { ShoppingBag, X, Plus } from 'lucide-react';
import { 
    ModalOverlay, ModalContent, PrimaryButton, 
    InputField, Label, FormGrid, TableContainer 
} from '../styles/Components';

export default function BuySell() {
    const { 
        buySellTransactions, fetchBuySell, 
        addBuySell, isBuySellModalOpen, setBuySellModal 
    } = useStore();

    const [calcTotal, setCalcTotal] = useState(0);

    useEffect(() => {
        fetchBuySell();
    }, []);

    // IMPROVED: Function to calculate total directly from state/inputs
    const updateCalculation = (e) => {
        const form = e.currentTarget.closest('form');
        const weight = parseFloat(form.gold_weight.value) || 0;
        const rate = parseFloat(form.rate_per_gram.value) || 0;
        setCalcTotal(weight * rate);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        
        // FIX: Explicitly set the calculated total into the data object
        // and ensure it is a number
        data.total_amount = Number(calcTotal);

        const success = await addBuySell(data);
        if (success) {
            alert("Transaction Recorded Successfully!");
            setCalcTotal(0); 
            setBuySellModal(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800 tracking-tight flex items-center gap-2">
                    <ShoppingBag className="text-blue-600" /> Buy & Sell Register
                </h1>
                <PrimaryButton bg="#3b82f6" onClick={() => {
                    setCalcTotal(0);
                    setBuySellModal(true);
                }}>
                    <Plus size={20} /> New Transaction
                </PrimaryButton>
            </div>

            <TableContainer>
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Type</th>
                            <th>Customer/Supplier</th>
                            <th>Weight/Purity</th>
                            <th>Rate</th>
                            <th>Total Amount</th>
                            <th>Mode</th>
                        </tr>
                    </thead>
                    <tbody>
                        {buySellTransactions.length === 0 ? (
                            <tr><td colSpan="7" className="p-10 text-center text-gray-400">No transactions recorded.</td></tr>
                        ) : (
                            buySellTransactions.map(tx => (
                                <tr key={tx.transaction_id}>
                                    <td className="font-mono text-xs text-gray-500">{tx.transaction_id}</td>
                                    <td>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${tx.type === 'Buy' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                            {tx.type}
                                        </span>
                                    </td>
                                    <td className="font-semibold text-gray-700">{tx.customer_supplier}</td>
                                    <td className="text-gray-600">{tx.gold_weight}g <span className="text-xs text-gray-400">({tx.purity})</span></td>
                                    <td className="text-gray-600">₹{tx.rate_per_gram}</td>
                                    <td className="font-bold text-gray-900">₹{Number(tx.total_amount).toLocaleString()}</td>
                                    <td>
                                        <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">{tx.payment_mode}</span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </TableContainer>

            {isBuySellModalOpen && (
                <ModalOverlay>
                    <ModalContent size="750px">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-black text-gray-800">New Transaction</h2>
                            <button onClick={() => setBuySellModal(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <FormGrid onSubmit={handleSubmit}>
                            <div>
                                <Label>Transaction Type</Label>
                                <select name="type" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                                    <option value="Buy">Buy Gold</option>
                                    <option value="Sell">Sell Gold</option>
                                </select>
                            </div>
                            <div>
                                <Label>Customer/Supplier Name</Label>
                                <InputField name="customer_supplier" required placeholder="Name of person/firm" />
                            </div>
                            <div>
                                <Label>Gold Weight (g)</Label>
                                <InputField 
                                    name="gold_weight" 
                                    type="number" 
                                    step="0.001" 
                                    required 
                                    placeholder="0.000" 
                                    onInput={updateCalculation}
                                />
                            </div>
                            <div>
                                <Label>Purity (Karat)</Label>
                                <InputField name="purity" placeholder="e.g. 22K or 916" required />
                            </div>
                            <div>
                                <Label>Rate per Gram (₹)</Label>
                                <InputField 
                                    name="rate_per_gram" 
                                    type="number" 
                                    required 
                                    placeholder="Current rate" 
                                    onInput={updateCalculation}
                                />
                            </div>
                            <div>
                                <Label>Payment Mode</Label>
                                <select name="payment_mode" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                                    <option value="Cash">Cash</option>
                                    <option value="GPay / UPI">GPay / UPI</option>
                                    <option value="Bank Transfer">Bank Transfer</option>
                                    <option value="Cheque">Cheque</option>
                                </select>
                            </div>
                            <div>
                                <Label>Transaction Date</Label>
                                <InputField name="transaction_date" type="date" defaultValue={new Date().toISOString().split('T')[0]} />
                            </div>
                            <div>
                                <Label>Remarks (Optional)</Label>
                                <InputField name="remarks" placeholder="Notes..." />
                            </div>

                            <div className="full-width bg-slate-900 p-5 rounded-2xl flex justify-between items-center shadow-inner mt-4">
                                <span className="text-slate-400 font-bold uppercase text-xs tracking-widest">Calculated Total</span>
                                <span className="text-3xl font-black text-white">₹{calcTotal.toLocaleString()}</span>
                            </div>

                            <div className="full-width pt-4">
                                <PrimaryButton type="submit" className="w-full h-12 shadow-lg" bg="#3b82f6">
                                    Finalize & Save Transaction
                                </PrimaryButton>
                            </div>
                        </FormGrid>
                    </ModalContent>
                </ModalOverlay>
            )}
        </div>
    );
}