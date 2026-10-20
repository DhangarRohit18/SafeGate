import crypto from 'crypto';

/**
 * Constant-time string comparison preventing cryptographic timing attacks.
 */
export function timingSafeCompare(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Computes standard Razorpay HMAC SHA256 checkout signature.
 */
export function computeCheckoutSignature(orderId: string, paymentId: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
}

/**
 * Computes Razorpay Webhook HMAC SHA256 signature from raw payload buffer.
 */
export function computeWebhookSignature(rawBody: Buffer | string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');
}
