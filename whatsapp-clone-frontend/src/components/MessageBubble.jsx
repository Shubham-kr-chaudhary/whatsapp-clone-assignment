
import React from 'react';

function formatTimestamp(ts) {
  if (!ts) return '';
  const n = Number(ts);
  if (Number.isNaN(n)) return '';
  let ms = n;
  if (n > 1e9 && n < 1e12) ms = n * 1000;
  return new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function SingleTick({ className = '' }) {
  return (
    <svg className={`w-4 h-4 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function DoubleTick({ className = '' }) {
  return (
    <svg className={`w-4 h-4 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 13L5 17L11 11" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 13L13 17L19 11" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function MessageBubble({ msg, own }) {
  const time = formatTimestamp(msg.timestamp);

  function StatusIcon({ status }) {
    if (status === 'sending') {
      return <div className="w-3 h-3 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />;
    }
    if (status === 'sent') return <SingleTick className="text-gray-400" />;
    if (status === 'delivered') return <DoubleTick className="text-gray-400" />;
    if (status === 'read') return <DoubleTick className="text-blue-500" />;
    if (status === 'failed') {
      return (
        <svg className="w-4 h-4 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 9v4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 17h.01" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="12" r="9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    }
    return null;
  }

  return (
    <div
      className={`inline-block p-3 rounded-lg shadow-sm
        ${own ? 'bg-green-100 text-black rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none'}
        max-w-[75%] md:max-w-[60%]`}
    >
      <div className="whitespace-pre-wrap">{msg.text}</div>
      <div className="mt-1 flex items-center justify-end gap-2">
        <div className="text-xs text-gray-500">{time}</div>
        {own ? <div className="flex items-center"><StatusIcon status={msg.status} /></div> : null}
      </div>
    </div>
  );
}
