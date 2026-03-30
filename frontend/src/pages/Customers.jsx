// frontend/src/pages/Customers.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import { UserPlus, X, Search, User, Phone, Calendar, MapPin, CreditCard, Clipboard, Hash, Bookmark } from 'lucide-react';
import { FormField, Card, DataTable, Button, ModalOverlay, ModalContent, ModalHeader, FormGrid } from '../components/common/UIComponents';

export default function Customers() {
  const navigate = useNavigate(); 
  const { customers, loading, fetchCustomers, addCustomer, isCustomerModalOpen, setCustomerModal } = useStore();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    const success = await addCustomer(data);
    if (success) {
      setCustomerModal(false);
    }
  };

  const filteredCustomers = customers.filter(cust => {
    const term = searchTerm.toLowerCase();
    const name = cust.full_name?.toLowerCase() || "";
    const uid = cust.customer_uid?.toLowerCase() || "";
    return name.includes(term) || cust.phone_number?.includes(term) || uid.includes(term);
  });

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      
      {/* HEADER SECTION (CLEAN ADMIN LOOK) */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Customer Directory</h1>
        <div className="flex items-center gap-3">
          <div className="w-64">
            <FormField icon={Search} placeholder="Search Name, Phone, UID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <Button onClick={() => setCustomerModal(true)}>
            <UserPlus size={16} /> Register Client
          </Button>
        </div>
      </div>

      {/* COMPACT DATA TABLE */}
      <DataTable headers={['ID', 'Name', 'Phone', 'Identity Proof', 'Residential Address']}>
        {filteredCustomers.map((cust) => (
          <tr key={cust.id} onClick={() => navigate(`/customer/${cust.id}`)} className="hover:bg-indigo-50/40 cursor-pointer transition-colors group">
            <td className="p-3">
              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                {cust.customer_uid}
              </span>
            </td>
            <td className="p-3 font-bold text-slate-800">{cust.full_name}</td>
            <td className="p-3 font-medium text-slate-600">{cust.phone_number}</td>
            <td className="p-3 text-xs font-semibold text-slate-600">{cust.id_proof_type}: {cust.id_proof_number}</td>
            <td className="p-3 text-slate-400 text-xs truncate max-w-xs">{cust.address}</td>
          </tr>
        ))}
      </DataTable>

      {/* SEAMLESS MODAL (NO SCROLL NEEDED) */}
      {isCustomerModalOpen && (
        <ModalOverlay>
          <ModalContent size="850px">
            <ModalHeader>
              <h2 className="text-lg font-black text-slate-800 uppercase tracking-tighter flex items-center gap-2">
                <UserPlus size={18} className="text-indigo-600" /> New Client Registration
              </h2>
              <button onClick={() => setCustomerModal(false)} className="hover:text-red-500 transition-colors">
                <X size={20} />
              </button>
            </ModalHeader>

            <form onSubmit={handleSubmit} className="p-5">
              <FormGrid>
                {/* Spreading fields across columns reduce modal height */}
                <div className="col-span-2"><FormField label="Full Name *" name="full_name" icon={User} required placeholder="Legal Name" /></div>
                <FormField label="Phone Number *" name="phone_number" icon={Phone} required placeholder="Primary Mobile" />
                <FormField label="Alternate Phone" name="alt_phone" icon={Phone} placeholder="Optional" />
                
                {/* NEW ID PROOF DROPDOWN */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Identity Proof Type *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Bookmark size={16} />
                    </div>
                    <select
                      name="id_proof_type"
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none"
                      defaultValue="Aadhaar"
                    >
                      <option value="" disabled>Select ID Type</option>
                      <option value="Aadhaar">Aadhaar Card</option>
                      <option value="Voter ID">Voter ID</option>
                      <option value="Driving License">Driving License</option>
                      <option value="PAN Card">PAN Card</option>
                      <option value="Passport">Passport</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <FormField label="ID Card Number *" name="id_proof_number" icon={Hash} required placeholder="Number" />
                
                <div className="col-span-2"><FormField label="Residential Address *" name="address" icon={MapPin} required placeholder="Door No, Street, City" /></div>
                <FormField label="PAN (Optional)" name="pan_number" icon={CreditCard} placeholder="ABCDE1234F" />

                <div className="col-span-2"><FormField label="Notes" name="notes" icon={Clipboard} placeholder="Extra remarks about client..." /></div>
                <FormField label="Date Registered" name="date_registered" type="date" defaultValue={new Date().toISOString().split('T')[0]} />

                {/* THE BUTTON - WILL BE VISIBLE WITHOUT SCROLLING */}
                <div className="full-width pt-2">
                  <Button type="submit" className="w-full py-3.5 text-sm uppercase tracking-widest bg-indigo-600 shadow-indigo-200 shadow-lg hover:shadow-none transition-all">
                    Complete Registration & Sync
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