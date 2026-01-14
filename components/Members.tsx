
import React, { useState, useEffect } from 'react';
import { User, Invoice } from '../types';
import { membersAPI, invoicesAPI } from '../api';
import { UserPlus, Search, Mail, Phone, ExternalLink, FileText, DollarSign, CheckCircle, X } from 'lucide-react';

interface MembersProps {
  user: User;
  onViewInvoices: (memberId: string) => void;
}

interface MemberStats {
  invoiceCount: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
}

const Members: React.FC<MembersProps> = ({ user, onViewInvoices }) => {
  const [members, setMembers] = useState<User[]>([]);
  const [memberStats, setMemberStats] = useState<Record<string, MemberStats>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    phone: '',
    password: 'password123',
  });

  useEffect(() => {
    loadMembers();
  }, [user]);

  const loadMembers = async () => {
    try {
      const myMembers = await membersAPI.getAll();
      setMembers(myMembers);

      // Calculate stats for each member
      const invoices = await invoicesAPI.getAll();
      const stats: Record<string, MemberStats> = {};

      myMembers.forEach((member: User) => {
        const memberInvoices = invoices.filter((inv: Invoice) => inv.memberId === member.id);
        stats[member.id] = {
          invoiceCount: memberInvoices.length,
          totalAmount: memberInvoices.reduce((sum: number, inv: Invoice) => sum + Number(inv.amount), 0),
          paidAmount: memberInvoices.filter((inv: Invoice) => inv.status === 'paid').reduce((sum: number, inv: Invoice) => sum + Number(inv.amount), 0),
          pendingAmount: memberInvoices.filter((inv: Invoice) => inv.status === 'pending').reduce((sum: number, inv: Invoice) => sum + Number(inv.amount), 0),
        };
      });

      setMemberStats(stats);
    } catch (error) {
      console.error('Failed to load members:', error);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await membersAPI.create({
        name: newMember.name,
        email: newMember.email,
        phone: newMember.phone,
        password: newMember.password,
      });

      setNewMember({ name: '', email: '', phone: '', password: 'password123' });
      setShowAddForm(false);
      loadMembers();
    } catch (error: any) {
      alert(error.message || 'Failed to create member');
    }
  };

  const filteredMembers = members.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search members..."
            className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-11 pr-4 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-slate-800 transition-all"
        >
          <UserPlus size={20} />
          Add Member
        </button>
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMembers.map((member) => {
          const stats = memberStats[member.id] || { invoiceCount: 0, totalAmount: 0, paidAmount: 0, pendingAmount: 0 };

          return (
            <div key={member.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all">
              {/* Header */}
              <div className="flex items-start gap-4 mb-4">
                <img
                  src={member.avatar}
                  alt={member.name}
                  className="w-12 h-12 rounded-xl object-cover border border-slate-100"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-800 truncate">{member.name}</h3>
                  <p className="text-xs text-slate-400 truncate">{member.email}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-slate-50 p-3 rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText size={12} className="text-slate-400" />
                    <span className="text-xs text-slate-500">Invoices</span>
                  </div>
                  <p className="font-bold text-slate-800">{stats.invoiceCount}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign size={12} className="text-slate-400" />
                    <span className="text-xs text-slate-500">Total</span>
                  </div>
                  <p className="font-bold text-slate-800">${stats.totalAmount.toLocaleString()}</p>
                </div>
                <div className="bg-emerald-50 p-3 rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle size={12} className="text-emerald-500" />
                    <span className="text-xs text-emerald-600">Received</span>
                  </div>
                  <p className="font-bold text-emerald-700">${stats.paidAmount.toLocaleString()}</p>
                </div>
                <div className="bg-amber-50 p-3 rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign size={12} className="text-amber-500" />
                    <span className="text-xs text-amber-600">Pending</span>
                  </div>
                  <p className="font-bold text-amber-700">${stats.pendingAmount.toLocaleString()}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => onViewInvoices(member.id)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 transition-all"
                >
                  <FileText size={14} />
                  Invoices
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-50 text-indigo-600 text-sm font-semibold hover:bg-indigo-100 transition-all">
                  <Mail size={14} />
                  Message
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredMembers.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <UserPlus size={40} className="mx-auto text-slate-200 mb-4" />
          <p className="text-slate-500 font-medium">No team members yet</p>
          <p className="text-slate-400 text-sm mt-1">Add your first team member to get started</p>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-xl font-bold font-heading text-slate-900">Add Team Member</h2>
                <p className="text-sm text-slate-500 mt-0.5">Invite a new member to your team.</p>
              </div>
              <button
                onClick={() => setShowAddForm(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddMember} className="p-6 space-y-5">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Full Name</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Sarah Smith"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm font-medium"
                    value={newMember.name}
                    onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Email Address</label>
                  <input
                    required
                    type="email"
                    placeholder="sarah@company.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm font-medium"
                    value={newMember.email}
                    onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Phone</label>
                  <input
                    required
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm font-medium"
                    value={newMember.phone}
                    onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Password</label>
                  <input
                    required
                    type="text"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm font-medium"
                    value={newMember.password}
                    onChange={(e) => setNewMember({ ...newMember, password: e.target.value })}
                  />
                  <p className="text-[10px] text-slate-400">Share this password with the member to login.</p>
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-all text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-slate-900 text-white font-semibold py-3 rounded-xl hover:bg-slate-800 transition-all text-sm shadow-lg shadow-slate-900/20"
                >
                  Create Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Members;
