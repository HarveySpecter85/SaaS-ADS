"use client";

interface ChatBubbleProps {
  isOpen: boolean;
  onClick: () => void;
  hasUnread?: boolean;
}

// Message icon
function MessageIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    </svg>
  );
}

// Close icon
function CloseIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

export function ChatBubble({ isOpen, onClick, hasUnread }: ChatBubbleProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      aria-label={isOpen ? "Close chat" : "Open chat"}
    >
      {/* Icon with rotation transition */}
      <span
        className={`transition-transform duration-200 ${isOpen ? 'rotate-90' : 'rotate-0'}`}
      >
        {isOpen ? <CloseIcon /> : <MessageIcon />}
      </span>

      {/* Unread indicator */}
      {hasUnread && !isOpen && (
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white" />
      )}
    </button>
  );
}
