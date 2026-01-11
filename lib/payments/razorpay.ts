/**
 * Shared Razorpay utilities
 * Centralizes Razorpay script loading and configuration
 */

// Razorpay configuration constants
export const RAZORPAY_CONFIG = {
  SCRIPT_URL: 'https://checkout.razorpay.com/v1/checkout.js',
  THEME_COLOR: '#00d9ff',
  CURRENCY: {
    INR: 'INR',
    USD: 'USD',
  },
  MIN_AMOUNT: {
    INR: 100, // 1 INR in paise
    USD: 1, // 0.01 USD in cents
  },
} as const;

/**
 * Load Razorpay script dynamically
 * Returns the Razorpay class or null if loading fails
 */
export async function loadRazorpayScript(): Promise<any | null> {
  // Return immediately if already loaded
  if (typeof window !== 'undefined' && (window as any).Razorpay) {
    return (window as any).Razorpay;
  }

  return new Promise((resolve) => {
    // Check if script is already in DOM
    const existingScript = document.querySelector(
      `script[src="${RAZORPAY_CONFIG.SCRIPT_URL}"]`
    );

    if (!existingScript) {
      const script = document.createElement('script');
      script.src = RAZORPAY_CONFIG.SCRIPT_URL;
      script.async = true;
      script.onerror = () => {
        console.error('Failed to load Razorpay script');
        resolve(null);
      };
      document.body.appendChild(script);
    }

    // Poll for Razorpay availability
    let attempts = 0;
    const maxAttempts = 100; // 10 seconds max
    const checkInterval = setInterval(() => {
      attempts++;
      if ((window as any).Razorpay) {
        clearInterval(checkInterval);
        resolve((window as any).Razorpay);
      } else if (attempts >= maxAttempts) {
        clearInterval(checkInterval);
        console.error('Razorpay script load timeout');
        resolve(null);
      }
    }, 100);
  });
}

/**
 * Generate a unique idempotency key for payments
 */
export function generateIdempotencyKey(
  userId: string,
  credits: number,
  timestamp?: number
): string {
  const ts = timestamp || Date.now();
  return `pay_${userId}_${credits}_${ts}`;
}

/**
 * Format amount for Razorpay (convert to smallest unit)
 */
export function formatAmountForRazorpay(
  amount: number,
  currency: 'INR' | 'USD'
): number {
  return Math.round(amount * 100);
}

/**
 * Format amount for display
 */
export function formatAmountForDisplay(
  amount: number,
  currency: 'INR' | 'USD'
): string {
  const symbol = currency === 'INR' ? '₹' : '$';
  return `${symbol}${amount.toFixed(2)}`;
}

/**
 * Validate minimum payment amount
 */
export function validateMinimumAmount(
  amountInSmallestUnit: number,
  currency: 'INR' | 'USD'
): { valid: boolean; message?: string } {
  const minAmount = RAZORPAY_CONFIG.MIN_AMOUNT[currency];
  if (amountInSmallestUnit < minAmount) {
    const displayMin = currency === 'INR' ? '₹1' : '$0.01';
    return {
      valid: false,
      message: `Minimum amount is ${displayMin}`,
    };
  }
  return { valid: true };
}

/**
 * Create Razorpay checkout options
 */
export interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  orderId: string;
  name?: string;
  description?: string;
  prefillEmail?: string;
  prefillName?: string;
  onSuccess: (response: RazorpaySuccessResponse) => void;
  onDismiss?: () => void;
}

export interface RazorpaySuccessResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export function createCheckoutOptions(
  options: RazorpayCheckoutOptions
): Record<string, any> {
  return {
    key: options.key,
    amount: options.amount,
    currency: options.currency,
    name: options.name || 'Audiolyse',
    description: options.description || 'Payment',
    order_id: options.orderId,
    handler: options.onSuccess,
    prefill: {
      email: options.prefillEmail || '',
      name: options.prefillName || '',
    },
    theme: {
      color: RAZORPAY_CONFIG.THEME_COLOR,
    },
    modal: {
      ondismiss: options.onDismiss || (() => {}),
    },
  };
}
