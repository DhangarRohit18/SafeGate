/**
 * AARIZO CommunityOS - Unified API Client
 * Connects React frontend directly to the Node.js + Express + Prisma + PostgreSQL backend.
 * Provides multi-tenant context headers (societyId, userId, userRole) and handles fallbacks.
 */

const API_BASE =
  (import.meta as any).env?.VITE_BACKEND_URL
    ? `${(import.meta as any).env.VITE_BACKEND_URL}/api`
    : (typeof window !== 'undefined' && (window.location.port === '5173' || window.location.port === '5174')
      ? 'http://localhost:5000/api'
      : '/api');

interface RequestOptions extends RequestInit {
  societyId?: string;
  userId?: string;
  userRole?: string;
}

function getStoredAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  try {
    const rawUser = localStorage.getItem('aarizo_user') || localStorage.getItem('communityos_auth_user');
    if (rawUser) {
      const parsed = JSON.parse(rawUser);
      if (parsed.societyId) headers['x-society-id'] = parsed.societyId;
      if (parsed.id || parsed.uid) headers['x-user-id'] = parsed.id || parsed.uid;
      if (parsed.role) headers['x-user-role'] = parsed.role;
    }
  } catch {
    // Non-critical fallback
  }

  return headers;
}

async function apiRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T | null> {
  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const defaultHeaders = getStoredAuthHeaders();

  if (options.societyId) defaultHeaders['x-society-id'] = options.societyId;
  if (options.userId) defaultHeaders['x-user-id'] = options.userId;
  if (options.userRole) defaultHeaders['x-user-role'] = options.userRole;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...(options.headers || {}),
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`[API] ${options.method || 'GET'} ${url} returned ${response.status}:`, errorText);
      return null;
    }

    return (await response.json()) as T;
  } catch (err) {
    console.warn(`[API] Failed to fetch ${url}. Falling back to client-side cache/state.`, err);
    return null;
  }
}

export const apiClient = {
  // Health
  checkHealth: () => apiRequest<{ status: string; engine: string }>('/health'),

  // Societies
  getSocieties: () => apiRequest<any[]>('/societies'),

  // Flats
  getFlats: (societyId?: string) => apiRequest<any[]>('/flats', { societyId }),

  // Residents
  getResidents: (societyId?: string) => apiRequest<any[]>('/residents', { societyId }),

  // Visitor Passes
  getVisitorPasses: (societyId?: string) => apiRequest<any[]>('/visitor-passes', { societyId }),
  verifyVisitorPass: (codeOrQr: string, societyId?: string) =>
    apiRequest<any>('/visitor-passes/verify', {
      method: 'POST',
      body: JSON.stringify({ codeOrQr, societyId }),
    }),
  createVisitorPass: (data: any) =>
    apiRequest<any>('/visitor-passes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Maintenance Tickets
  getMaintenanceTickets: (societyId?: string) => apiRequest<any[]>('/maintenance', { societyId }),
  createMaintenanceTicket: (data: any) =>
    apiRequest<any>('/maintenance', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateMaintenanceTicket: (id: string, data: any) =>
    apiRequest<any>(`/maintenance/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // Billing Invoices
  getBillingInvoices: (societyId?: string) => apiRequest<any[]>('/billing/invoices', { societyId }),
  updateBillingInvoice: (id: string, data: any) =>
    apiRequest<any>(`/billing/invoices/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // Parcels
  getParcels: (societyId?: string) => apiRequest<any[]>('/parcels', { societyId }),
  createParcel: (data: any) =>
    apiRequest<any>('/parcels', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  collectParcel: (id: string, collectedBy?: string) =>
    apiRequest<any>(`/parcels/${id}/collect`, {
      method: 'PATCH',
      body: JSON.stringify({ collectedBy }),
    }),

  // Staff
  getStaff: (societyId?: string) => apiRequest<any[]>('/staff', { societyId }),

  // Domestic Workers
  getDomesticWorkers: (societyId?: string) => apiRequest<any[]>('/domestic-workers', { societyId }),

  // Vendors
  getVendors: (societyId?: string) => apiRequest<any[]>('/vendors', { societyId }),

  // Amenities
  getAmenities: (societyId?: string) => apiRequest<any[]>('/amenities', { societyId }),

  // Announcements
  getAnnouncements: (societyId?: string) => apiRequest<any[]>('/announcements', { societyId }),
  createAnnouncement: (data: any) =>
    apiRequest<any>('/announcements', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Community Events
  getCommunityEvents: (societyId?: string) => apiRequest<any[]>('/community-events', { societyId }),
  createCommunityEvent: (data: any) =>
    apiRequest<any>('/community-events', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Emergency Incidents
  getEmergencyIncidents: (societyId?: string) => apiRequest<any[]>('/emergency-incidents', { societyId }),
  createEmergencyIncident: (data: any) =>
    apiRequest<any>('/emergency-incidents', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Notifications
  getNotifications: (societyId?: string) => apiRequest<any[]>('/notifications', { societyId }),
  markNotificationRead: (id: string) =>
    apiRequest<any>(`/notifications/${id}/read`, {
      method: 'PATCH',
    }),

  // File Upload Engine
  uploadFile: async (file: File, category: string = 'attachments'): Promise<{ success: boolean; url: string; fullUrl: string; filename: string; size: number }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const fileData = reader.result as string;
          const res = await apiRequest<{ success: boolean; url: string; filename: string; size: number }>('/upload', {
            method: 'POST',
            body: JSON.stringify({
              filename: file.name,
              fileData,
              category,
            }),
          });
          if (!res || !res.url) {
            throw new Error('Upload failed on server');
          }
          const baseUrl = API_BASE.replace(/\/api$/, '');
          const relativeOrAbsUrl = res.url;
          resolve({
            success: Boolean(res.success),
            url: relativeOrAbsUrl,
            filename: res.filename || file.name,
            size: res.size || file.size,
            fullUrl: relativeOrAbsUrl.startsWith('http') ? relativeOrAbsUrl : `${baseUrl}${relativeOrAbsUrl}`,
          });
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  },

  // Razorpay Payment Engine
  createRazorpayOrder: (invoiceId: string, amount: number) =>
    apiRequest<{ orderId: string; amount: number; currency: string; keyId: string; notes?: any }>('/payments/razorpay/create-order', {
      method: 'POST',
      body: JSON.stringify({ invoiceId, amount }),
    }),

  verifyRazorpayPayment: (data: { invoiceId: string; razorpayPaymentId: string; razorpayOrderId: string; amount: number; razorpaySignature?: string }) =>
    apiRequest<{ success: boolean; message: string; invoice: any; transactionId: string }>('/payments/razorpay/verify', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  refundRazorpayPayment: (data: { paymentId: string; amount: number; reason: string }) =>
    apiRequest<{ success: boolean; refundId: string; amount: number; message: string }>('/payments/razorpay/refund', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getPayments: (societyId?: string, residentId?: string, invoiceId?: string) => {
    const params = new URLSearchParams();
    if (societyId) params.append('societyId', societyId);
    if (residentId) params.append('residentId', residentId);
    if (invoiceId) params.append('invoiceId', invoiceId);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return apiRequest<any[]>(`/payments${queryString}`, { societyId });
  },

  // Advertisements & Sponsored Offers
  getAdvertisements: (societyId?: string) => apiRequest<any[]>('/advertisements', { societyId }),
  createAdvertisement: (data: any) =>
    apiRequest<any>('/advertisements', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  recordAdView: (id: string) =>
    apiRequest<any>(`/advertisements/${id}/view`, {
      method: 'POST',
    }),
  recordAdClick: (id: string) =>
    apiRequest<any>(`/advertisements/${id}/click`, {
      method: 'POST',
    }),

  // Vendors
  registerVendor: (data: any) =>
    apiRequest<any>('/vendors', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Generic Query
  queryTable: (table: string, societyId?: string) =>
    apiRequest<any[]>(`/${table}/query`, {
      method: 'POST',
      societyId,
    }),
};
