import type { Metadata } from 'next';
import { Inspector } from 'react-dev-inspector';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: '智能英语口语陪练',
    template: '%s | 英语口语陪练',
  },
  description:
    '智能英语口语陪练平台，基于 AI 技术提供真实场景对话练习、实时语法纠错和个性化学习建议，让英语口语提升更高效。',
  keywords: [
    '英语口语',
    '英语学习',
    'AI 陪练',
    '雅思口语',
    '对话练习',
    '语法纠错',
    '英语学习工具',
    '在线英语',
  ],
  authors: [{ name: 'English Practice Team' }],
  // icons: {
  //   icon: '',
  // },
  openGraph: {
    title: '智能英语口语陪练',
    description:
      '基于 AI 的英语口语练习平台，提供多场景对话练习、实时语法纠错和个性化学习建议。',
    locale: 'zh_CN',
    type: 'website',
    // images: [
    //   {
    //     url: '',
    //     width: 1200,
    //     height: 630,
    //     alt: '英语口语陪练',
    //   },
    // ],
  },
  // twitter: {
  //   card: 'summary_large_image',
  //   title: 'English Speaking Practice',
  //   description:
  //     'AI-powered English speaking practice platform with real-time grammar correction.',
  //   // images: [''],
  // },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isDev = process.env.COZE_PROJECT_ENV === 'DEV';

  return (
    <html lang="en">
      <body className={`antialiased`}>
        {isDev && <Inspector />}
        {children}
      </body>
    </html>
  );
}
