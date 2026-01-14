
export type UserRole = 'ADMIN' | 'MEMBER';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  adminId?: string; // If member, link to their admin
  avatar?: string;
  lockedSenderName?: string;
  password?: string;
}

export type InvoiceStatus = 'pending' | 'paid' | 'overdue';

// Member business profile for invoices
export interface Profile {
  id: string;
  memberId: string;
  name: string;
  address: string;
  phone: string;
  email?: string;
  avatar?: string;
  isDefault?: boolean;
}

export interface Invoice {
  id: string;
  referenceId: string;
  invoiceNumber: string;
  fromName: string;
  toName: string;
  toEmail?: string; // Made optional
  subject: string;
  description?: string; // Auto-generated from service category
  amount: number;
  created_at: string;
  status: InvoiceStatus;
  memberId: string;
  profileId?: string; // Link to profile
  stripeLink: string;
  qrCodeUrl: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: string;
}

