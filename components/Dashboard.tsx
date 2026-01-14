import React, { useState } from 'react';
import { User, Invoice } from '../types';
import { clearToken } from '../api';
import Sidebar from './Sidebar';
import DashboardHome from './DashboardHome';
import Invoices from './Invoices';
import Members from './Members';
import Profiles from './Profiles';
import SettingsView from './Settings';
import Notifications from './Notifications';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardHome user={user} onTabChange={setActiveTab} />;
      case 'invoices':
        return <Invoices user={user} />;
      case 'profiles':
        return user.role === 'MEMBER' ? <Profiles user={user} /> : null;
      case 'members':
        return user.role === 'ADMIN' ? (
          <Members
            user={user}
            onViewInvoices={(id) => {
              setSelectedMemberId(id);
              setActiveTab('member-invoices');
            }}
          />
        ) : null;
      case 'member-invoices':
        return <Invoices user={user} memberScopeId={selectedMemberId} />;
      case 'settings':
        return <SettingsView user={user} />;
      default:
        return <DashboardHome user={user} onTabChange={setActiveTab} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar
        user={user}
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setSelectedMemberId(null);
        }}
        onLogout={() => {
          clearToken();
          onLogout();
        }}
      />
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-heading text-slate-800">
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace('-', ' ')}
            </h1>
            <p className="text-slate-500">Welcome back, {user.name}</p>
          </div>
          <div className="flex items-center gap-4">
            {/* Notification Bell - Only for Admin */}
            {user.role === 'ADMIN' && (
              <Notifications adminId={user.id} />
            )}
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold">{user.name}</p>
              <p className="text-xs text-slate-400 capitalize">{user.role}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold overflow-hidden border-2 border-white shadow-sm">
              {user.avatar ? (
                <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                user.name.charAt(0).toUpperCase()
              )}
            </div>
          </div>
        </header>
        {renderContent()}
      </main>
    </div>
  );
};

export default Dashboard;
