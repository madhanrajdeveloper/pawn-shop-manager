import { useEffect } from 'react';
import Select from 'react-select'; // Import searchable select
import useStore from '../store/useStore';
import { LoanService } from '../api/services';
import { CircleDollarSign, X } from 'lucide-react';
import { ModalOverlay, ModalContent, PrimaryButton, InputField, Label, FormGrid, TableContainer } from '../styles/Components';

export default function Loans() {
  const { 
    customers, loans, fetchCustomers, fetchLoans,
    isLoanModalOpen, setLoanModal 
  } = useStore();

  useEffect(() => {
    fetchCustomers();
    fetchLoans();
  }, []);

  // Format customers for the Searchable Dropdown
  const customerOptions = customers.map(c => ({
    value: c.id,
    label: `${c.id} - ${c.full_name} (${c.phone_number})`
  }));

  const handleCreateLoan = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    await LoanService.create(data);
    setLoanModal(false);
    fetchLoans();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Loan Ledger</h1>
        <PrimaryButton bg="#059669" onClick={() => setLoanModal(true)}>
          <CircleDollarSign size={20} /> New Loan
        </PrimaryButton>
      </div>

      <TableContainer>
        <table>
          <thead>
            <tr>
              <th>Receipt</th>
              <th>Customer</th>
              <th>Gold Info</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loans.map(loan => (
              <tr key={loan.receipt_no}>
                <td className="font-bold text-green-700">{loan.receipt_no}</td>
                <td>{loan.customer_id}</td>
                <td>{loan.gold_weight}g - {loan.gold_description}</td>
                <td className="font-bold">₹{loan.loan_amount}</td>
                <td><span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">{loan.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableContainer>

      {isLoanModalOpen && (
        <ModalOverlay>
          <ModalContent size="800px">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Issue New Gold Loan</h2>
              <X className="cursor-pointer" onClick={() => setLoanModal(false)} />
            </div>

            <FormGrid onSubmit={handleCreateLoan}>
              <div className="full-width">
                <Label>Select Customer (Type to search)</Label>
                <Select 
                  name="customer_id"
                  options={customerOptions}
                  className="mt-1"
                  placeholder="Search by name or ID..."
                  isSearchable={true}
                  required
                />
              </div>

              <div>
                <Label>Gold Description</Label>
                <InputField name="gold_description" required placeholder="e.g. Chain 22K" />
              </div>
              <div>
                <Label>Gold Weight (g)</Label>
                <InputField name="gold_weight" type="number" step="0.01" required />
              </div>
              <div>
                <Label>Loan Amount (₹)</Label>
                <InputField name="loan_amount" type="number" required />
              </div>
              <div>
                <Label>Monthly Interest (₹)</Label>
                <InputField name="monthly_interest" type="number" required />
              </div>
              <div>
                <Label>Loan Date</Label>
                <InputField name="loan_date" type="date" defaultValue={new Date().toISOString().split('T')[0]} />
              </div>
              <div>
                <Label>Due Date</Label>
                <InputField name="due_date" type="date" required />
              </div>

              <div className="full-width pt-4">
                <PrimaryButton type="submit" className="w-full" bg="#059669">Create Loan & Print Receipt</PrimaryButton>
              </div>
            </FormGrid>
          </ModalContent>
        </ModalOverlay>
      )}
    </div>
  );
}