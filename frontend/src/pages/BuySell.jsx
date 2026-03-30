// frontend/src/pages/BuySell.jsx
import { useEffect, useState } from 'react';
import useStore from '../store/useStore';
import { ShoppingBag, Search, PlusCircle, X, ArrowDownRight, ArrowUpRight, CheckCircle2, User, Scale, Bookmark, CircleDollarSign, Calendar, Clipboard } from 'lucide-react';
import { FormField, DataTable, Button, ModalOverlay, ModalContent, ModalHeader, FormGrid } from '../components/common/UIComponents';

export default function BuySell() {
  const { buySellTransactions, loading, fetchBuySell, addBuySell, isBuySellModalOpen, setBuySellModal } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [calcTotal, setCalcTotal] = useState(0);

  useEffect(() => { fetchBuySell(); }, [fetchBuySell]);

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
    data.total_amount = Number(calcTotal);
    const success = await addBuySell(data);
    if (success) {
      setCalcTotal(0);
      setBuySellModal(false);
    }
  };

  const filteredTransactions = buySellTransactions.filter(t => {
    const term = searchTerm.toLowerCase();
    const custSup = t.customer_supplier ? t.customer_supplier.toLowerCase() : '';
    return t.transaction_id.toLowerCase().includes(term) || custSup.includes(term) || t.type.toLowerCase().includes(term);
  });

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Buy & Sell Ledger</h1>
        <div className="flex items-center gap-3">
          <div className="w-64">
            <FormField icon={Search} placeholder="Search ID or Name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <Button onClick={() => { setCalcTotal(0); setBuySellModal(true); }}>
            <PlusCircle size={16} /> New Record
          </Button>
        </div>
      </div>

      <DataTable headers={['Trans. ID', 'Type', 'Customer / Supplier', 'Details', 'Rate/g (₹)', 'Total Amount (₹)', 'Date & Mode']}>
        {filteredTransactions.length === 0 ? (
          <tr><td colSpan="7" className="p-10 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">No records found</td></tr>
        ) : filteredTransactions.map(tx => (
          <tr key={tx.transaction_id} className="hover:bg-indigo-50/40 transition-colors">
            <td className="p-3 font-black text-indigo-600">{tx.transaction_id}</td>
            <td className="p-3">
              {tx.type === 'Buy' ? (
                <span className="flex items-center gap-1 text-blue-700 bg-blue-100 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest w-fit">
                  <ArrowDownRight size={12} /> BUY
                </span>
              ) : (
                <span className="flex items-center gap-1 text-purple-700 bg-purple-100 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest w-fit">
                  <ArrowUpRight size={12} /> SELL
                </span>
              )}
            </td>
            <td className="p-3 font-bold text-slate-800">{tx.customer_supplier}</td>
            <td className="p-3 font-medium text-slate-600 text-xs">{tx.gold_weight}g <span className="bg-slate-100 px-1 py-0.5 rounded">{tx.purity}</span></td>
            <td className="p-3 font-bold text-slate-700">₹{(tx.rate_per_gram || 0).toLocaleString()}</td>
            <td className={`p-3 font-black ${tx.type === 'Buy' ? 'text-rose-600' : 'text-emerald-600'}`}>
              {tx.type === 'Buy' ? '-' : '+'} ₹{(Number(tx.total_amount) || 0).toLocaleString()}
            </td>
            <td className="p-3">
                <span className="block text-slate-500 font-bold text-xs">{tx.transaction_date}</span>
                <span className="text-[9px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-black uppercase tracking-widest">{tx.payment_mode}</span>
            </td>
          </tr>
        ))}
      </DataTable>

      {/* COMPACT MODAL */}
      {isBuySellModalOpen && (
        <ModalOverlay>
          <ModalContent size="800px">
            <ModalHeader>
              <h2 className="text-lg font-black text-slate-800 uppercase tracking-tighter flex items-center gap-2">
                <ShoppingBag size={18} className="text-indigo-600" /> New Transaction
              </h2>
              <button onClick={() => setBuySellModal(false)} className="hover:text-red-500 transition-colors"><X size={20} /></button>
            </ModalHeader>

            <form onSubmit={handleSubmit} className="p-5">
              <FormGrid>
                
                {/* COMPACT TOGGLE */}
                <div className="full-width flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                  <label className="flex-1 cursor-pointer">
                    <input type="radio" name="type" value="Buy" className="sr-only peer" defaultChecked />
                    <div className="text-center py-2 rounded-md font-bold text-xs text-slate-500 peer-checked:bg-white peer-checked:text-blue-700 peer-checked:shadow-sm transition-all flex items-center justify-center gap-2">
                      <ArrowDownRight size={14} /> Shop is Buying
                    </div>
                  </label>
                  <label className="flex-1 cursor-pointer">
                    <input type="radio" name="type" value="Sell" className="sr-only peer" />
                    <div className="text-center py-2 rounded-md font-bold text-xs text-slate-500 peer-checked:bg-white peer-checked:text-purple-700 peer-checked:shadow-sm transition-all flex items-center justify-center gap-2">
                      <ArrowUpRight size={14} /> Shop is Selling
                    </div>
                  </label>
                </div>

                {/* FIELDS SPREAD ACROSS 3 COLUMNS */}
                <div className="span-2"><FormField label="Customer / Supplier Name *" name="customer_supplier" icon={User} required placeholder="Entity Name" /></div>
                <FormField label="Purity *" name="purity" icon={Bookmark} required placeholder="e.g. 24K" />
                
                <FormField label="Weight (g) *" name="gold_weight" type="number" step="0.001" icon={Scale} required placeholder="0.00" onInput={updateCalculation} />
                <FormField label="Rate per gram (₹) *" name="rate_per_gram" type="number" icon={CircleDollarSign} required placeholder="Rate" onInput={updateCalculation} />
                <FormField label="Date" name="transaction_date" type="date" icon={Calendar} defaultValue={new Date().toISOString().split('T')[0]} required />
                
                <div className="col-span-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-800 ml-1 mb-1 block">Payment Mode</label>
                  <select name="payment_mode" defaultValue="Cash" className="w-full px-3 py-2 bg-white border-2 border-slate-200 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-indigo-600 transition-all">
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Bank">Bank Transfer</option>
                  </select>
                </div>
                <div className="span-2"><FormField label="Remarks" name="remarks" icon={Clipboard} placeholder="Optional notes" /></div>

                <div className="full-width pt-2 border-t border-slate-100 flex items-center justify-between mt-2">
                  <div>
                    <span className="text-slate-500 font-bold uppercase text-[10px] tracking-widest block">Calculated Total</span>
                    <span className="text-3xl font-black text-emerald-600 tracking-tight">₹{calcTotal.toLocaleString()}</span>
                  </div>
                  <Button type="submit" className="py-3 px-8 text-sm">
                    <CheckCircle2 size={16} /> Save Record
                  </Button>
                </div>

              </FormGrid>
            </form>
          </ModalContent>
        </ModalOverlay>
      )}
    </div>
  );
}