/**
 * Lark / Feishu API Client
 * Handles: access token caching, send text, send interactive card
 */

const LARK_BASE = 'https://open.larksuite.com/open-apis'

let cachedToken: string | null = null
let tokenExpiresAt = 0

/** Get (or refresh) the tenant access token */
export async function getLarkToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt - 60_000) return cachedToken

  const res = await fetch(`${LARK_BASE}/auth/v3/tenant_access_token/internal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      app_id: process.env.LARK_APP_ID,
      app_secret: process.env.LARK_APP_SECRET,
    }),
  })
  const data = await res.json()
  if (data.code !== 0) throw new Error(`Lark token error: ${data.msg}`)
  cachedToken = data.tenant_access_token
  tokenExpiresAt = Date.now() + data.expire * 1000
  return cachedToken!
}

/** Send a plain text message to a chat */
export async function sendText(chatId: string, text: string) {
  const token = await getLarkToken()
  const res = await fetch(`${LARK_BASE}/im/v1/messages?receive_id_type=chat_id`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      receive_id: chatId,
      msg_type: 'text',
      content: JSON.stringify({ text }),
    }),
  })
  return res.json()
}

/** Send an interactive card message to a chat */
export async function sendCard(chatId: string, card: object) {
  const token = await getLarkToken()
  const res = await fetch(`${LARK_BASE}/im/v1/messages?receive_id_type=chat_id`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      receive_id: chatId,
      msg_type: 'interactive',
      content: JSON.stringify(card),
    }),
  })
  return res.json()
}

/** Update an existing card (for approve/revise state change) */
export async function updateCard(messageId: string, card: object) {
  const token = await getLarkToken()
  const res = await fetch(`${LARK_BASE}/im/v1/messages/${messageId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      msg_type: 'interactive',
      content: JSON.stringify(card),
    }),
  })
  return res.json()
}

/** Reply to a message thread */
export async function replyText(messageId: string, text: string) {
  const token = await getLarkToken()
  const res = await fetch(`${LARK_BASE}/im/v1/messages/${messageId}/reply`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      msg_type: 'text',
      content: JSON.stringify({ text }),
    }),
  })
  return res.json()
}

/** Lark card builder helpers */
export function buildApprovalCard(params: {
  sprintId: string
  summary: string
  tasksMarkdown: string
  risks: string
}): object {
  return {
    config: { wide_screen_mode: true },
    header: {
      title: { content: '📋 Sprint Brief — Menunggu Approval Kamu', tag: 'plain_text' },
      template: 'blue',
    },
    elements: [
      {
        tag: 'div',
        text: {
          content: `**Ringkasan Sprint:**\n${params.summary}`,
          tag: 'lark_md',
        },
      },
      { tag: 'hr' },
      {
        tag: 'div',
        text: {
          content: `**Task Breakdown:**\n${params.tasksMarkdown}`,
          tag: 'lark_md',
        },
      },
      ...(params.risks
        ? [
            { tag: 'hr' },
            {
              tag: 'div',
              text: {
                content: `⚠️ **Risiko / Blocker:**\n${params.risks}`,
                tag: 'lark_md',
              },
            },
          ]
        : []),
      { tag: 'hr' },
      {
        tag: 'action',
        actions: [
          {
            tag: 'button',
            text: { content: '✅  APPROVE — Lanjut Coding', tag: 'plain_text' },
            type: 'primary',
            value: { action: 'approve', sprint_id: params.sprintId },
          },
          {
            tag: 'button',
            text: { content: '✏️  REVISE — Ada yang perlu diubah', tag: 'plain_text' },
            type: 'default',
            value: { action: 'revise_prompt', sprint_id: params.sprintId },
          },
        ],
      },
    ],
  }
}

export function buildApprovedCard(summary: string): object {
  return {
    config: { wide_screen_mode: true },
    header: {
      title: { content: '✅ Sprint APPROVED — Agents sudah mulai coding!', tag: 'plain_text' },
      template: 'green',
    },
    elements: [
      {
        tag: 'div',
        text: { content: summary, tag: 'lark_md' },
      },
    ],
  }
}

export function buildRevisedCard(feedback: string): object {
  return {
    config: { wide_screen_mode: true },
    header: {
      title: { content: '✏️ Sprint dikembalikan untuk revisi', tag: 'plain_text' },
      template: 'yellow',
    },
    elements: [
      {
        tag: 'div',
        text: { content: `**Feedback:**\n${feedback}`, tag: 'lark_md' },
      },
    ],
  }
}
