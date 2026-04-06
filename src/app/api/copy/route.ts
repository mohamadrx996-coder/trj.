import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { token, sourceId, targetId, options } = await req.json()
    
    if (!token || !sourceId || !targetId) {
      return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 })
    }

    const stats = { 
      roles_deleted: 0, 
      roles_created: 0, 
      channels_deleted: 0, 
      channels_created: 0, 
      categories_created: 0,
      emojis: 0 
    }
    
    const roleMap: Record<string, string> = {}
    const catMap: Record<string, string> = {}
    
    const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))
    
    const api = async (method: string, endpoint: string, body?: object): Promise<any> => {
      try {
        const res = await fetch(`https://discord.com/api/v10/${endpoint}`, {
          method,
          headers: { 
            'Authorization': token, 
            'Content-Type': 'application/json' 
          },
          body: body ? JSON.stringify(body) : undefined
        })
        
        if (res.status === 429) {
          const data = await res.json().catch(() => ({}))
          await sleep(((data as any).retry_after || 1) * 1000 + 500)
          return api(method, endpoint, body)
        }
        
        if (res.status === 204) return { success: true, status: 204 }
        if (res.status === 201) return res.json().catch(() => ({ success: true }))
        if (res.status === 200) return res.json().catch(() => ({ success: true }))
        
        const data = await res.json().catch(() => ({}))
        return { ...data, _status: res.status }
      } catch {
        return { error: true }
      }
    }

    // جلب بيانات السيرفرين
    const [sourceRoles, sourceChannels, targetRoles, targetChannels] = await Promise.all([
      api('GET', `guilds/${sourceId}/roles`),
      api('GET', `guilds/${sourceId}/channels`),
      api('GET', `guilds/${targetId}/roles`),
      api('GET', `guilds/${targetId}/channels`)
    ])

    if (!Array.isArray(sourceRoles)) {
      return NextResponse.json({ error: 'فشل جلب رتب المصدر' }, { status: 400 })
    }
    if (!Array.isArray(sourceChannels)) {
      return NextResponse.json({ error: 'فشل جلب رومات المصدر' }, { status: 400 })
    }
    if (!Array.isArray(targetRoles)) {
      return NextResponse.json({ error: 'فشل جلب رتب الهدف - تأكد من أنك أدمن' }, { status: 400 })
    }
    if (!Array.isArray(targetChannels)) {
      return NextResponse.json({ error: 'فشل جلب رومات الهدف - تأكد من أنك أدمن' }, { status: 400 })
    }

    // حذف كل رومات الهدف
    for (const ch of targetChannels) {
      if (ch.id) {
        await api('DELETE', `channels/${ch.id}`)
        stats.channels_deleted++
        await sleep(100)
      }
    }

    // حذف رتب الهدف
    const targetEveryone = targetRoles.find((r: any) => r.name === '@everyone')
    
    for (const r of targetRoles) {
      if (r.name === '@everyone') continue
      if (r.managed) continue
      
      if (r.id) {
        await api('DELETE', `guilds/${targetId}/roles/${r.id}`)
        stats.roles_deleted++
        await sleep(100)
      }
    }

    // نسخ @everyone
    if (options?.roles) {
      const srcEveryone = sourceRoles.find((r: any) => r.name === '@everyone')
      
      if (srcEveryone && targetEveryone && targetEveryone.id) {
        await api('PATCH', `guilds/${targetId}/roles/${targetEveryone.id}`, {
          permissions: srcEveryone.permissions,
          mentionable: srcEveryone.mentionable
        })
        if (srcEveryone.id) roleMap[srcEveryone.id] = targetEveryone.id
      }
    }

    // نسخ الرتب بالترتيب
    if (options?.roles) {
      const sortedRoles = sourceRoles
        .filter((r: any) => r.name !== '@everyone' && !r.managed)
        .sort((a: any, b: any) => (a.position || 0) - (b.position || 0))
      
      for (const role of sortedRoles) {
        const newRole = await api('POST', `guilds/${targetId}/roles`, {
          name: role.name || 'Role',
          permissions: role.permissions || '0',
          color: role.color || 0,
          hoist: role.hoist || false,
          mentionable: role.mentionable || false
        })
        
        if (newRole && !newRole.error && newRole.id) {
          if (role.id) roleMap[role.id] = newRole.id
          stats.roles_created++
        }
        
        await sleep(200)
      }
    }

    // نسخ التصنيفات
    if (options?.channels) {
      const categories = sourceChannels
        .filter((c: any) => c.type === 4)
        .sort((a: any, b: any) => (a.position || 0) - (b.position || 0))
      
      for (const cat of categories) {
        const permissions = (cat.permission_overwrites || [])
          .map((p: any) => ({
            id: roleMap[p.id] || p.id,
            allow: p.allow || '0',
            deny: p.deny || '0',
            type: p.type || 0
          }))
          .filter((p: any) => p.id)
        
        const newCat = await api('POST', `guilds/${targetId}/channels`, {
          name: cat.name || 'Category',
          type: 4,
          permission_overwrites: permissions.length > 0 ? permissions : undefined
        })
        
        if (newCat && !newCat.error && newCat.id) {
          if (cat.id) catMap[cat.id] = newCat.id
          stats.categories_created++
        }
        
        await sleep(200)
      }
    }

    // نسخ الرومات
    if (options?.channels) {
      const channels = sourceChannels
        .filter((c: any) => c.type !== 4)
        .sort((a: any, b: any) => (a.position || 0) - (b.position || 0))
      
      for (const ch of channels) {
        const permissions = (ch.permission_overwrites || [])
          .map((p: any) => ({
            id: roleMap[p.id] || p.id,
            allow: p.allow || '0',
            deny: p.deny || '0',
            type: p.type || 0
          }))
          .filter((p: any) => p.id)
        
        const payload: any = {
          name: ch.name || 'channel',
          type: ch.type || 0,
          permission_overwrites: permissions.length > 0 ? permissions : undefined
        }
        
        if (ch.parent_id && catMap[ch.parent_id]) {
          payload.parent_id = catMap[ch.parent_id]
        }
        
        if (ch.type === 0 || ch.type === 5) {
          payload.topic = ch.topic || null
          payload.nsfw = ch.nsfw || false
        }
        
        if (ch.type === 2) {
          payload.bitrate = ch.bitrate || 64000
          payload.user_limit = ch.user_limit || 0
        }
        
        const newCh = await api('POST', `guilds/${targetId}/channels`, payload)
        
        if (newCh && !newCh.error) {
          stats.channels_created++
        }
        
        await sleep(200)
      }
    }

    return NextResponse.json({ 
      success: true, 
      stats
    })
    
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'خطأ: ' + (error.message || 'Unknown error') 
    }, { status: 500 })
  }
}
