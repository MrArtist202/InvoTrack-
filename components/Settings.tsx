
import React, { useState } from 'react';
import { User } from '../types';
import { Camera, Lock, Save, User as UserIcon, Phone, Mail } from 'lucide-react';

interface SettingsProps {
  user: User;
}

const SettingsView: React.FC<SettingsProps> = ({ user }) => {
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone,
  });

  const handleSave = () => {
    // Update logic
    const storageKey = user.role === 'ADMIN' ? 'invotrack_admins' : 'invotrack_members';
    const all = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const index = all.findIndex((u: any) => u.id === user.id);
    if (index !== -1) {
      all[index] = { ...all[index], ...formData };
      localStorage.setItem(storageKey, JSON.stringify(all));
      localStorage.setItem('invotrack_user', JSON.stringify(all[index]));
      alert("Settings saved successfully! Please refresh or rejoin to see full changes.");
    }
  };

  return (
    <div className="max-w-4xl space-y-8 animate-in slide-in-from-bottom duration-500">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-indigo-600 h-32 relative">
          <div className="absolute -bottom-12 left-8 p-1 bg-white rounded-3xl shadow-xl">
            <div className="relative group">
              <img src={user.avatar} className="w-32 h-32 rounded-2xl object-cover" alt="" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 rounded-2xl flex items-center justify-center transition-opacity cursor-pointer">
                <Camera className="text-white" size={24} />
              </div>
            </div>
          </div>
        </div>
        <div className="pt-16 pb-8 px-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold font-heading">{user.name}</h2>
            <p className="text-slate-500">{user.email} • <span className="capitalize">{user.role}</span></p>
          </div>
          <button onClick={handleSave} className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
            <Save size={18} />
            Save Changes
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
          <h3 className="font-bold text-lg font-heading flex items-center gap-2">
            <UserIcon size={20} className="text-indigo-600" />
            General Information
          </h3>
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Full Name</label>
              <input
                type="text"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 outline-none focus:ring-2 focus:ring-indigo-500"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Email Address</label>
              <input
                type="email"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 outline-none focus:ring-2 focus:ring-indigo-500"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Phone Number</label>
              <input
                type="tel"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 outline-none focus:ring-2 focus:ring-indigo-500"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
          <h3 className="font-bold text-lg font-heading flex items-center gap-2">
            <Lock size={20} className="text-indigo-600" />
            Security
          </h3>
          <div className="space-y-4">
            <p className="text-sm text-slate-500">Manage your account security settings</p>
            <button className="text-indigo-600 font-bold text-sm hover:underline">Change Account Password</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
