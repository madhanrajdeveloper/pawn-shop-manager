// frontend/src/components/common/UIComponents.jsx
import styled from 'styled-components';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';
import useStore from '../../store/useStore';

// --- CENTRAL THEME ---
export const theme = {
  primary: '#4f46e5',
  secondary: '#0f172a',
  background: '#f8fafc',
  surface: '#ffffff',
  border: '#e2e8f0',
  text: '#1e293b',
  muted: '#64748b',
  success: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b'
};

// --- NEW: GLOBAL TOAST NOTIFICATION ---
export const ToastNotification = () => {
  const { toast } = useStore();
  if (!toast.visible) return null;

  const colors = {
    success: 'bg-emerald-600 border-emerald-400',
    danger: 'bg-rose-600 border-rose-400',
    info: 'bg-indigo-600 border-indigo-400'
  };

  const Icon = toast.type === 'danger' ? AlertCircle : toast.type === 'info' ? Info : CheckCircle;

  return (
    <div className={`fixed bottom-5 right-5 z-[10000] animate-in slide-in-from-right duration-300 flex items-center gap-3 px-6 py-3 rounded-2xl text-white shadow-2xl border ${colors[toast.type] || colors.success}`}>
      <Icon size={20} />
      <span className="font-black text-[10px] uppercase tracking-widest">{toast.message}</span>
    </div>
  );
};

// --- ULTRA-COMPACT INPUT ---
export const FormField = ({ label, icon: Icon, ...props }) => (
  <div className="w-full text-left">
    {label && (
      <label className="text-[10px] font-black uppercase tracking-wider text-slate-700 ml-1 mb-1 block">
        {label}
      </label>
    )}
    <div className="relative group">
      {Icon && (
        <Icon 
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-600 transition-colors pointer-events-none" 
          size={14} 
        />
      )}
      <input 
        {...props} 
        className={`w-full ${Icon ? 'pl-8' : 'px-3'} py-2 border border-[#cccccc] rounded-lg text-xs font-semibold text-slate-900 placeholder:font-thin placeholder:text-[#808080] outline-none focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 transition-all `}
      />
    </div>
  </div>
);

// --- ATOMIC CARD ---
export const Card = styled.div`
  background: ${theme.surface};
  border: 1px solid ${theme.border};
  border-radius: 1.25rem;
  padding: 1.25rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  position: relative;
`;

// --- MODAL SYSTEM ---
export const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  padding: 1rem;
`;

export const ModalContent = styled.div`
  background: white;
  border-radius: 1.25rem;
  width: 100%;
  max-width: ${(props) => props.size || '850px'};
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  border: 1px solid ${theme.border};
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  overflow-y: auto;
`;

export const ModalHeader = styled.div`
  padding: 1rem 1.25rem;
  border-bottom: 1px solid ${theme.border};
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  background: white;
  z-index: 10;
`;

// --- GRID SYSTEM ---
export const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  padding: 1.25rem;
  
  .full-width { grid-column: span 3; }
  .span-2 { grid-column: span 2; }
`;

// --- BUTTONS ---
export const Button = styled.button`
  background: ${props => 
    props.variant === 'danger' ? theme.danger : 
    props.variant === 'success' ? theme.success : theme.primary
  };
  color: white;
  font-weight: 900;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.7rem 1.5rem;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s;
  border: none;
  cursor: pointer;

  &:hover { filter: brightness(95%); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
  &:active { transform: scale(0.98); }
`;

// --- TABLE ---
export const DataTable = ({ headers, children }) => (
  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm border-collapse">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="p-3 text-[10px] font-black uppercase tracking-widest text-slate-700">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {children}
        </tbody>
      </table>
    </div>
  </div>
);