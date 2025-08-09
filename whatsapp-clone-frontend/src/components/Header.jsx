
import React, { useState, useRef, useEffect } from "react";

function Avatar({ label }) {
  const clean = String(label || "");
  const initials = clean.match(/\D/)
    ? (clean.split(" ").map(s => s[0]).slice(0, 2).join("") || clean.slice(-4))
    : clean.slice(-4);
  return (
    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-green-600 text-white flex items-center justify-center font-semibold text-sm sm:text-base flex-shrink-0">
      {initials}
    </div>
  );
}

export default function Header({
  title,
  onMenu,
  displayName,
  activeWA,
  onCall = () => {},
  onVideoCall = () => {},
  onMore = () => {}
}) {
  const shownTitle = displayName || title || activeWA || "WhatsApp Clone";
  const isChatOpen = Boolean(activeWA);

  // dropdown state for small screens
  const [actionsOpen, setActionsOpen] = useState(false);
  const actionsRef = useRef(null);

  useEffect(() => {
    function handleDocClick(e) {
      if (actionsRef.current && !actionsRef.current.contains(e.target)) {
        setActionsOpen(false);
      }
    }
    function handleEsc(e) {
      if (e.key === "Escape") setActionsOpen(false);
    }
    document.addEventListener("mousedown", handleDocClick);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleDocClick);
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  return (
    <header className="relative h-12 sm:h-14 px-3 sm:px-4 bg-white flex items-center justify-between gap-2 sm:gap-3 border-b flex-shrink-0">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Back arrow or menu */}
        <button
          className="md:hidden p-1 sm:p-2 rounded bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-300"
          onClick={onMenu}
          aria-label={isChatOpen ? "Back" : "Menu"}
        >
          {isChatOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 sm:w-6 sm:h-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 sm:w-6 sm:h-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>

        {/* Avatar + name */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Avatar label={displayName || activeWA} />
          <div className="min-w-0">
            <div className="font-semibold text-gray-800 text-sm sm:text-base truncate">
              {shownTitle}
            </div>
            {isChatOpen && (
              <div className="text-xs text-gray-500 truncate">Online</div>
            )}
          </div>
        </div>
      </div>

      {/* Right-side action icons */}
      {isChatOpen && (
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Full icons for small+ (hidden on xs) */}
          <div className="hidden sm:flex items-center gap-1 sm:gap-2">
            <button
              className="p-1 sm:p-2 rounded bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-200"
              title="Voice Call"
              onClick={onCall}
              aria-label="Voice call"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.86 19.86 0 01-8.63-3.07 19.51 19.51 0 01-6-6A19.86 19.86 0 012.08 4.18 2 2 0 014.06 2h3a2 2 0 012 1.72 12.05 12.05 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.05 12.05 0 002.81.7A2 2 0 0122 16.92z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <button
              className="p-1 sm:p-2 rounded bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-200"
              title="Video Call"
              onClick={onVideoCall}
              aria-label="Video call"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M23 7l-7 5 7 5V7z" strokeLinecap="round" strokeLinejoin="round" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <button
              className="p-1 sm:p-2 rounded bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300"
              title="More"
              onClick={onMore}
              aria-label="More options"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v.01M12 12v.01M12 18v.01" />
              </svg>
            </button>
          </div>

          {/* Compact actions for XS: single button opens a small menu */}
          <div className="sm:hidden relative" ref={actionsRef}>
            <button
              className="p-1 rounded bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200"
              onClick={() => setActionsOpen(v => !v)}
              aria-expanded={actionsOpen}
              aria-haspopup="menu"
              aria-label="Open actions"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v.01M12 12v.01M12 18v.01" />
              </svg>
            </button>

            {actionsOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-white border rounded shadow-lg z-50">
                <button
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                  onClick={() => { setActionsOpen(false); onCall(); }}
                >
                  Voice call
                </button>
                <button
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                  onClick={() => { setActionsOpen(false); onVideoCall(); }}
                >
                  Video call
                </button>
                <button
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                  onClick={() => { setActionsOpen(false); onMore(); }}
                >
                  More
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
