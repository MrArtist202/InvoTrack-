
import React from 'react';
import { Invoice, Profile } from '../types';
import { APP_NAME } from '../constants';
import { COMPANY_INFO, formatCurrency } from '../config';
import { Mail, Phone, Globe, CreditCard, ShieldCheck, ExternalLink, Copy, MapPin } from 'lucide-react';
import QRCode from 'react-qr-code';

interface InvoiceTemplateProps {
  invoice: Invoice;
  profile?: Profile | null;
  onPay?: (invoice: Invoice) => void;
}

const InvoiceTemplate: React.FC<InvoiceTemplateProps> = ({ invoice, profile, onPay }) => {
  const copyLink = () => {
    navigator.clipboard.writeText(invoice.stripeLink);
  };

  return (
    <div data-id="invoice-template" className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden max-w-3xl mx-auto">
      {/* Header Bar with Gradient when profile exists */}
      <div className={`h-2 w-full ${profile ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500' : 'bg-slate-900'}`} />

      <div className="p-8 md:p-12">
        {/* Top Section */}
        <div className="flex flex-col md:flex-row justify-between gap-8 mb-12">
          {/* Left Side - Profile or Company Info */}
          {profile ? (
            <div className="flex items-start gap-4">
              {/* Profile Avatar */}
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 overflow-hidden shadow-lg">
                {profile.avatar ? (
                  <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
                ) : (
                  profile.name.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">{profile.name}</h2>
                <div className="text-slate-500 text-sm space-y-1">
                  <p className="flex items-center gap-2"><MapPin size={14} className="text-slate-400" /> {profile.address}</p>
                  <p className="flex items-center gap-2"><Phone size={14} className="text-slate-400" /> {profile.phone}</p>
                  {profile.email && (
                    <p className="flex items-center gap-2"><Mail size={14} className="text-slate-400" /> {profile.email}</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 font-bold text-xl font-heading mb-4 text-slate-900">
                <div className="bg-slate-900 text-white w-8 h-8 rounded-lg flex items-center justify-center text-sm">I</div>
                {APP_NAME}
              </div>
              <div className="text-slate-500 text-sm space-y-1">
                <p className="flex items-center gap-2"><Mail size={14} className="text-slate-400" /> {COMPANY_INFO.email}</p>
                <p className="flex items-center gap-2"><Phone size={14} className="text-slate-400" /> {COMPANY_INFO.phone}</p>
                <p className="flex items-center gap-2"><Globe size={14} className="text-slate-400" /> {COMPANY_INFO.website}</p>
              </div>
            </div>
          )}

          <div className="text-right">
            <h1 className="text-4xl font-bold font-heading text-slate-900 uppercase tracking-tight mb-2">Invoice</h1>
            <p className="text-indigo-600 font-bold text-lg">{invoice.invoiceNumber}</p>
            <p className="text-slate-400 text-sm mt-1">
              {new Date(invoice.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Reference ID */}
        <div className="bg-slate-50 rounded-xl p-4 mb-8 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase text-slate-400 font-semibold tracking-wider">Reference ID</p>
            <p className="font-mono font-bold text-slate-800">{invoice.referenceId}</p>
          </div>
          <div className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase ${invoice.status === 'paid'
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-amber-100 text-amber-700'
            }`}>
            {invoice.status}
          </div>
        </div>

        {/* From / To */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 pb-8 border-b border-slate-100">
          <div>
            <p className="text-xs uppercase text-slate-400 font-semibold tracking-wider mb-3">From</p>
            <h3 className="text-xl font-bold text-slate-900 mb-1">{invoice.fromName}</h3>
            <p className="text-slate-500 text-sm">Authorized Representative</p>
            <div className="mt-3 inline-flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-full">
              <ShieldCheck size={12} className="text-emerald-500" />
              <span className="text-xs font-semibold text-emerald-600">Verified</span>
            </div>
          </div>
          <div>
            <p className="text-xs uppercase text-slate-400 font-semibold tracking-wider mb-3">Bill To</p>
            <h3 className="text-xl font-bold text-slate-900 mb-1">{invoice.toName}</h3>
            <p className="text-slate-500 text-sm">{invoice.toEmail}</p>
          </div>
        </div>

        {/* Line Items */}
        <div className="mb-12">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left pb-4 text-xs uppercase font-semibold text-slate-400 tracking-wider">Description</th>
                <th className="text-right pb-4 text-xs uppercase font-semibold text-slate-400 tracking-wider">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-6">
                  <p className="font-semibold text-slate-900 text-lg mb-1">{invoice.subject}</p>
                  <p className="text-slate-400 text-sm">{invoice.description || 'Professional services as agreed'}</p>
                </td>
                <td className="py-6 text-right align-top">
                  <span className="font-bold text-2xl text-slate-900">
                    {formatCurrency(invoice.amount, invoice.currency)}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Payment Section */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-8 pt-8 border-t border-slate-100">
          {/* QR Code */}
          <div className="flex-shrink-0">
            <p className="text-xs uppercase text-slate-400 font-semibold tracking-wider mb-3">Scan to Pay</p>
            <div className="bg-white p-3 rounded-xl border border-slate-200 inline-block">
              <div style={{ height: "auto", margin: "0 auto", maxWidth: 112, width: "100%" }}>
                <QRCode
                  size={256}
                  style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                  value={invoice.stripeLink || ''}
                  viewBox={`0 0 256 256`}
                />
              </div>
            </div>
            <p className="flex items-center gap-1 mt-2 text-xs text-slate-500 cursor-pointer hover:text-indigo-600 transition-colors" onClick={copyLink}>
              <Copy size={12} />
              Copy link
            </p>
          </div>

          {/* Total & Pay Button */}
          <div className="w-full md:w-72 bg-slate-50 p-6 rounded-xl">
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span className="text-slate-900 font-medium">{formatCurrency(invoice.amount, invoice.currency)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Tax (0%)</span>
                <span className="text-slate-400">{formatCurrency(0, invoice.currency)}</span>
              </div>
              <div className="pt-3 border-t border-slate-200">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-900">Total Due</span>
                  <span className="font-bold text-2xl text-slate-900">{formatCurrency(invoice.amount, invoice.currency)}</span>
                </div>
              </div>
            </div>

            {invoice.status === 'pending' ? (
              <button
                id="invoice-pay-button"
                onClick={() => onPay ? onPay(invoice) : window.open(invoice.stripeLink, '_blank')}
                className="flex items-center justify-center gap-2 w-full bg-slate-900 text-white font-semibold py-4 rounded-xl hover:bg-indigo-600 transition-all"
              >
                <CreditCard size={18} />
                Continue to Pay
                <ExternalLink size={14} />
              </button>
            ) : (
              <div className="flex items-center justify-center gap-2 w-full bg-emerald-100 text-emerald-700 font-semibold py-4 rounded-xl">
                <ShieldCheck size={18} />
                Payment Complete
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-slate-50 px-8 py-4 border-t border-slate-100 text-center">
        <p className="text-xs text-slate-400 font-medium">
          Official Invoice • {APP_NAME} • {invoice.referenceId}
        </p>
      </div>
    </div>
  );
};

export default InvoiceTemplate;
