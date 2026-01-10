/**
 * Invoice PDF Generator for Audiolyse
 * Generates professional invoices for subscriptions and credit purchases
 */

// Note: This is designed for client-side PDF generation
// For server-side, we'll use a different approach with API

export interface InvoiceData {
  invoiceNumber: string;
  date: string;
  dueDate?: string;
  
  // Company details
  company: {
    name: string;
    address: string[];
    email: string;
    phone?: string;
    gstin?: string; // GST Identification Number for India
  };
  
  // Customer details
  customer: {
    name: string;
    email: string;
    address?: string[];
    organizationName?: string;
  };
  
  // Line items
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }[];
  
  // Totals
  subtotal: number;
  tax?: {
    rate: number; // percentage (e.g., 18 for 18%)
    amount: number;
    name: string; // e.g., "GST", "VAT"
  };
  discount?: {
    description: string;
    amount: number;
  };
  total: number;
  
  // Payment details
  currency: 'INR' | 'USD';
  paymentId: string;
  paymentMethod: string;
  paymentStatus: 'paid' | 'pending' | 'failed';
  
  // Additional info
  notes?: string;
  billingInterval?: 'monthly' | 'annual';
}

// Company information for invoices
export const COMPANY_INFO = {
  name: 'Audiolyse Technologies',
  address: [
    'Chennai, Tamil Nadu',
    'India - 600001',
  ],
  email: 'billing@audiolyse.com',
  phone: '+91-XXXXXXXXXX',
  gstin: 'XXXXXXXXXXXXXXX', // Add actual GSTIN when available
  website: 'https://audiolyse.com',
};

/**
 * Generate invoice number based on date and payment ID
 */
export function generateInvoiceNumber(paymentId: string, date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const shortId = paymentId.slice(-8).toUpperCase();
  return `INV-${year}${month}-${shortId}`;
}

/**
 * Calculate tax amount (GST for India)
 */
export function calculateTax(amount: number, currency: 'INR' | 'USD'): { rate: number; amount: number; name: string } | undefined {
  // Apply GST only for INR transactions
  if (currency === 'INR') {
    const gstRate = 18; // 18% GST for digital services in India
    const taxAmount = Math.round((amount * gstRate) / 100);
    return {
      rate: gstRate,
      amount: taxAmount,
      name: 'GST (18%)',
    };
  }
  return undefined;
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number, currency: 'INR' | 'USD'): string {
  if (currency === 'INR') {
    return `₹${amount.toLocaleString('en-IN')}`;
  }
  return `$${amount.toFixed(2)}`;
}

/**
 * Create invoice data for subscription purchase
 */
export function createSubscriptionInvoice(params: {
  tier: string;
  amount: number;
  currency: 'INR' | 'USD';
  paymentId: string;
  customerName: string;
  customerEmail: string;
  organizationName?: string;
  billingInterval: 'monthly' | 'annual';
}): InvoiceData {
  const date = new Date();
  const invoiceNumber = generateInvoiceNumber(params.paymentId, date);
  
  const tierNames: Record<string, string> = {
    individual: 'Individual Plan',
    team: 'Team Plan',
    enterprise: 'Enterprise Plan',
  };
  
  const description = params.billingInterval === 'annual'
    ? `${tierNames[params.tier] || params.tier} - Annual Subscription (12 months)`
    : `${tierNames[params.tier] || params.tier} - Monthly Subscription`;
  
  // For annual billing, the amount is already the total
  // For monthly, it's per month
  const baseAmount = params.billingInterval === 'annual' 
    ? Math.round(params.amount / 0.8) // Reverse the 20% discount to show original
    : params.amount;
  
  const discount = params.billingInterval === 'annual' 
    ? { description: 'Annual Billing Discount (20%)', amount: baseAmount - params.amount }
    : undefined;
  
  const tax = calculateTax(params.amount, params.currency);
  const total = params.amount + (tax?.amount || 0);
  
  return {
    invoiceNumber,
    date: date.toISOString(),
    company: COMPANY_INFO,
    customer: {
      name: params.customerName,
      email: params.customerEmail,
      organizationName: params.organizationName,
    },
    items: [{
      description,
      quantity: 1,
      unitPrice: baseAmount,
      amount: baseAmount,
    }],
    subtotal: baseAmount,
    discount,
    tax,
    total,
    currency: params.currency,
    paymentId: params.paymentId,
    paymentMethod: 'Razorpay',
    paymentStatus: 'paid',
    billingInterval: params.billingInterval,
    notes: params.billingInterval === 'annual' 
      ? 'Thank you for choosing annual billing! Your subscription is valid for 12 months.'
      : 'Thank you for your subscription!',
  };
}

/**
 * Create invoice data for credit purchase
 */
export function createCreditsInvoice(params: {
  credits: number;
  amount: number;
  currency: 'INR' | 'USD';
  paymentId: string;
  customerName: string;
  customerEmail: string;
  organizationName?: string;
}): InvoiceData {
  const date = new Date();
  const invoiceNumber = generateInvoiceNumber(params.paymentId, date);
  
  const pricePerCredit = params.amount / params.credits;
  
  const tax = calculateTax(params.amount, params.currency);
  const total = params.amount + (tax?.amount || 0);
  
  return {
    invoiceNumber,
    date: date.toISOString(),
    company: COMPANY_INFO,
    customer: {
      name: params.customerName,
      email: params.customerEmail,
      organizationName: params.organizationName,
    },
    items: [{
      description: `${params.credits} Analysis Credits`,
      quantity: params.credits,
      unitPrice: pricePerCredit,
      amount: params.amount,
    }],
    subtotal: params.amount,
    tax,
    total,
    currency: params.currency,
    paymentId: params.paymentId,
    paymentMethod: 'Razorpay',
    paymentStatus: 'paid',
    notes: 'Credits have been added to your account. Credits never expire.',
  };
}
