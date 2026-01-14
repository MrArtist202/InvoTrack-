

import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { User } from './types';
import { authAPI, clearToken } from './api';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import PaymentSuccess from './components/PaymentSuccess';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Persistence check on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const user = await authAPI.getMe();
        setCurrentUser(user);
      } catch (error) {
        clearToken();
        setCurrentUser(null);
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
