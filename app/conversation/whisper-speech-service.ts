import { AudioRecorder } from './audio-recorder-service'
import { isSpeechSynthesisSupported, initSpeechSynthesis } from './speech-utils'
import { TTS_PROVIDER } from '@/config'

export type SpeechStatus = 'idle' | 'recording' | 'processing' | 'speaking'

interface WhisperSpeechServiceConfig {
  onStatusChange?: (status: SpeechStatus) => void
  onTranscript?: (text: string) => void
  onError?: (error: string) => void
  onSpeechEnd?: () => void
  ttsProvider?: 'system' | 'openai'
}

export class WhisperSpeechService {
  private recorder: AudioRecorder
  private status: SpeechStatus = 'idle'
  private config: WhisperSpeechServiceConfig
  private currentOpenAIAudio: HTMLAudioElement | null = null
  private currentSystemUtterance: SpeechSynthesisUtterance | null = null

  constructor(config: WhisperSpeechServiceConfig = {}) {
    this.config = { ttsProvider: TTS_PROVIDER === 'openai' ? 'openai' : 'system', ...config }
    this.recorder = new AudioRecorder()
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      initSpeechSynthesis().catch(console.error)
    }
  }

  getStatus(): SpeechStatus { return this.status }

  updateConfig(config: Partial<WhisperSpeechServiceConfig>): void {
    this.config = { ...this.config, ...config }
  }

  resetConfig(): void {
    this.config = {
      ...this.config,
      onStatusChange: undefined,
      onTranscript: undefined,
      onError: undefined,
      onSpeechEnd: undefined,
    }
  }

  async startListening(): Promise<void> {
    if (this.status !== 'idle') return
    await this.stopSpeaking()
    try {
      await this.recorder.start({})
      this.setStatus('recording')
    } catch (error: any) {
      this.handleError(error.message || 'Failed to start recording')
    }
  }

  async stopListening(): Promise<void> {
    if (this.status !== 'recording') return
    try {
      const { audioBlob, duration } = await this.recorder.stop()
      await this.handleAudioDataAvailable(audioBlob, duration)
    } catch (error: any) {
      this.handleError(error.message || 'Failed to stop recording')
      this.setStatus('idle')
    }
  }

  private async transcribeAudio(audioBlob: Blob): Promise<string> {
    const formData = new FormData()
    formData.append('audio', audioBlob, 'audio.webm')
    formData.append('task', 'transcribe')

    const response = await fetch('/api/whisper', { method: 'POST', body: formData })
    if (!response.ok) {
      const err = await response.text()
      throw new Error(err || `Speech recognition failed: ${response.status}`)
    }
    const result = await response.json()
    return result.text || ''
  }

  async speak(text: string): Promise<void> {
    if (this.status === 'speaking') await this.stopSpeaking()
    this.cleanupCurrentAudio()
    this.setStatus('speaking')

    try {
      if (this.config.ttsProvider === 'system') {
        await this._speakSystem(text)
      } else {
        await this._speakOpenAI(text)
      }
    } catch (error: any) {
      this.handleError(error.message || 'Speech synthesis failed')
      this.setStatus('idle')
    }
  }

  private async _speakSystem(text: string): Promise<void> {
    if (!window.speechSynthesis) throw new Error('Speech synthesis not supported')
    window.speechSynthesis.cancel()
    await new Promise(r => setTimeout(r, 50))

    const utterance = new SpeechSynthesisUtterance(text)
    this.currentSystemUtterance = utterance
    let voices = window.speechSynthesis.getVoices()
    if (!voices.length) {
      await new Promise<void>(r => {
        const check = () => {
          voices = window.speechSynthesis.getVoices()
          if (voices.length) r()
        }
        window.speechSynthesis.onvoiceschanged = check
        check()
      })
    }
    const voice = voices.find(v => v.lang.startsWith('zh')) || voices.find(v => v.lang.startsWith('en')) || voices[0]
    if (voice) utterance.voice = voice
    utterance.rate = 1.0
    utterance.volume = 1.0

    await new Promise<void>((resolve, reject) => {
      utterance.onend = () => { this.setStatus('idle'); this.config.onSpeechEnd?.(); resolve() }
      utterance.onerror = (e) => { this.setStatus('idle'); reject(new Error(String((e as any).error))) }
      window.speechSynthesis.speak(utterance)
    })
    this.currentSystemUtterance = null
    this.setStatus('idle')
  }

  private async _speakOpenAI(text: string): Promise<void> {
    let audio: HTMLAudioElement | null = null
    let audioUrl: string | null = null
    try {
      const res = await fetch('/api/openai-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, model: 'tts-1', voice: 'alloy', response_format: 'mp3' }),
      })
      if (!res.ok) throw new Error(await res.text())
      const blob = await res.blob()
      audioUrl = URL.createObjectURL(blob)
      audio = new Audio(audioUrl)
      this.currentOpenAIAudio = audio
      await audio.play()

      await new Promise<void>((resolve, reject) => {
        audio!.onended = () => {
          if (this.status === 'speaking') { this.setStatus('idle'); this.config.onSpeechEnd?.() }
          if (audioUrl) URL.revokeObjectURL(audioUrl)
          this.currentOpenAIAudio = null
          resolve()
        }
        audio!.onerror = () => {
          if (audioUrl) URL.revokeObjectURL(audioUrl)
          this.currentOpenAIAudio = null
          reject(new Error('Audio playback failed'))
        }
      })
    } catch (error: any) {
      this.setStatus('idle')
      if (audioUrl) URL.revokeObjectURL(audioUrl)
      this.currentOpenAIAudio = null
      throw error
    }
  }

  async stopSpeaking(): Promise<void> {
    if (window.speechSynthesis) window.speechSynthesis.cancel()
    this.currentSystemUtterance = null
    if (this.currentOpenAIAudio) {
      this.currentOpenAIAudio.pause()
      this.currentOpenAIAudio.src = ''
      this.currentOpenAIAudio = null
    }
    if (this.status === 'speaking') this.setStatus('idle')
  }

  private setStatus(s: SpeechStatus): void {
    if (this.status === s) return
    this.status = s
    this.config.onStatusChange?.(s)
  }

  private handleError(msg: string): void {
    this.config.onError?.(msg)
    this.setStatus('idle')
  }

  private cleanupCurrentAudio(): void {
    if (window.speechSynthesis) window.speechSynthesis.cancel()
    this.currentSystemUtterance = null
    if (this.currentOpenAIAudio) {
      this.currentOpenAIAudio.pause()
      this.currentOpenAIAudio = null
    }
  }

  private async handleAudioDataAvailable(audioBlob: Blob, duration: number): Promise<void> {
    try {
      this.setStatus('processing')
      if (duration < 0.5) {
        this.setStatus('idle')
        this.config.onTranscript?.('')
        return
      }
      const transcript = await this.transcribeAudio(audioBlob)
      this.config.onTranscript?.(transcript || '')
    } catch (error: any) {
      this.handleError(error.message || 'Failed to process audio')
    } finally {
      if (this.status === 'processing') this.setStatus('idle')
    }
  }
}

export const whisperSpeechService = new WhisperSpeechService()
