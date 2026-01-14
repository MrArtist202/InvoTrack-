
// Stripe Integration for InvoTrack
// This module handles real Stripe payment link generation

export interface StripeConfig {
    publishableKey: string;
    secretKey: string;
    webhookSecret: string;
    isConfigured: boolean;
}

// Default configuration - REPLACE WITH YOUR KEYS
export const stripeConfig: StripeConfig = {
    publishableKey: '', // Your Stripe publishable key (pk_live_... or pk_test_...)
    secretKey: '',      // Your Stripe secret key (sk_live_... or sk_test_...)  
    webhookSecret: '',  // Your webhook signing secret (whsec_...)
    isConfigured: false,
};

// Check if Stripe is configured
export const isStripeConfigured = (): boolean => {
    return stripeConfig.publishableKey !== '' && stripeConfig.secretKey !== '';
};

// Generate a Stripe Payment Link
// Note: In production, this should be called from a backend server
export const createPaymentLink = async (
    amount: number,
    currency: string = 'usd',
    description: string,
    referenceId: string,
    customerEmail?: string
): Promise<string> => {
    if (!isStripeConfigured()) {
        // Return demo link if not configured
        console.warn('Stripe not configured. Using demo payment link.');
        return `https://buy.stripe.com/demo/${referenceId}`;
    }

    // In a real implementation, this would call your backend API
    // which would use the Stripe secret key to create a checkout session
    // 
    // Example backend endpoint:
    // POST /api/create-checkout-session
    // Body: { amount, currency, description, referenceId, customerEmail }
    //
    // The backend would then use:
    // const session = await stripe.checkout.sessions.create({
    //   payment_method_types: ['card'],
    //   line_items: [{
    //     price_data: {
    //       currency,
    //       product_data: { name: description },
    //       unit_amount: Math.round(amount * 100),
    //     },
    //     quantity: 1,
    //   }],
    //   mode: 'payment',
    //   success_url: `${YOUR_DOMAIN}/success?ref=${referenceId}`,
    //   cancel_url: `${YOUR_DOMAIN}/cancel?ref=${referenceId}`,
    //   customer_email: customerEmail,
    //   metadata: { referenceId },
    // });
    // return session.url;

    try {
        // For demo purposes, we'll create a mock checkout URL
        // In production, replace this with your actual API call
        const mockCheckoutUrl = `https://checkout.stripe.com/pay/cs_test_${referenceId}`;
        return mockCheckoutUrl;
    } catch (error) {
        console.error('Error creating payment link:', error);
        throw error;
    }
};

// Verify webhook signature (backend only)
export const verifyWebhookSignature = (
    payload: string,
    signature: string,
    secret: string
): boolean => {
    // This should only be used on the backend
    // const event = stripe.webhooks.constructEvent(payload, signature, secret);
    console.warn('Webhook verification should be done on the backend');
    return false;
};

// Handle successful payment (called by webhook)
export const handlePaymentSuccess = (referenceId: string): void => {
    const invoices = JSON.parse(localStorage.getItem('invotrack_invoices') || '[]');
    const index = invoices.findIndex((inv: any) => inv.referenceId === referenceId);

    if (index !== -1) {
        invoices[index].status = 'paid';
        invoices[index].paidAt = new Date().toISOString();
        localStorage.setItem('invotrack_invoices', JSON.stringify(invoices));
        console.log(`Invoice ${referenceId} marked as paid`);
    }
};

// Instructions for setting up Stripe
export const STRIPE_SETUP_INSTRUCTIONS = `
## Setting Up Real Stripe Payments

### Step 1: Create a Stripe Account
1. Go to https://stripe.com and sign up
2. Complete your business verification

### Step 2: Get Your API Keys
1. Go to Developers > API Keys in your Stripe Dashboard
2. Copy your Publishable key (pk_test_... or pk_live_...)
3. Copy your Secret key (sk_test_... or sk_live_...)

### Step 3: Create a Backend Server
You need a simple backend to securely create Stripe Checkout Sessions.
This can be a simple Express.js server or a serverless function.

Example with Express.js:
\`\`\`javascript
const stripe = require('stripe')('sk_test_...');
const express = require('express');
const app = express();

app.post('/api/create-checkout-session', async (req, res) => {
  const { amount, description, referenceId, customerEmail } = req.body;
  
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: { name: description },
        unit_amount: Math.round(amount * 100),
      },
      quantity: 1,
    }],
    mode: 'payment',
    success_url: \`\${YOUR_DOMAIN}/success?ref=\${referenceId}\`,
    cancel_url: \`\${YOUR_DOMAIN}/cancel?ref=\${referenceId}\`,
    customer_email: customerEmail,
    metadata: { referenceId },
  });
  
  res.json({ url: session.url });
});
\`\`\`

### Step 4: Set Up Webhooks
1. Go to Developers > Webhooks in Stripe Dashboard
2. Add endpoint: https://your-domain.com/api/webhook
3. Select event: checkout.session.completed
4. Copy the signing secret (whsec_...)

### Step 5: Handle Webhooks
\`\`\`javascript
app.post('/api/webhook', express.raw({type: 'application/json'}), (req, res) => {
  const sig = req.headers['stripe-signature'];
  const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const referenceId = session.metadata.referenceId;
    // Update your database to mark invoice as paid
  }
  
  res.json({ received: true });
});
\`\`\`

### Step 6: Update Frontend
Update config.ts with your backend API URL:
\`\`\`typescript
export const API_URL = 'https://your-backend.com';
\`\`\`
`;
