'use client';

import { useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Loader2, Trash2 } from 'lucide-react';
import { useChatBot } from '@/contexts/ChatBotContext';

export default function ChatBotWidget() {
  const {
    messages,
    isOpen,
    isLoading,
    sendMessage,
    toggleChat,
    closeChat,
    clearChat
  } = useChatBot();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeChat();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeChat]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const input = inputRef.current;
    if (!input || !input.value.trim()) return;

    const message = input.value;
    input.value = '';
    await sendMessage(message);
  };

  return (
    <>
      {/* Chat Button - positioned above WhatsApp */}
      <button
        onClick={toggleChat}
        className={`fixed bottom-24 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all duration-300 ${
          isOpen
            ? 'bg-gray-600 hover:bg-gray-700'
            : 'bg-[var(--casita-orange)] hover:bg-[var(--casita-orange-dark)] hover:scale-110'
        }`}
        title={isOpen ? 'Close chat' : 'Chat with Casita AI'}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <>
            <MessageCircle className="w-6 h-6 text-white" />
            {/* Notification dot for new users */}
            {messages.length === 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">?</span>
              </span>
            )}
          </>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-44 right-6 z-50 w-[380px] max-w-[calc(100vw-3rem)] bg-white rounded-2xl shadow-2xl overflow-hidden animate-scale-in border border-gray-100">
          {/* Header */}
          <div className="bg-[var(--casita-orange)] text-white p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold">Casita Assistant</h3>
                  <p className="text-sm text-white/80">Ask me anything</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {messages.length > 0 && (
                  <button
                    onClick={clearChat}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    title="Clear conversation"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={closeChat}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="h-[350px] overflow-y-auto p-4 space-y-4 bg-[var(--casita-cream)]">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto bg-[var(--casita-orange-light)] rounded-full flex items-center justify-center mb-4">
                  <span className="text-3xl">🏠</span>
                </div>
                <h4 className="font-semibold text-gray-800 mb-2">Hola! Welcome to Casita</h4>
                <p className="text-sm text-gray-600 mb-4">
                  I can help you with:
                </p>
                <div className="space-y-2 text-sm text-left max-w-[250px] mx-auto">
                  <QuickAction onClick={() => sendMessage("I'd like to look up my reservation")}>
                    📋 Look up my reservation
                  </QuickAction>
                  <QuickAction onClick={() => sendMessage("What properties do you have available?")}>
                    🏖️ Available properties
                  </QuickAction>
                  <QuickAction onClick={() => sendMessage("What are the check-in and check-out times?")}>
                    ⏰ Check-in/out times
                  </QuickAction>
                  <QuickAction onClick={() => sendMessage("I need to cancel my reservation")}>
                    ❌ Cancel reservation
                  </QuickAction>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-[var(--casita-orange)] text-white rounded-br-md'
                        : 'bg-white text-gray-800 rounded-bl-md shadow-sm'
                    } ${message.metadata?.error ? 'border border-red-200' : ''}`}
                  >
                    <MessageContent content={message.content} />
                    <div className={`text-xs mt-1 ${
                      message.role === 'user' ? 'text-white/70' : 'text-gray-400'
                    }`}>
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                </div>
              ))
            )}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[var(--casita-orange)]" />
                    <span className="text-sm text-gray-500">Thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-gray-100 bg-white">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                placeholder="Type your message..."
                className="flex-1 px-4 py-3 rounded-full border border-gray-200 focus:border-[var(--casita-orange)] focus:ring-2 focus:ring-[var(--casita-orange-light)] outline-none text-sm"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading}
                className="p-3 bg-[var(--casita-orange)] text-white rounded-full hover:bg-[var(--casita-orange-dark)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-gray-400 text-center mt-2">
              Powered by AI • Need human help? <a href="https://wa.me/15558767325" target="_blank" rel="noopener noreferrer" className="text-[var(--casita-orange)] hover:underline">WhatsApp us</a>
            </p>
          </form>
        </div>
      )}
    </>
  );
}

function QuickAction({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full p-3 bg-white rounded-lg text-left hover:bg-gray-50 transition-colors border border-gray-100 shadow-sm"
    >
      {children}
    </button>
  );
}

function MessageContent({ content }: { content: string }) {
  // Simple markdown-like rendering for bold text and line breaks
  const lines = content.split('\n');

  return (
    <div className="text-sm leading-relaxed space-y-1">
      {lines.map((line, i) => {
        if (!line.trim()) return <br key={i} />;

        // Handle bold text
        const parts = line.split(/(\*\*.*?\*\*)/g);
        return (
          <p key={i}>
            {parts.map((part, j) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={j}>{part.slice(2, -2)}</strong>;
              }
              return <span key={j}>{part}</span>;
            })}
          </p>
        );
      })}
    </div>
  );
}

function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}
