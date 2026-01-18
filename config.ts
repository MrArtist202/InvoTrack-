
// InvoTrack Configuration
// Configure your settings here

// ============================================
// STRIPE CONFIGURATION
// ============================================
// To enable real payments:
// 1. Create account at https://stripe.com
// 2. Get your API keys from Dashboard > Developers > API Keys
// 3. Fill in the values below

export const STRIPE_CONFIG = {
  // Your Stripe Publishable Key (starts with pk_)
  publishableKey: 'pk_test_51Shtyq953i45SWE93rOQzFdtXhTy59kVqdWn323mm0j5ZMk6r4x9Db1dPE7eGTjInu0ZFyjApkt8cHEFL228oBBB00XBFfLqfL',

  // Set to true when you've added your keys
  isConfigured: true,

  // Your backend API URL (for creating checkout sessions)
  // In production (Vercel), we can use the relative path or specific env var
  apiUrl: import.meta.env.VITE_API_URL || '/api',
};

// ============================================
// COMPANY INFORMATION
// ============================================
// This appears on invoices

export const COMPANY_INFO = {
  name: 'InvoTrack',
  email: 'support@invotrack.com',
  phone: '+1 (555) 123-4567',
  website: 'www.invotrack.com',
  address: '123 Business Avenue, Suite 100',
  city: 'New York, NY 10001',
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

export const formatCurrency = (amount: number, currency: string = 'AUD'): string => {
  const code = currency.toUpperCase();
  const locale = code === 'AUD' ? 'en-AU' : 'en-US';

  // Explicitly return CURRENCY CODE + Value to be safe and clear as requested
  return `${code} ${amount.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Generate a unique reference ID for each invoice (timestamp-based for guaranteed uniqueness)
export const generateReferenceId = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `REF-${timestamp}-${random}`;
};

// Generate next serial invoice number (INV-0001, INV-0002, etc.)
export const getNextInvoiceNumber = (): string => {
  const all = JSON.parse(localStorage.getItem('invotrack_invoices') || '[]');
  const invoiceNumbers = all
    .map((inv: any) => inv.invoiceNumber)
    .filter((num: string) => num && num.startsWith('INV-'))
    .map((num: string) => parseInt(num.replace('INV-', ''), 10))
    .filter((num: number) => !isNaN(num));

  const maxNumber = invoiceNumbers.length > 0 ? Math.max(...invoiceNumbers) : 0;
  const nextNumber = maxNumber + 1;
  return `INV-${nextNumber.toString().padStart(4, '0')}`;
};

// Generate payment link
export const generatePaymentLink = async (
  referenceId: string,
  amount: number,
  description: string,
  customerEmail: string,
  currency: string = 'AUD'
): Promise<string> => {
  if (STRIPE_CONFIG.isConfigured && STRIPE_CONFIG.apiUrl) {
    try {
      // Call your backend to create a Stripe Checkout Session
      // Remove hardcoded /api since apiUrl already includes it (or defaults to /api)
      const response = await fetch(`${STRIPE_CONFIG.apiUrl}/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          currency,
          description,
          referenceId,
          customerEmail,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.details || 'Failed to create checkout session');
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error('Error creating Stripe checkout:', error);
      throw error; // Let the caller handle it
    }
  }

  // If not configured, throw error
  throw new Error('Stripe is not configured');
};

// Generate QR code URL for payment
export const generateQRCodeUrl = (paymentLink: string, size: number = 200): string => {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(paymentLink)}`;
};

// ============================================
// POLLING FOR PAYMENT STATUS
// ============================================
// When Stripe is configured, the frontend can poll for payment status
// In production, use webhooks for real-time updates

export const checkPaymentStatus = async (referenceId: string): Promise<'pending' | 'paid' | 'failed'> => {
  if (STRIPE_CONFIG.isConfigured && STRIPE_CONFIG.apiUrl) {
    try {
      const response = await fetch(`${STRIPE_CONFIG.apiUrl}/check-payment/${referenceId}`);
      const data = await response.json();
      return data.status;
    } catch (error) {
      console.error('Error checking payment status:', error);
      return 'pending';
    }
  }

  // Without Stripe, return current localStorage status
  const invoices = JSON.parse(localStorage.getItem('invotrack_invoices') || '[]');
  const invoice = invoices.find((inv: any) => inv.referenceId === referenceId);
  return invoice?.status || 'pending';
};
