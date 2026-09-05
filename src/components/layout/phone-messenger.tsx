"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { ArrowUp, MessageSquare, X } from "lucide-react";
import { checkAndRedactSensitiveInfo, checkProfanity } from "@/lib/safety";
import { isInsideOverlayScrollRegion } from "@/lib/overlay-scroll";

interface Message {
  sender: "user" | "assistant" | "system";
  content: string;
  time?: string;
  streaming?: boolean;
}

// Client-side helper to generate SHA-256 hash
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Generate client device fingerprint hash
async function getDeviceFingerprint(): Promise<string> {
  if (typeof window === "undefined") return "server-fallback";
  try {
    const components = [
      navigator.userAgent,
      navigator.language,
      Intl.DateTimeFormat().resolvedOptions().timeZone,
      `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`,
    ];
    return await sha256(components.join("|"));
  } catch (e) {
    return "fallback-fingerprint-error";
  }
}

// Generate or retrieve transient 256-bit encryption key
function getOrCreateSessionKey(): string {
  if (typeof window === "undefined") return "";
  let key = sessionStorage.getItem("chat_session_key");
  if (!key) {
    const array = new Uint8Array(32);
    window.crypto.getRandomValues(array);
    key = Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
    sessionStorage.setItem("chat_session_key", key);
  }
  return key;
}

// Generate or retrieve sessionId
function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = sessionStorage.getItem("chat_session_id");
  if (!id) {
    id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem("chat_session_id", id || "");
  }
  return id || "";
}

function getTimeStamp(): string {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const CONVERSATION_STARTERS = ["Your projects?", "Your experience?", "Your research?"];

// Streaming reveal: the network can deliver text in bursty chunks (Groq in particular
// streams fast and unevenly), so we decouple "bytes arrived" from "text appears" and
// drip the buffered text out at a steady pace. The reveal rate scales with backlog so
// a long response never lags far behind what's actually arrived.
// Time-based (not frame-count-based), so the pace reads the same on a 60Hz or 144Hz
// display: a slow, readable typewriter at rest, gently accelerating only if the
// network gets meaningfully ahead of what's on screen.
const REVEAL_CHARS_PER_SEC = 26;
const REVEAL_CATCHUP_TAU_MS = 1800;

// A control tag like <suggestions> can itself arrive split across chunk boundaries
// (e.g. one chunk ends "...answer.<suggest", the next starts "ions>[...]"). Cutting only
// on a full match would let that stray "<suggest" fragment flash on screen for a frame.
// So: cut at the full tag once it's confirmed, or at the tail's longest partial match of
// the tag while it's still ambiguous, so nothing ever streams into view.
function visibleUpToTag(text: string, tag: string): string {
  const fullIndex = text.indexOf(tag);
  if (fullIndex !== -1) return text.slice(0, fullIndex);
  for (let len = Math.min(tag.length - 1, text.length); len > 0; len--) {
    if (text.endsWith(tag.slice(0, len))) return text.slice(0, text.length - len);
  }
  return text;
}

export function PhoneMessenger() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "assistant",
      content: "Ask me about Girwan’s projects, research, or experience.",
      time: undefined,
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const [fingerprint, setFingerprint] = useState("");
  const [dynamicSuggestions, setDynamicSuggestions] = useState<string[]>([]);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const phoneFrameRef = useRef<HTMLDivElement>(null);
  const suggestionsRef = useRef<HTMLDivElement | null>(null);
  const prefersReducedMotion = useReducedMotion();

  // Streaming reveal state (refs, not React state, since these update every animation frame).
  const revealTargetRef = useRef(""); // visible text the network has confirmed so far
  const revealedTextRef = useRef(""); // visible text actually painted to the DOM so far
  const streamDoneRef = useRef(false);
  const revealFrameRef = useRef<number | null>(null);
  const streamingIndexRef = useRef<number | null>(null); // index of the in-progress assistant message
  const pendingSuggestionsRef = useRef<string[]>([]);
  const revealCarryRef = useRef(0); // fractional characters carried between ticks
  const lastTickTimeRef = useRef<number | null>(null);

  useEffect(() => () => { if (revealFrameRef.current !== null) cancelAnimationFrame(revealFrameRef.current); }, []);

  // Listen for global custom event to trigger the chat open (e.g. from the contact section)
  useEffect(() => {
    const handleOpenChat = () => setIsOpen(true);
    window.addEventListener("open-ai-chat", handleOpenChat);
    return () => window.removeEventListener("open-ai-chat", handleOpenChat);
  }, []);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const launchRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    const frame = requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
      if (event.key !== "Tab") return;
      const nodes = Array.from(phoneFrameRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), textarea:not([disabled]), a[href]') ?? []);
      const first = nodes[0], last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    const onScroll = (event: WheelEvent | TouchEvent) => {
      // Not just "inside my own panel": a project detail sheet can still be open
      // underneath (its "try it here" link opens the chat without closing it), and
      // its own scroll region needs to keep scrolling normally too.
      if (!isInsideOverlayScrollRegion(event.target)) event.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("wheel", onScroll, { passive: false });
    window.addEventListener("touchmove", onScroll, { passive: false });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("wheel", onScroll);
      window.removeEventListener("touchmove", onScroll);
      (previous?.isConnected ? previous : launchRef.current)?.focus({ preventScroll: true });
    };
  }, [isOpen]);

  // Initialize fingerprint
  useEffect(() => {
    getDeviceFingerprint().then((fp) => setFingerprint(fp));
  }, []);

  // Scroll to bottom when messages update. A streaming reply shouldn't yank the view
  // back down if the user scrolled up to reread earlier messages — but sending a new
  // message of your own should always jump you to it, scrolled-up or not.
  const wasStreamingRef = useRef(false);
  const forceScrollRef = useRef(false);
  useEffect(() => {
    const pane = chatEndRef.current?.parentElement;
    if (!pane) return;
    const forced = forceScrollRef.current;
    forceScrollRef.current = false;
    const nearBottom = forced || pane.scrollHeight - pane.scrollTop - pane.clientHeight < 120;
    if (!nearBottom) return;

    // The moment a reply finishes, its timestamp and the suggestion chips settle in
    // and the pane grows a bit more than it did per streamed character — glide to the
    // new bottom instead of snapping, so that settle doesn't read as a jolt.
    const isStreamingNow = messages.some((m) => m.streaming);
    const justFinished = wasStreamingRef.current && !isStreamingNow;
    wasStreamingRef.current = isStreamingNow;

    if (justFinished && !prefersReducedMotion) pane.scrollTo({ top: pane.scrollHeight, behavior: "smooth" });
    else pane.scrollTop = pane.scrollHeight;
  }, [messages, isLoading, isOpen, prefersReducedMotion]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading || isBanned) return;

    const userText = textToSend.trim();
    setInput("");
    setIsLoading(true);

    // 1. Client-side PII and Secrets scanning
    const safetyResult = checkAndRedactSensitiveInfo(userText);
    const profanityResult = checkProfanity(userText);

    // 2. Display the redacted version of the user's message
    let finalRedacted = safetyResult.redactedText;
    if (!profanityResult.isSafe) {
      finalRedacted = checkProfanity(finalRedacted).redactedText;
    }
    
    forceScrollRef.current = true;
    setMessages((prev) => [...prev, { sender: "user", content: finalRedacted, time: getTimeStamp() }]);

    // 3. Block API request if sensitive data or vulgarity was found
    if (!safetyResult.isSafe || !profanityResult.isSafe) {
      const systemMessage = !profanityResult.isSafe
        ? "Please keep the conversation professional. Vulgar language and insults are not allowed."
        : "Please don’t send private information, credentials, API keys, passwords, or sensitive personal data in this chat.";

      forceScrollRef.current = true;
      setMessages((prev) => [
        ...prev,
        { sender: "system", content: systemMessage, time: getTimeStamp() }
      ]);
      setIsLoading(false);
      return;
    }

    try {
      const sessionKey = getOrCreateSessionKey();
      const sessionId = getOrCreateSessionId();

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-key": sessionKey,
          "x-device-fingerprint": fingerprint,
        },
        body: JSON.stringify({ message: userText, sessionId }),
        signal: AbortSignal.timeout(30000),
      });

      if (response.status === 403) {
        setIsBanned(true);
        const banMessage = await response.text();
        forceScrollRef.current = true;
        setMessages((prev) => [...prev, { sender: "system", content: banMessage, time: getTimeStamp() }]);
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        let errorText = "Could not complete message.";
        let newRedactedText = null;
        
        try {
          const data = await response.clone().json();
          if (data.error) errorText = data.error;
          if (data.redactedText) newRedactedText = data.redactedText;
        } catch {
          const rawText = await response.text();
          if (rawText) errorText = rawText;
        }

        forceScrollRef.current = true;
        setMessages((prev) => {
          const updated = [...prev];
          if (newRedactedText && updated.length > 0 && updated[updated.length - 1].sender === "user") {
            updated[updated.length - 1].content = newRedactedText;
          }
          return [
            ...updated,
            { sender: "system", content: errorText, time: getTimeStamp() },
          ];
        });
        setIsLoading(false);
        return;
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("Response body is not readable.");
      }

      // Reset streaming state for this turn.
      revealTargetRef.current = "";
      revealedTextRef.current = "";
      streamDoneRef.current = false;
      streamingIndexRef.current = null;
      pendingSuggestionsRef.current = [];
      revealCarryRef.current = 0;
      lastTickTimeRef.current = null;

      // Paints revealedTextRef into the streaming message at a steady, slow typewriter
      // pace, only accelerating (via the backlog term) if the network gets meaningfully
      // ahead of what's on screen — measured by elapsed time, not frame count, so it
      // reads the same regardless of display refresh rate.
      const runRevealLoop = () => {
        const now = performance.now();
        const last = lastTickTimeRef.current ?? now;
        const dt = now - last;
        lastTickTimeRef.current = now;

        const target = revealTargetRef.current;
        const revealed = revealedTextRef.current;
        if (revealed.length < target.length) {
          const backlog = target.length - revealed.length;
          const baselineChars = (dt / 1000) * REVEAL_CHARS_PER_SEC;
          const catchupChars = backlog * (dt / REVEAL_CATCHUP_TAU_MS);
          revealCarryRef.current += Math.max(baselineChars, catchupChars);

          const step = Math.min(backlog, Math.floor(revealCarryRef.current));
          if (step > 0) {
            revealCarryRef.current -= step;
            revealedTextRef.current = target.slice(0, revealed.length + step);
            setMessages((prev) => {
              const index = streamingIndexRef.current;
              if (index === null || !prev[index]) return prev;
              const next = [...prev];
              next[index] = { ...next[index], content: revealedTextRef.current };
              return next;
            });
          }
        }

        if (revealedTextRef.current.length >= revealTargetRef.current.length && streamDoneRef.current) {
          setMessages((prev) => {
            const index = streamingIndexRef.current;
            if (index === null || !prev[index]) return prev;
            const next = [...prev];
            next[index] = { ...next[index], content: revealTargetRef.current, streaming: false, time: getTimeStamp() };
            return next;
          });
          setDynamicSuggestions(pendingSuggestionsRef.current);
          if (suggestionsRef.current) suggestionsRef.current.scrollLeft = 0;
          setIsLoading(false);
          revealFrameRef.current = null;
          return;
        }
        revealFrameRef.current = requestAnimationFrame(runRevealLoop);
      };

      let accumulated = "";
      // A plain local flag, not the ref: setMessages's updater can run on a deferred
      // React flush rather than synchronously, so gating on streamingIndexRef.current
      // here could see a stale null on the next chunk and create a second placeholder.
      let placeholderCreated = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        accumulated += decoder.decode(value, { stream: true });

        // Hold back the trailing <suggestions> block (and any partial tag being typed
        // out, even split across chunks) so it's never revealed as visible text.
        revealTargetRef.current = visibleUpToTag(accumulated, "<suggestions");

        if (!placeholderCreated && revealTargetRef.current.length > 0) {
          placeholderCreated = true;
          forceScrollRef.current = true;
          setMessages((prev) => {
            streamingIndexRef.current = prev.length;
            return [...prev, { sender: "assistant", content: "", streaming: true }];
          });
          revealFrameRef.current = requestAnimationFrame(runRevealLoop);
        }
      }

      // Extract dynamic suggestions if present, and settle on the final visible text.
      let finalContent = accumulated;
      const suggestionsStartIndex = finalContent.indexOf("<suggestions>");

      if (suggestionsStartIndex !== -1) {
        const suggestionsBlock = finalContent.slice(suggestionsStartIndex);
        // Try to extract the JSON array inside the tags, even if the closing tag is mangled
        const innerTextMatch = suggestionsBlock.match(/<suggestions>([\s\S]*?)(?:<\/suggestions>|<\/suggestion|<\/suggestio|<\/suggesti|<\/suggest|<\/sugges|<\/sugge|<\/sugg|<\/sug|<\/su|<\/s|<\/|<|$)/);

        if (innerTextMatch) {
          try {
            // Only parse if it looks like a complete JSON array
            const jsonStr = innerTextMatch[1].trim();
            if (jsonStr.startsWith("[") && jsonStr.endsWith("]")) {
              pendingSuggestionsRef.current = JSON.parse(jsonStr);
            }
          } catch (e) {
            // JSON parse failed, fallback to default starters
          }
        }

        // Always strip the raw XML block from the user's view
        finalContent = finalContent.slice(0, suggestionsStartIndex).trim();
      }

      revealTargetRef.current = finalContent;
      streamDoneRef.current = true;

      if (!placeholderCreated) {
        // The whole response arrived with nothing to reveal incrementally (e.g. empty
        // answer) — just show whatever we ended up with directly.
        forceScrollRef.current = true;
        setMessages((prev) => [...prev, { sender: "assistant", content: finalContent, time: getTimeStamp() }]);
        setDynamicSuggestions(pendingSuggestionsRef.current);
        if (suggestionsRef.current) suggestionsRef.current.scrollLeft = 0;
        setIsLoading(false);
      } else if (revealFrameRef.current === null) {
        // The reveal loop had already caught up and stopped itself before the network
        // finished; give it one more tick to notice streamDoneRef and finalize.
        revealFrameRef.current = requestAnimationFrame(runRevealLoop);
      }

    } catch (e: any) {
      console.error(e);
      if (revealFrameRef.current !== null) {
        cancelAnimationFrame(revealFrameRef.current);
        revealFrameRef.current = null;
      }
      forceScrollRef.current = true;
      setMessages((prev) => {
        const index = streamingIndexRef.current;
        const next = index !== null && prev[index] ? [...prev] : prev;
        if (index !== null && next[index]) next[index] = { ...next[index], streaming: false };
        return [...next, { sender: "system", content: `Connection failed. ${e.message || ""}`, time: getTimeStamp() }];
      });
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(input);
    }
  };

  return <>
    <button ref={launchRef} type="button" className="chat-launcher" aria-label="Open AI chat" aria-expanded={isOpen} onClick={() => setIsOpen(true)}><MessageSquare size={18} aria-hidden="true" /><span>Ask my AI</span></button>
    <AnimatePresence>
      {isOpen && <>
        <motion.div className="chat-backdrop" aria-hidden="true" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsOpen(false)} />
        <motion.div ref={phoneFrameRef} className="chat-panel" role="dialog" aria-modal="true" aria-labelledby="chat-title" initial={prefersReducedMotion ? false : { opacity: 0, y: 18, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: prefersReducedMotion ? 0 : 12 }} transition={{ duration: .25, ease: [.16, 1, .3, 1] }}>
          <header className="chat-header"><div><h2 id="chat-title">Ask my AI</h2><p>Girwan's projects &amp; experience</p></div><button className="icon-button" type="button" aria-label="Close AI chat" onClick={() => setIsOpen(false)}><X size={18} aria-hidden="true" /></button></header>
          <div className="chat-messages" role="log" aria-label="Conversation" aria-live={messages[messages.length - 1]?.streaming ? "off" : "polite"} aria-relevant="additions text">
            {messages.map((message, index) => <div className="chat-message" data-sender={message.sender} key={index}>
              <p>{message.content}{message.streaming && <span className="chat-caret" aria-hidden="true" />}</p>
              {/* Reserve the timestamp's line the moment a reply starts streaming, so its
                  arrival at the end fades in rather than shoving the layout down. */}
              {(message.time !== undefined || message.streaming) &&
                <time className="chat-message-time" data-ready={message.time !== undefined}>{message.time ?? " "}</time>}
            </div>)}
            {isLoading && !messages[messages.length - 1]?.streaming && <p className="chat-loading" role="status">Thinking…</p>}
            <div ref={chatEndRef} />
          </div>
          {!isBanned && <div ref={suggestionsRef} className="chat-suggestions">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={dynamicSuggestions.length ? "dynamic" : "starters"}
                className="chat-suggestions-inner"
                initial={prefersReducedMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: .22 }}
              >
                {(dynamicSuggestions.length ? dynamicSuggestions : CONVERSATION_STARTERS).map(starter => <button type="button" key={starter} disabled={isLoading} onClick={() => handleSendMessage(starter)}>{starter}</button>)}
              </motion.div>
            </AnimatePresence>
          </div>}
          <form className="chat-compose" onSubmit={event => { event.preventDefault(); handleSendMessage(input); }}>
            <textarea ref={inputRef} aria-label="Message to AI" placeholder={isBanned ? "Chat unavailable" : "Ask a question…"} value={input} onChange={event => setInput(event.target.value)} maxLength={400} rows={1} disabled={isBanned || isLoading} onKeyDown={handleKeyPress} />
            <button type="submit" className="icon-button" aria-label="Send message" disabled={isLoading || isBanned || !input.trim()}><ArrowUp size={20} aria-hidden="true" /></button>
          </form>
        </motion.div>
      </>}
    </AnimatePresence>
  </>;
}
