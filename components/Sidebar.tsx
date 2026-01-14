
import React, { useState, useRef, useEffect } from 'react';
import { User } from '../types';
import { authAPI } from '../api';
import { NAV_ITEMS, APP_NAME } from '../constants';
import { LogOut, Settings, ChevronUp, Camera, Save, X, Mail, Phone, Lock, Eye, EyeOff } from 'lucide-react';

interface SidebarProps {
  user: User;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ user, activeTab, setActiveTab, onLogout }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone,
    avatar: user.avatar || '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500000) {
        alert('Image too large. Please choose an image under 500KB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      // Password change validation
      if (showPasswordSection) {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
          alert('New passwords do not match!');
          return;
        }
        if (passwordData.newPassword && passwordData.newPassword.length < 6) {
          alert('New password must be at least 6 characters!');
          return;
        }

        await authAPI.changePassword({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        });
      }

      const updatedUser = await authAPI.updateProfile({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        avatar: formData.avatar,
      });

      // Update local user state if needed (or reload page / re-fetch)
      // Since App.tsx fetches user on mount, reloading might be easiest or better yet, just close modal
      // Ideally we should update the parent state. But for now, alert and close.

      alert('Profile updated successfully!');
      setShowEditModal(false);
      setShowPasswordSection(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });

      // Force reload to update context (simple solution for now)
      window.location.reload();
    } catch (error: any) {
      alert(error.message || 'Failed to update profile');
    }
  };

  return (
    <>
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-2.5 font-bold text-xl font-heading">
            <div className="bg-slate-900 text-white w-9 h-9 rounded-xl flex items-center justify-center">I</div>
            <span className="text-slate-900">{APP_NAME}</span>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 p-4">
          <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-3 px-3">Menu</p>
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              if (item.adminOnly && user.role !== 'ADMIN') return null;
              if (item.memberOnly && user.role !== 'MEMBER') return null;

              const isActive = activeTab === item.path || (activeTab === 'member-invoices' && item.path === 'members');

              return (
                <button
                  key={item.path}
                  onClick={() => setActiveTab(item.path)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm ${isActive
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                    }`}
                >
                  <span className={isActive ? 'text-white' : 'text-slate-400'}>
                    {item.icon}
                  </span>
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Profile Section */}
        <div className="p-4 border-t border-slate-100 relative" ref={menuRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-all group"
          >
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold overflow-hidden">
              {user.avatar ? (
                <img src={user.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                user.name.charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-semibold text-slate-800 truncate">{user.name}</p>
              <p className="text-xs text-slate-400 capitalize">{user.role.toLowerCase()}</p>
            </div>
            <ChevronUp size={16} className={`text-slate-400 transition-transform ${showProfileMenu ? '' : 'rotate-180'}`} />
          </button>

          {/* Profile Dropdown Menu */}
          {showProfileMenu && (
            <div className="absolute bottom-full left-4 right-4 mb-2 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-2 duration-200">
              <div className="p-4 border-b border-slate-100 bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg overflow-hidden">
                    {user.avatar ? (
                      <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      user.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 truncate">{user.name}</p>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                  </div>
                </div>
              </div>
              <div className="p-2">
                <button
                  onClick={() => { setShowProfileMenu(false); setShowEditModal(true); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-all"
                >
                  <Settings size={16} className="text-slate-400" />
                  Edit Profile
                </button>
                <button
                  onClick={() => { setShowProfileMenu(false); onLogout(); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-all"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800">Edit Profile</h2>
              <button onClick={() => { setShowEditModal(false); setShowPasswordSection(false); }} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg transition-all">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto">
              {/* Avatar Upload */}
              <div className="flex flex-col items-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <button
                  type="button"
                  onClick={handleAvatarClick}
                  className="w-20 h-20 rounded-full bg-indigo-100 border-4 border-white shadow-lg flex items-center justify-center overflow-hidden transition-all cursor-pointer group hover:ring-4 hover:ring-indigo-100"
                >
                  {formData.avatar ? (
                    <img src={formData.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Camera size={28} className="text-indigo-400 group-hover:text-indigo-600 transition-colors" />
                  )}
                </button>
                <p className="text-xs text-slate-400 mt-2">Click to upload photo</p>
              </div>

              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Mail size={12} /> Email
                </label>
                <input
                  type="email"
                  className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Phone size={12} /> Phone
                </label>
                <input
                  type="tel"
                  className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              {/* Change Password Toggle */}
              <button
                type="button"
                onClick={() => setShowPasswordSection(!showPasswordSection)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-all"
              >
                <span className="flex items-center gap-2">
                  <Lock size={14} className="text-slate-400" />
                  Change Password
                </span>
                <ChevronUp size={14} className={`text-slate-400 transition-transform ${showPasswordSection ? '' : 'rotate-180'}`} />
              </button>

              {/* Password Change Section */}
              {showPasswordSection && (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Current Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3 pr-10 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">New Password</label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Confirm New Password</label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => { setShowEditModal(false); setShowPasswordSection(false); }}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-all text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-all text-sm flex items-center justify-center gap-2"
                >
                  <Save size={16} />
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
