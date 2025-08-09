
import React, { useState, useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';

export default function ChatWindow({ wa_id }) {
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState('');
  const boxRef = useRef(null);

  const BASE = import.meta.env.VITE_API_URL || '';
  const MY_WA_ID = String(import.meta.env.VITE_OWN_WA_ID || '918329446654');

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        if (!wa_id) {
          if (mounted) setMsgs([]);
          return;
        }

        const res = await fetch(`${BASE}/api/chats/${wa_id}`);
        if (!res.ok) throw new Error('Bad response');
        const rawData = await res.json();

        const normalized = (Array.isArray(rawData) ? rawData : []).map(m => {
          const raw = m.raw_payload || m.raw || {};
          const from =
            raw.from ?? raw.sender ?? raw.from_number ?? raw.sender_id ?? m.from ?? m.sender ?? undefined;
          const to =
            raw.to ?? raw.recipient ?? raw.to_number ?? raw.recipient_id ?? m.to ?? undefined;
          const sFrom = from !== undefined ? String(from) : undefined;
          const sTo = to !== undefined ? String(to) : undefined;
          const sWaId = m.wa_id !== undefined && m.wa_id !== null ? String(m.wa_id) : undefined;

          let other;
          if (sFrom) {
            if (sFrom === MY_WA_ID) {
              other = sTo && sTo !== MY_WA_ID ? sTo : (sWaId && sWaId !== MY_WA_ID ? sWaId : undefined);
            } else {
              other = sFrom;
            }
          } else if (sTo) {
            other = sTo !== MY_WA_ID ? sTo : (sWaId && sWaId !== MY_WA_ID ? sWaId : undefined);
          } else if (sWaId && sWaId !== MY_WA_ID) {
            other = sWaId;
          } else {
            other = undefined;
          }

          let textVal = '';
          if (typeof m.text === 'string') textVal = m.text;
          else if (m.text && typeof m.text === 'object') textVal = m.text.body ?? '';
          else if (raw.text && typeof raw.text === 'object') textVal = raw.text.body ?? '';
          else if (typeof m.body === 'string') textVal = m.body;

          const tsCandidate = m.timestamp ?? raw.timestamp ?? Date.now();
          const n = Number(tsCandidate) || 0;
          let tsMs = (n > 1e12) ? n : (n > 1e9 ? n * 1000 : Date.now());

          let computedSentByMe = false;
          if (typeof m.sentByMe === 'boolean') computedSentByMe = !!m.sentByMe;
          else if (sFrom && sFrom === MY_WA_ID) computedSentByMe = true;
          else if (sTo && sTo === MY_WA_ID) computedSentByMe = false;
          else if (typeof m.id === 'string' && m.id.startsWith('local_')) computedSentByMe = true;

          return {
            ...m,
            text: textVal,
            timestamp: tsMs,
            raw_payload: raw,
            other,
            sentByMe: computedSentByMe
          };
        });

        const filtered = normalized.filter(m => {
          try {
            if (!wa_id) return false;
            const sWa = String(wa_id);
            if (m.other && String(m.other) === sWa) return true;
            if (m.wa_id && m.wa_id !== MY_WA_ID && String(m.wa_id) === sWa) return true;
            if (typeof m.id === 'string' && m.id.startsWith('local_') && m.wa_id && String(m.wa_id) === sWa) return true;
            return false;
          } catch {
            return false;
          }
        });

        filtered.sort((a, b) => (Number(a.timestamp) || 0) - (Number(b.timestamp) || 0));

        if (mounted) setMsgs(filtered);
      } catch (err) {
        console.error('Failed to load messages', err);
        if (mounted) setMsgs([]);
      }
    }

    load();
    return () => { mounted = false; };
  }, [wa_id, BASE, MY_WA_ID]);

  // scroll after paint (stable)
  useEffect(() => {
    if (!boxRef.current) return;
    requestAnimationFrame(() => {
      try { boxRef.current.scrollTop = boxRef.current.scrollHeight; }
      catch { /* ignore */ }
    });
  }, [msgs]);

  function detectOwnMessage(m) {
    if (!m) return false;
    if (typeof m.sentByMe === 'boolean') return !!m.sentByMe;
    return false;
  }

  async function send() {
    const bodyText = text.trim();
    if (!bodyText || !wa_id) return;

    const tempId = `local_${Date.now()}`;
    const tempMsg = { id: tempId, text: bodyText, timestamp: Date.now(), status: 'sending', sentByMe: true, wa_id };

    setMsgs(prev => [...prev, tempMsg]);
    setText('');

    try {
      const res = await fetch(`${BASE}/api/chats/${wa_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: bodyText })
      });
      if (!res.ok) {
        setMsgs(prev => prev.map(m => (m.id === tempId ? { ...m, status: 'failed' } : m)));
        throw new Error('Failed to send');
      }
      const saved = await res.json();
      const raw = saved.raw_payload || saved.raw || {};
      const from = raw.from ?? raw.sender ?? saved.from;
      const to = raw.to ?? raw.recipient ?? saved.to;
      const sFrom = from !== undefined ? String(from) : undefined;
      const sTo = to !== undefined ? String(to) : undefined;

      const computedOther = (sFrom && sFrom === MY_WA_ID)
        ? (sTo && sTo !== MY_WA_ID ? sTo : (saved.wa_id && saved.wa_id !== MY_WA_ID ? saved.wa_id : undefined))
        : (sFrom ? sFrom : (saved.wa_id && saved.wa_id !== MY_WA_ID ? saved.wa_id : undefined));

      const tsCandidate = saved.timestamp ?? raw.timestamp ?? Date.now();
      const n = Number(tsCandidate) || 0;
      let tsMs = (n > 1e12) ? n : (n > 1e9 ? n * 1000 : Date.now());

      const normalizedSaved = {
        ...saved,
        text: (typeof saved.text === 'string') ? saved.text : (saved.text?.body || raw.text?.body || ''),
        timestamp: tsMs,
        raw_payload: raw,
        other: computedOther,
        sentByMe: true
      };

      setMsgs(prev => prev.map(m => (m.id === tempId ? normalizedSaved : m)));
    } catch (err) {
      console.error('Send failed', err);
      setMsgs(prev => prev.map(m => (m.id === tempId ? { ...m, status: 'failed' } : m)));
    }
  }

  // placeholder when no chat selected
  if (!wa_id) {
    return (
      <div data-chat-window className="flex-1 flex flex-col bg-white min-h-0">
        <div className="flex-1 flex items-center justify-center bg-gray-50 min-h-0">
          <div className="text-gray-500">Select a chat to start messaging</div>
        </div>
        <div className="p-3 border-t bg-white">
          <div className="flex gap-2">
            <input className="flex-1 border rounded px-3 py-2 text-sm" placeholder="Type a message" disabled />
            <button className="px-4 py-2 bg-green-600 text-white rounded" disabled>Send</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main data-chat-window className="flex-1 flex flex-col bg-white min-h-0">
      <div ref={boxRef} className="flex-1 overflow-auto p-4 sm:p-6 bg-gray-50 flex flex-col gap-3 min-h-0">
        {msgs.length === 0 ? (
          <div className="text-center text-gray-400 mt-10">No messages yet</div>
        ) : (
          msgs.map(m => {
            const own = detectOwnMessage(m);
            return (
              <div key={m.id ?? Math.random()} className={`w-full flex ${own ? 'justify-end' : 'justify-start'}`}>
                <MessageBubble msg={m} own={own} />
              </div>
            );
          })
        )}
      </div>

      <div className="p-3 sm:p-4 border-t bg-white">
        <div className="flex gap-2 items-center">
          <input
            className="flex-1 border rounded px-3 py-2 text-sm min-w-0"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Type a message"
            aria-label="Message input"
          />
          <button
            className="px-4 py-2 bg-green-600 text-white rounded text-sm flex items-center justify-center"
            onClick={send}
            aria-label="Send message"
          >
            Send
          </button>
        </div>
      </div>
    </main>
  );
}
