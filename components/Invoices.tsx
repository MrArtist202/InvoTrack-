
import React, { useState, useEffect, useRef } from 'react';
import { User, Invoice, InvoiceStatus, Profile } from '../types';
import { invoicesAPI, profilesAPI } from '../api';
import { STRIPE_CONFIG, generatePaymentLink, formatCurrency } from '../config';
import { Plus, Search, Mail, Download, Check, ExternalLink, ReceiptText, Copy, Trash2, AlertCircle, Filter, ChevronDown, X } from 'lucide-react';
import InvoiceForm from './InvoiceForm';
import InvoiceTemplate from './InvoiceTemplate';
import { notifyInvoiceCreated } from '../notificationStore';

interface InvoicesProps {
  user: User;
  memberScopeId?: string | null;
}

const Invoices: React.FC<InvoicesProps> = ({ user, memberScopeId }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);

  // Filter states
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [filterProfile, setFilterProfile] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadInvoices();
    loadProfiles();
  }, [user, memberScopeId]);

  const loadProfiles = async () => {
    try {
      const all = await profilesAPI.getAll();
      setProfiles(all);
    } catch (error) {
      console.error('Failed to load profiles:', error);
    }
  };

  const loadInvoices = async () => {
    try {
      const all = await invoicesAPI.getAll();
      console.log('Raw invoices from API:', all);
      let filtered = all;

      if (memberScopeId) {
        filtered = all.filter((inv: Invoice) => inv.memberId === memberScopeId);
      }

      const sorted = filtered.sort((a: Invoice, b: Invoice) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA;
      });

      console.log('Final sorted invoices:', sorted);
      setInvoices(sorted);
    } catch (error) {
      console.error('Failed to load invoices:', error);
    }
  };

  // No need for local getNextInvoiceNumber as we can do it effectively or just rely on form data
  // generateReferenceId is useful

  // Generate robust unique reference ID (timestamp + random)
  const generateReferenceId = (): string => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `REF-${timestamp}-${random}`;
  };

  const handleCreate = async (data: Partial<Invoice>) => {
    try {
      const referenceId = data.referenceId || generateReferenceId();

      const newInv = await invoicesAPI.create({
        reference_id: referenceId,
        invoice_number: data.invoiceNumber || 'INV-0000', // Should be handled better ideally
        profile_id: data.profileId,
        from_name: data.fromName || user.name,
        to_name: data.toName || '',
        to_email: data.toEmail || '',
        subject: data.subject || '',
        description: data.description || '',
        amount: data.amount || 0,
        currency: data.currency,
        stripe_link: data.stripeLink,
        qr_code_url: data.qrCodeUrl,
      });

      // Generate Stripe link if configured
      if (STRIPE_CONFIG.isConfigured && newInv) {
        await generatePaymentLink(referenceId, newInv.amount, newInv.description || 'Invoice', newInv.toEmail || '', newInv.currency);
        // The backend `create-checkout-session` updates the invoice with the link
      }

      notifyInvoiceCreated(user, newInv.amount, newInv.id);
      loadInvoices();
      setShowForm(false);
    } catch (error: any) {
      alert(error.message || 'Failed to create invoice');
    }
  };

  const toggleStatus = async (id: string) => {
    const invoice = invoices.find(i => i.id === id);
    if (!invoice) return;

    try {
      const newStatus = invoice.status === 'paid' ? 'pending' : 'paid';
      const updated = await invoicesAPI.updateStatus(id, newStatus);

      setInvoices(invoices.map(inv => inv.id === id ? { ...inv, status: updated.status } : inv));

      if (selectedInvoice && selectedInvoice.id === id) {
        setSelectedInvoice({ ...selectedInvoice, status: updated.status });
      }
    } catch (error: any) {
      alert(error.message || 'Failed to update status');
    }
  };

  const deleteInvoice = async (id: string) => {
    const invoice = invoices.find(i => i.id === id);
    if (invoice && invoice.status === 'paid') {
      alert('Cannot delete a paid invoice');
      return;
    }

    try {
      await invoicesAPI.delete(id);
      setDeleteConfirm(null);
      loadInvoices();
      if (selectedInvoice?.id === id) {
        setSelectedInvoice(null);
      }
    } catch (error: any) {
      alert(error.message || 'Failed to delete invoice');
    }
  };

  const handlePayment = async (inv: Invoice) => {
    // Always generate a new link to ensure the session hasn't expired (Stripe sessions expire in 24h)
    // if (inv.stripeLink && inv.stripeLink.includes('checkout.stripe.com')) {
    //   window.open(inv.stripeLink, '_blank');
    //   return;
    // }

    try {
      const url = await generatePaymentLink(inv.referenceId, inv.amount, inv.description || 'Invoice', inv.toEmail || '', inv.currency);

      // Update local state to reflect new link immediately
      const updatedInv = { ...inv, stripeLink: url };
      setInvoices(prev => prev.map(i => i.id === inv.id ? updatedInv : i));

      if (selectedInvoice && selectedInvoice.id === inv.id) {
        setSelectedInvoice(updatedInv);
      }

      window.open(url, '_blank');
    } catch (e: any) {
      alert("Failed to generate payment link: " + e.message);
    }
  };

  const copyPaymentLink = (link: string) => {
    navigator.clipboard.writeText(link);
  };

  const downloadPDF = async () => {
    if (!invoiceRef.current || !selectedInvoice) return;

    try {
      const { toPng } = await import('html-to-image');
      const { jsPDF } = await import('jspdf');

      // 1. Clone only to ensuring we have a clean capture context if needed, 
      // but html-to-image works great on the live element usually. 
      // However, to strictly enforce A4 width and avoid viewport issues, we still use a detailed hidden container.

      const originalElement = invoiceRef.current;

      // We must render the clone visible for html-to-image to capture it correctly (it needs layout).
      // But we can put it in a container that's "off-screeen" but technically rendered.
      const container = document.createElement('div');
      container.style.position = 'fixed'; // clear alignment
      container.style.top = '0';
      container.style.left = '0';
      container.style.width = '794px'; // A4 width @ 96DPI
      container.style.zIndex = '-9999';
      container.style.backgroundColor = '#ffffff';

      // Clone the node
      const clone = originalElement.cloneNode(true) as HTMLElement;

      // Reset some styles on the clone root to ensure it fills the A4 container
      const templateRoot = clone.querySelector('[data-id="invoice-template"]') as HTMLElement;
      if (templateRoot) {
        templateRoot.style.maxWidth = '100%';
        templateRoot.style.margin = '0';
        templateRoot.style.boxShadow = 'none';
        templateRoot.style.border = 'none';
        templateRoot.style.borderRadius = '0';
      }

      container.appendChild(clone);
      document.body.appendChild(container);

      // 3. Handle images explicitly to avoid CORS issues
      // html-to-image tries to handle this, but manual pre-fetching is more robust
      const images = Array.from(container.querySelectorAll('img'));
      const loadPromises = images.map(async (img) => {
        if (img.src && !img.src.startsWith('data:')) {
          try {
            const response = await fetch(img.src);
            const blob = await response.blob();
            const reader = new FileReader();
            return new Promise<void>((resolve) => {
              reader.onloadend = () => {
                img.src = reader.result as string;
                resolve();
              };
              reader.readAsDataURL(blob);
            });
          } catch (e) {
            console.warn('Failed to load image for PDF:', img.src, e);
          }
        }
      });
      await Promise.all(loadPromises);

      // Allow fonts to load and layout to settle
      await document.fonts.ready;
      await new Promise(resolve => setTimeout(resolve, 800));

      // 2. Capture using html-to-image
      const dataUrl = await toPng(container, {
        cacheBust: true,
        pixelRatio: 2, // High resolution
        backgroundColor: '#ffffff',
        width: 794,
      });

      // 3. Generate PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = 210;

      // Calculate image dimensions to fit width
      const imgProps = pdf.getImageProperties(dataUrl);
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, imgHeight);

      // 4. Add Links
      if (selectedInvoice.status === 'pending' && selectedInvoice.stripeLink) {
        const payBtn = container.querySelector('#invoice-pay-button');
        if (payBtn) {
          const btnRect = payBtn.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect(); // Use container rect as reference

          // Map web pixels to PDF mm
          const scale = pdfWidth / 794;

          const x = (btnRect.left - containerRect.left) * scale;
          const y = (btnRect.top - containerRect.top) * scale;
          const w = btnRect.width * scale;
          const h = btnRect.height * scale;

          pdf.link(x, y, w, h, { url: selectedInvoice.stripeLink });
        }
      }

      pdf.save(`Invoice-${selectedInvoice.referenceId}.pdf`);

      // Cleanup
      document.body.removeChild(container);

    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const filteredInvoices = React.useMemo(() => {
    return invoices.filter(inv => {
      // Search filter
      const matchesSearch = searchTerm === '' ||
        inv.toName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.referenceId.toLowerCase().includes(searchTerm.toLowerCase());

      // Profile filter
      const matchesProfile = filterProfile === '' || inv.profileId === filterProfile;

      // Status filter
      const matchesStatus = filterStatus === '' || inv.status === filterStatus;

      // Date filter
      const invDate = new Date(inv.created_at).setHours(0, 0, 0, 0);
      const matchesDateFrom = filterDateFrom === '' || invDate >= new Date(filterDateFrom).setHours(0, 0, 0, 0);
      const matchesDateTo = filterDateTo === '' || invDate <= new Date(filterDateTo).setHours(0, 0, 0, 0);

      return matchesSearch && matchesProfile && matchesStatus && matchesDateFrom && matchesDateTo;
    });
  }, [invoices, searchTerm, filterProfile, filterStatus, filterDateFrom, filterDateTo]);

  const clearFilters = () => {
    setFilterProfile('');
    setFilterStatus('');
    setFilterDateFrom('');
    setFilterDateTo('');
  };

  const hasActiveFilters = filterProfile || filterStatus || filterDateFrom || filterDateTo;

  return (
    <div className="space-y-6">
      {!selectedInvoice && (
        <>
          {/* Search and Filter Bar */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="flex gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search client, invoice # or reference..."
                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${showFilters || hasActiveFilters
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                >
                  <Filter size={16} />
                  Filters
                  {hasActiveFilters && (
                    <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                  )}
                </button>
              </div>
              {user.role === 'MEMBER' && !memberScopeId && (
                <button
                  onClick={() => setShowForm(true)}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-slate-800 active:scale-[0.98] transition-all text-sm"
                >
                  <Plus size={18} />
                  New Invoice
                </button>
              )}
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <div className="bg-white border border-slate-200 rounded-xl p-4 animate-in slide-in-from-top duration-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-slate-700">Filter Invoices</span>
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="text-xs text-indigo-600 hover:underline flex items-center gap-1"
                    >
                      <X size={12} />
                      Clear all
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Profile Filter */}
                  {profiles.length > 0 && (
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-500">Profile</label>
                      <select
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                        value={filterProfile}
                        onChange={(e) => setFilterProfile(e.target.value)}
                      >
                        <option value="">All Profiles</option>
                        {profiles.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Status Filter */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500">Status</label>
                    <select
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                    >
                      <option value="">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                    </select>
                  </div>

                  {/* Date From */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500">From Date</label>
                    <input
                      type="date"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                      value={filterDateFrom}
                      onChange={(e) => setFilterDateFrom(e.target.value)}
                    />
                  </div>

                  {/* Date To */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500">To Date</label>
                    <input
                      type="date"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                      value={filterDateTo}
                      onChange={(e) => setFilterDateTo(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">Reference</th>
                    <th className="px-6 py-4">From</th>
                    <th className="px-6 py-4">To</th>
                    <th className="px-6 py-4">Subject</th>
                    <th className="px-6 py-4 text-right">Amount</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50 group">
                      <td className="px-6 py-4">
                        <p className="font-mono font-semibold text-indigo-600 text-sm">{inv.referenceId}</p>
                        <p className="text-xs text-slate-400">{new Date(inv.created_at).toLocaleDateString()}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-700">{inv.fromName}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-800">{inv.toName}</p>
                        <p className="text-xs text-slate-400">{inv.toEmail}</p>
                      </td>
                      <td className="px-6 py-4 text-slate-600 max-w-[200px] truncate">{inv.subject}</td>
                      <td className="px-6 py-4 text-right font-bold text-slate-800">{formatCurrency(inv.amount, inv.currency)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${inv.status === 'paid'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                          }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSelectedInvoice(inv)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                            title="View Invoice"
                          >
                            <ExternalLink size={16} />
                          </button>
                          <button
                            onClick={() => copyPaymentLink(inv.stripeLink)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                            title="Copy Payment Link"
                          >
                            <Copy size={16} />
                          </button>
                          <button
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                            title="Send Email"
                          >
                            <Mail size={16} />
                          </button>
                          {/* Delete button - only for pending invoices */}
                          {inv.status === 'pending' && (
                            <button
                              onClick={() => setDeleteConfirm(inv.id)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              title="Delete Invoice"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredInvoices.length === 0 && (
                <div className="p-16 text-center">
                  <ReceiptText className="mx-auto text-slate-200 mb-4" size={48} />
                  <p className="text-slate-500 font-medium">No invoices found</p>
                  <p className="text-slate-400 text-sm mt-1">
                    {user.role === 'MEMBER' ? 'Create your first invoice to get started' : 'No invoices from your team yet'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {selectedInvoice && (
        <div className="animate-in slide-in-from-right duration-300">
          <div className="mb-6 flex items-center justify-between">
            <button
              onClick={() => setSelectedInvoice(null)}
              className="text-slate-500 hover:text-slate-900 flex items-center gap-2 font-medium bg-white px-4 py-2 rounded-xl border border-slate-200 hover:border-slate-300 transition-all"
            >
              ← Back to List
            </button>
            <div className="flex gap-2">
              {selectedInvoice.status === 'pending' && (
                <button
                  onClick={() => setDeleteConfirm(selectedInvoice.id)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition-all"
                >
                  <Trash2 size={18} />
                  Delete
                </button>
              )}
              <button
                onClick={downloadPDF}
                className="bg-slate-900 text-white px-4 py-2 rounded-xl font-semibold hover:bg-slate-800 transition-all flex items-center gap-2"
              >
                <Download size={18} />
                Download PDF
              </button>
            </div>
          </div>
          <div ref={invoiceRef}>
            <InvoiceTemplate
              invoice={selectedInvoice}
              profile={profiles.find(p => p.id === selectedInvoice.profileId)}
              onPay={handlePayment}
            />
          </div>
        </div>
      )}

      {showForm && (
        <InvoiceForm
          user={user}
          profiles={profiles}
          onClose={() => setShowForm(false)}
          onSubmit={handleCreate}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 rounded-xl">
                <AlertCircle className="text-red-600" size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Delete Invoice?</h3>
                <p className="text-sm text-slate-500">This action cannot be undone</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteInvoice(deleteConfirm);
                  if (selectedInvoice?.id === deleteConfirm) {
                    setSelectedInvoice(null);
                  }
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;
