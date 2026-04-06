import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { token, length, count, useUnderscore, useDot } = await req.json()
    
    if (!token) {
      return NextResponse.json({ error: 'التوكن مطلوب', invalidToken: true }, { status: 400 })
    }

    // ═══════════════════════════════════════════════════════════════
    // 🔐 التحقق من التوكن
    // ═══════════════════════════════════════════════════════════════
    
    const userRes = await fetch('https://discord.com/api/v10/users/@me', {
      method: 'GET',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      }
    })

    if (userRes.status === 401) {
      return NextResponse.json({ 
        error: '❌ التوكن غير صالح!',
        invalidToken: true 
      }, { status: 400 })
    }

    if (!userRes.ok) {
      return NextResponse.json({ 
        error: 'خطأ في الاتصال بديسكورد' 
      }, { status: 500 })
    }

    const userData = await userRes.json()

    // ═══════════════════════════════════════════════════════════════
    // 🎯 إعدادات الصيد
    // ═══════════════════════════════════════════════════════════════
    
    const len = Math.max(2, Math.min(10, parseInt(length) || 4))
    const total = Math.max(1, Math.min(100, parseInt(count) || 10))
    
    const letters = 'abcdefghijklmnopqrstuvwxyz'
    const numbers = '0123456789'
    const baseChars = letters + numbers
    const extraChars = (useUnderscore ? '_' : '') + (useDot ? '.' : '')
    const allChars = baseChars + extraChars
    
    const checked: Array<{username: string, status: 'available' | 'taken' | 'error'}> = []
    const available: string[] = []
    const taken: string[] = []
    const errors: string[] = []
    
    // ═══════════════════════════════════════════════════════════════
    // 🎲 توليد يوزر عشوائي
    // ═══════════════════════════════════════════════════════════════
    
    const generateUsername = (): string => {
      let result = ''
      for (let i = 0; i < len; i++) {
        result += allChars.charAt(Math.floor(Math.random() * allChars.length))
      }
      // البداية بحرف
      if (!letters.includes(result[0])) {
        result = letters.charAt(Math.floor(Math.random() * letters.length)) + result.slice(1)
      }
      // النهاية ليست _ أو .
      if (result.endsWith('_') || result.endsWith('.')) {
        result = result.slice(0, -1) + numbers.charAt(Math.floor(Math.random() * numbers.length))
      }
      return result
    }
    
    // ═══════════════════════════════════════════════════════════════
    // 🔍 فحص اليوزر - طريقة صحيحة
    // ═══════════════════════════════════════════════════════════════
    
    const checkUsername = async (username: string): Promise<'available' | 'taken' | 'error'> => {
      try {
        // نحاول تغيير اليوزر - إذا نجح فهو متاح
        // هذه الطريقة الوحيدة الموثوقة لفحص اليوزر في Discord
        const res = await fetch('https://discord.com/api/v10/users/@me', {
          method: 'PATCH',
          headers: {
            'Authorization': token,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            username: username
          })
        })

        if (res.status === 200) {
          // تم التغيير - اليوزر متاح!
          return 'available'
        }

        const data = await res.json().catch(() => ({}))
        
        // فحص نوع الخطأ
        if (res.status === 400) {
          const errors = (data as any).errors
          if (errors?.username?._errors) {
            for (const err of errors.username._errors) {
              // USERNAME_TOO_MANY_USERS = اليوزر محجوز
              if (err.code === 'USERNAME_TOO_MANY_USERS') {
                return 'taken'
              }
            }
          }
          // أي خطأ آخر في اليوزر
          return 'taken'
        }

        if (res.status === 429) {
          // Rate limited
          const retry = (data as any).retry_after || 3
          await new Promise(r => setTimeout(r, retry * 1000))
          return checkUsername(username)
        }
        
        if (res.status === 401) {
          return 'error'
        }

        return 'error'
      } catch {
        return 'error'
      }
    }
    
    // ═══════════════════════════════════════════════════════════════
    // 🚀 بدء الصيد
    // ═══════════════════════════════════════════════════════════════
    
    const usedUsernames = new Set<string>()
    
    for (let i = 0; i < total; i++) {
      let username = generateUsername()
      
      // التأكد من عدم التكرار
      while (usedUsernames.has(username)) {
        username = generateUsername()
      }
      usedUsernames.add(username)
      
      const status = await checkUsername(username)
      
      checked.push({ username, status })
      
      if (status === 'available') {
        available.push(username)
      } else if (status === 'taken') {
        taken.push(username)
      } else {
        errors.push(username)
      }
      
      // تأخير لتجنب Rate Limit
      await new Promise(r => setTimeout(r, 800))
    }

    return NextResponse.json({
      success: true,
      user: {
        username: userData.username,
        discriminator: userData.discriminator,
        id: userData.id,
        avatar: userData.avatar
      },
      stats: {
        total,
        checked: checked.length,
        available: available.length,
        taken: taken.length,
        errors: errors.length
      },
      results: checked,
      available,
      taken,
      errors
    })
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'خطأ: ' + (error.message || 'Unknown error') 
    }, { status: 500 })
  }
}
