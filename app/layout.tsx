import type { Metadata } from 'next';
import './globals.css';

const recoveryScript = `
(function () {
  var reload = document.getElementById('study-reload');
  if (reload) reload.addEventListener('click', function () { location.reload(); });
  window.setTimeout(function () {
    var root = document.documentElement;
    var stylesReady = getComputedStyle(root).getPropertyValue('--study-styles-ready').trim() === '1';
    var scriptReady = root.dataset.studyJavascript === 'ready';
    if (!stylesReady || !scriptReady) {
      var notice = document.getElementById('study-load-failure');
      if (notice) notice.hidden = false;
    }
  }, 8000);
})();`;

export const metadata: Metadata = {
  title: '荒漠生存情境研究',
  description: '参与一次关于 AI 语音助手交流体验的在线研究。',
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>
        <div
          id="study-load-failure"
          hidden
          role="alert"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2147483647,
            padding: '20vh 24px 24px',
            background: '#f7eddb',
            color: '#35281d',
            fontFamily:
              "'Noto Sans SC', 'Microsoft YaHei', 'PingFang SC', sans-serif",
            fontSize: '18px',
            lineHeight: 1.7,
            textAlign: 'center',
          }}
        >
          <p style={{ margin: '0 auto 20px', maxWidth: '32rem' }}>
            页面资源未能完整加载。请检查网络连接，然后重新加载本页。已保存的实验进度不会丢失。
          </p>
          <button
            id="study-reload"
            type="button"
            style={{
              padding: '10px 22px',
              border: '1px solid #8b3f2e',
              borderRadius: '10px',
              background: '#8b3f2e',
              color: '#fffaf1',
              font: 'inherit',
            }}
          >
            重新加载
          </button>
        </div>
        <script dangerouslySetInnerHTML={{ __html: recoveryScript }} />
        {children}
      </body>
    </html>
  );
}
