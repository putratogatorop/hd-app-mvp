'use client'

import { useState, useRef, useEffect, useCallback, KeyboardEvent } from 'react'
import { processMessage } from '@/lib/chat/engine'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean
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
  'Bandingkan revenue minggu ini vs minggu lalu',
  'Berapa ROI voucher FREEONGKIR?',
]

// ── Blinking cursor ──────────────────────────────────────────────────────────

function BlinkingCursor() {
  return (
    <span className="inline-block w-[2px] h-[14px] bg-hd-burgundy ml-0.5 align-middle animate-pulse" />
  )
}

// ── Thinking indicator ───────────────────────────────────────────────────────

function ThinkingIndicator() {
  return (
    <div className="flex items-end gap-2 mb-4">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-hd-burgundy to-hd-burgundy-dark flex items-center justify-center flex-shrink-0 shadow-sm">
        <span className="text-sm text-white">✦</span>
      </div>
      <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 h-4">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-hd-burgundy/60 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s`, animationDuration: '0.6s' }}
              />
            ))}
          </span>
          <span className="text-xs text-gray-400 italic">Menganalisis data...</span>
        </div>
      </div>
    </div>
  )
}

// ── Message bubble ────────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'
  const parts = message.content.split('\n')

  return (
    <div className={`flex items-end gap-2 mb-4 ${isUser ? 'flex-row-reverse' : ''}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-hd-burgundy to-hd-burgundy-dark flex items-center justify-center flex-shrink-0 shadow-sm">
          <span className="text-sm text-white">✦</span>
        </div>
      )}
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-hd-dark flex items-center justify-center flex-shrink-0">
          <span className="text-xs text-white font-bold">You</span>
        </div>
      )}
      <div
        className={`max-w-[82%] px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? 'bg-hd-burgundy text-white rounded-2xl rounded-br-sm shadow-sm'
            : 'bg-white border border-gray-100 text-hd-dark rounded-2xl rounded-bl-sm shadow-sm'
        }`}
      >
        {parts.map((line, i) => (
          <span key={i}>
            {line}
            {i < parts.length - 1 && <br />}
          </span>
        ))}
        {message.isStreaming && <BlinkingCursor />}
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ChatPanel({ open, onClose }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const streamRef = useRef<NodeJS.Timeout | null>(null)

  const isBusy = isThinking || isStreaming

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isThinking])

  // Focus input when panel opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300)
  }, [open])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) clearInterval(streamRef.current)
    }
  }, [])

  const streamResponse = useCallback((fullText: string) => {
    const msgId = `a-${Date.now()}`
    let charIndex = 0

    // Add empty streaming message
    setMessages(prev => [...prev, {
      id: msgId,
      role: 'assistant',
      content: '',
      isStreaming: true,
    }])
    setIsStreaming(true)

    // Stream characters at variable speed
    const stream = () => {
      // Determine chunk size — faster for common chars, pause at newlines
      let chunkSize = 1
      const currentChar = fullText[charIndex]

      // Speed up: 2-4 chars at a time for regular text
      if (currentChar !== '\n' && currentChar !== '💡' && currentChar !== '📊') {
        chunkSize = Math.min(2 + Math.floor(Math.random() * 3), fullText.length - charIndex)
      }

      charIndex += chunkSize
      const currentContent = fullText.slice(0, charIndex)

      setMessages(prev =>
        prev.map(m =>
          m.id === msgId
            ? { ...m, content: currentContent, isStreaming: charIndex < fullText.length }
            : m
        )
      )

      if (charIndex >= fullText.length) {
        if (streamRef.current) clearInterval(streamRef.current)
        streamRef.current = null
        setIsStreaming(false)
      }
    }

    // Variable speed: 15-35ms per tick (feels like fast human typing)
    streamRef.current = setInterval(stream, 20)
  }, [])

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || isBusy) return

    // Add user message
    setMessages(prev => [...prev, {
      id: `u-${Date.now()}`,
      role: 'user',
      content: trimmed,
    }])
    setInput('')

    // Show "thinking" for 600-1200ms (randomized for realism)
    setIsThinking(true)
    const thinkTime = 600 + Math.random() * 600
    await new Promise(resolve => setTimeout(resolve, thinkTime))
    setIsThinking(false)

    // Get response and stream it
    try {
      const response = processMessage(trimmed)
      streamResponse(response)
    } catch {
      setMessages(prev => [...prev, {
        id: `a-err-${Date.now()}`,
        role: 'assistant',
        content: 'Maaf, terjadi kesalahan. Silakan coba lagi.',
      }])
    }
  }, [isBusy, streamResponse])

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const hasMessages = messages.length > 0

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:bg-black/20"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={`
          fixed z-50 bg-white shadow-2xl flex flex-col
          bottom-0 left-0 right-0 rounded-t-2xl
          md:bottom-0 md:left-auto md:right-0 md:top-0 md:rounded-none md:rounded-l-2xl md:w-[400px]
          transition-all duration-300 ease-out
          ${open
            ? 'translate-y-0 md:translate-x-0 opacity-100'
            : 'translate-y-full md:translate-y-0 md:translate-x-full opacity-0'
          }
        `}
      >
        <div className="flex flex-col h-[75vh] md:h-screen">

          {/* ── Header ── */}
          <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-white to-gray-50/50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-hd-burgundy to-hd-burgundy-dark flex items-center justify-center shadow-md">
                <span className="text-white text-sm">✦</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-hd-dark leading-tight">HD Insights</h3>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-[11px] text-gray-400 leading-tight">AI-powered analytics</p>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors text-gray-500 text-sm"
            >
              ✕
            </button>
          </div>

          {/* ── Messages ── */}
          <div className="flex-1 overflow-y-auto px-4 py-4 bg-gray-50/50">
            {!hasMessages && !isThinking && (
              <div className="h-full flex flex-col items-center justify-center text-center px-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-hd-burgundy to-hd-burgundy-dark flex items-center justify-center mb-4 shadow-lg">
                  <span className="text-2xl text-white">✦</span>
                </div>
                <h4 className="font-bold text-hd-dark mb-1">HD Insights</h4>
                <p className="text-xs text-gray-400 mb-6 leading-relaxed max-w-[240px]">
                  Tanya apapun tentang bisnis Häagen-Dazs. Saya menganalisis data real-time untuk membantu keputusan Anda.
                </p>

                {/* Suggestion chips */}
                <div className="flex flex-col gap-2 w-full max-w-[280px]">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      className="text-xs text-left px-4 py-3 rounded-xl border border-gray-200 text-hd-dark hover:border-hd-burgundy hover:bg-hd-burgundy/5 transition-all font-medium group"
                    >
                      <span className="text-hd-burgundy mr-2 opacity-50 group-hover:opacity-100">→</span>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {(hasMessages || isThinking) && (
              <div>
                {messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} />
                ))}
                {isThinking && <ThinkingIndicator />}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          {/* ── Input ── */}
          <div className="flex-shrink-0 border-t border-gray-100 px-4 py-3 bg-white">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus-within:border-hd-burgundy focus-within:ring-1 focus-within:ring-hd-burgundy/20 transition-all">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isBusy ? 'Menunggu respons...' : 'Tanya tentang bisnis...'}
                disabled={isBusy}
                className="flex-1 bg-transparent text-sm text-hd-dark placeholder:text-gray-400 focus:outline-none disabled:opacity-50"
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isBusy}
                className="w-8 h-8 rounded-lg bg-hd-burgundy text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-hd-burgundy-dark active:scale-95 transition-all flex-shrink-0"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 7H13M13 7L7.5 1.5M13 7L7.5 12.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            <p className="text-[10px] text-gray-300 text-center mt-2">HD Insights dapat membuat kesalahan. Verifikasi data penting.</p>
          </div>

        </div>
      </div>
    </>
  )
}
