'use client'

import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { processMessage } from '@/lib/chat/engine'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface ChatPanelProps {
  open: boolean
  onClose: () => void
}

// ── Suggested questions ───────────────────────────────────────────────────────

const SUGGESTIONS = [
  'Apa best seller minggu ini?',
  'Toko mana yang perlu perhatian?',
  'Ringkasan bisnis minggu ini',
]

// ── Typing indicator ──────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 mb-4">
      <div className="w-7 h-7 rounded-full bg-hd-burgundy/10 flex items-center justify-center flex-shrink-0">
        <span className="text-xs text-hd-burgundy">✦</span>
      </div>
      <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
        <span className="flex items-center gap-1 h-4">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s`, animationDuration: '0.8s' }}
            />
          ))}
        </span>
      </div>
      <p className="text-xs text-gray-400 self-end pb-1">HD Insights sedang mengetik...</p>
    </div>
  )
}

// ── Message bubble ────────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'

  // Render newlines as line breaks
  const parts = message.content.split('\n')

  return (
    <div className={`flex items-end gap-2 mb-4 ${isUser ? 'flex-row-reverse' : ''}`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-hd-burgundy/10 flex items-center justify-center flex-shrink-0">
          <span className="text-xs text-hd-burgundy">✦</span>
        </div>
      )}
      <div
        className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
          isUser
            ? 'bg-hd-burgundy text-white rounded-br-sm'
            : 'bg-white border border-gray-100 text-hd-dark rounded-bl-sm'
        }`}
      >
        {parts.map((line, i) => (
          <span key={i}>
            {line}
            {i < parts.length - 1 && <br />}
          </span>
        ))}
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ChatPanel({ open, onClose }: ChatPanelProps) {
  const [messages, setMessages]   = useState<Message[]>([])
  const [input, setInput]         = useState('')
  const [isTyping, setIsTyping]   = useState(false)
  const bottomRef                 = useRef<HTMLDivElement>(null)
  const inputRef                  = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // Focus input when panel opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 200)
    }
  }, [open])

  const sendMessage = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || isTyping) return

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: trimmed,
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    try {
      const response = await processMessage(trimmed)
      const assistantMsg: Message = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: response,
      }
      setMessages((prev) => [...prev, assistantMsg])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `a-err-${Date.now()}`,
          role: 'assistant',
          content: 'Maaf, terjadi kesalahan. Silakan coba lagi.',
        },
      ])
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const hasMessages = messages.length > 0

  return (
    <>
      {/* Backdrop (mobile only) */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={`
          fixed z-50 bg-white shadow-2xl flex flex-col
          /* Mobile: slide-up drawer */
          bottom-0 left-0 right-0 rounded-t-2xl
          /* Desktop: side panel */
          md:bottom-0 md:left-auto md:right-0 md:top-0 md:rounded-none md:rounded-l-2xl md:w-[380px]
          transition-transform duration-300 ease-out
          ${open
            ? 'translate-y-0 md:translate-x-0'
            : 'translate-y-full md:translate-y-0 md:translate-x-full'
          }
        `}
        style={{ height: open ? undefined : undefined }}
      >
        {/* Mobile height constraint */}
        <div className="flex flex-col h-[70vh] md:h-screen">

          {/* ── Header ── */}
          <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-hd-burgundy flex items-center justify-center">
                <span className="text-white text-sm">✦</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-hd-dark leading-tight">HD Insights</h3>
                <p className="text-xs text-gray-400 leading-tight">Powered by AI</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors text-gray-500"
              aria-label="Tutup"
            >
              ✕
            </button>
          </div>

          {/* ── Messages ── */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {!hasMessages && !isTyping && (
              <div className="h-full flex flex-col items-center justify-center text-center px-4">
                <div className="w-14 h-14 rounded-full bg-hd-burgundy/10 flex items-center justify-center mb-3">
                  <span className="text-2xl text-hd-burgundy">✦</span>
                </div>
                <h4 className="font-semibold text-hd-dark mb-1">Tanya HD Insights</h4>
                <p className="text-xs text-gray-400 mb-5 leading-relaxed">
                  Analisis data bisnis Häagen-Dazs Indonesia dalam hitungan detik.
                </p>

                {/* Suggestion chips */}
                <div className="flex flex-col gap-2 w-full max-w-[260px]">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      className="text-xs text-left px-4 py-2.5 rounded-xl border border-hd-burgundy/30 text-hd-burgundy hover:bg-hd-burgundy hover:text-white transition-colors font-medium"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {hasMessages && (
              <div>
                {messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} />
                ))}
                {isTyping && <TypingIndicator />}
                <div ref={bottomRef} />
              </div>
            )}

            {!hasMessages && isTyping && (
              <div>
                <TypingIndicator />
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          {/* ── Input ── */}
          <div className="flex-shrink-0 border-t border-gray-100 px-4 py-3">
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Tanya sesuatu..."
                disabled={isTyping}
                className="flex-1 bg-transparent text-sm text-hd-dark placeholder:text-gray-400 focus:outline-none disabled:opacity-50"
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isTyping}
                className="w-8 h-8 rounded-lg bg-hd-burgundy text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-hd-burgundy-dark active:scale-95 transition-all flex-shrink-0"
                aria-label="Kirim"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 7H13M13 7L7.5 1.5M13 7L7.5 12.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
