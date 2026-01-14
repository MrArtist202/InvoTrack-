// API Service for connecting to backend
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Get auth token from localStorage
const getToken = (): string | null => {
    return localStorage.getItem('invotrack_token');
};

// Set auth token
export const setToken = (token: string) => {
    localStorage.setItem('invotrack_token', token);
};

// Clear auth token
export const clearToken = () => {
    localStorage.removeItem('invotrack_token');
    localStorage.removeItem('invotrack_user');
};

// API request helper
const request = async (endpoint: string, options: RequestInit = {}) => {
    const token = getToken();

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'Request failed');
    }

    return data;
};

// ==================== AUTH API ====================

export const authAPI = {
    register: async (data: { name: string; email: string; password: string; phone: string }) => {
        const result = await request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(data),
        });
        setToken(result.token);
        return result;
    },

    login: async (data: { email: string; password: string }) => {
        const result = await request('/auth/login', {
            method: 'POST',
            body: JSON.stringify(data),
        });
        setToken(result.token);
        return result;
    },

    getMe: async () => {
        return request('/auth/me');
    },

    updateProfile: async (data: { name: string; email: string; phone: string; avatar?: string }) => {
        return request('/auth/profile', {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    changePassword: async (data: { currentPassword: string; newPassword: string }) => {
        return request('/auth/password', {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },
};

// ==================== MEMBERS API ====================

// Helper to transform Member/User from DB (snake_case) to Frontend (camelCase)
const transformUser = (data: any): any => {
    if (!data) return null;
    return {
        ...data,
        adminId: data.admin_id,
        lockedSenderName: data.locked_sender_name, // If this field existed in DB, but removed from form. Safe to map if column exists or future proof.
        // role, id, name, email, avatar usually match
    };
};

export const membersAPI = {
    getAll: async () => {
        const result = await request('/members');
        return result.map(transformUser);
    },

    create: async (data: { name: string; email: string; password: string; phone: string }) => {
        const result = await request('/members', {
            method: 'POST',
            body: JSON.stringify(data),
        });
        return transformUser(result);
    },

    delete: async (id: string) => {
        return request(`/members/${id}`, { method: 'DELETE' });
    },
};

// ==================== PROFILES API ====================

// Helper to transform Profile from DB (snake_case) to Frontend (camelCase)
const transformProfile = (data: any): any => {
    if (!data) return null;
    return {
        ...data,
        memberId: data.member_id,
        isDefault: data.is_default,
    };
};

export const profilesAPI = {
    getAll: async () => {
        const result = await request('/profiles');
        return result.map(transformProfile);
    },

    create: async (data: { name: string; address: string; phone: string; email?: string; avatar?: string; is_default?: boolean }) => {
        const result = await request('/profiles', {
            method: 'POST',
            body: JSON.stringify(data),
        });
        return transformProfile(result);
    },

    update: async (id: string, data: { name: string; address: string; phone: string; email?: string; avatar?: string; is_default?: boolean }) => {
        const result = await request(`/profiles/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
        return transformProfile(result);
    },

    delete: async (id: string) => {
        return request(`/profiles/${id}`, { method: 'DELETE' });
    },

    setDefault: async (id: string) => {
        return request(`/profiles/${id}/default`, { method: 'PUT' });
    },
};

// ==================== INVOICES API ====================

// Helper to transform Invoice from DB (snake_case) to Frontend (camelCase)
const transformInvoice = (data: any): any => {
    if (!data) return null;
    return {
        ...data,
        referenceId: data.reference_id,
        invoiceNumber: data.invoice_number,
        memberId: data.member_id,
        profileId: data.profile_id,
        fromName: data.from_name,
        toName: data.to_name,
        toEmail: data.to_email,
        stripeLink: data.stripe_link,
        qrCodeUrl: data.qr_code_url,
        // Ensure created_at is preserved
        created_at: data.created_at,
        // Ensure numeric fields are numbers (PG returns strings for decimals)
        amount: Number(data.amount),
    };
};

export const invoicesAPI = {
    getAll: async () => {
        const result = await request('/invoices');
        return result.map(transformInvoice);
    },

    getById: async (id: string) => {
        const result = await request(`/invoices/${id}`);
        return transformInvoice(result);
    },

    create: async (data: {
        reference_id: string;
        invoice_number: string;
        profile_id?: string;
        from_name: string;
        to_name: string;
        to_email?: string;
        subject: string;
        description?: string;
        amount: number;
        stripe_link?: string;
        qr_code_url?: string;
    }) => {
        const result = await request('/invoices', {
            method: 'POST',
            body: JSON.stringify(data),
        });
        return transformInvoice(result);
    },

    updateStatus: async (id: string, status: 'pending' | 'paid') => {
        const result = await request(`/invoices/${id}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status }),
        });
        return transformInvoice(result);
    },

    delete: async (id: string) => {
        return request(`/invoices/${id}`, { method: 'DELETE' });
    },

    verifyPaymentSession: async (sessionId: string) => {
        const result = await request('/payment/verify-session', {
            method: 'POST',
            body: JSON.stringify({ sessionId }),
        });
        return result; // Expected to return { success: true, invoice: ... }
    },
};

// ==================== NOTIFICATIONS API ====================

export const notificationsAPI = {
    getAll: async () => {
        const result = await request('/notifications');
        return result.map((n: any) => ({
            ...n,
            amount: n.amount ? Number(n.amount) : undefined,
            // Ensure any other snake_case mapping if needed, but assuming notification schema matches for now or is simple
        }));
    },

    create: async (data: {
        adminId: string;
        type: string;
        title: string;
        message: string;
        memberId?: string;
        invoiceId?: string;
        amount?: number;
    }) => {
        return request('/notifications', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    markAsRead: async (id: string) => {
        return request(`/notifications/${id}/read`, { method: 'PUT' });
    },

    markAllAsRead: async () => {
        return request('/notifications/read-all', { method: 'PUT' });
    },
};

// ==================== STATS API ====================

export const statsAPI = {
    get: async () => {
        return request('/stats');
    },
};

// Check if API is available (for fallback to localStorage)
export const checkAPIHealth = async (): Promise<boolean> => {
    try {
        await fetch(`${API_URL}/health`);
        return true;
    } catch {
        return false;
    }
};
