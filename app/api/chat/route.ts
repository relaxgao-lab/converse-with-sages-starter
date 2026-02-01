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

    let systemPrompt = `You are playing the role of: ${sceneMeta.aiRole}.
The user is playing the role of: ${sceneMeta.userRole}.
The context of the conversation is: ${sceneMeta.context}.

Follow these rules STRICTLY:
1. Always stay in character as ${sceneMeta.aiRole}.
2. Use appropriate vocabulary and phrases for this role and context.
3. Interact naturally with the user who is playing ${sceneMeta.userRole}.
4. Keep responses concise and natural for a real conversation.
5. You may respond in Chinese or Classical Chinese as appropriate for the sage's voice.
6. Wrap your main response in [SPEAK]...[/SPEAK] tags for TTS.
7. After the main response, provide exactly 2 suggested replies for the user in the format:
   You can say:
   1. "[first suggestion]"
   2. "[second suggestion]"
8. Provide a translation if needed. Format: TRANSLATION:\n[translation]
9. NEVER break character or mention being an AI.`;

    if (isInitialTurn) {
      systemPrompt += `\n10. Initiate the conversation naturally based on your role and the context.`;
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
