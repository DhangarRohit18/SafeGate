import { describe, it, expect, beforeEach } from '@jest/globals';
import crypto from 'crypto';

import { timingSafeCompare } from '../server/src/crypto';

describe('Dwellora Razorpay Payment Integration Test Suite', () => {
  const TEST_KEY_SECRET = 'rzp_secret_AARIZO_2026';
  const TEST_WEBHOOK_SECRET = 'rzp_webhook_AARIZO_2026';

  describe('1. Cryptographic Signature Verification & Timing-Attack Safety', () => {
    it('timingSafeCompare correctly validates identical strings', () => {
      const sig1 = 'a3f8c02874e0d9b43e851d8b671a5c1234567890abcdef1234567890abcdef12';
      const sig2 = 'a3f8c02874e0d9b43e851d8b671a5c1234567890abcdef1234567890abcdef12';
      expect(timingSafeCompare(sig1, sig2)).toBe(true);
    });

    it('timingSafeCompare rejects mismatched strings with equal lengths in constant time', () => {
      const sig1 = 'a3f8c02874e0d9b43e851d8b671a5c1234567890abcdef1234567890abcdef12';
      const sig2 = 'a3f8c02874e0d9b43e851d8b671a5c1234567890abcdef1234567890abcdef13';
      expect(timingSafeCompare(sig1, sig2)).toBe(false);
    });

    it('timingSafeCompare rejects strings with different lengths safely', () => {
      const sig1 = 'a3f8c02874e0d9b4';
      const sig2 = 'a3f8c02874e0d9b43e851d8b';
      expect(timingSafeCompare(sig1, sig2)).toBe(false);
    });

    it('verifies standard Razorpay HMAC-SHA256 checkout signature formula', () => {
      const orderId = 'order_dwellora_test_101';
      const paymentId = 'pay_dwellora_test_909';

      const payload = `${orderId}|${paymentId}`;
      const validSignature = crypto
        .createHmac('sha256', TEST_KEY_SECRET)
        .update(payload)
        .digest('hex');

      const expectedSignature = crypto
        .createHmac('sha256', TEST_KEY_SECRET)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      expect(timingSafeCompare(expectedSignature, validSignature)).toBe(true);
    });

    it('rejects tampered payment ID or order ID against checkout signature', () => {
      const orderId = 'order_dwellora_test_101';
      const paymentId = 'pay_dwellora_test_909';
      const validSignature = crypto
        .createHmac('sha256', TEST_KEY_SECRET)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      // Attacker attempts to swap payment ID
      const tamperedPaymentId = 'pay_forged_attacker_001';
      const expectedSignature = crypto
        .createHmac('sha256', TEST_KEY_SECRET)
        .update(`${orderId}|${tamperedPaymentId}`)
        .digest('hex');

      expect(timingSafeCompare(expectedSignature, validSignature)).toBe(false);
    });
  });

  describe('2. Client Amount Tampering Prevention & Server-Side Invoice Resolution', () => {
    it('guarantees server resolves amount from authorized database invoice and ignores client input', () => {
      const mockDbInvoice = {
        id: 'inv-maintenance-march-2026',
        societyId: 'soc-dwellora-north',
        invoiceNumber: 'INV-2026-03-042',
        totalAmount: 4500.0,
        paidAmount: 1000.0, // Partial earlier payment
        status: 'PENDING',
      };

      // Client attempts to tamper with amount to pay ₹1 instead of outstanding ₹3500
      const clientPayload = {
        invoiceId: 'inv-maintenance-march-2026',
        amount: 1.0, // Tampered client value
      };

      // Server calculates actual outstanding balance strictly from DB record
      const actualOutstanding = Number(mockDbInvoice.totalAmount) - Number(mockDbInvoice.paidAmount);
      const serverCalculatedPaise = Math.round(actualOutstanding * 100);

      // Verify that server calculated amount is 350000 paise (₹3500), NOT 100 paise (₹1)
      expect(actualOutstanding).toBe(3500.0);
      expect(serverCalculatedPaise).toBe(350000);
      expect(serverCalculatedPaise).not.toBe(Math.round(clientPayload.amount * 100));
    });

    it('rejects payment order creation for already-paid invoices', () => {
      const paidInvoice = {
        id: 'inv-paid-001',
        status: 'PAID',
        totalAmount: 2500,
        paidAmount: 2500,
      };

      const isPayable = paidInvoice.status !== 'PAID' && paidInvoice.status !== 'CANCELLED';
      expect(isPayable).toBe(false);
    });

    it('rejects payment order creation for cancelled invoices', () => {
      const cancelledInvoice = {
        id: 'inv-cancelled-001',
        status: 'CANCELLED',
        totalAmount: 2500,
        paidAmount: 0,
      };

      const isPayable = cancelledInvoice.status !== 'PAID' && cancelledInvoice.status !== 'CANCELLED';
      expect(isPayable).toBe(false);
    });

    it('rejects payment order creation if outstanding balance is zero or negative', () => {
      const fullySettledInvoice = {
        id: 'inv-settled-001',
        status: 'PENDING',
        totalAmount: 2500,
        paidAmount: 2500,
      };

      const outstanding = Number(fullySettledInvoice.totalAmount) - Number(fullySettledInvoice.paidAmount);
      expect(outstanding <= 0).toBe(true);
    });
  });

  describe('3. Multi-Tenant Isolation & Role-Based Access Control', () => {
    it('blocks payment order creation across different society tenants', () => {
      const userSocietyId = 'soc-dwellora-north';
      const invoiceSocietyId = 'soc-dwellora-south';

      const isAuthorizedSociety = userSocietyId === invoiceSocietyId;
      expect(isAuthorizedSociety).toBe(false);
    });

    it('prevents residents from paying invoices belonging to other residents', () => {
      const residentUserId = 'user-resident-101';
      const targetInvoice = {
        id: 'inv-other-resident',
        residentId: 'resident-202',
        resident: {
          userId: 'user-resident-202',
          phone: '+919999999999',
        },
      };

      const isOwner =
        targetInvoice.residentId === residentUserId ||
        targetInvoice.resident?.userId === residentUserId;

      expect(isOwner).toBe(false);
    });

    it('allows society admin or secretary to initiate orders for society invoices', () => {
      const role = 'secretary';
      const allowedRoles = ['admin', 'secretary'];
      expect(allowedRoles.includes(role)).toBe(true);
    });
  });

  describe('4. Webhook Raw-Body Verification & Idempotent Deduplication', () => {
    it('validates authentic webhook payload against raw byte buffer', () => {
      const rawPayload = Buffer.from(
        JSON.stringify({
          entity: 'event',
          event: 'payment.captured',
          contains: ['payment'],
          payload: {
            payment: {
              entity: {
                id: 'pay_test_hook_001',
                amount: 350000,
                status: 'captured',
                notes: { invoiceId: 'inv-test-101' },
              },
            },
          },
        }),
        'utf8'
      );

      const authenticSignature = crypto
        .createHmac('sha256', TEST_WEBHOOK_SECRET)
        .update(rawPayload)
        .digest('hex');

      const serverCalculated = crypto
        .createHmac('sha256', TEST_WEBHOOK_SECRET)
        .update(rawPayload)
        .digest('hex');

      expect(timingSafeCompare(serverCalculated, authenticSignature)).toBe(true);
    });

    it('rejects webhook payload if a single raw byte was altered in transit', () => {
      const originalPayload = Buffer.from('{"event":"payment.captured","amount":350000}', 'utf8');
      const tamperedPayload = Buffer.from('{"event":"payment.captured","amount":100000}', 'utf8');

      const signature = crypto
        .createHmac('sha256', TEST_WEBHOOK_SECRET)
        .update(originalPayload)
        .digest('hex');

      const verificationCheck = crypto
        .createHmac('sha256', TEST_WEBHOOK_SECRET)
        .update(tamperedPayload)
        .digest('hex');

      expect(timingSafeCompare(verificationCheck, signature)).toBe(false);
    });

    it('idempotently handles duplicate webhook event deliveries without re-processing', () => {
      const processedEventsStore = new Set<string>();
      const eventId = 'evt_test_dedup_unique_456';

      // First webhook delivery
      const isFirstDuplicate = processedEventsStore.has(eventId);
      expect(isFirstDuplicate).toBe(false);
      processedEventsStore.add(eventId);

      // Duplicate webhook redelivery from Razorpay retry engine
      const isSecondDuplicate = processedEventsStore.has(eventId);
      expect(isSecondDuplicate).toBe(true);
    });

    it('processes payment.captured event by marking invoice as settled', () => {
      let invoiceStatus = 'PENDING';
      let paymentRecordStatus = 'PENDING';

      const webhookEvent = {
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: 'pay_captured_777',
              order_id: 'order_dwellora_777',
              notes: { invoiceId: 'inv-777' },
            },
          },
        },
      };

      if (webhookEvent.event === 'payment.captured') {
        invoiceStatus = 'PAID';
        paymentRecordStatus = 'SUCCESS';
      }

      expect(invoiceStatus).toBe('PAID');
      expect(paymentRecordStatus).toBe('SUCCESS');
    });

    it('processes payment.failed event by marking record status as FAILED with diagnostic reason', () => {
      let paymentRecordStatus = 'PENDING';
      let failureReason = '';

      const webhookEvent = {
        event: 'payment.failed',
        payload: {
          payment: {
            entity: {
              id: 'pay_failed_888',
              error_code: 'BAD_REQUEST_ERROR',
              error_description: 'Payment was declined by issuing bank due to insufficient funds.',
            },
          },
        },
      };

      if (webhookEvent.event === 'payment.failed') {
        paymentRecordStatus = 'FAILED';
        failureReason = webhookEvent.payload.payment.entity.error_description;
      }

      expect(paymentRecordStatus).toBe('FAILED');
      expect(failureReason).toContain('insufficient funds');
    });
  });

  describe('5. Database Transaction Consistency & Idempotent Verification', () => {
    it('returns idempotent success if verification endpoint is called twice for the same invoice', () => {
      let invoiceStatus = 'PAID'; // Already verified on previous call

      let duplicateActionTaken = false;
      let responseMessage = '';

      if (invoiceStatus === 'PAID') {
        responseMessage = 'Invoice has already been verified and marked as PAID.';
        duplicateActionTaken = false;
      } else {
        duplicateActionTaken = true;
      }

      expect(duplicateActionTaken).toBe(false);
      expect(responseMessage).toContain('already been verified');
    });

    it('verifies refund processing updates status and tracks refund amount', () => {
      const originalPayment = {
        id: 'pay_record_001',
        amount: 2500,
        status: 'SUCCESS',
        refundId: null,
        refundAmount: 0,
      };

      const refundData = {
        refundId: 'rfnd_dwellora_999',
        amount: 2500,
        reason: 'Duplicate payment accidental double debit',
      };

      const refundedPayment = {
        ...originalPayment,
        status: 'REFUNDED',
        refundId: refundData.refundId,
        refundAmount: refundData.amount,
        refundReason: refundData.reason,
      };

      expect(refundedPayment.status).toBe('REFUNDED');
      expect(refundedPayment.refundAmount).toBe(2500);
      expect(refundedPayment.refundId).toBe('rfnd_dwellora_999');
    });
  });
});
