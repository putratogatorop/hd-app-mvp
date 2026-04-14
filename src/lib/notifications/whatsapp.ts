/**
 * WhatsApp notification stub.
 *
 * Not active until WHATSAPP_API_TOKEN + WHATSAPP_API_URL are set in env.
 * Recommended providers for ID: Fonnte (https://fonnte.com), WatZap.
 *
 * When active: called from placeOrder() after a gift order is created,
 * sends recipient a WhatsApp with their personal note + tracking link.
 */

export interface SendGiftNotificationInput {
  recipientPhone: string
  recipientName: string
  senderName?: string
  giftMessage?: string
  giftToken: string // for /gift/[token] receipt URL
  appBaseUrl: string
}

export async function sendGiftNotification(
  input: SendGiftNotificationInput
): Promise<{ ok: boolean; reason?: string }> {
  const token = process.env.WHATSAPP_API_TOKEN
  const url = process.env.WHATSAPP_API_URL

  if (!token || !url) {
    return { ok: false, reason: 'WhatsApp provider not configured' }
  }

  const receiptUrl = `${input.appBaseUrl}/gift/${input.giftToken}`
  const sender = input.senderName ?? 'Someone special'
  const message = [
    `Halo ${input.recipientName}! 🎁`,
    ``,
    `${sender} sent you a gift from Häagen-Dazs.`,
    input.giftMessage ? `\n"${input.giftMessage}"\n` : '',
    `Track your gift: ${receiptUrl}`,
  ]
    .filter(Boolean)
    .join('\n')

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token,
      },
      body: JSON.stringify({
        target: input.recipientPhone,
        message,
      }),
    })
    if (!res.ok) {
      return { ok: false, reason: `Provider returned ${res.status}` }
    }
    return { ok: true }
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : 'Unknown error' }
  }
}
