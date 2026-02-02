"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Menu, Mic, Send, StopCircle, Volume2, VolumeX } from "lucide-react"
import { whisperSpeechService, type SpeechStatus } from "./conversation/whisper-speech-service"
import { TTS_PROVIDER } from "@/config"

interface Message {
  role: "user" | "assistant"
  content: string
}

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
  const [scenario, setScenario] = useState("")
  const [sceneMeta, setSceneMeta] = useState<SceneMeta | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [speechStatus, setSpeechStatus] = useState<SpeechStatus>("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const transcriptCallback = useRef<((text: string) => void) | null>(null)
  const bottomStripRef = useRef<HTMLDivElement>(null)
  const [bottomStripPaused, setBottomStripPaused] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    whisperSpeechService.updateConfig({
      ttsProvider: TTS_PROVIDER,
      onStatusChange: (s) => setSpeechStatus(s),
      onError: (err) => {
        setErrorMessage(err)
        setSpeechStatus("idle")
      },
      onTranscript: (text) => {
        if (transcriptCallback.current) transcriptCallback.current(text)
      },
    })
    return () => whisperSpeechService.resetConfig?.()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

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
    if (!sceneMeta && bottomStripRef.current && !bottomStripPaused) {
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
  }, [sceneMeta, bottomStripPaused])

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || !sceneMeta) return
    setIsLoading(true)
    setErrorMessage(null)
    const newUserMsg: Message = { role: "user", content: text }
    setMessages((prev) => [...prev, newUserMsg])
    setInputText("")

    try {
      const resp = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, newUserMsg],
          sceneMeta,
        }),
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data.error || "API error")
      const aiMsg: Message = { role: "assistant", content: data.content || "(No response)" }
      setMessages((prev) => [...prev, aiMsg])
      setIsLoading(false)

      const speakMatch = data.content?.match(/\[SPEAK\]([\s\S]*?)\[\/SPEAK\]/)
      if (isSpeechEnabled && speakMatch?.[1]) {
        await whisperSpeechService.speak(speakMatch[1].trim())
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Request failed")
    } finally {
      setIsLoading(false)
      setSpeechStatus("idle")
    }
  }, [messages, sceneMeta, isSpeechEnabled])

  const handleVoiceToggle = async () => {
    if (speechStatus === "recording") {
      await whisperSpeechService.stopListening()
      return
    }
    transcriptCallback.current = (text) => {
      if (text?.trim()) {
        setInputText(text)
        sendMessage(text)
      }
    }
    await whisperSpeechService.startListening()
  }

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!inputText.trim()) return
    sendMessage(inputText)
  }

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
        setSceneMeta({
          aiRole: data.aiRole,
          userRole: data.userRole,
          context: data.context,
          scenario: toUse,
        })
      } else {
        setErrorMessage("AI returned incomplete data")
      }
    } catch {
      setErrorMessage("Failed to get scene meta")
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirmScene = () => {
    if (!sceneMeta) return
    setIsLoading(true)
    setErrorMessage(null)
    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [], sceneMeta }),
    })
      .then((r) => r.json())
      .then((data) => {
        const aiMsg: Message = { role: "assistant", content: data.content || "(No response)" }
        setMessages([aiMsg])
        const speakMatch = data.content?.match(/\[SPEAK\]([\s\S]*?)\[\/SPEAK\]/)
        if (isSpeechEnabled && speakMatch?.[1]) {
          whisperSpeechService.speak(speakMatch[1].trim())
        }
      })
      .catch((err) => setErrorMessage(err.message))
      .finally(() => setIsLoading(false))
  }

  const handleBack = () => {
    setSceneMeta(null)
    setScenario("")
    setMessages([])
    setInputText("")
    setErrorMessage(null)
  }

  const extractSpeakContent = (content: string) => {
    const m = content.match(/\[SPEAK\]([\s\S]*?)\[\/SPEAK\]/)
    return m ? m[1].trim() : content
  }

  return (
    <div className="min-h-screen flex flex-col">
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm flex justify-between items-center">
          {errorMessage}
          <Button variant="ghost" size="sm" onClick={() => setErrorMessage(null)}>关闭</Button>
        </div>
      )}

      {!sceneMeta ? (
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
      ) : !messages.length ? (
        <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6">
          <div className="bg-card border rounded-lg p-4 sm:p-6 max-w-lg w-full mb-6 mx-3">
            <h2 className="text-xl font-bold mb-4">场景设定</h2>
            <p className="mb-2"><strong>圣人：</strong>{sceneMeta.aiRole}</p>
            <p className="mb-2"><strong>你的身份：</strong>学生</p>
            <p className="text-sm text-muted-foreground leading-relaxed"><strong>对话场景：</strong>{sceneMeta.context}</p>
          </div>
          <div className="flex gap-4">
            <Button onClick={handleConfirmScene} disabled={isLoading}>确认开始</Button>
            <Button variant="outline" onClick={handleBack}>返回</Button>
          </div>
        </div>
      ) : (
        <div className="flex h-screen bg-[#f9f9f9]">
          {/* 移动端侧栏遮罩 */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 z-40 bg-black/50 md:hidden"
              onClick={() => setSidebarOpen(false)}
              aria-hidden
            />
          )}
          <aside
            className={`fixed md:relative inset-y-0 left-0 z-50 w-[260px] max-w-[85vw] flex flex-col shrink-0 bg-[#171717] text-gray-200 transform transition-transform duration-200 ease-out ${
              sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
            }`}
          >
            <div className="p-3">
              <Button
                onClick={() => { handleBack(); setSidebarOpen(false) }}
                className="w-full justify-center gap-2 rounded-lg bg-transparent hover:bg-white/10 text-gray-300 border border-white/20 min-h-[44px] touch-manipulation"
              >
                <span className="text-sm">+ 新对话</span>
              </Button>
            </div>
            <div className="flex-1 min-h-0 px-3 py-2 overflow-y-auto">
              <div className="rounded-xl bg-gradient-to-br from-amber-900/30 to-orange-900/20 border border-amber-700/30 p-4 shadow-lg">
                {(() => {
                  const parts = sceneMeta.scenario.split(/[，,]/);
                  const name = parts[0]?.trim() || sceneMeta.scenario;
                  const intro = parts.slice(1).join('，').trim();
                  return (
                    <>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-200 to-orange-200 flex items-center justify-center text-lg font-medium text-amber-900 shadow-inner shrink-0">
                          {name.slice(0, 1)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base font-bold text-white mb-0.5 truncate">{name}</h3>
                          {intro && (
                            <p className="text-xs text-amber-200/80 line-clamp-2 leading-relaxed">{intro}</p>
                          )}
                        </div>
                      </div>
                      {(sceneMeta.context || intro) && (
                        <div className="pt-3 border-t border-amber-700/30">
                          <p className="text-xs text-amber-300/90 leading-relaxed">
                            {sceneMeta.context || intro}
                          </p>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
            <div className="p-3 space-y-1 border-t border-white/10">
              <button
                type="button"
                onClick={() => { handleBack(); setSidebarOpen(false) }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-gray-400 hover:bg-white/10 hover:text-gray-200 min-h-[44px] touch-manipulation"
              >
                <ArrowLeft className="h-4 w-4" />
                选古人
              </button>
              <button
                type="button"
                onClick={() => setIsSpeechEnabled(!isSpeechEnabled)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-gray-400 hover:bg-white/10 hover:text-gray-200 min-h-[44px] touch-manipulation"
                title={isSpeechEnabled ? "关闭语音" : "开启语音"}
              >
                {isSpeechEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                {isSpeechEnabled ? "语音开" : "语音关"}
              </button>
            </div>
          </aside>

          <main className="flex-1 flex flex-col min-w-0 bg-white min-h-0">
            {/* 移动端顶部栏 */}
            <div className="flex md:hidden items-center gap-2 shrink-0 px-3 py-2 border-b border-gray-200 bg-white min-h-[44px]">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="p-2 -ml-1 rounded-lg text-gray-600 hover:bg-gray-100 touch-manipulation"
                aria-label="打开菜单"
              >
                <Menu className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-gray-600 hover:bg-gray-100 text-sm touch-manipulation"
              >
                <ArrowLeft className="h-4 w-4" />
                选古人
              </button>
              <span className="flex-1 truncate text-sm text-gray-700 ml-1" title={sceneMeta.scenario}>
                {sceneMeta.scenario}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto min-h-0">
              <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-8 pb-[max(6rem,calc(6rem+env(safe-area-inset-bottom)))]">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`group relative flex gap-4 py-6 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                  >
                    <div
                      className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                        msg.role === "assistant"
                          ? "bg-[#19c37d] text-white"
                          : "bg-[#ab68ff] text-white"
                      }`}
                    >
                      {msg.role === "assistant" ? "师" : "我"}
                    </div>
                    <div
                      className={`flex-1 min-w-0 text-[15px] leading-[1.75] whitespace-pre-wrap ${
                        msg.role === "user"
                          ? "text-gray-900 text-right"
                          : "text-gray-800"
                      }`}
                    >
                      {msg.role === "user" ? (
                        <div className="inline-block max-w-[85%] rounded-2xl bg-[#f4f4f4] px-4 py-3 text-gray-900 text-left">
                          {msg.content}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="prose prose-gray max-w-none text-[15px] leading-[1.75] prose-p:my-3 prose-p:leading-relaxed">
                            {extractSpeakContent(msg.content)}
                          </div>
                          {i === messages.length - 1 && (
                            <div className="min-h-[28px] flex items-center pt-1">
                              {speechStatus === "speaking" ? (
                                <div className="flex items-center gap-2 text-[13px] text-amber-600">
                                  <span className="flex items-end gap-0.5 h-4 [&>span]:inline-block">
                                    <span className="w-1 bg-amber-500 rounded-full origin-bottom animate-sound-wave animate-sound-wave-1 h-3" />
                                    <span className="w-1 bg-amber-500 rounded-full origin-bottom animate-sound-wave animate-sound-wave-2 h-4" />
                                    <span className="w-1 bg-amber-500 rounded-full origin-bottom animate-sound-wave animate-sound-wave-3 h-3" />
                                    <span className="w-1 bg-amber-500 rounded-full origin-bottom animate-sound-wave animate-sound-wave-4 h-4" />
                                  </span>
                                  <Volume2 className="h-3.5 w-3.5 shrink-0 animate-status-pulse" />
                                  正在播放
                                </div>
                              ) : null}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="group relative flex gap-4 py-6">
                    <div className="shrink-0 w-8 h-8 rounded-full bg-[#19c37d] flex items-center justify-center text-xs font-medium text-white animate-status-pulse">
                      师
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="inline-block rounded-2xl bg-gray-50/80 border border-gray-100 px-4 py-3 text-[15px] text-gray-500 italic">
                        等待圣人回复
                        <span className="inline-flex">
                          <span className="animate-dot-flash-1">.</span>
                          <span className="animate-dot-flash-2">.</span>
                          <span className="animate-dot-flash-3">.</span>
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <div className="sticky bottom-0 w-full border-t border-gray-200 bg-white p-3 sm:p-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] z-10 shadow-[0_-2px_8px_rgba(0,0,0,0.05)]">
              <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
                <div className="flex items-end gap-1 rounded-2xl bg-white border border-gray-300 shadow-[0_0_0_1px_rgba(0,0,0,0.05),0_2px_4px_rgba(0,0,0,0.05)] p-2 focus-within:border-gray-400 focus-within:shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_2px_6px_rgba(0,0,0,0.08)] transition-all">
                  <Input
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="输入或语音..."
                    disabled={isLoading || speechStatus === "recording" || speechStatus === "processing"}
                    className="flex-1 border-0 min-h-[44px] sm:min-h-[52px] py-3 px-4 text-base sm:text-[15px] focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-gray-500"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={handleVoiceToggle}
                    disabled={isLoading || speechStatus === "processing"}
                    className="shrink-0 h-10 w-10 sm:h-9 sm:w-9 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 touch-manipulation"
                  >
                    {speechStatus === "recording" ? <StopCircle className="h-5 w-5 text-red-500" /> : <Mic className="h-5 w-5" />}
                  </Button>
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!inputText.trim() || isLoading}
                    className="shrink-0 h-10 w-10 sm:h-9 sm:w-9 rounded-lg bg-[#19c37d] hover:bg-[#18a86d] text-white disabled:opacity-50 touch-manipulation"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </div>
          </main>
        </div>
      )}
    </div>
  )
}
