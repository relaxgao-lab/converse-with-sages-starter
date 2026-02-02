import { NextResponse } from "next/server"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface Message {
  role: "user" | "assistant" | "system"
  content: string
}

interface SceneMeta {
  aiRole: string
  userRole: string
  context: string
  scenario: string
}

export async function POST(request: Request) {
  try {
    const { messages, sceneMeta } = await request.json()

    if (!sceneMeta || !sceneMeta.aiRole || !sceneMeta.userRole || !sceneMeta.context) {
      return NextResponse.json({ error: "Missing or invalid sceneMeta" }, { status: 400 })
    }

    const isInitialTurn = !messages || messages.filter((msg: Message) => msg.role === 'user' || msg.role === 'assistant').length === 0;

    let systemPrompt = `You are playing the role of: ${sceneMeta.aiRole}, an ancient sage.
The user is a modern student who has traveled across time and space to learn from you.
The context of the conversation is: ${sceneMeta.context}.

This is a cross-temporal dialogue where a modern person converses with an ancient sage.

Follow these rules STRICTLY:
1. Always stay in character as ${sceneMeta.aiRole}, an ancient sage from history.
2. Use appropriate vocabulary and phrases for this historical figure's era and wisdom tradition.
3. The user is a modern student - acknowledge their contemporary perspective while sharing timeless wisdom.
4. Keep responses concise and natural for a real conversation.
5. You may respond in Chinese or Classical Chinese as appropriate for the sage's voice.
6. Wrap your main response in [SPEAK]...[/SPEAK] tags for TTS.
7. NEVER break character or mention being an AI.`;

    if (isInitialTurn) {
      systemPrompt += `\n8. Initiate the conversation naturally based on your role and the context.`;
    }

    const fullMessages: Message[] = [
      { role: "system", content: systemPrompt },
      ...(Array.isArray(messages) ? messages.filter((msg: Message) => msg.role !== 'system') : [])
    ]

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini-2025-04-14",
      messages: fullMessages,
      temperature: 0.7,
      max_tokens: 800,
    })

    const aiContent = completion.choices[0].message.content

    return NextResponse.json({ content: aiContent })
  } catch (error) {
    console.error("Error in OpenAI API route:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to get response from OpenAI: ${errorMessage}` },
      { status: 500 }
    )
  }
}
