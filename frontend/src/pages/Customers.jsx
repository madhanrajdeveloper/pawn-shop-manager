import { useEffect } from 'react';
import useStore from '../store/useStore';
import { UserPlus, X, Search } from 'lucide-react';
import {
  ModalOverlay, ModalContent, PrimaryButton,
  InputField, Label, SelectField
} from '../styles/Components';

export default function Customers() {
  const {
    customers, loading, fetchCustomers, addCustomer,
    isCustomerModalOpen, setCustomerModal
  } = useStore();

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);

    const success = await addCustomer(data);
    if (success) alert("Customer Registered Successfully!");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black text-gray-900">Customers</h1>
        <PrimaryButton onClick={() => setCustomerModal(true)}>
          <UserPlus size={20} /> Register New
        </PrimaryButton>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-widest">
              <tr>
                <th className="p-4 font-bold">ID</th>
                <th className="p-4 font-bold">Full Name</th>
                <th className="p-4 font-bold">Phone</th>
                <th className="p-4 font-bold">Address</th>
                <th className="p-4 font-bold">ID Proof</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="5" className="p-10 text-center text-gray-400">Loading Customers...</td></tr>
              ) : customers.map((cust) => (
                <tr key={cust.id} className="hover:bg-blue-50/50 transition">
                  <td className="p-4 font-bold text-blue-600">{cust.id}</td>
                  <td className="p-4 font-semibold text-gray-800">{cust.full_name}</td>
                  <td className="p-4 text-gray-600">{cust.phone_number}</td>
                  <td className="p-4 text-gray-500 truncate max-w-xs">{cust.address}</td>
                  <td className="p-4 text-gray-600 text-sm font-medium">
                    {cust.id_proof_type}: {cust.id_proof_number}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* POPUP MODAL FOR REGISTRATION */}
      {isCustomerModalOpen && (
        <ModalOverlay>
          <ModalContent size="650px">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-gray-800">New Registration</h2>
              <button onClick={() => setCustomerModal(false)} className="text-gray-400 hover:text-red-500">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-5">
              <div>
                <Label>Full Name *</Label>
                <InputField name="full_name" required placeholder="Enter name" />
              </div>
              <div>
                <Label>Phone Number *</Label>
                <InputField name="phone_number" required placeholder="98765..." />
              </div>
              <div>
                <Label>Alternate Phone</Label>
                <InputField name="alt_phone" placeholder="Optional" />
              </div>
              <div>
                <Label>Date Registered</Label>
                <InputField name="date_registered" type="date" defaultValue={new Date().toISOString().split('T')[0]} />
              </div>
              <div className="col-span-2">
                <Label>Residential Address *</Label>
                <InputField name="address" required placeholder="Full address" />
              </div>
              <div>
                <Label>ID Proof Type</Label>
                <SelectField name="id_proof_type">
                  <option>Aadhaar</option>
                  <option>PAN Card</option>
                  <option>Voter ID</option>
                </SelectField>
              </div>
              <div>
                <Label>ID Proof Number</Label>
                <InputField name="id_proof_number" required placeholder="Number" />
              </div>
              <div className="col-span-2">
                <Label>Notes</Label>
                <InputField name="notes" placeholder="Any extra details" />
              </div>

              <div className="col-span-2 pt-4">
                <PrimaryButton type="submit" className="w-full" bg="#10b981">
                  Complete Registration & Sync
                </PrimaryButton>
              </div>
            </form>
          </ModalContent>
        </ModalOverlay>
      )}
    </div>
  );
}