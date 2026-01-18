
import React, { useState, useEffect } from 'react';
import { User, Invoice, Profile } from '../types';
import { X, ChevronDown, DollarSign } from 'lucide-react';
import { generateReferenceId, generateQRCodeUrl, getNextInvoiceNumber } from '../config';
import { SERVICE_CATEGORIES } from '../constants';

interface InvoiceFormProps {
  user: User;
  profiles: Profile[];
  onClose: () => void;
  onSubmit: (data: Partial<Invoice>) => void;
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({ user, profiles, onClose, onSubmit }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [description, setDescription] = useState('');

  const referenceId = generateReferenceId();
  const invoiceNumber = getNextInvoiceNumber();

  const [formData, setFormData] = useState({
    toName: '',
    toEmail: '',
    amount: '',
    currency: 'AUD',
  });

  useEffect(() => {
    // Set default profile if available
    const defaultProfile = profiles.find(p => p.isDefault) || profiles[0];
    if (defaultProfile) setSelectedProfile(defaultProfile);
  }, [profiles]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    const found = SERVICE_CATEGORIES.find(c => c.label === category);
    if (found) setDescription(found.description);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfile) return alert('Please select a profile first');
    if (!selectedCategory) return alert('Please select a service category');

    setIsSubmitting(true);
    try {
      const amount = parseFloat(formData.amount);
      const stripeLink = `https://buy.stripe.com/test_${referenceId.replace(/-/g, '')}`;
      const qrCodeUrl = generateQRCodeUrl(stripeLink);

      onSubmit({
        toName: formData.toName,
        toEmail: formData.toEmail,
        fromName: selectedProfile.name,
        profileId: selectedProfile.id,
        invoiceNumber,
        referenceId,
        subject: selectedCategory,
        description,
        amount,
        currency: formData.currency,
        stripeLink,
        qrCodeUrl,
      });
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert('Error creating invoice. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-lg font-bold font-heading text-slate-800">New Invoice</h2>
            <p className="text-xs text-slate-500">Fill in the details below</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-xl transition-all">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          {/* Auto Info */}
          <div className="flex gap-2 text-xs">
            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-2.5">
              <span className="text-slate-400 block">Invoice #</span>
              <span className="font-mono font-semibold text-indigo-600">{invoiceNumber}</span>
            </div>
            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-2.5">
              <span className="text-slate-400 block">Ref ID</span>
              <span className="font-mono font-semibold text-slate-600 text-[11px]">{referenceId}</span>
            </div>
          </div>

          {/* Profile Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">From (Profile) *</label>
            {profiles.length === 0 ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
                <p className="text-amber-700 text-sm font-medium">No profiles yet</p>
                <p className="text-amber-600 text-xs">Create one in Profiles section first</p>
              </div>
            ) : (
              <div className="relative">
                <select
                  required
                  className="w-full appearance-none bg-white border border-slate-200 rounded-xl py-2.5 px-3 pr-10 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                  value={selectedProfile?.id || ''}
                  onChange={(e) => setSelectedProfile(profiles.find(p => p.id === e.target.value) || null)}
                >
                  <option value="">Select profile...</option>
                  {profiles.map(p => (
                    <option key={p.id} value={p.id}>{p.name} {p.isDefault ? '(Default)' : ''}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            )}
          </div>

          {/* Client Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Bill To (Client) *</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                required
                type="text"
                placeholder="Client or company name"
                className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                value={formData.toName}
                onChange={(e) => setFormData({ ...formData, toName: e.target.value })}
              />
              <input
                type="email"
                placeholder="Client email (optional)"
                className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                value={formData.toEmail}
                onChange={(e) => setFormData({ ...formData, toEmail: e.target.value })}
              />
            </div>
          </div>

          {/* Currency Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Currency</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer hover:border-indigo-500 transition-all has-[:checked]:bg-indigo-50 has-[:checked]:border-indigo-500 has-[:checked]:text-indigo-700">
                <input
                  type="radio"
                  name="currency"
                  value="AUD"
                  checked={formData.currency === 'AUD'}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="hidden"
                />
                <span className="font-bold text-sm">AUD</span>
              </label>
              <label className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer hover:border-indigo-500 transition-all has-[:checked]:bg-indigo-50 has-[:checked]:border-indigo-500 has-[:checked]:text-indigo-700">
                <input
                  type="radio"
                  name="currency"
                  value="USD"
                  checked={formData.currency === 'USD'}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="hidden"
                />
                <span className="font-bold text-sm">USD</span>
              </label>
            </div>
          </div>

          {/* Service */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Service *</label>
            <div className="relative">
              <select
                required
                className="w-full appearance-none bg-white border border-slate-200 rounded-xl py-2.5 px-3 pr-10 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
              >
                <option value="">Select service...</option>
                {SERVICE_CATEGORIES.map(cat => (
                  <option key={cat.label} value={cat.label}>{cat.label}</option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
            {description && (
              <p className="text-xs text-slate-500 bg-slate-50 rounded-lg p-2 mt-1">{description}</p>
            )}
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-xs">{formData.currency}</span>
              <input
                required
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-12 pr-3 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-lg font-bold"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-all disabled:opacity-50 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || profiles.length === 0}
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-all disabled:opacity-50 text-sm"
            >
              {isSubmitting ? 'Creating...' : 'Generate Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InvoiceForm;
