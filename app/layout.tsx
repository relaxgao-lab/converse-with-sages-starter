import type { Metadata, Viewport } from 'next'
import './globals.css'
const siteUrl = 'https://sages.relaxgao.com'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: '与神对话-Converse with Sages ',
  description: '与佛陀、老子、庄子、王阳明、诸子百家等古今中外智者对话，AI 驱动的跨文化先贤对话',
  keywords: ['AI对话', '圣人对话', '智者', '哲学', '传统文化', '老子', '庄子', '王阳明', '佛陀'],
  authors: [{ name: 'RelaxGao' }],
  creator: 'RelaxGao',
  publisher: 'RelaxGao',
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: siteUrl,
    siteName: '与神对话-Converse with Sages',
    title: '与神对话-Converse with Sages',
    description: '跨越时空，与古今中外智者对话。与佛陀、老子、庄子、王阳明、苏格拉底等圣人进行超时空对话，探索智慧与人生之道。',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: '与神对话-Converse with Sages',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '与神对话-Converse with Sages',
    description: '跨越时空，与古今中外智者对话。与佛陀、老子、庄子、王阳明、苏格拉底等圣人进行超时空对话。',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-background antialiased">
        {children}
      </body>
    </html>
  )
}
