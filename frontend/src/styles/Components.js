import styled from 'styled-components';

export const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.75);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
  backdrop-filter: blur(8px);
  padding: 1rem;
`;

export const ModalContent = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 1.25rem;
  width: 100%;
  max-width: ${(props) => props.size || '700px'};
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  position: relative;
  max-height: 90vh;
  overflow-y: auto;
`;

export const PrimaryButton = styled.button`
  background: ${(props) => props.bg || '#2563eb'};
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 0.75rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;

  &:hover {
    filter: brightness(110%);
    transform: translateY(-2px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  }

  &:active {
    transform: translateY(0);
  }
`;

export const Label = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.25rem;
`;

export const InputField = styled.input`
  width: 100%;
  padding: 0.625rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.95rem;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }
`;

export const SelectField = styled.select`
  width: 100%;
  padding: 0.625rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  background-color: white;
`;

export const FormGrid = styled.form`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.25rem;
  
  .full-width {
    grid-column: span 2;
  }
`;

export const TableContainer = styled.div`
  background: white;
  border-radius: 1rem;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  
  table {
    width: 100%;
    border-collapse: collapse;
  }
  
  th {
    background: #f9fafb;
    padding: 1rem;
    font-size: 0.75rem;
    text-transform: uppercase;
    color: #6b7280;
    text-align: left;
  }
  
  td {
    padding: 1rem;
    border-top: 1px solid #f3f4f6;
    font-size: 0.875rem;
  }
`;