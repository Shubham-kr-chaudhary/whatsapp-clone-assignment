
import React from "react";

function Avatar({ label }) {
  const initials = String(label || "").slice(-4);
  return (
    <div className="w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center font-semibold">
      {initials}
    </div>
  );
}

function formatTime(ts) {
  if (!ts) return "";
  const n = Number(ts);
  if (Number.isNaN(n)) return "";
  const ms = (n > 1e12) ? n : (n > 1e9 ? n*1000 : n);
  return new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ChatListItem({ chat, active, onClick }) {
  const { wa_id, lastText, lastTime } = chat;
  return (
    <div onClick={onClick} className={`p-3 flex gap-3 items-start cursor-pointer hover:bg-gray-50 ${active ? 'bg-gray-100' : ''}`}>
      <Avatar label={wa_id} />
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <div className="font-semibold text-gray-800 truncate">{wa_id}</div>
          <div className="text-xs text-gray-400">{formatTime(lastTime)}</div>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm text-gray-500 truncate">{lastText}</div>
          {/* placeholder unread badge */}
          {/* Replace with real unread counts if you maintain them */}
        </div>
      </div>
    </div>
  );
}
