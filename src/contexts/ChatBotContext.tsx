'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ChatMessage, ChatSession, ReservationContext, ChatResponse } from '@/types/chat';

interface ChatBotContextType {
  messages: ChatMessage[];
  isOpen: boolean;
  isLoading: boolean;
  sessionId: string | null;
  verificationStatus: 'none' | 'pending' | 'verified';
  currentReservation: ReservationContext | null;
  sendMessage: (text: string) => Promise<void>;
  toggleChat: () => void;
  openChat: () => void;
  closeChat: () => void;
  clearChat: () => void;
}

const ChatBotContext = createContext<ChatBotContextType | undefined>(undefined);

const STORAGE_KEY = 'casita_chat_session';
const SESSION_EXPIRY = 30 * 60 * 1000; // 30 minutes

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function ChatBotProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<'none' | 'pending' | 'verified'>('none');
  const [currentReservation, setCurrentReservation] = useState<ReservationContext | null>(null);

  // Load session from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const session: ChatSession & { expiresAt: number } = JSON.parse(stored);
        if (session.expiresAt > Date.now()) {
          setMessages(session.messages.map(m => ({
            ...m,
            timestamp: new Date(m.timestamp)
          })));
          setSessionId(session.id);
          setVerificationStatus(session.verificationStatus);
          setCurrentReservation(session.currentReservation || null);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error('Error loading chat session:', error);
    }
  }, []);

  // Save session to localStorage
  const saveSession = useCallback((
    msgs: ChatMessage[],
    sessId: string,
    status: 'none' | 'pending' | 'verified',
    reservation: ReservationContext | null
  ) => {
    try {
      const session = {
        id: sessId,
        messages: msgs,
        verificationStatus: status,
        currentReservation: reservation,
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: Date.now() + SESSION_EXPIRY
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch (error) {
      console.error('Error saving chat session:', error);
    }
  }, []);

  const addMessage = useCallback((message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: generateId(),
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    // Add user message
    const userMessage = addMessage({
      role: 'user',
      content: text
    });

    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          sessionId: sessionId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data: ChatResponse = await response.json();

      // Update session ID
      if (data.sessionId && !sessionId) {
        setSessionId(data.sessionId);
      }

      // Update verification status and reservation context
      if (data.reservation) {
        setCurrentReservation(data.reservation);
        setVerificationStatus('verified');
      }

      // Add assistant response
      const assistantMessage = addMessage({
        role: 'assistant',
        content: data.reply,
        metadata: {
          action: data.action,
          reservationId: data.reservation?.id,
          error: !!data.error
        }
      });

      // Save session
      const newMessages = [...messages, userMessage, assistantMessage];
      saveSession(
        newMessages,
        data.sessionId || sessionId || generateId(),
        data.reservation ? 'verified' : verificationStatus,
        data.reservation || currentReservation
      );

    } catch (error) {
      console.error('Error sending message:', error);
      addMessage({
        role: 'assistant',
        content: 'Lo siento, I\'m having trouble connecting right now. Please try again or contact us via WhatsApp at 555-876-7325.',
        metadata: { error: true }
      });
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, sessionId, messages, verificationStatus, currentReservation, addMessage, saveSession]);

  const toggleChat = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const openChat = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeChat = useCallback(() => {
    setIsOpen(false);
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
    setSessionId(null);
    setVerificationStatus('none');
    setCurrentReservation(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <ChatBotContext.Provider
      value={{
        messages,
        isOpen,
        isLoading,
        sessionId,
        verificationStatus,
        currentReservation,
        sendMessage,
        toggleChat,
        openChat,
        closeChat,
        clearChat
      }}
    >
      {children}
    </ChatBotContext.Provider>
  );
}

export function useChatBot() {
  const context = useContext(ChatBotContext);
  if (context === undefined) {
    throw new Error('useChatBot must be used within a ChatBotProvider');
  }
  return context;
}
