import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase/config';
import { apiClient } from '../apiClient';
import type {
  CreateRazorpayOrderResponse,
  VerifyRazorpayPaymentRequest,
  VerifyRazorpayPaymentResponse,
  RefundPaymentRequest,
  RefundPaymentResponse,
} from '../../types/payment';

// Public Razorpay Key ID - Never contains key secret
export const RAZORPAY_PUBLIC_KEY =
  (import.meta as any).env?.VITE_RAZORPAY_KEY_ID || 'rzp_test_AARIZO_2026';

let scriptLoadingPromise: Promise<boolean> | null = null;

/**
 * Dynamically loads the official Razorpay Checkout SDK script into document.
 */
export function loadRazorpayCheckoutScript(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if ((window as any).Razorpay) return Promise.resolve(true);

  if (scriptLoadingPromise) return scriptLoadingPromise;

  scriptLoadingPromise = new Promise((resolve) => {
    const existing = document.querySelector('script[src*="checkout.razorpay.com"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.warn('[RazorpayService] Failed to load official Razorpay script from CDN.');
      resolve(false);
    };
    document.body.appendChild(script);
  });

  return scriptLoadingPromise;
}

export interface CheckoutOptions {
  invoiceId: string;
  invoiceNumber: string;
  societyName?: string;
  purpose?: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  onProcessing?: (statusMsg: string) => void;
}

export interface CheckoutResult {
  success: boolean;
  paymentId?: string;
  orderId?: string;
  signature?: string;
  invoiceNumber?: string;
  amount?: number;
  message?: string;
  cancelled?: boolean;
}

export class RazorpayService {
  /**
   * Part 1: Securely creates a Razorpay Order via Cloud Functions or Backend API.
   * Note: Amount is NEVER trusted from client; server looks up actual invoice balance in Firestore.
   */
  public static async createOrder(invoiceId: string, currency: string = 'INR'): Promise<CreateRazorpayOrderResponse> {
    try {
      const callable = httpsCallable<{ invoiceId: string; currency: string }, CreateRazorpayOrderResponse>(
        functions,
        'createRazorpayOrder'
      );
      const res = await callable({ invoiceId, currency });
      if (res?.data?.orderId) {
        return res.data;
      }
    } catch (functionsErr: any) {
      console.warn('[RazorpayService] Cloud Function createRazorpayOrder error, trying API fallback:', functionsErr?.message);
    }

    // Backend REST API fallback
    const apiRes = await apiClient.createRazorpayOrder(invoiceId, 0);
    if (!apiRes || !apiRes.orderId) {
      throw new Error('Unable to create Razorpay Order on server. Please verify your internet connection or contact administration.');
    }

    return {
      orderId: apiRes.orderId,
      amount: apiRes.amount,
      currency: apiRes.currency || currency,
      keyId: apiRes.keyId || RAZORPAY_PUBLIC_KEY,
      invoiceId,
    };
  }

  /**
   * Part 3: Verifies Razorpay payment signature cryptographically on server before updating status.
   */
  public static async verifyPayment(params: VerifyRazorpayPaymentRequest): Promise<VerifyRazorpayPaymentResponse> {
    try {
      const callable = httpsCallable<VerifyRazorpayPaymentRequest, VerifyRazorpayPaymentResponse>(
        functions,
        'verifyRazorpayPayment'
      );
      const res = await callable(params);
      if (res?.data) {
        return res.data;
      }
    } catch (functionsErr: any) {
      console.warn('[RazorpayService] Cloud Function verifyRazorpayPayment error, trying API fallback:', functionsErr?.message);
    }

    // Backend REST API fallback
    const apiRes = await apiClient.verifyRazorpayPayment({
      invoiceId: params.invoiceId,
      razorpayOrderId: params.razorpayOrderId,
      razorpayPaymentId: params.razorpayPaymentId,
      amount: 0,
      razorpaySignature: params.razorpaySignature,
    });

    if (!apiRes || !apiRes.success) {
      throw new Error(apiRes?.message || 'Payment signature verification failed on server.');
    }

    return {
      success: true,
      message: apiRes.message || 'Payment verified successfully.',
      paymentId: params.razorpayPaymentId,
      transactionId: params.razorpayPaymentId,
      status: 'SUCCESS',
    };
  }

  /**
   * Part 9: Initiates refund securely through server (admin-only).
   */
  public static async refundPayment(params: RefundPaymentRequest): Promise<RefundPaymentResponse> {
    try {
      const callable = httpsCallable<RefundPaymentRequest, RefundPaymentResponse>(
        functions,
        'refundPayment'
      );
      const res = await callable(params);
      if (res?.data) {
        return res.data;
      }
    } catch (err: any) {
      console.warn('[RazorpayService] Cloud Function refund error, checking REST API:', err?.message);
    }

    // REST fallback
    const res = await fetch('/api/payments/razorpay/refund', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson?.message || 'Refund failed on server.');
    }
    return (await res.json()) as RefundPaymentResponse;
  }

  /**
   * Orchestrates the complete end-to-end payment lifecycle:
   * 1. Loads SDK
   * 2. Calls backend createRazorpayOrder
   * 3. Opens Razorpay standard checkout popup
   * 4. On response, executes backend signature verification
   * 5. Returns final verified transaction result
   */
  public static async executeCheckout(options: CheckoutOptions): Promise<CheckoutResult> {
    const isLoaded = await loadRazorpayCheckoutScript();
    if (!isLoaded || typeof window === 'undefined' || !(window as any).Razorpay) {
      throw new Error('Razorpay Checkout SDK could not be loaded. Please check your network or ad-blocker settings.');
    }

    options.onProcessing?.('Creating secure payment order...');
    const orderData = await this.createOrder(options.invoiceId);

    return new Promise<CheckoutResult>((resolve, reject) => {
      let isVerified = false;

      const rzpOptions = {
        key: orderData.keyId || RAZORPAY_PUBLIC_KEY,
        amount: orderData.amount, // amount in paise
        currency: orderData.currency || 'INR',
        name: options.societyName || 'Dwellora Community Society',
        description: `Maintenance Bill: ${options.invoiceNumber}`,
        order_id: orderData.orderId,
        prefill: {
          name: options.userName || 'Resident',
          email: options.userEmail || 'resident@dwellora.com',
          contact: options.userPhone || '9876543210',
        },
        theme: {
          color: '#083B56',
        },
        // Brand logo is only passed if a valid, publicly accessible HTTPS URL is configured
        ...(((import.meta as any).env?.VITE_PUBLIC_LOGO_URL &&
          typeof (import.meta as any).env.VITE_PUBLIC_LOGO_URL === 'string' &&
          (import.meta as any).env.VITE_PUBLIC_LOGO_URL.startsWith('https://'))
          ? { image: (import.meta as any).env.VITE_PUBLIC_LOGO_URL }
          : {}),
        modal: {
          ondismiss: () => {
            if (!isVerified) {
              resolve({
                success: false,
                cancelled: true,
                message: 'Payment cancelled by user.',
              });
            }
          },
        },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          isVerified = true;
          try {
            options.onProcessing?.('Cryptographically verifying payment with server... Do not close window.');
            const verification = await RazorpayService.verifyPayment({
              invoiceId: options.invoiceId,
              razorpayOrderId: response.razorpay_order_id || orderData.orderId,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature || `sig_${Date.now()}`,
            });

            resolve({
              success: true,
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              signature: response.razorpay_signature,
              invoiceNumber: options.invoiceNumber,
              amount: orderData.amount / 100,
              message: verification.message,
            });
          } catch (verifyErr: any) {
            console.error('[RazorpayService] Verification failure:', verifyErr);
            reject(new Error(verifyErr?.message || 'Payment signature verification failed. Please contact society administration.'));
          }
        },
      };

      try {
        const rzp = new (window as any).Razorpay(rzpOptions);
        rzp.on('payment.failed', (failResp: any) => {
          console.warn('[RazorpayService] payment.failed event:', failResp?.error);
          resolve({
            success: false,
            cancelled: false,
            message: failResp?.error?.description || 'Payment was declined or failed.',
          });
        });
        rzp.open();
      } catch (err: any) {
        reject(new Error(`Failed to initialize Razorpay modal: ${err?.message}`));
      }
    });
  }
}
