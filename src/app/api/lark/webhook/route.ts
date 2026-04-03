/**
 * Lark Webhook Handler
 *
 * Handles three types of events:
 *   1. URL verification challenge (during bot setup)
 *   2. im.message.receive_v1 â Putra posts sprint brief in PM group
 *   3. card.action.trigger â Putra taps APPROVE or REVISE on the card
 */

import { NextRequest, NextResponse } from 'next/server'
import { runPMAgent, handleApprove, handleRevise } from '@/lib/lark/pm-agent'
import { sendText } from '@/lib/lark/client'

/** Lark sends this for URL verification during bot setup */
interface LarkChallenge {
  challenge: string
  token: string
  type: 'url_verification'
}

/** Lark message event */
interface LarkMessageEvent {
  schema: string
  header: {
    event_type: string
    token: string
  }
  event: {
    message: {
      message_id: string
      chat_id: string
      chat_type: string
      message_type: string
      content: string   // JSON string: {"text": "..."}
    }
    sender: {
      sender_id: {
        open_id: string
        user_id: string
      }
      sender_type: string
    }
  }
}

/** Lark card action event */
interface LarkCardAction {
  open_id: string
  action: {
    value: {
      action: 'approve' | 'revise_prompt'
      sprint_id: string
    }
    tag: string
  }
  challenge?: string
}

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const verificationToken = process.env.LARK_VERIFICATION_TOKEN

  // ââ 1. URL Verification (one-time setup) ââ
  const challenge = body as LarkChallenge
  if (challenge?.type === 'url_verification') {
    if (verificationToken && challenge.token !== verificationToken) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
    return NextResponse.json({ challenge: challenge.challenge })
  }

  // ââ 2. Card action challenge (Lark sends challenge on first card action) ââ
  const cardChallenge = body as LarkCardAction
  if (cardChallenge?.challenge && cardChallenge?.action) {
    return NextResponse.json({ challenge: cardChallenge.challenge })
  }

  // ââ 3. Card action â APPROVE or REVISE ââ
  if (cardChallenge?.action?.value?.sprint_id) {
    const { action, sprint_id } = cardChallenge.action.value

    if (action === 'approve') {
      // Fire and forget â don't block the webhook response
      runPMAgent_approve(sprint_id)
      return NextResponse.json({ toast: { type: 'info', content: 'â Sprint approved! Agents mulai coding...' } })
    }

    if (action === 'revise_prompt') {
      // For revise, we need feedback from Putra â ask them to reply
      // In a real setup you'd show a form; for MVP we ask them to DM feedback
      runPMAgent_revise(sprint_id, '')
      return NextResponse.json({ toast: { type: 'info', content: 'âï¸ Sprint dikembalikan. Kirim feedback kamu di grup PM!' } })
    }
  }

  // ââ 4. Bot added to group event ââ (fires when Putra adds the bot via desktop app)
  const anyEvent = body as { header?: { event_type?: string }; event?: { chat_id?: string; name?: string } }
  if (anyEvent?.header?.event_type === 'im.chat.member.bot.added_v1') {
    const chatId = anyEvent.event?.chat_id
    const chatName = anyEvent.event?.name ?? 'Unknown Group'
    console.log(`[Webhook] Bot added to group: ${chatName} (chat_id: ${chatId})`)
    if (chatId) {
      sendText(
        chatId,
        `ð¤ *HD App Notifier siap di grup ini!*\n\n` +
        `ð *Chat ID grup ini:*\n\`${chatId}\`\n\n` +
        `ð  Grup: ${chatName}\n\n` +
        `_Salin Chat ID di atas dan simpan ke Vercel env vars sebagai LARK_CHAT_* ya, Putra!_`
      ).catch(err => console.error('[Webhook] bot_added sendText error:', err))
    }
    return NextResponse.json({ ok: true })
  }

  // ââ 5. Message receive event ââ
  const msgEvent = body as LarkMessageEvent
  if (msgEvent?.header?.event_type === 'im.message.receive_v1') {
    const { message } = msgEvent.event

    // Only handle text messages
    if (message.message_type !== 'text') {
      return NextResponse.json({ ok: true })
    }

    // Verify token
    if (verificationToken && msgEvent.header.token !== verificationToken) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Parse text content
    let text = ''
    try {
      const parsed = JSON.parse(message.content) as { text?: string }
      text = parsed.text?.trim() ?? ''
    } catch {
      return NextResponse.json({ ok: true })
    }

    if (!text) return NextResponse.json({ ok: true })

    // Check if message is from the PM group
    const pmChatId = process.env.LARK_CHAT_PM
    if (!pmChatId || message.chat_id !== pmChatId) {
      // Not from PM group â ignore
      return NextResponse.json({ ok: true })
    }

    // Commands
    if (text.toLowerCase().startsWith('/sprint ') || text.toLowerCase().startsWith('sprint:')) {
      const brief = text.replace(/^\/sprint\s+/i, '').replace(/^sprint:\s*/i, '')
      if (brief.length < 10) {
        return NextResponse.json({ ok: true })
      }
      // Kick off PM agent (fire and forget, respond to Lark quickly)
      runPMAgent_safe(brief, pmChatId)
      return NextResponse.json({ ok: true })
    }

    // If it's just a plain message (no command prefix) AND it's in PM group,
    // treat the whole message as a sprint brief if it's substantial
    if (text.length > 30 && !text.startsWith('/')) {
      runPMAgent_safe(text, pmChatId)
    }

    return NextResponse.json({ ok: true })
  }

  // Unknown event type â return 200 to avoid Lark retries
  return NextResponse.json({ ok: true })
}

/** GET handler for health check */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'HD App Lark Webhook',
    timestamp: new Date().toISOString(),
  })
}

// ââ Fire-and-forget wrappers (don't block webhook response) ââ

function runPMAgent_safe(brief: string, pmChatId: string) {
  runPMAgent(brief, pmChatId).catch(err => {
    console.error('[PM Agent] Error:', err)
  })
}

function runPMAgent_approve(sprintId: string) {
  handleApprove(sprintId).catch(err => {
    console.error('[PM Agent] Approve error:', err)
  })
}

function runPMAgent_revise(sprintId: string, feedback: string) {
  handleRevise(sprintId, feedback).catch(err => {
    console.error('[PM Agent] Revise error:', err)
  })
}
/**
 * Lark Webhook Handler
 *
 * Handles three types of events:
 *   1. URL verification challenge (during bot setup)
 *   2. im.message.receive_v1 — Putra posts sprint brief in PM group
 *   3. card.action.trigger — Putra taps APPROVE or REVISE on the card
 */

import { NextRequest, NextResponse } from 'next/server'
import { runPMAgent, handleApprove, handleRevise } from '@/lib/lark/pm-agent'

/** Lark sends this for URL verification during bot setup */
interface LarkChallenge {
  challenge: string
  token: string
  type: 'url_verification'
}

/** Lark message event */
interface LarkMessageEvent {
  schema: string
  header: {
    event_type: string
    token: string
  }
  event: {
    message: {
      message_id: string
      chat_id: string
      chat_type: string
      message_type: string
      content: string   // JSON string: {"text": "..."}
    }
    sender: {
      sender_id: {
        open_id: string
        user_id: string
      }
      sender_type: string
    }
  }
}

/** Lark card action event */
interface LarkCardAction {
  open_id: string
  action: {
    value: {
      action: 'approve' | 'revise_prompt'
      sprint_id: string
    }
    tag: string
  }
  challenge?: string
}

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const verificationToken = process.env.LARK_VERIFICATION_TOKEN

  // ── 1. URL Verification (one-time setup) ──
  const challenge = body as LarkChallenge
  if (challenge?.type === 'url_verification') {
    if (verificationToken && challenge.token !== verificationToken) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
    return NextResponse.json({ challenge: challenge.challenge })
  }

  // ── 2. Card action challenge (Lark sends challenge on first card action) ──
  const cardChallenge = body as LarkCardAction
  if (cardChallenge?.challenge && cardChallenge?.action) {
    return NextResponse.json({ challenge: cardChallenge.challenge })
  }

  // ── 3. Card action — APPROVE or REVISE ──
  if (cardChallenge?.action?.value?.sprint_id) {
    const { action, sprint_id } = cardChallenge.action.value

    if (action === 'approve') {
      // Fire and forget — don't block the webhook response
      runPMAgent_approve(sprint_id)
      return NextResponse.json({ toast: { type: 'info', content: '✅ Sprint approved! Agents mulai coding...' } })
    }

    if (action === 'revise_prompt') {
      // For revise, we need feedback from Putra — ask them to reply
      // In a real setup you'd show a form; for MVP we ask them to DM feedback
      runPMAgent_revise(sprint_id, '')
      return NextResponse.json({ toast: { type: 'info', content: '✏️ Sprint dikembalikan. Kirim feedback kamu di grup PM!' } })
    }
  }

  // ── 4. Message receive event ──
  const msgEvent = body as LarkMessageEvent
  if (msgEvent?.header?.event_type === 'im.message.receive_v1') {
    const { message } = msgEvent.event

    // Only handle text messages
    if (message.message_type !== 'text') {
      return NextResponse.json({ ok: true })
    }

    // Verify token
    if (verificationToken && msgEvent.header.token !== verificationToken) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Parse text content
    let text = ''
    try {
      const parsed = JSON.parse(message.content) as { text?: string }
      text = parsed.text?.trim() ?? ''
    } catch {
      return NextResponse.json({ ok: true })
    }

    if (!text) return NextResponse.json({ ok: true })

    // Check if message is from the PM group
    const pmChatId = process.env.LARK_CHAT_PM
    if (!pmChatId || message.chat_id !== pmChatId) {
      // Not from PM group — ignore
      return NextResponse.json({ ok: true })
    }

    // Commands
    if (text.toLowerCase().startsWith('/sprint ') || text.toLowerCase().startsWith('sprint:')) {
      const brief = text.replace(/^\/sprint\s+/i, '').replace(/^sprint:\s*/i, '')
      if (brief.length < 10) {
        return NextResponse.json({ ok: true })
      }
      // Kick off PM agent (fire and forget, respond to Lark quickly)
      runPMAgent_safe(brief, pmChatId)
      return NextResponse.json({ ok: true })
    }

    // If it's just a plain message (no command prefix) AND it's in PM group,
    // treat the whole message as a sprint brief if it's substantial
    if (text.length > 30 && !text.startsWith('/')) {
      runPMAgent_safe(text, pmChatId)
    }

    return NextResponse.json({ ok: true })
  }

  // Unknown event type — return 200 to avoid Lark retries
  return NextResponse.json({ ok: true })
}

/** GET handler for health check */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'HD App Lark Webhook',
    timestamp: new Date().toISOString(),
  })
}

// ── Fire-and-forget wrappers (don't block webhook response) ──

function runPMAgent_safe(brief: string, pmChatId: string) {
  runPMAgent(brief, pmChatId).catch(err => {
    console.error('[PM Agent] Error:', err)
  })
}

function runPMAgent_approve(sprintId: string) {
  handleApprove(sprintId).catch(err => {
    console.error('[PM Agent] Approve error:', err)
  })
}

function runPMAgent_revise(sprintId: string, feedback: string) {
  handleRevise(sprintId, feedback).catch(err => {
    console.error('[PM Agent] Revise error:', err)
  })
}
