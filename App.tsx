

import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { User } from './types';
import { authAPI, clearToken } from './api';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import PaymentSuccess from './components/PaymentSuccess';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Persistence check on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const user = await authAPI.getMe();
        setCurrentUser(user);
      } catch (error) {
        clearToken();
        setCurrentUser(null);
      } finally {
        setIsCheckingAuth(false);
      }
    };
    checkSession();
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    clearToken();
    setCurrentUser(null);
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Routes>
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/*" element={
          !currentUser ? (
            <Login onLogin={handleLogin} />
          ) : (
            <Dashboard user={currentUser} onLogout={handleLogout} />
          )
        } />
      </Routes>
    </div>
  );
};

export default App;
