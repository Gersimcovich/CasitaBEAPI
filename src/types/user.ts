// User Authentication & Account Types

export type Locale = 'en' | 'es' | 'pt' | 'fr' | 'de' | 'it' | 'pl';

export interface CasitaUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  country?: string;
  preferredLanguage: Locale;
  casitaPoints: number;
  totalSpent: number; // Total USD spent (1 dollar = 1 point)
  createdAt: string;
  updatedAt: string;
}

export interface UserSession {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
  createdAt: string;
}

export interface VerificationCode {
  id: string;
  email: string;
  code: string; // 6-digit code
  type: 'login' | 'register';
  expiresAt: string;
  createdAt: string;
  attempts: number;
  used: boolean;
}

export interface UserReservation {
  id: string;
  odooBookingId?: string;
  guestyReservationId?: string;
  confirmationCode: string;
  userId: string;
  propertyName: string;
  propertyImage?: string;
  propertyAddress: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  nights: number;
  totalPaid: number;
  pointsEarned: number;
  currency: string;
  status: 'confirmed' | 'completed' | 'cancelled';
  createdAt: string;
}

// API Request/Response Types
export interface LoginRequest {
  email: string;
}

export interface VerifyCodeRequest {
  email: string;
  code: string;
}

export interface RegisterRequest {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  country?: string;
  preferredLanguage?: Locale;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: CasitaUser;
  token?: string;
  requiresVerification?: boolean;
  requiresRegistration?: boolean;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  country?: string;
  preferredLanguage?: Locale;
}
