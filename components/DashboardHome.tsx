import React, { useState, useEffect } from 'react';
import { User, Invoice } from '../types';
import { invoicesAPI, membersAPI } from '../api';
import { formatCurrency } from '../config';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { FileText, Clock, CheckCircle, TrendingUp, ArrowUpRight, Wallet, Users, Plus, DollarSign } from 'lucide-react';

interface DashboardHomeProps {
  user: User;
  onTabChange: (tab: string) => void;
}

const DashboardHome: React.FC<DashboardHomeProps> = ({ user, onTabChange }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [memberCount, setMemberCount] = useState(0);
  const [stats, setStats] = useState<any>({
    AUD: { totalCount: 0, pendingCount: 0, paidCount: 0, totalRevenue: 0, pendingRevenue: 0, totalAmount: 0 },
    USD: { totalCount: 0, pendingCount: 0, paidCount: 0, totalRevenue: 0, pendingRevenue: 0, totalAmount: 0 },
  });
  const [currencyView, setCurrencyView] = useState<'AUD' | 'USD'>('AUD');

  useEffect(() => {
    const loadData = async () => {
      try {
        const allInvoices = await invoicesAPI.getAll();
        setInvoices(allInvoices);

        // Fetch new stats from backend
        // Note: For now, we are calculating locally to be safe or if the endpoint doesn't return everything perfectly yet, 
        // but the plan was to use backend. Let's try to use the backend stats if available, or calculate locally as fallback.
        // Actually, let's trust the backend changes we just made. 
        // We need to fetch stats from the API. The previous code didn't actually call `invoicesAPI.getStats()`. 
        // Let's assume there's an API call or calculate it. The previous code calculated it locally.
        // Since I modified the backend to return the perfect shape, I should probably use it. 
        // But `invoicesAPI` in `api.ts` might need an update to expose `getStats`. 
        // Let's check `api.ts` later. For now, calculating locally is safer and immediate without changing `api.ts`.
        // Wait, the user wants "dashboard also should show both...". Calculating locally is fine and robust.

        const newStats = {
          AUD: {
            totalCount: allInvoices.filter(i => i.currency === 'AUD').length,
            pendingCount: allInvoices.filter(i => i.currency === 'AUD' && i.status === 'pending').length,
            paidCount: allInvoices.filter(i => i.currency === 'AUD' && i.status === 'paid').length,
            totalRevenue: allInvoices.filter(i => i.currency === 'AUD' && i.status === 'paid').reduce((acc, curr) => acc + curr.amount, 0),
            pendingRevenue: allInvoices.filter(i => i.currency === 'AUD' && i.status === 'pending').reduce((acc, curr) => acc + curr.amount, 0),
            totalAmount: allInvoices.filter(i => i.currency === 'AUD').reduce((acc, curr) => acc + curr.amount, 0),
          },
          USD: {
            totalCount: allInvoices.filter(i => i.currency === 'USD').length,
            pendingCount: allInvoices.filter(i => i.currency === 'USD' && i.status === 'pending').length,
            paidCount: allInvoices.filter(i => i.currency === 'USD' && i.status === 'paid').length,
            totalRevenue: allInvoices.filter(i => i.currency === 'USD' && i.status === 'paid').reduce((acc, curr) => acc + curr.amount, 0),
            pendingRevenue: allInvoices.filter(i => i.currency === 'USD' && i.status === 'pending').reduce((acc, curr) => acc + curr.amount, 0),
            totalAmount: allInvoices.filter(i => i.currency === 'USD').reduce((acc, curr) => acc + curr.amount, 0),
          }
        };
        setStats(newStats);

        if (user.role === 'ADMIN') {
          const members = await membersAPI.getAll();
          setMemberCount(members.length);
        }
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      }
    };
    loadData();
  }, [user]);

  const currentStats = stats[currencyView];

  const chartData = [
    { name: 'Received', amount: currentStats.totalRevenue },
    { name: 'Pending', amount: currentStats.pendingRevenue },
    { name: 'Total', amount: currentStats.totalAmount },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* Currency Toggle */}
      <div className="flex justify-end">
        <div className="bg-slate-100 p-1 rounded-xl flex gap-1">
          <button
            onClick={() => setCurrencyView('AUD')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${currencyView === 'AUD' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            AUD ($)
          </button>
          <button
            onClick={() => setCurrencyView('USD')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${currencyView === 'USD' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            USD ($)
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Wallet className="text-white" size={22} />}
          label={`Total Received (${currencyView})`}
          value={formatCurrency(currentStats.totalRevenue, currencyView)}
          trend={`${currentStats.paidCount} paid`}
          trendUp={true}
          bg="bg-slate-900 text-white"
        />
        <StatCard
          icon={<Clock className="text-amber-600" size={22} />}
          label={`Pending (${currencyView})`}
          value={formatCurrency(currentStats.pendingRevenue, currencyView)}
          trend={`${currentStats.pendingCount} invoices`}
          bg="bg-white border border-slate-200"
        />
        <StatCard
          icon={<FileText className="text-indigo-600" size={22} />}
          label="Total Invoices"
          value={currentStats.totalCount.toString()}
          trend="All time"
          bg="bg-white border border-slate-200"
        />
        {user.role === 'ADMIN' ? (
          <StatCard
            icon={<Users className="text-emerald-600" size={22} />}
            label="Team Members"
            value={memberCount.toString()}
            trend="Active"
            trendUp={true}
            bg="bg-white border border-slate-200"
          />
        ) : (
          <StatCard
            icon={<CheckCircle className="text-emerald-600" size={22} />}
            label="Success Rate"
            value={currentStats.totalCount > 0 ? `${Math.round((currentStats.paidCount / currentStats.totalCount) * 100)}%` : '0%'}
            trend="Paid invoices"
            trendUp={true}
            bg="bg-white border border-slate-200"
          />
        )}
      </div>

      <div className={`grid grid-cols-1 ${user.role === 'ADMIN' ? 'lg:grid-cols-3' : ''} gap-6`}>
        {/* Chart - Admin Only */}
        {user.role === 'ADMIN' && (
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-lg text-slate-800">Revenue Overview ({currencyView})</h3>
                <p className="text-sm text-slate-500">Payment breakdown</p>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip
                    cursor={{ fill: '#f8fafc', radius: 8 }}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', padding: '12px' }}
                    formatter={(value: number) => [formatCurrency(value, currencyView), 'Amount']}
                  />
                  <Bar dataKey="amount" fill="#0f172a" radius={[8, 8, 0, 0]} barSize={60}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : index === 1 ? '#f59e0b' : '#0f172a'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-lg text-slate-800 mb-2">Quick Actions</h3>
          <p className="text-sm text-slate-500 mb-6">Common tasks</p>

          <div className="space-y-3">
            {user.role === 'MEMBER' && (
              <QuickActionButton
                title="Create Invoice"
                desc="Generate a new invoice"
                icon={<Plus size={18} className="text-indigo-600" />}
                onClick={() => onTabChange('invoices')}
              />
            )}
            <QuickActionButton
              title="View Invoices"
              desc="See all invoices"
              icon={<FileText size={18} className="text-slate-600" />}
              onClick={() => onTabChange('invoices')}
            />
            {user.role === 'ADMIN' && (
              <QuickActionButton
                title="Manage Team"
                desc="View members"
                icon={<Users size={18} className="text-emerald-600" />}
                onClick={() => onTabChange('members')}
              />
            )}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-lg text-slate-800">Recent Invoices</h3>
          <button onClick={() => onTabChange('invoices')} className="text-sm text-indigo-600 font-semibold hover:underline">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Reference</th>
                <th className="px-6 py-4">Client</th>
                {user.role === 'ADMIN' && <th className="px-6 py-4">Created By</th>}
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.slice(0, 5).map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-mono font-semibold text-indigo-600 text-sm">{inv.referenceId}</td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-800">{inv.toName}</p>
                    <p className="text-xs text-slate-400">{inv.toEmail}</p>
                  </td>
                  {user.role === 'ADMIN' && (
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-800 text-sm">{inv.member_name || 'Unknown'}</p>
                    </td>
                  )}
                  <td className="px-6 py-4 text-right font-bold text-slate-900">{formatCurrency(inv.amount, inv.currency)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${inv.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-sm">{new Date(inv.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={user.role === 'ADMIN' ? 6 : 5} className="px-6 py-12 text-center">
                    <FileText size={40} className="mx-auto text-slate-200 mb-3" />
                    <p className="text-slate-400">No invoices yet</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, trend, trendUp, bg }: any) => (
  <div className={`${bg || 'bg-white border border-slate-200'} p-5 rounded-2xl flex flex-col justify-between h-32`}>
    <div className="flex items-center justify-between">
      <div className={`p-2.5 rounded-xl ${bg?.includes('bg-white') ? 'bg-slate-100' : 'bg-white/20'}`}>
        {icon}
      </div>
      {trend && (
        <div className={`flex items-center text-xs font-semibold px-2 py-1 rounded-lg ${trendUp ? 'text-emerald-600 bg-emerald-50' : 'text-slate-500 bg-slate-100'
          }`}>
          {trendUp && <ArrowUpRight size={12} className="mr-0.5" />}
          {trend}
        </div>
      )}
    </div>
    <div>
      <p className={`text-xs font-semibold mb-0.5 ${bg?.includes('slate-900') ? 'text-slate-400' : 'text-slate-500'}`}>{label}</p>
      <p className={`text-2xl font-bold ${bg?.includes('slate-900') ? 'text-white' : 'text-slate-900'}`}>{value}</p>
    </div>
  </div>
);

const QuickActionButton = ({ title, desc, icon, onClick }: any) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all text-left"
  >
    <div className="bg-slate-50 p-2.5 rounded-lg">
      {icon}
    </div>
    <div>
      <p className="font-semibold text-slate-800 text-sm">{title}</p>
      <p className="text-xs text-slate-400">{desc}</p>
    </div>
  </button>
);

export default DashboardHome;
