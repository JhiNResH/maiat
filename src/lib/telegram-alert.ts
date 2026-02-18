/**
 * Telegram Alert System
 * Sends notifications to @maiatalerts when projects need reviews
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8320745684:AAE4diIOwF7XE24gPqQtF6oAkP6z3RZqmAw'
const ALERT_CHAT_ID = process.env.TELEGRAM_ALERT_CHAT_ID || '@maiatalerts'

export async function sendAlert(text: string, parseMode: string = 'HTML'): Promise<boolean> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: ALERT_CHAT_ID,
        text,
        parse_mode: parseMode,
        disable_web_page_preview: true,
      }),
    })
    const data = await res.json()
    return data.ok === true
  } catch (err) {
    console.error('[telegram-alert] Failed to send:', err)
    return false
  }
}

export async function sendReviewNeededAlert(
  projectName: string,
  trustScore: number,
  reviewCount: number,
  projectSlug?: string,
  queriedBy?: string
): Promise<boolean> {
  const needed = Math.max(0, 5 - reviewCount)
  const slug = projectSlug || projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const text = [
    `⚡ <b>${projectName}</b> was just queried!`,
    ``,
    `📊 Trust Score: <b>${trustScore}</b> | Reviews: <b>${reviewCount}</b>/5`,
    `✍️ ${needed} more review${needed !== 1 ? 's' : ''} needed for accurate scoring`,
    ``,
    `🪲 Write a review and earn <b>10 Scarab</b>`,
    queriedBy ? `\n🤖 Queried by: <code>${queriedBy}</code>` : '',
  ].filter(Boolean).join('\n')

  return sendAlertWithButton(text, `✍️ Review ${projectName}`, `https://t.me/MaiatBot?start=review_${slug}`)
}

export async function sendAlertWithButton(text: string, buttonText: string, buttonUrl: string): Promise<boolean> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: ALERT_CHAT_ID,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        reply_markup: {
          inline_keyboard: [[{ text: buttonText, url: buttonUrl }]],
        },
      }),
    })
    const data = await res.json()
    return data.ok === true
  } catch (err) {
    console.error('[telegram-alert] Failed to send:', err)
    return false
  }
}

export async function sendNewReviewAlert(
  projectName: string,
  rating: number,
  reviewerAddress: string,
  newTrustScore: number
): Promise<boolean> {
  const stars = '⭐'.repeat(rating) + '☆'.repeat(5 - rating)
  const text = [
    `📝 New review on <b>${projectName}</b>`,
    ``,
    `${stars} (${rating}/5)`,
    `👤 By: <code>${reviewerAddress.slice(0, 6)}...${reviewerAddress.slice(-4)}</code>`,
    `📊 Updated Trust Score: <b>${newTrustScore}</b>`,
  ].join('\n')

  return sendAlert(text)
}
