"use client"

import React, { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface SceneMeta {
  aiRole: string
  userRole: string
  context: string
  scenario: string
}

// 道教人物，按年代从早到晚
const taoistSages = [
  { label: "老子", value: "老子，道家创始人，著《道德经》", intro: "道家创始人，著《道德经》" },
  { label: "关尹子", value: "关尹子，道家，关令尹喜，道德经传人", intro: "道家，关令尹喜，道德经传人" },
  { label: "文子", value: "文子，道家，老子弟子，通玄真经", intro: "道家，老子弟子，通玄真经" },
  { label: "列子", value: "列子，道家代表人物，御风而行", intro: "道家代表人物，御风而行" },
  { label: "庄子", value: "庄子，道家代表人物", intro: "道家代表人物" },
]

// 佛教人物，按年代从早到晚
const buddhistSages = [
  { label: "佛陀", value: "佛陀，佛教创始人，觉悟者，讲四谛与慈悲", intro: "佛教创始人，觉悟者，讲四谛与慈悲" },
  { label: "龙树", value: "龙树，印度大乘论师，中观空性", intro: "印度大乘论师，中观空性" },
  { label: "达摩", value: "达摩，禅宗初祖，东渡传法、面壁九年", intro: "禅宗初祖，东渡传法、面壁九年" },
  { label: "玄奘", value: "玄奘，唐代高僧，西行取经、唯识宗", intro: "唐代高僧，西行取经、唯识宗" },
  { label: "慧能", value: "慧能，禅宗六祖，顿悟见性", intro: "禅宗六祖，顿悟见性" },
]

// 西方圣人，按年代从早到晚
const westernSages = [
  { label: "苏格拉底", value: "苏格拉底，古希腊哲学家，主张认识你自己", intro: "古希腊哲学家，主张认识你自己" },
  { label: "柏拉图", value: "柏拉图，古希腊哲学家，理念论与理想国", intro: "古希腊哲学家，理念论与理想国" },
  { label: "亚里士多德", value: "亚里士多德，古希腊哲学家，逻辑与德性", intro: "古希腊哲学家，逻辑与德性" },
  { label: "笛卡尔", value: "笛卡尔，近代哲学之父，我思故我在", intro: "近代哲学之父，我思故我在" },
  { label: "康德", value: "康德，德国古典哲学奠基人，批判哲学", intro: "德国古典哲学奠基人，批判哲学" },
]

// 诸子百家等，按年代从早到晚
const otherSages = [
  { label: "管子", value: "管子，齐相，富国强兵之道", intro: "齐相，富国强兵之道" },
  { label: "孙子", value: "孙子，兵家鼻祖，《孙子兵法》", intro: "兵家鼻祖，《孙子兵法》" },
  { label: "孔子", value: "孔子，儒家创始人，提倡仁礼", intro: "儒家创始人，提倡仁礼" },
  { label: "墨子", value: "墨子，墨家创始人，主张兼爱非攻", intro: "墨家创始人，主张兼爱非攻" },
  { label: "孟子", value: "孟子，儒家代表，主张性善论", intro: "儒家代表，主张性善论" },
  { label: "荀子", value: "荀子，儒家代表，性恶论与礼法", intro: "儒家代表，性恶论与礼法" },
  { label: "韩非", value: "韩非，法家集大成者，法术势", intro: "法家集大成者，法术势" },
  { label: "鬼谷子", value: "鬼谷子，纵横家祖师，谋略与辩术", intro: "纵横家祖师，谋略与辩术" },
  { label: "诸葛亮", value: "诸葛亮，蜀汉丞相，智慧与忠义", intro: "蜀汉丞相，智慧与忠义" },
  { label: "李白", value: "李白，诗仙，浪漫与自由", intro: "诗仙，浪漫与自由" },
  { label: "杜甫", value: "杜甫，诗圣，沉郁与仁心", intro: "诗圣，沉郁与仁心" },
  { label: "王阳明", value: "王阳明，心学创始人，致良知、知行合一", intro: "心学创始人，致良知、知行合一" },
]

const bottomSages = [...westernSages, ...otherSages]

export default function HomePage() {
  const router = useRouter()
  const [scenario, setScenario] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const bottomStripRef = useRef<HTMLDivElement>(null)
  const [bottomStripPaused, setBottomStripPaused] = useState(false)

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

  const handleStartScenario = async (override?: string) => {
    const toUse = (override ?? scenario).trim()
    if (!toUse) return
    setScenario(toUse)
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

  return (
    <div className="min-h-screen flex flex-col">
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm flex justify-between items-center">
          {errorMessage}
          <Button variant="ghost" size="sm" onClick={() => setErrorMessage(null)}>关闭</Button>
        </div>
      )}

      <div className="flex-1 flex flex-col min-h-screen bg-gradient-to-b from-stone-50/80 to-stone-100/60">
        {/* 上方内容区域 */}
        <div className="flex-[0.5] min-h-0 flex items-end justify-center pb-4 md:pb-6">
          <div className="text-center px-4 max-w-2xl">
            <p className="text-sm sm:text-base text-amber-700/80 font-medium mb-2">
              跨越时空，与智者对话
            </p>
            <p className="text-xs sm:text-sm text-gray-500/80 leading-relaxed">
              点击下方人物卡片快速开始，或输入任意智者姓名开启对话
            </p>
          </div>
        </div>

        {/* 主行：左道教 | 中标题+输入 | 右佛教 */}
        <div className="shrink-0 grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 md:gap-20 w-full max-w-6xl mx-auto px-3 sm:px-4 md:px-8 items-start">
          {/* 左：道教人物（小屏横向滚动） */}
          <div className="order-2 md:order-1 flex md:flex-col items-stretch md:items-end gap-3 md:pr-6 overflow-x-auto md:overflow-visible pb-2 md:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden -mx-3 px-3 sm:mx-0 sm:px-0">
            {taoistSages.map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={() => handleStartScenario(s.value)}
                disabled={isLoading}
                className="flex items-center gap-3 shrink-0 w-[200px] md:w-[200px] rounded-2xl bg-gradient-to-br from-white to-amber-50/40 shadow-lg shadow-amber-900/5 hover:shadow-xl hover:shadow-amber-900/10 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-2 disabled:opacity-60 transition-all py-2.5 px-3 text-left border border-amber-100/60 hover:border-amber-200/80 min-h-[44px] touch-manipulation"
                aria-label={`与${s.label}对话`}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-200 to-orange-200 flex items-center justify-center text-base font-medium text-amber-900 shrink-0 shadow-inner">
                  {s.label.slice(0, 1)}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-gray-800">{s.label}</span>
                  <span className="block text-[11px] text-gray-500 truncate">{s.intro}</span>
                </div>
              </button>
            ))}
          </div>

          {/* 中：标题 + 输入区 */}
          <section className="order-1 md:order-2 shrink-0 flex flex-col items-center text-center px-2 sm:px-4 md:px-8 py-2">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-1 tracking-tight">Converse with Sages</h1>
            <p className="text-muted-foreground text-xs sm:text-sm md:text-base mb-4 sm:mb-5">与古今中外智者对话</p>
            <div className="w-full max-w-sm flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row gap-2 w-full">
                <Input
                  value={scenario}
                  onChange={(e) => setScenario(e.target.value)}
                  placeholder="如：佛陀、老子、孔子、苏格拉底..."
                  onKeyDown={(e) => e.key === "Enter" && handleStartScenario()}
                  disabled={isLoading}
                  className="rounded-xl border-stone-200 bg-white shadow-sm"
                />
                <Button
                  onClick={() => handleStartScenario()}
                  disabled={isLoading || !scenario.trim()}
                  className="rounded-xl shrink-0 px-5"
                >
                  {isLoading ? "..." : "开始"}
                </Button>
              </div>
              {isLoading && (
                <p className="text-muted-foreground text-xs">生成场景中...</p>
              )}
            </div>
          </section>

          {/* 右：佛教人物（小屏横向滚动） */}
          <div className="order-3 flex md:flex-col items-stretch md:items-start gap-3 md:pl-6 overflow-x-auto md:overflow-visible pb-2 md:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden -mx-3 px-3 sm:mx-0 sm:px-0">
            {buddhistSages.map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={() => handleStartScenario(s.value)}
                disabled={isLoading}
                className="flex items-center gap-3 shrink-0 w-[200px] md:w-[200px] rounded-2xl bg-gradient-to-br from-white to-amber-50/40 shadow-lg shadow-amber-900/5 hover:shadow-xl hover:shadow-amber-900/10 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-2 disabled:opacity-60 transition-all py-2.5 px-3 text-left border border-amber-100/60 hover:border-amber-200/80 min-h-[44px] touch-manipulation"
                aria-label={`与${s.label}对话`}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-200 to-orange-200 flex items-center justify-center text-base font-medium text-amber-900 shrink-0 shadow-inner">
                  {s.label.slice(0, 1)}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-gray-800">{s.label}</span>
                  <span className="block text-[11px] text-gray-500 truncate">{s.intro}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 下方弹性占位（较小，避免底部内容过低） */}
        <div className="flex-[0.2] min-h-0" aria-hidden />

        {/* 底部：西方圣人 + 诸子百家等横向滚动（自动滚动、无滚动条） */}
        <div className="shrink-0 w-full py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div
            ref={bottomStripRef}
            onMouseEnter={() => setBottomStripPaused(true)}
            onMouseLeave={() => setBottomStripPaused(false)}
            className="overflow-x-auto overflow-y-hidden px-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            <div className="flex gap-4 min-w-max justify-center py-1">
              {[...bottomSages, ...bottomSages].map((s, i) => (
                <button
                  key={`${s.label}-${i}`}
                  type="button"
                  onClick={() => handleStartScenario(s.value)}
                  disabled={isLoading}
                  className="flex flex-col items-center gap-1.5 shrink-0 w-32 rounded-2xl bg-gradient-to-br from-white to-amber-50/40 shadow-lg shadow-amber-900/5 hover:shadow-xl hover:shadow-amber-900/10 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-2 disabled:opacity-60 transition-all py-3 px-2 border border-amber-100/60 hover:border-amber-200/80 min-h-[44px] touch-manipulation"
                  aria-label={`与${s.label}对话`}
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-200 to-orange-200 flex items-center justify-center text-base font-medium text-amber-900 shadow-inner">
                    {s.label.slice(0, 1)}
                  </div>
                  <span className="text-xs font-medium text-gray-800 leading-tight">{s.label}</span>
                  <span className="text-[11px] text-gray-500 leading-tight text-center line-clamp-2">{s.intro}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
