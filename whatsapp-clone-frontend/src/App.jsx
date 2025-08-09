

import React, { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";
import Header from "./components/Header";

export default function App() {
  const [chats, setChats] = useState([]);
  const [activeWA, setActiveWA] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const BASE = import.meta.env.VITE_API_URL || "";

  // Detect mobile (kept for behaviour control)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 767px)");
    function onChange(e) {
      setIsMobile(e.matches);
      if (e.matches) setSidebarOpen(true); // show list or drawer by default on mobile
    }
    setIsMobile(mq.matches);
    mq.addEventListener ? mq.addEventListener("change", onChange) : mq.addListener(onChange);
    return () => {
      mq.removeEventListener ? mq.removeEventListener("change", onChange) : mq.removeListener(onChange);
    };
  }, []);

  // Load chat list
  const loadChats = React.useCallback(async () => {
    try {
      const res = await fetch(`${BASE}/api/chats`);
      if (!res.ok) throw new Error("Failed to load chats");
      const data = await res.json();

      const normalized = (Array.isArray(data) ? data : []).map(c => ({
        wa_id: String(c.wa_id),
        displayName: c.displayName || c.name || null,
        lastText: c.lastText || "",
        lastTime: Number(c.lastTime) || 0,
        status: c.status || ""
      }));

      const map = new Map();
      normalized.forEach(c => map.set(c.wa_id, c));
      const unique = Array.from(map.values()).sort((a, b) => b.lastTime - a.lastTime);

      setChats(unique);
    } catch (err) {
      console.error("loadChats error", err);
      setChats([]);
    }
  }, [BASE]);

  useEffect(() => {
    loadChats();
    const iv = setInterval(loadChats, 5000);
    return () => clearInterval(iv);
  }, [loadChats]);

  function handleSelectChat(wa) {
    setActiveWA(wa);
    if (isMobile) setSidebarOpen(false);
  }

  const activeChat = chats.find(c => c.wa_id === activeWA);
  const headerTitle = activeChat ? (activeChat.displayName || activeChat.wa_id) : "WhatsApp Clone";

  return (
    <div className="h-screen w-screen bg-gray-100">
      {/* MOBILE: show either sidebar (drawer) or chat */}
      {isMobile ? (
        !activeWA ? (
          <div className="h-full w-full">
            <Sidebar
              chats={chats}
              activeWA={activeWA}
              onSelect={handleSelectChat}
              open={sidebarOpen}
              setOpen={setSidebarOpen}
            />
          </div>
        ) : (
          <div className="h-full w-full flex flex-col">
            <Header
              title={headerTitle}
              onMenu={() => setActiveWA(null)}
              displayName={activeChat?.displayName}
              activeWA={activeWA}
              onCall={() => console.log('call')}
              onVideoCall={() => console.log('video')}
              onMore={() => console.log('more menu')}
            />
            <ChatWindow wa_id={activeWA} />
          </div>
        )
      ) : (
        // DESKTOP: show both sidebar and chat
        <div className="h-full w-full flex">
          <Sidebar
            chats={chats}
            activeWA={activeWA}
            onSelect={handleSelectChat}
            open={true}
            setOpen={() => {}}
          />
          <div className="flex-1 flex flex-col min-h-0">
            {activeWA && (
              <Header
                title={headerTitle}
                onMenu={() => {}}
                displayName={activeChat?.displayName}
                activeWA={activeWA}
                onCall={() => console.log('call')}
                onVideoCall={() => console.log('video')}
                onMore={() => console.log('more menu')}
              />
            )}
            {!activeWA ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
                <div className="rounded-full w-20 h-20 bg-green-500 text-white flex items-center justify-center text-2xl font-semibold mb-6">
                  💬
                </div>
                <h2 className="text-xl font-semibold mb-2">Select a chat</h2>
                <p className="text-gray-500 max-w-md">
                  Choose a conversation from the left to view messages and start chatting.
                </p>
              </div>
            ) : (
              <ChatWindow wa_id={activeWA} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

