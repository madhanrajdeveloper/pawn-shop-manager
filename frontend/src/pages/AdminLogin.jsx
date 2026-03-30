// frontend/src/pages/AdminLogin.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import apiClient from '../api/client';
import { Lock, User, KeyRound, UserPlus } from 'lucide-react';
import { Card, FormField, Button } from '../components/common/UIComponents';

export default function AdminLogin() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  
  const { loginAdmin } = useStore();
  const navigate = useNavigate();

  const isRegistrationAllowed = localStorage.getItem('allowAdminReg') === 'true';

  // --- THE FIX: Force Electron to focus on the input after the transition ---
  useEffect(() => {
    // We wait 350ms to let the "animate-in duration-300" finish perfectly
    const focusTimer = setTimeout(() => {
      const usernameInput = document.getElementById('admin-username');
      if (usernameInput) {
        usernameInput.focus();
        usernameInput.click(); // Failsafe to break through any ghost overlays
      }
    }, 350);

    return () => clearTimeout(focusTimer);
  }, [isRegistering]); // Re-run if they toggle the registration view

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isRegistering) {
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      try {
        await apiClient.post('/admin/register', { username, password });
        alert('New Admin created securely in database!');
        
        localStorage.setItem('allowAdminReg', 'false');
        setIsRegistering(false);
        setUsername('');
        setPassword('');
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to create admin. Username might exist.');
      }
    } else {
      const isSuccess = await loginAdmin(username, password);
      if (isSuccess) {
        navigate('/admin-dashboard');
      } else {
        setError('Invalid Username or Password.');
      }
    }
  };

  return (
    // Added 'relative z-10' to ensure the form is above any potential ghost layers
    <div className="flex items-center justify-center min-h-[75vh] relative z-10 animate-in zoom-in-95 duration-300">
      <Card className="w-full max-w-sm p-8 shadow-2xl border-none">
        
        <div className="flex flex-col items-center mb-8 text-center">
          <div className={`p-4 rounded-2xl mb-4 shadow-lg ${isRegistering ? 'bg-indigo-600 shadow-indigo-900/20' : 'bg-slate-900 shadow-slate-900/20'}`}>
            {isRegistering ? <UserPlus className="text-white" size={32} /> : <Lock className="text-emerald-400" size={32} />}
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {isRegistering ? 'Create Admin' : 'Admin Gateway'}
          </h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-2">
            {isRegistering ? 'Registration Gate Open' : 'Authorized Personnel Only'}
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 text-rose-600 text-xs font-black uppercase tracking-widest p-3 rounded-lg mb-6 text-center border border-rose-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField 
            id="admin-username" // Hooked up to the useEffect above
            label="Username" 
            icon={User} 
            type="text" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter admin ID"
            required
            autoFocus // React's native attempt to focus
          />

          <FormField 
            label="Secure Password" 
            icon={KeyRound} 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />

          {isRegistering && (
            <FormField 
              label="Confirm Password" 
              icon={KeyRound} 
              type="password" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          )}

          <div className="pt-4 space-y-3">
            <Button type="submit" className={`w-full py-3 text-sm shadow-lg ${isRegistering ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-900 hover:bg-black'}`}>
              {isRegistering ? 'Register Account' : 'Authenticate & Enter'}
            </Button>

            {isRegistrationAllowed && (
              <button 
                type="button"
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setError('');
                }}
                className="w-full text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors uppercase tracking-widest"
              >
                {isRegistering ? '← Back to Login' : 'Create New Admin Account'}
              </button>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}