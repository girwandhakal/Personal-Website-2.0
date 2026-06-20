"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { checkAndRedactSensitiveInfo, checkProfanity } from "@/lib/safety";

interface Message {
  sender: "user" | "assistant" | "system";
  content: string;
  time?: string;
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

const CONVERSATION_STARTERS = [
  "Tell me about yourself?",
  "What is your most impressive technical project?",
  "Why are you the best fit for our engineering team?",
];

// iOS-style font stack: Inter approximates SF Pro Display on the web
const IOS_FONT = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif";

export function PhoneMessenger() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "assistant",
      content: "Hey! I'm Girwan's AI assistant. Ask me about his projects, skills, or work experience 👋",
      time: getTimeStamp(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [warningCount, setWarningCount] = useState(0);
  const [isBanned, setIsBanned] = useState(false);
  const [fingerprint, setFingerprint] = useState("");
  const [currentTime, setCurrentTime] = useState("10:00");
  const [showNotification, setShowNotification] = useState(true);
  const [dynamicSuggestions, setDynamicSuggestions] = useState<string[]>([]);
  const [isFocused, setIsFocused] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const phoneFrameRef = useRef<HTMLDivElement>(null);
  const suggestionsRef = useRef<HTMLDivElement | null>(null);
  const prefersReducedMotion = useReducedMotion();

  // Robust Callback Ref: Guarantees the listener attaches the exact millisecond the DOM node is created, even inside AnimatePresence
  const suggestionsCallbackRef = React.useCallback((node: HTMLDivElement | null) => {
    if (node) {
      suggestionsRef.current = node;
      const handleWheel = (e: WheelEvent) => {
        if (e.deltaY !== 0) {
          e.preventDefault();
          node.scrollLeft += e.deltaY;
        }
      };
      node.addEventListener("wheel", handleWheel, { passive: false });
    }
  }, []);

  // Clock Update
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  // Initialize fingerprint
  useEffect(() => {
    getDeviceFingerprint().then((fp) => setFingerprint(fp));
  }, []);

  // Scroll to bottom when messages update
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, isOpen]);

  // Prevent background scroll when hovering over non-scrollable parts of the phone UI
  useEffect(() => {
    const frame = phoneFrameRef.current;
    if (!frame || !isOpen) return;

    const preventScroll = (e: WheelEvent | TouchEvent) => {
      const scrollable = frame.querySelector('.phone-msg-scroll') as HTMLElement | null;
      if (!scrollable) {
        if (e.cancelable) e.preventDefault();
        return;
      }

      // Check if the event target is inside the scrollable message thread
      const isInsideScrollable = scrollable.contains(e.target as Node);
      
      if (!isInsideScrollable) {
        // If the user scrolls while hovering over the header, footer, or anywhere else, stop it
        if (e.cancelable) e.preventDefault();
      }
    };

    frame.addEventListener("wheel", preventScroll, { passive: false });
    frame.addEventListener("touchmove", preventScroll, { passive: false });
    
    return () => {
      frame.removeEventListener("wheel", preventScroll);
      frame.removeEventListener("touchmove", preventScroll);
    };
  }, [isOpen]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading || isBanned) return;

    const userText = textToSend.trim();
    setInput("");
    setIsLoading(true);
    setShowNotification(false);

    // 1. Client-side PII and Secrets scanning
    const safetyResult = checkAndRedactSensitiveInfo(userText);
    const profanityResult = checkProfanity(userText);

    // 2. Display the redacted version of the user's message
    let finalRedacted = safetyResult.redactedText;
    if (!profanityResult.isSafe) {
      finalRedacted = checkProfanity(finalRedacted).redactedText;
    }
    
    setMessages((prev) => [...prev, { sender: "user", content: finalRedacted, time: getTimeStamp() }]);

    // 3. Block API request if sensitive data or vulgarity was found
    if (!safetyResult.isSafe || !profanityResult.isSafe) {
      const systemMessage = !profanityResult.isSafe 
        ? "Please keep the conversation professional. Vulgar language and insults are not allowed."
        : "Please don’t send private information, credentials, API keys, passwords, or sensitive personal data in this chat.";

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
      });

      if (response.status === 403) {
        setIsBanned(true);
        const banMessage = await response.text();
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

      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;

        if (accumulated.startsWith("[SYSTEM WARNING]")) {
          const match = accumulated.match(/Warning (\d)\/3/);
          if (match) setWarningCount(parseInt(match[1]));
          
          setMessages((prev) => [
            ...prev,
            { sender: "system", content: accumulated, time: getTimeStamp() }
          ]);
          setIsLoading(false);
          return;
        }
      }

      // Extract dynamic suggestions if present
      let finalContent = accumulated;
      let newSuggestions: string[] = [];
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
              newSuggestions = JSON.parse(jsonStr);
            }
          } catch (e) {
            // JSON parse failed, fallback to default starters
          }
        }
        
        // Always strip the raw XML block from the user's view
        finalContent = finalContent.slice(0, suggestionsStartIndex).trim();
      }

      // Add a realistic typing delay based on the length of the response
      // Minimum 1 second, ~25ms per character, maximum 2 seconds
      const typingDelay = Math.max(1000, Math.min(finalContent.length * 25, 2000));
      await new Promise((resolve) => setTimeout(resolve, typingDelay));

      setDynamicSuggestions(newSuggestions);
      if (suggestionsRef.current) {
        suggestionsRef.current.scrollLeft = 0;
      }
      
      setMessages((prev) => [
        ...prev,
        { sender: "assistant", content: finalContent, time: getTimeStamp() }
      ]);

    } catch (e: any) {
      console.error(e);
      setMessages((prev) => [
        ...prev,
        { sender: "system", content: `Connection failed. ${e.message || ""}`, time: getTimeStamp() },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(input);
    }
  };

  // iOS signal bars SVG
  const SignalBars = () => (
    <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
      <rect x="0" y="9" width="3" height="3" rx="0.5" fill="white"/>
      <rect x="4.5" y="6" width="3" height="6" rx="0.5" fill="white"/>
      <rect x="9" y="3" width="3" height="9" rx="0.5" fill="white"/>
      <rect x="13.5" y="0" width="3" height="12" rx="0.5" fill="white" opacity="0.35"/>
    </svg>
  );

  // iOS wifi SVG
  const WifiIcon = () => (
    <svg width="15" height="12" viewBox="0 0 15 12" fill="white">
      <path d="M7.5 10.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z" transform="translate(0,-2)"/>
      <path d="M4.05 8.55a4.92 4.92 0 0 1 6.9 0" stroke="white" strokeWidth="1.3" fill="none" strokeLinecap="round" transform="translate(0,-2)"/>
      <path d="M1.4 5.9a8.36 8.36 0 0 1 12.2 0" stroke="white" strokeWidth="1.3" fill="none" strokeLinecap="round" transform="translate(0,-2)"/>
    </svg>
  );

  // iOS battery SVG
  const BatteryIcon = () => (
    <svg width="27" height="12" viewBox="0 0 27 12" fill="none">
      <rect x="0.5" y="0.5" width="23" height="11" rx="2.5" stroke="white" strokeWidth="1" opacity="0.4"/>
      <rect x="24.5" y="3.5" width="2" height="5" rx="1" fill="white" opacity="0.4"/>
      <rect x="2" y="2" width="18" height="8" rx="1.5" fill="white"/>
    </svg>
  );

  return (
    <>
      {/* Backdrop Blur Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            onClick={() => setIsOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9998,
              background: "rgba(0,0,0,0.4)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
            }}
          />
        )}
      </AnimatePresence>

      {/* Docked Button Container (Fixed Bottom Right) */}
      <div 
        className="phone-dock-root"
        style={{
          position: "fixed",
          right: "24px",
          bottom: "24px",
          zIndex: 9999,
          fontFamily: IOS_FONT,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          pointerEvents: isOpen ? "none" : "auto",
        }}
      >
        <AnimatePresence>
          {!isOpen && (
            <motion.button
              key="docked"
              onClick={() => { setIsOpen(true); setShowNotification(false); }}
              initial={prefersReducedMotion ? undefined : { scale: 0.85, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? undefined : { scale: 0.85, opacity: 0, y: 30, transition: { duration: 0.2 } }}
              whileHover={prefersReducedMotion ? undefined : { y: -4, scale: 1.02, transition: { duration: 0.2 } }}
              whileTap={{ scale: 0.96 }}
              aria-label="Open chat messenger"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                background: "none",
                border: "none",
                cursor: "pointer",
                outline: "none",
                padding: 0,
              }}
            >
              {/* Inner motion div to handle the infinite bounce independently of exit animations */}
              <motion.div
                animate={prefersReducedMotion ? { y: 0 } : { y: showNotification ? [0, -8, 0] : 0 }}
                transition={showNotification ? { y: { duration: 3, repeat: Infinity, ease: "easeInOut" } } : { duration: 0.3 }}
                style={{
                  width: "86px",
                  height: "172px",
                  borderRadius: "24px",
                  background: "linear-gradient(160deg, #1e293b 0%, #000000 100%)",
                  border: "3px solid #2a2a2e",
                boxShadow: showNotification 
                  ? "0 20px 40px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.15), inset 0 0 0 1px rgba(0,0,0,0.5), 0 0 28px rgba(10, 132, 255, 0.35)"
                  : "0 20px 40px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.15), inset 0 0 0 1px rgba(0,0,0,0.5)",
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                transition: "box-shadow 0.8s ease-in-out",
              }}>
                {/* Dynamic Island */}
                <div style={{
                  marginTop: "8px",
                  width: "28px",
                  height: "8px",
                  background: "#000",
                  borderRadius: "4px",
                }}/>
                
                {/* Notification Badge on the phone itself */}
                {showNotification && (
                  <div style={{
                    position: "absolute",
                    top: "-4px",
                    right: "-4px",
                    width: "14px",
                    height: "14px",
                    background: "#FF3B30",
                    borderRadius: "50%",
                    boxShadow: "0 2px 8px rgba(255,59,48,0.5)",
                    border: "2px solid #0a0908",
                  }}/>
                )}

                {/* Blinking "Eyes" (Lock Screen details) */}
                <div className="eye-blink" style={{ position: "absolute", bottom: "30px", left: "16px", width: "12px", height: "12px", borderRadius: "50%", background: "rgba(255,255,255,0.3)" }}/>
                <div className="eye-blink" style={{ position: "absolute", bottom: "30px", right: "16px", width: "12px", height: "12px", borderRadius: "50%", background: "rgba(255,255,255,0.3)" }}/>

                {/* Home bar */}
                <div style={{
                  position: "absolute",
                  bottom: "6px",
                  width: "32px",
                  height: "3px",
                  background: "rgba(255,255,255,0.4)",
                  borderRadius: "2px",
                }}/>
              </motion.div>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Centered Phone Modal Container */}
      <div
        className="phone-messenger-root"
        style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          pointerEvents: "none",
          fontFamily: IOS_FONT,
        }}
      >
        <AnimatePresence>
          {isOpen && (
            /* ====== Active Smartphone State ====== */
            <motion.div
              key="phone-active"
              ref={phoneFrameRef}
              initial={prefersReducedMotion ? undefined : { y: 40, scale: 0.95, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={prefersReducedMotion ? undefined : { scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="phone-frame"
            style={{
              pointerEvents: "auto",
              width: "340px",
              height: "600px",
              borderRadius: "44px",
              background: "#000",
              border: "3px solid #3a3a3c",
              boxShadow: "0 24px 80px rgba(0,0,0,0.6), 0 8px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              position: "relative",
            }}
          >
            {/* ---- Dynamic Island ---- */}
            <div style={{
              position: "absolute",
              top: "10px",
              left: "50%",
              transform: "translateX(-50%)",
              width: "100px",
              height: "28px",
              background: "#000",
              borderRadius: "20px",
              zIndex: 30,
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              paddingRight: "10px",
            }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#1a1a2e", border: "1.5px solid #2a2a3e" }}/>
            </div>

            {/* ---- iOS Status Bar ---- */}
            <div style={{
              height: "50px",
              padding: "14px 26px 0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "14px",
              fontWeight: 600,
              color: "white",
              zIndex: 20,
              background: "rgba(28,28,30,0.95)",
              backdropFilter: "blur(20px)",
            }}>
              <span style={{ fontWeight: 700, fontSize: "15px", letterSpacing: "-0.3px" }}>{currentTime}</span>
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <SignalBars />
                <WifiIcon />
                <BatteryIcon />
              </div>
            </div>

            {/* ---- Messages App Header ---- */}
            <div style={{
              padding: "8px 16px 12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "rgba(28,28,30,0.95)",
              backdropFilter: "blur(20px)",
              borderBottom: "0.5px solid rgba(255,255,255,0.1)",
            }}>
              {/* Back button */}
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#0A84FF",
                  fontSize: "16px",
                  fontWeight: 400,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "2px",
                  padding: 0,
                  fontFamily: IOS_FONT,
                }}
              >
                <svg width="10" height="18" viewBox="0 0 10 18" fill="none">
                  <path d="M9 1L1 9L9 17" stroke="#0A84FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span style={{ marginLeft: "2px" }}>Back</span>
              </button>

              {/* Contact Info */}
              <div style={{ textAlign: "center" }}>
                {/* Contact avatar */}
                <div style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #5856D6, #AF52DE)",
                  margin: "0 auto 2px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "white",
                }}>
                  G
                </div>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "white" }}>Girwan</div>
              </div>

              {/* Spacer */}
              <div style={{ width: "50px" }}/>
            </div>

            {/* ---- Message Thread ---- */}
            <div
              className="phone-msg-scroll"
              style={{
                flex: 1,
                overflowY: "auto",
                overscrollBehavior: "contain",
                padding: "14px 12px",
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                background: "#000",
              }}
            >
              {messages.map((msg, index) => {
                const isUser = msg.sender === "user";
                const isSystem = msg.sender === "system";
                const showTime = index === 0 || 
                  (index > 0 && messages[index - 1].sender !== msg.sender);

                return (
                  <motion.div 
                    key={index}
                    initial={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.9, y: 10, originX: isUser ? 1 : 0, originY: 1 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 450, damping: 25 }}
                  >
                    {showTime && msg.time && (
                      <div style={{
                        textAlign: "center",
                        fontSize: "11px",
                        color: "rgba(255,255,255,0.35)",
                        fontWeight: 400,
                        padding: "4px 0 2px",
                      }}>
                        {msg.time}
                      </div>
                    )}
                    <div style={{
                      display: "flex",
                      justifyContent: isUser ? "flex-end" : "flex-start",
                    }}>
                      <div style={{
                        maxWidth: "78%",
                        padding: "9px 14px",
                        borderRadius: isUser
                          ? "18px 18px 4px 18px"
                          : "18px 18px 18px 4px",
                        background: isSystem
                          ? "rgba(255,59,48,0.15)"
                          : isUser
                            ? "#0A84FF"
                            : "#2C2C2E",
                        color: isSystem ? "#FF6961" : "white",
                        fontSize: "15px",
                        fontWeight: 400,
                        lineHeight: "1.38",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        border: isSystem ? "1px solid rgba(255,59,48,0.3)" : "none",
                      }}>
                        {msg.content}
                      </div>
                    </div>
                    {/* Delivered indicator on last user message */}
                    {isUser && index === messages.length - 1 && !isLoading && (
                      <div style={{
                        textAlign: "right",
                        fontSize: "10px",
                        color: "rgba(255,255,255,0.3)",
                        fontWeight: 400,
                        paddingRight: "4px",
                        marginTop: "-2px",
                      }}>
                        Delivered
                      </div>
                    )}
                  </motion.div>
                );
              })}

              {/* Typing Indicator */}
              {isLoading && (
                <div style={{ display: "flex", justifyContent: "flex-start" }}>
                  <div style={{
                    padding: "12px 18px",
                    borderRadius: "18px 18px 18px 4px",
                    background: "#2C2C2E",
                    display: "flex",
                    gap: "4px",
                    alignItems: "center",
                  }}>
                    <div className="ios-typing-dot" style={{ animationDelay: "0ms" }}/>
                    <div className="ios-typing-dot" style={{ animationDelay: "150ms" }}/>
                    <div className="ios-typing-dot" style={{ animationDelay: "300ms" }}/>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* ---- Suggestions ---- */}
            <AnimatePresence>
              {!isBanned && !input && !isLoading && (messages.length <= 2 || dynamicSuggestions.length > 0) && (
                <motion.div 
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ type: "spring", stiffness: 300, damping: 24 }}
                  ref={suggestionsCallbackRef}
                  style={{
                    padding: "4px 12px 12px 12px",
                    display: "flex",
                    overflowX: "auto",
                    gap: "8px",
                    background: "transparent",
                  }}
                  className="phone-msg-scroll"
                >
                  {(dynamicSuggestions.length > 0 ? dynamicSuggestions : CONVERSATION_STARTERS).map((starter) => (
                    <button
                      key={starter}
                      disabled={isLoading || isBanned}
                      onClick={() => handleSendMessage(starter)}
                      style={{
                        padding: "6px 14px",
                        border: "1px solid rgba(255,255,255,0.04)",
                        borderRadius: "18px",
                        background: "rgba(255,255,255,0.07)",
                        color: "rgba(255,255,255,0.55)",
                        fontSize: "13px",
                        fontWeight: 400,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        fontFamily: IOS_FONT,
                        transition: "all 150ms ease",
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = "rgba(255,255,255,0.15)";
                        e.currentTarget.style.color = "rgba(255,255,255,0.9)";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = "rgba(255,255,255,0.07)";
                        e.currentTarget.style.color = "rgba(255,255,255,0.55)";
                      }}
                    >
                      {starter}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* ---- Input / Compose Bar ---- */}
            <div style={{
              padding: "8px 10px 6px",
              display: "flex",
              alignItems: "flex-end",
              gap: "8px",
              borderTop: "0.5px solid rgba(255,255,255,0.08)",
              background: "rgba(28,28,30,0.95)",
              backdropFilter: "blur(20px)",
            }}>
              <div style={{
                flex: 1,
                position: "relative",
                border: isFocused ? "1px solid rgba(10, 132, 255, 0.6)" : "1px solid rgba(255,255,255,0.18)",
                boxShadow: isFocused ? "0 0 0 3px rgba(10, 132, 255, 0.15)" : "none",
                borderRadius: "20px",
                background: "rgba(255,255,255,0.06)",
                display: "flex",
                alignItems: "center",
                transition: "all 0.2s ease",
              }}>
                <textarea
                  disabled={isBanned || isLoading}
                  value={input}
                  onChange={(e) => setInput(e.target.value.substring(0, 400))}
                  onKeyDown={handleKeyPress}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder={isBanned ? "Blocked" : "iMessage"}
                  rows={1}
                  style={{
                    width: "100%",
                    background: "transparent",
                    border: "none",
                    padding: "8px 14px",
                    color: "white",
                    fontSize: "15px",
                    fontWeight: 400,
                    resize: "none",
                    outline: "none",
                    fontFamily: IOS_FONT,
                    lineHeight: "1.3",
                    maxHeight: "80px",
                  }}
                />
              </div>

              {/* Send Button (iOS style arrow-up circle) */}
              <motion.button
                whileTap={{ scale: 0.85 }}
                disabled={isLoading || isBanned || !input.trim()}
                onClick={() => handleSendMessage(input)}
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "50%",
                  border: "none",
                  background: isLoading || isBanned || !input.trim() ? "rgba(255,255,255,0.08)" : "#0A84FF",
                  color: "white",
                  cursor: isLoading || isBanned || !input.trim() ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "background 150ms ease",
                  marginBottom: "1px",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M12 20V4M12 4L6 10M12 4L18 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </motion.button>
            </div>

            {/* ---- Home Indicator Bar ---- */}
            <div style={{
              height: "28px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(28,28,30,0.95)",
            }}>
              <div style={{
                width: "120px",
                height: "5px",
                background: "rgba(255,255,255,0.2)",
                borderRadius: "3px",
              }}/>
            </div>
          </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Embedded Styles */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        .ios-typing-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: rgba(255,255,255,0.4);
          animation: ios-typing 1.2s infinite ease-in-out;
        }
        @keyframes ios-typing {
          0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
          30% { opacity: 1; transform: translateY(-4px); }
        }

        .eye-blink {
          animation: blink-anim 4s infinite;
          transform-origin: center;
        }
        @keyframes blink-anim {
          0%, 92%, 98%, 100% { transform: scaleY(1); }
          95% { transform: scaleY(0.1); }
        }

        .phone-msg-scroll::-webkit-scrollbar {
          width: 0;
          height: 0;
        }
        .phone-msg-scroll {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        @media (max-width: 640px) {
          .phone-messenger-root {
            right: 0 !important;
            bottom: 0 !important;
          }
          .phone-frame {
            width: 100vw !important;
            height: 100dvh !important;
            border-radius: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </>
  );
}
