import { NextRequest, NextResponse } from 'next/server'
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
    const { scenario } = await req.json()
    if (!scenario || typeof scenario !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid scenario' }, { status: 400 })
    }

    const prompt = `请根据我想对话的古代人物或场景"${scenario}"，推理出一个JSON，内容包括：ai要扮演的角色、用户身份、对话上下文。只返回JSON，不要多余解释。例如：{ "aiRole": "老子", "userRole": "求道者", "context": "在函谷关，求道者向老子请教道德经的智慧。" }`

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 300,
    })
    const content = completion.choices[0].message.content

    let meta = null
    try {
      meta = typeof content === 'string' ? JSON.parse(content) : content
    } catch {
      return NextResponse.json({ error: 'AI 返回内容不是有效 JSON' }, { status: 500 })
    }
    if (!meta || !meta.aiRole || !meta.userRole || !meta.context) {
      return NextResponse.json({ error: 'AI 返回内容不完整' }, { status: 500 })
    }
    return NextResponse.json(meta)
  } catch (e) {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
