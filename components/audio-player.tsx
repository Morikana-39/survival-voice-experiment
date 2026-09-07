'use client';
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { Play, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import type { View } from '@/lib/protocol';
type Send = (
  action: string,
  extra?: Record<string, unknown>,
) => Promise<Record<string, unknown> | null>;
export function AudioPlayer({
  session,
  send,
  busy,
}: {
  session: View;
  send: Send;
  busy: boolean;
}) {
  const media = useRef<HTMLAudioElement>(null),
    elapsed = useRef(0),
    last = useRef(0),
    interruptions = useRef(0),
    playing = useRef(false);
  const [status, setStatus] = useState<'idle' | 'playing' | 'done' | 'error'>(
      'idle',
    ),
    [message, setMessage] = useState(
      '请完整听完助手的理由，再继续讨论下一项。',
    ),
    [fraction, setFraction] = useState(0),
    [heard, setHeard] = useState(false);
  const account = () => {
    const now = performance.now();
    if (playing.current && last.current) elapsed.current += now - last.current;
    last.current = now;
  };
  const interrupt = (text: string) => {
    account();
    playing.current = false;
    media.current?.pause();
    elapsed.current = 0;
    interruptions.current += 1;
    setFraction(0);
    setHeard(false);
    setStatus('error');
    setMessage(text);
  };
  useEffect(() => {
    const audio = media.current;
    const onHidden = () => {
      if (document.hidden && playing.current)
        interrupt('播放已中断。返回页面后，请从头重新收听。');
    };
    document.addEventListener('visibilitychange', onHidden);
    return () => {
      document.removeEventListener('visibilitychange', onHidden);
      playing.current = false;
      audio?.pause();
    };
  }, []);
  const play = async () => {
    const a = media.current;
    if (!a || document.hidden) return;
    setMessage('正在准备语音…');
    const result = await send('play_start');
    if (!result) return;
    a.currentTime = 0;
    a.playbackRate = 1;
    elapsed.current = 0;
    last.current = performance.now();
    setHeard(false);
    setFraction(0);
    try {
      await a.play();
      setStatus('playing');
      setMessage('正在播放，请保持页面打开。');
    } catch {
      setStatus('error');
      setMessage('浏览器未允许播放，请打开声音后再次点击播放。');
    }
  };
  const autoPlay = useEffectEvent(() => {
    void play();
  });
  useEffect(() => {
    if (!session.audioSrc) return;
    const timer = setTimeout(() => autoPlay(), 0);
    return () => clearTimeout(timer);
  }, [session.audioSrc]);
  return (
    <div className="audio-panel">
      <div
        className={`voice-bars ${status === 'playing' ? 'active' : ''}`}
        aria-hidden="true"
      >
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <span key={i} style={{ animationDelay: `${i * 80}ms` }} />
        ))}
      </div>
      <h3>
        {session.mode === 'preview'
          ? 'AI 语音助手 · 流畅语音试听'
          : 'AI 语音助手'}
      </h3>
      {session.mode === 'preview' && (
        <p>
          预览仅播放已上传的流畅语音，不代表正式随机分组。停顿版语音待加入。
        </p>
      )}
      <output className="audio-status">{message}</output>
      {/* A transcript would change the auditory experimental stimulus. */}
      {/* oxlint-disable-next-line jsx-a11y/media-has-caption */}
      <audio
        ref={media}
        src={session.audioSrc ?? undefined}
        preload="auto"
        onPlaying={() => {
          last.current = performance.now();
          playing.current = true;
          setStatus('playing');
        }}
        onTimeUpdate={() => {
          const a = media.current!;
          account();
          setFraction(a.duration ? Math.min(1, a.currentTime / a.duration) : 0);
        }}
        onWaiting={() => {
          account();
          playing.current = false;
        }}
        onPause={() => {
          if (playing.current && !media.current?.ended)
            interrupt('播放已暂停，请从头重新收听。');
        }}
        onError={() => interrupt('语音未能加载。请检查网络后重新播放。')}
        onVolumeChange={() => {
          if (media.current?.muted || media.current?.volume === 0)
            interrupt('检测到播放器静音，请恢复声音并重新播放。');
        }}
        onRateChange={() => {
          if (media.current?.playbackRate !== 1)
            interrupt('请以正常速度完整播放语音。');
        }}
        onSeeking={() => {
          if (
            playing.current &&
            media.current &&
            media.current.currentTime * 1000 > elapsed.current + 1200
          )
            interrupt('请从头完整收听，不能跳过语音。');
        }}
        onEnded={() => {
          account();
          playing.current = false;
          const a = media.current!;
          if (
            document.hidden ||
            a.muted ||
            a.volume === 0 ||
            !Number.isFinite(a.duration) ||
            elapsed.current < a.duration * 1000 - 150
          ) {
            interrupt('播放不完整，请重新收听。');
            return;
          }
          setStatus('done');
          setFraction(1);
          setMessage('语音已播放完毕。');
        }}
      />
      <progress
        className="audio-progress"
        value={fraction}
        max={1}
        aria-label="语音播放进度"
      />
      {status !== 'playing' && status !== 'done' && (
        <Button variant="outline" disabled={busy} onClick={() => void play()}>
          {status === 'error' ? <RotateCcw /> : <Play />}从头播放
        </Button>
      )}
      {status === 'done' && (
        <>
          <label className="heard-option" htmlFor="heard-clip">
            <Checkbox
              id="heard-clip"
              checked={heard}
              onCheckedChange={(v) => setHeard(v === true)}
            />
            我已清楚听到完整语音
          </label>
          <Button
            className="primary-action"
            disabled={busy || !heard}
            onClick={() =>
              void send('exposure', {
                item: session.currentItem,
                skipped: false,
                interruptions: interruptions.current,
                durationMs: Math.round(media.current!.duration * 1000),
                listenedMs: Math.round(elapsed.current),
              })
            }
          >
            继续
          </Button>
        </>
      )}
      {session.mode === 'preview' && (
        <Button
          variant="ghost"
          disabled={busy}
          onClick={() => {
            // A skipped test clip is recorded explicitly and never enters study exports.
            playing.current = false;
            media.current?.pause();
            void send('exposure', {
              item: session.currentItem,
              skipped: true,
              interruptions: interruptions.current,
            });
          }}
        >
          仅测试：跳过本段语音
        </Button>
      )}
    </div>
  );
}
