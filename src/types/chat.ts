// Chat types for AI Guest Assistant

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    action?: ChatAction;
    reservationId?: string;
    error?: boolean;
  };
}

export type ChatAction =
  | 'greeting'
  | 'lookup_request'
  | 'lookup_success'
  | 'lookup_failed'
  | 'cancel_request'
  | 'cancel_confirm'
  | 'cancel_success'
  | 'cancel_failed'
  | 'modify_request'
  | 'modify_success'
  | 'modify_failed'
  | 'general_info'
  | 'escalate';

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  verificationStatus: 'none' | 'pending' | 'verified';
  currentReservation?: ReservationContext | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReservationContext {
  id: string;
  confirmationCode: string;
  guestEmail: string;
  guestName: string;
  propertyName: string;
  propertyAddress: string;
  checkIn: string;
  checkOut: string;
  guestsCount: number;
  totalPrice: number;
  currency: string;
  status: string;
}

// API request/response types
export interface ChatRequest {
  message: string;
  sessionId?: string;
}

export interface ChatResponse {
  reply: string;
  sessionId: string;
  action?: ChatAction;
  reservation?: ReservationContext;
  error?: string;
}

// AI intent detection types
export interface ParsedIntent {
  type: 'lookup' | 'cancel' | 'modify_dates' | 'info' | 'greeting' | 'unknown';
  confirmationCode?: string;
  email?: string;
  newCheckIn?: string;
  newCheckOut?: string;
  confirmed?: boolean;
}
