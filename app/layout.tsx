import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '荒漠生存决策研究',
  description: '参与一次关于 AI 语音助手和决策体验的在线研究。',
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
