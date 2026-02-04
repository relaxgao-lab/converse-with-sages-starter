"use client"

import React, { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import OlarkChat from '@/components/ui/OlarkChat'

interface SceneMeta {
  aiRole: string
  userRole: string
  context: string
  scenario: string
}

// 道教人物，按年代从早到晚
const taoistSages = [
  { label: "老子", value: "老子，道家创始人，著《道德经》", intro: "道家创始人，著《道德经》" },
  { label: "庄子", value: "庄子，道家代表人物", intro: "道家代表人物" },
  { label: "关尹子", value: "关尹子，道家，关令尹喜，道德经传人", intro: "道家，关令尹喜，道德经传人" },
  { label: "文子", value: "文子，道家，老子弟子，通玄真经", intro: "道家，老子弟子，通玄真经" },
  { label: "列子", value: "列子，道家代表人物，御风而行", intro: "道家代表人物，御风而行" },
]

// 佛教人物，按年代从早到晚
const buddhistSages = [
  { label: "佛陀", value: "佛陀，佛教创始人，觉悟者，讲四谛与慈悲", intro: "佛教创始人，觉悟者，讲四谛与慈悲" },
  { label: "龙树", value: "龙树，印度大乘论师，中观空性", intro: "印度大乘论师，中观空性" },
  { label: "达摩", value: "达摩，禅宗初祖，东渡传法、面壁九年", intro: "禅宗初祖，东渡传法、面壁九年" },
  { label: "玄奘", value: "玄奘，唐代高僧，西行取经、唯识宗", intro: "唐代高僧，西行取经、唯识宗" },
  { label: "慧能", value: "慧能，禅宗六祖，顿悟见性", intro: "禅宗六祖，顿悟见性" },
]


// 顶部：西方科学家（横条展示）
const topScientists = [
  { label: "苏格拉底", value: "苏格拉底，古希腊哲学家，主张认识你自己", intro: "古希腊哲学家，主张认识你自己" },
  { label: "柏拉图", value: "柏拉图，古希腊哲学家，理念论与理想国", intro: "古希腊哲学家，理念论与理想国" },
  { label: "亚里士多德", value: "亚里士多德，古希腊哲学家，逻辑与德性", intro: "古希腊哲学家，逻辑与德性" },
  { label: "笛卡尔", value: "笛卡尔，近代哲学之父，我思故我在", intro: "近代哲学之父，我思故我在" },
  { label: "康德", value: "康德，德国古典哲学奠基人，批判哲学", intro: "德国古典哲学奠基人，批判哲学" },
  { label: "尼古拉·特斯拉", value: "尼古拉·特斯拉，发明家与物理学家，交流电与无线传输", intro: "发明家与物理学家，交流电与无线传输" },
  { label: "爱因斯坦", value: "爱因斯坦，物理学家，相对论与光子", intro: "物理学家，相对论与光子" },
  { label: "牛顿", value: "牛顿，物理学家，经典力学与万有引力", intro: "物理学家，经典力学与万有引力" },
  { label: "居里夫人", value: "居里夫人，物理学家与化学家，放射性研究", intro: "物理学家与化学家，放射性研究" },
  { label: "达尔文", value: "达尔文，生物学家，进化论", intro: "生物学家，进化论" },
  { label: "伽利略", value: "伽利略，物理学家与天文学家，近代科学奠基人", intro: "物理学家与天文学家，近代科学奠基人" },
  { label: "麦克斯韦", value: "麦克斯韦，物理学家，电磁学与麦克斯韦方程组", intro: "物理学家，电磁学与麦克斯韦方程组" },
  { label: "玻尔", value: "玻尔，物理学家，量子力学与原子结构", intro: "物理学家，量子力学与原子结构" },
]

// 诸子百家等，按知名度从高到低
const otherSages = [
  { label: "孔子", value: "孔子，儒家创始人，提倡仁礼", intro: "儒家创始人，提倡仁礼" },
  { label: "诸葛亮", value: "诸葛亮，蜀汉丞相，智慧与忠义", intro: "蜀汉丞相，智慧与忠义" },
  { label: "李白", value: "李白，诗仙，浪漫与自由", intro: "诗仙，浪漫与自由" },
  { label: "王阳明", value: "王阳明，心学创始人，致良知、知行合一", intro: "心学创始人，致良知、知行合一" },
  { label: "孟子", value: "孟子，儒家代表，主张性善论", intro: "儒家代表，主张性善论" },
  { label: "孙子", value: "孙子，兵家鼻祖，《孙子兵法》", intro: "兵家鼻祖，《孙子兵法》" },
  { label: "杜甫", value: "杜甫，诗圣，沉郁与仁心", intro: "诗圣，沉郁与仁心" },
  { label: "荀子", value: "荀子，儒家代表，性恶论与礼法", intro: "儒家代表，性恶论与礼法" },
  { label: "韩非", value: "韩非，法家集大成者，法术势", intro: "法家集大成者，法术势" },
  { label: "墨子", value: "墨子，墨家创始人，主张兼爱非攻", intro: "墨家创始人，主张兼爱非攻" },
  { label: "管子", value: "管子，齐相，富国强兵之道", intro: "齐相，富国强兵之道" },
  { label: "鬼谷子", value: "鬼谷子，纵横家祖师，谋略与辩术", intro: "纵横家祖师，谋略与辩术" },
]

const bottomSages = [ ...otherSages]

// 参考 EnglishAI 的 pastel 卡片配色（每张卡片不同柔和色）
const pastelCards = [
  { bg: "bg-slate-100", border: "border-slate-200", ring: "focus:ring-slate-300", avatar: "bg-slate-200 text-slate-700" },
  { bg: "bg-violet-100", border: "border-violet-200", ring: "focus:ring-violet-300", avatar: "bg-violet-200 text-violet-700" },
  { bg: "bg-pink-100", border: "border-pink-200", ring: "focus:ring-pink-300", avatar: "bg-pink-200 text-pink-700" },
  { bg: "bg-amber-100", border: "border-amber-200", ring: "focus:ring-amber-300", avatar: "bg-amber-200 text-amber-800" },
  { bg: "bg-emerald-100", border: "border-emerald-200", ring: "focus:ring-emerald-300", avatar: "bg-emerald-200 text-emerald-700" },
  { bg: "bg-sky-100", border: "border-sky-200", ring: "focus:ring-sky-300", avatar: "bg-sky-200 text-sky-700" },
  { bg: "bg-teal-100", border: "border-teal-200", ring: "focus:ring-teal-300", avatar: "bg-teal-200 text-teal-700" },
  { bg: "bg-orange-100", border: "border-orange-200", ring: "focus:ring-orange-300", avatar: "bg-orange-200 text-orange-700" },
  { bg: "bg-cyan-100", border: "border-cyan-200", ring: "focus:ring-cyan-300", avatar: "bg-cyan-200 text-cyan-700" },
]

export default function HomePage() {
  const router = useRouter()
  const [scenario, setScenario] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const bottomStripRef = useRef<HTMLDivElement>(null)
  const [bottomStripPaused, setBottomStripPaused] = useState(false)
  const topStripRef = useRef<HTMLDivElement>(null)
  const [topStripPaused, setTopStripPaused] = useState(false)

  useEffect(() => {
    let touchStartY = 0
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY
    }
    const handleTouchMove = (e: TouchEvent) => {
      const touchY = e.touches[0].clientY
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      if (touchY > touchStartY && scrollTop === 0) {
        e.preventDefault()
      }
    }
    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
    }
  }, [])

  useEffect(() => {
    if (bottomStripRef.current && !bottomStripPaused) {
      const el = bottomStripRef.current
      const step = 1
      const interval = setInterval(() => {
        if (!el || bottomStripPaused) return
        const segmentWidth = el.scrollWidth / 2
        if (segmentWidth <= 0) return
        el.scrollLeft += step
        if (el.scrollLeft >= segmentWidth) el.scrollLeft -= segmentWidth
      }, 30)
      return () => clearInterval(interval)
    }
  }, [bottomStripPaused])

  useEffect(() => {
    if (topStripRef.current && !topStripPaused) {
      const el = topStripRef.current
      const step = 1
      const interval = setInterval(() => {
        if (!el || topStripPaused) return
        const segmentWidth = el.scrollWidth / 2
        if (segmentWidth <= 0) return
        el.scrollLeft += step
        if (el.scrollLeft >= segmentWidth) el.scrollLeft -= segmentWidth
      }, 30)
      return () => clearInterval(interval)
    }
  }, [topStripPaused])

  const handleStartScenario = async (override?: string) => {
    const toUse = (override ?? scenario).trim()
    if (!toUse) return
    // 点击卡片时不更新输入框，只使用传入的值
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const resp = await fetch("/api/scene-meta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario: toUse }),
      })
      const data = await resp.json()
      if (data?.aiRole && data?.userRole && data?.context) {
        const sceneMeta: SceneMeta = {
          aiRole: data.aiRole,
          userRole: data.userRole,
          context: data.context,
          scenario: toUse,
        }
        // 保存状态到 localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('converse-sages-state', JSON.stringify({
            sceneMeta,
            messages: [],
            scenario: toUse,
            isSpeechEnabled: true,
          }))
        }
        // 跳转到对话页面
        router.push('/chat')
      } else {
        setErrorMessage("AI returned incomplete data")
      }
    } catch {
      setErrorMessage("Failed to get scene meta")
    } finally {
      setIsLoading(false)
    }
  }

  // 离开首页时隐藏 OlarkChat
  useEffect(() => {
    return () => {
      // 组件卸载时隐藏 Olark 聊天框
      if (typeof window !== 'undefined' && (window as any).olark) {
        try {
          (window as any).olark('api.box.hide')
        } catch (e) {
          console.warn('Failed to hide Olark:', e)
        }
      }
    }
  }, [])

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <OlarkChat/>
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm flex justify-between items-center shrink-0">
          {errorMessage}
          <Button variant="ghost" size="sm" onClick={() => setErrorMessage(null)}>关闭</Button>
        </div>
      )}

      <div className="flex-1 flex flex-col min-h-0 bg-white overflow-y-auto overflow-x-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {/* 顶部：西方科学家（无限向右滚动，上边距用 safe-area-inset-top） */}
        <div className="shrink-0 w-full overflow-x-hidden pt-[max(1rem,env(safe-area-inset-top))] pb-2">
          <div
            ref={topStripRef}
            onMouseEnter={() => setTopStripPaused(true)}
            onMouseLeave={() => setTopStripPaused(false)}
            className="overflow-x-auto overflow-y-hidden px-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            <div className="flex gap-2 md:gap-4 min-w-max justify-center py-1">
              {[...topScientists, ...topScientists, ...topScientists, ...topScientists].map((s, i) => {
                const p = pastelCards[i % pastelCards.length]
                return (
                  <button
                    key={`top-${s.label}-${i}`}
                    type="button"
                    onClick={() => handleStartScenario(s.value)}
                    disabled={isLoading}
                    className={`flex flex-col gap-1 md:gap-1.5 shrink-0 w-24 md:w-32 rounded-lg md:rounded-xl ${p.bg} border ${p.border} hover:shadow-md focus:outline-none focus:ring-2 ${p.ring} focus:ring-offset-2 disabled:opacity-60 transition-all py-2 px-2 md:py-3 md:px-3 text-center touch-manipulation`}
                    aria-label={`与${s.label}对话`}
                  >
                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-sm md:text-base font-medium shrink-0 mx-auto ${p.avatar}`}>
                      {s.label.slice(0, 1)}
                    </div>
                    <span className="text-[11px] md:text-xs font-bold text-gray-800 leading-tight">{s.label}</span>
                    <span className="text-[10px] md:text-[11px] text-gray-600 leading-tight line-clamp-2">{s.intro}</span>
                    <span className="text-[10px] md:text-[11px] font-medium text-blue-600 mt-auto">开始对话 →</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
        {/* 主内容 + 底部横条（主内容块拉满剩余高度，主行内容靠底） */}
        <div className="flex-1 flex flex-col min-h-0 w-full">
        {/* 主行：手机端简单垂直堆叠占用剩余空间，桌面端 grid 三列 */}
        <div className="flex-1 flex flex-col justify-end md:grid md:grid-cols-[1fr_auto_1fr] md:gap-6 w-full max-w-6xl mx-auto px-3 md:px-6 md:items-center md:py-2 min-h-0">
          {/* 左：道教人物（多列填满空白） */}
          <div className="order-2 md:order-1 flex md:grid md:grid-cols-2 gap-2 md:gap-3 md:pr-4 overflow-x-auto md:overflow-y-auto md:overflow-x-visible [scrollbar-width:none] [&::-webkit-scrollbar]:hidden -mx-3 px-3 md:mx-0 md:px-0 md:content-start md:justify-items-end mb-2 md:mb-0">
            {taoistSages.map((s, i) => {
              const p = pastelCards[i % pastelCards.length]
              const isFullRow = i === 0 // 老子独占一行
              return (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => handleStartScenario(s.value)}
                  disabled={isLoading}
                  className={`flex flex-col gap-1 md:gap-1.5 shrink-0 w-[150px] md:w-full md:min-w-0 rounded-xl md:rounded-2xl ${p.bg} border ${p.border} hover:shadow-md focus:outline-none focus:ring-2 ${p.ring} focus:ring-offset-1 disabled:opacity-60 transition-all py-2 px-2 md:py-3 md:px-3 text-left touch-manipulation ${isFullRow ? "md:col-span-2" : ""}`}
                  aria-label={`与${s.label}对话`}
                >
                  <div className="flex items-center gap-1.5 md:gap-2">
                    <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm md:text-base font-medium shrink-0 ${p.avatar}`}>
                      {s.label.slice(0, 1)}
                    </div>
                    <span className="text-xs md:text-sm font-bold text-gray-800 truncate">{s.label}</span>
                  </div>
                  <p className="text-[11px] md:text-xs text-gray-600 leading-tight line-clamp-1">{s.intro}</p>
                  <span className="text-[11px] md:text-xs font-medium text-blue-600">开始对话 →</span>
                </button>
              )
            })}
          </div>

          {/* 中：标语 + 标题 + 副标题 + 输入区（一组，紧凑层级） */}
          <section className="order-1 md:order-2 shrink-0 flex flex-col items-center text-center px-3 md:px-4 mb-3 md:mb-0">
            {/* 上方标语：两行紧贴 */}
            <div className="flex flex-col gap-1 mb-3 md:mb-4">
              <p className="text-3xl md:text-5xl text-gray-500 font-medium tracking-wide uppercase">跨越时空，与智者对话</p>
              <p className="text-base md:text-base text-gray-400 leading-relaxed">点击卡片或输入智者姓名开始</p>
            </div>
            {/* 主标题：有设计感的层次 */}
            <div className="flex flex-col gap-2 md:gap-2.5 mb-4 md:mb-5">
              <h1 className="text-xl  md:text-2xl lg:text-2xl font-extrabold tracking-tight leading-none">
                <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                  Converse
                </span>
                <span className="text-gray-900"> </span>
                <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 bg-clip-text text-transparent">
                  with Sages
                </span>
              </h1>
              <div className="flex items-center justify-center gap-2 mt-1">
                <div className="h-px w-8 md:w-12 bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                <p className="text-sm md:text-base text-gray-600 font-medium tracking-wide">与古今中外智者对话</p>
                <div className="h-px w-8 md:w-12 bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
              </div>
            </div>
            {/* 输入区 */}
            <div className="w-full max-w-xs flex flex-col gap-2 md:gap-2.5 relative">
              <div className="flex flex-col sm:flex-row gap-2 w-full">
                <Input
                  value={scenario}
                  onChange={(e) => setScenario(e.target.value)}
                  placeholder="如：佛陀、老子、王阳明..."
                  onKeyDown={(e) => {
                    if (e.key !== "Enter") return
                    if (scenario.trim()) handleStartScenario()
                  }}
                  disabled={isLoading}
                  className="rounded-lg border-gray-200 bg-white text-base md:text-base h-10 md:h-11 focus-visible:ring-0 focus-visible:outline-none"
                />
                <Button
                  onClick={() => handleStartScenario()}
                  disabled={isLoading || !scenario.trim()}
                  className="rounded-lg shrink-0 px-5 md:px-6 h-10 md:h-11 text-sm md:text-base font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                >
                  开始
                </Button>
              </div>
              {/* 悬浮提示 */}
              {isLoading && (
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-50 transition-all duration-200 ease-in-out animate-[fadeIn_0.2s_ease-in-out_forwards,slideUp_0.2s_ease-in-out_forwards]">
                  <div className="bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                    <span>生成场景中...</span>
                  </div>
                  {/* 小三角箭头 */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                </div>
              )}
            </div>
          </section>

          {/* 右：佛教人物（多列填满空白） */}
          <div className="order-3 flex md:grid md:grid-cols-2 gap-2 md:gap-3 md:pl-4 overflow-x-auto md:overflow-y-auto md:overflow-x-visible [scrollbar-width:none] [&::-webkit-scrollbar]:hidden -mx-3 px-3 md:mx-0 md:px-0 md:content-start md:justify-items-start">
            {buddhistSages.map((s, i) => {
              const p = pastelCards[(i + 3) % pastelCards.length]
              const isFullRow = i === 0 // 佛陀独占一行
              return (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => handleStartScenario(s.value)}
                  disabled={isLoading}
                  className={`flex flex-col gap-1 md:gap-1.5 shrink-0 w-[150px] md:w-full md:min-w-0 rounded-xl md:rounded-2xl ${p.bg} border ${p.border} hover:shadow-md focus:outline-none focus:ring-2 ${p.ring} focus:ring-offset-1 disabled:opacity-60 transition-all py-2 px-2 md:py-3 md:px-3 text-left touch-manipulation ${isFullRow ? "md:col-span-2" : ""}`}
                  aria-label={`与${s.label}对话`}
                >
                  <div className="flex items-center gap-1.5 md:gap-2">
                    <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm md:text-base font-medium shrink-0 ${p.avatar}`}>
                      {s.label.slice(0, 1)}
                    </div>
                    <span className="text-xs md:text-sm font-bold text-gray-800 truncate">{s.label}</span>
                  </div>
                  <p className="text-[11px] md:text-xs text-gray-600 leading-tight line-clamp-1">{s.intro}</p>
                  <span className="text-[11px] md:text-xs font-medium text-blue-600">开始对话 →</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* 底部：西方圣人 + 诸子百家（pastel 卡片风格） */}
        <div className="shrink-0 w-full pt-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div
            ref={bottomStripRef}
            onMouseEnter={() => setBottomStripPaused(true)}
            onMouseLeave={() => setBottomStripPaused(false)}
            className="overflow-x-auto overflow-y-hidden px-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            <div className="flex gap-2 md:gap-4 min-w-max justify-center py-1">
              {[...bottomSages, ...bottomSages].map((s, i) => {
                const p = pastelCards[i % pastelCards.length]
                return (
                  <button
                    key={`${s.label}-${i}`}
                    type="button"
                    onClick={() => handleStartScenario(s.value)}
                    disabled={isLoading}
                    className={`flex flex-col gap-1 md:gap-1.5 shrink-0 w-24 md:w-32 rounded-lg md:rounded-xl ${p.bg} border ${p.border} hover:shadow-md focus:outline-none focus:ring-2 ${p.ring} focus:ring-offset-2 disabled:opacity-60 transition-all py-2 px-2 md:py-3 md:px-3 text-center touch-manipulation`}
                    aria-label={`与${s.label}对话`}
                  >
                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-sm md:text-base font-medium shrink-0 mx-auto ${p.avatar}`}>
                      {s.label.slice(0, 1)}
                    </div>
                    <span className="text-[11px] md:text-xs font-bold text-gray-800 leading-tight">{s.label}</span>
                    <span className="text-[10px] md:text-[11px] text-gray-600 leading-tight line-clamp-2">{s.intro}</span>
                    <span className="text-[10px] md:text-[11px] font-medium text-blue-600 mt-auto">开始对话 →</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}
