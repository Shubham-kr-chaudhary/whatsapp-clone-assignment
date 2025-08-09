
import React, { useMemo, useState } from "react";
import ChatListItem from "./ChatListItem";

export default function Sidebar({ chats, activeWA, onSelect, open, setOpen }) {
  const [q, setQ] = useState("");

  // dedupe & sorted (safe)
  const uniqueChats = useMemo(() => {
    const map = new Map();
    chats.forEach(c => map.set(c.wa_id, c));
    return Array.from(map.values()).sort((a,b)=>b.lastTime - a.lastTime);
  }, [chats]);

  const filtered = uniqueChats.filter(c => {
    if (!q) return true;
    return c.wa_id.includes(q) || (c.lastText || "").toLowerCase().includes(q.toLowerCase());
  });

  return (
    <>
      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 bg-black/40 z-20 md:hidden transition-opacity ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      />

      <aside className={`z-30 transform top-0 left-0 bg-white w-full md:w-80 h-full border-r
        fixed md:relative transition-transform ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-4 border-b flex items-center gap-3">
          <div className="font-bold text-lg">Chats</div>
          <div className="flex-1">
            <input
              value={q}
              onChange={e=>setQ(e.target.value)}
              className="w-full bg-gray-100 rounded px-3 py-2 text-sm"
              placeholder="Search or start new chat"
            />
          </div>
        </div>

        <div className="overflow-auto h-[calc(100vh-64px)]">
          {filtered.length === 0 ? (
            <div className="p-6 text-gray-500">No chats</div>
          ) : (
            filtered.map(c => (
              <ChatListItem
                key={c.wa_id}
                chat={c}
                active={c.wa_id === activeWA}
                onClick={() => onSelect(c.wa_id)}
              />
            ))
          )}
        </div>
      </aside>
    </>
  );
}
