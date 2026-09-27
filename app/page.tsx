'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ShieldCheck,
  Volume2,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { RankingBoard, RankingReference } from '@/components/ranking-board';
import { AudioPlayer } from '@/components/audio-player';
import {
  ITEMS,
  QUESTIONS,
  LIKERT_LABELS,
  MINIMUM_AGE,
  MAXIMUM_AGE,
  isEligibleAge,
  type View,
} from '@/lib/protocol';
import {
  ConsentInformation,
  InstructionInformation,
  ScenarioInformation,
  INFORMATION_TITLES,
  type InformationPage,
} from '@/components/study-information';
import { reviewPages } from '@/lib/navigation';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
} from '@/components/ui/alert-dialog';

type Config = {
  open: boolean;
  contact: string;
  researcher: string;
  institution: string;
  ethics: string;
  retention: string;
  session: View | null;
};
const titles: Record<string, string> = {
  consent: '知情同意',
  demographics: '基本信息',
  instructions: '实验说明',
  audio: '先确认声音',
  scenario: '沙漠中的一次经历',
  initial: '您当前的排序',
  discussion: '交流想法',
  revise: '重新评估排序',
  questionnaire: '回顾交流体验',
  complete: '感谢您的参与',
  withdrawn: '您已退出实验',
  updated: '实验内容已更新',
};
const phases = Object.keys(titles);
const actionId = () => {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
};
const startKey = () => {
  try {
    const saved = sessionStorage.getItem('survival-voice-start-key');
    if (saved && /^[a-f0-9]{64}$/.test(saved)) return saved;
  } catch {}
  const key = Array.from(crypto.getRandomValues(new Uint8Array(32)), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
  try {
    sessionStorage.setItem('survival-voice-start-key', key);
  } catch {}
  return key;
};

export default function Home() {
  const [config, setConfig] = useState<Config | null>(null),
    [session, setSession] = useState<View | null>(null);
  const [entry, setEntry] = useState('consent'),
    [eligibilityConfirmed, setEligibilityConfirmed] = useState(false),
    [consent, setConsent] = useState(false);
  const [age, setAge] = useState(''),
    [gender, setGender] = useState(''),
    [invitation, setInvitation] = useState('');
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [fading, setFading] = useState(false),
    [withdraw, setWithdraw] = useState(false);
  const [review, setReview] = useState<InformationPage | null>(null);
  const [testCondition, setTestCondition] = useState<
    'fluent' | 'disfluent' | null
  >(null);
  const [failedRequest, setFailedRequest] = useState<{
    path: string;
    body: Record<string, unknown>;
  } | null>(null);
  const card = useRef<HTMLElement>(null),
    actionLock = useRef(false),
    hiddenCount = useRef(0);
  const phase = session?.protocolMismatch
      ? 'updated'
      : (session?.phase ?? entry),
    testMode = session?.mode === 'preview' || testCondition !== null;
  const history = reviewPages(phase);
  const step = Math.min(10, phases.indexOf(phase) + 1);
  const load = useCallback(async () => {
    try {
      const requested =
        typeof window === 'undefined'
          ? null
          : new URLSearchParams(window.location.search).get('testCondition');
      const condition =
        requested === 'fluent' || requested === 'disfluent' ? requested : null;
      setTestCondition(condition);
      const query = condition ? `?testCondition=${condition}` : '';
      const r = await fetch(`/api/study${query}`, { cache: 'no-store' });
      const data = (await r.json()) as Config & { error?: string };
      if (!r.ok) throw new Error(data.error);
      setConfig(data);
      setSession(data.session);
      setError('');
    } catch (e) {
      setError(
        e instanceof TypeError || e instanceof SyntaxError
          ? '无法加载实验进度，请检查网络后重试。'
          : e instanceof Error
            ? e.message
            : '连接失败，请重新加载。',
      );
    }
  }, []);
  useEffect(() => {
    document.documentElement.dataset.studyJavascript = 'ready';
    if (
      getComputedStyle(document.documentElement)
        .getPropertyValue('--study-styles-ready')
        .trim() === '1'
    )
      document.getElementById('study-load-failure')?.setAttribute('hidden', '');
    const timer = setTimeout(() => {
      void load();
    }, 0);
    const listener = () => {
      if (document.hidden) hiddenCount.current += 1;
    };
    document.addEventListener('visibilitychange', listener);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', listener);
    };
  }, [load]);
  const sceneKey = `${phase}-${session?.discussionIndex ?? 0}`;
  useEffect(() => {
    card.current?.scrollTo({ top: 0 });
    card.current
      ?.querySelector<HTMLHeadingElement>('h1')
      ?.focus({ preventScroll: true });
  }, [sceneKey]);
  const request = async (path: string, body: Record<string, unknown>) => {
    if (actionLock.current) return null;
    actionLock.current = true;
    setBusy(true);
    setError('');
    try {
      let r: Response | null = null;
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          r = await fetch(path, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });
          if (r.status < 500 || attempt === 1) break;
        } catch (e) {
          if (attempt === 1) throw e;
        }
        await new Promise((resolve) => setTimeout(resolve, 800));
      }
      if (!r) throw new Error('连接暂时不可用，请重试同一提交。');
      if (r.status >= 500) {
        setFailedRequest({ path, body });
        throw new Error('连接暂时不可用，请重试同一提交。');
      }
      const data = (await r.json()) as Record<string, unknown>;
      if (!r.ok) {
        setFailedRequest(null);
        throw new Error(
          typeof data.error === 'string' ? data.error : '保存失败，请重试。',
        );
      }
      const next = data.session as View;
      if (
        next &&
        (next.phase !== session?.phase ||
          next.discussionIndex !== session?.discussionIndex)
      ) {
        setFading(true);
        await new Promise((resolve) => setTimeout(resolve, 140));
      }
      if (next) setSession(next);
      if (next && path === '/api/session') {
        try {
          sessionStorage.removeItem('survival-voice-start-key');
        } catch {}
      }
      setFading(false);
      setFailedRequest(null);
      if (next?.phase === 'complete') {
        try {
          localStorage.setItem('survival-voice-completed', next.id);
        } catch {}
      }
      if (next && ['complete', 'withdrawn'].includes(next.phase)) {
        try {
          for (const key of Object.keys(sessionStorage))
            if (key.startsWith(next.id + '-')) sessionStorage.removeItem(key);
        } catch {}
      }
      return data as Record<string, unknown>;
    } catch (e) {
      if (e instanceof TypeError || e instanceof SyntaxError)
        setFailedRequest({ path, body });
      setError(
        e instanceof TypeError || e instanceof SyntaxError
          ? '网络连接中断，请重试同一提交。'
          : e instanceof Error
            ? e.message
            : '网络连接中断，请重试。',
      );
      return null;
    } finally {
      actionLock.current = false;
      setBusy(false);
      setFading(false);
    }
  };
  const send = (action: string, extra: Record<string, unknown> = {}) =>
    request('/api/action', {
      action,
      actionId: actionId(),
      revision: session?.revision,
      ...extra,
    });
  const begin = () =>
    request('/api/session', {
      startKey: startKey(),
      consent: consent && eligibilityConfirmed,
      age: Number(age),
      gender,
      invitation: invitation.trim(),
      testCondition,
    });
  return (
    <main className="experiment-shell">
      <div className="paper-grain" aria-hidden="true" />
      {/* Preserve the supplied transparent frame without an image-transform service. */}
      {/* oxlint-disable-next-line next/no-img-element */}
      <img
        src="/experiment-frame.png"
        alt=""
        aria-hidden="true"
        className="ornate-frame"
      />
      <section
        ref={card}
        className={`experiment-card ${['initial', 'discussion', 'revise'].includes(phase) ? 'wide-card' : ''}`}
        aria-labelledby="page-title"
      >
        <header className="experiment-header">
          <div>
            <p className="eyebrow">荒漠生存情境研究</p>
            <p className="step-label">
              {phase === 'withdrawn' ? '参与已结束' : `第 ${step} 步，共 10 步`}
            </p>
          </div>
          <span className="study-mark">
            <ShieldCheck />
            自愿参与
          </span>
        </header>
        <Progress
          value={phase === 'withdrawn' ? 100 : step * 10}
          aria-label="实验进度"
          className="experiment-progress"
        />
        <div
          className={`content-column ${fading ? 'page-exit' : 'page-enter'}`}
          key={sceneKey}
        >
          <div className="title-block">
            <span className="section-number" aria-hidden="true">
              {phase === 'complete' ? (
                <CheckCircle2 />
              ) : (
                String(step).padStart(2, '0')
              )}
            </span>
            <div>
              <h1 id="page-title" tabIndex={-1}>
                {titles[phase]}
              </h1>
              <p>
                {session?.warmupPending
                  ? '请先完整收听交流前的语音。'
                  : phase === 'discussion'
                    ? `第 ${(session?.discussionIndex ?? 0) + 1} 项，共 ${ITEMS.length} 项 · 请按提示完成交流`
                    : phase === 'consent'
                      ? '请先阅读参与说明。整个任务预计需要约 15 分钟。'
                      : ''}
              </p>
            </div>
          </div>
          {error && (
            <div className="error-box" role="alert">
              <p>{error}</p>
              {failedRequest ? (
                <Button
                  variant="outline"
                  onClick={() =>
                    void request(failedRequest.path, failedRequest.body)
                  }
                  disabled={busy}
                >
                  重试同一提交
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => void load()}
                  disabled={busy}
                >
                  重新加载已保存进度
                </Button>
              )}
            </div>
          )}
          {phase === 'updated' && session && (
            <div className="notice-card">
              <RotateCcw />
              <div>
                <p>实验内容已更新。旧版记录会保留，但不能与新流程混用。</p>
                <p>请联系研究人员处理您的原有参与记录，不要重新参加。</p>
                {session.completionCode && (
                  <p>原完成码：{session.completionCode}</p>
                )}
              </div>
            </div>
          )}
          {phase === 'consent' && (
            <>
              <div className="notice-card">
                <Volume2 />
                <div>
                  <strong>请全程保持声音开启</strong>
                  <p>
                    本实验含语音内容。请在安静的环境中，使用能清楚听到声音的设备。开始前需要完成声音检查。
                  </p>
                </div>
              </div>
              <ConsentInformation config={config} />
              <fieldset className="consent-checks">
                <legend className="sr-only">参与同意</legend>
                <label className="consent-option" htmlFor="age-eligibility">
                  <Checkbox
                    id="age-eligibility"
                    checked={eligibilityConfirmed}
                    onCheckedChange={(v) => setEligibilityConfirmed(v === true)}
                  />
                  <span>
                    参与者需要在{MINIMUM_AGE}-{MAXIMUM_AGE}
                    岁之间，已阅读并理解以上说明。
                  </span>
                </label>
                <label className="consent-option" htmlFor="study-consent">
                  <Checkbox
                    id="study-consent"
                    checked={consent}
                    onCheckedChange={(v) => setConsent(v === true)}
                  />
                  <span>
                    我自愿参与，同意记录上述数据，并理解部分研究细节会在结束时说明。
                  </span>
                </label>
              </fieldset>
              <div className="action-row">
                <Button variant="ghost" onClick={() => setWithdraw(true)}>
                  不同意并退出
                </Button>
                <Button
                  className="primary-action"
                  disabled={!eligibilityConfirmed || !consent || !config}
                  onClick={() => setEntry('demographics')}
                >
                  同意并继续
                  <ArrowRight />
                </Button>
              </div>
            </>
          )}
          {phase === 'demographics' && (
            <div className="form-stack">
              <p>以下信息仅用于研究分析。请按实际情况填写。</p>
              <label className="field-label" htmlFor="age">
                年龄（周岁）
                <Input
                  id="age"
                  type="number"
                  min={MINIMUM_AGE}
                  max={MAXIMUM_AGE}
                  inputMode="numeric"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="请输入 12–65 周岁的年龄"
                />
              </label>
              <fieldset>
                <legend>性别</legend>
                <RadioGroup
                  value={gender}
                  onValueChange={(v) => setGender(String(v))}
                  className="gender-options"
                >
                  {[
                    ['woman', '女性'],
                    ['man', '男性'],
                  ].map(([value, label]) => (
                    <label key={value} className="choice-label">
                      <RadioGroupItem value={value} />
                      <span>{label}</span>
                    </label>
                  ))}
                </RadioGroup>
              </fieldset>
              {!testMode && (
                <label className="field-label" htmlFor="invitation">
                  参与码
                  <Input
                    id="invitation"
                    autoComplete="off"
                    value={invitation}
                    onChange={(e) => setInvitation(e.target.value)}
                    placeholder="输入研究人员发放的参与码"
                  />
                  <small>每人限参加一次，请使用发放给您的参与码。</small>
                </label>
              )}
              <div className="action-row">
                <p>请勿在多个窗口同时进行实验。</p>
                <Button
                  className="primary-action"
                  disabled={
                    busy ||
                    !gender ||
                    !age ||
                    !isEligibleAge(Number(age)) ||
                    (!testMode && !invitation.trim())
                  }
                  onClick={() => void begin()}
                >
                  {busy ? '正在保存…' : '保存并继续'}
                  <ArrowRight />
                </Button>
              </div>
            </div>
          )}
          {phase === 'instructions' && (
            <>
              <InstructionInformation />
              <Next busy={busy} onClick={() => void send('instructions')}>
                开始声音检查
              </Next>
            </>
          )}
          {phase === 'audio' && <SoundCheck send={send} busy={busy} />}
          {phase === 'scenario' && (
            <>
              <ScenarioInformation />
              <Next busy={busy} onClick={() => void send('scenario')}>
                开始独立排序
              </Next>
            </>
          )}
          {phase === 'initial' && session && (
            <>
              <ScenarioInformation />
              <RankingBoard
                initial={[]}
                draftKey={`${session.id}-initial`}
                busy={busy}
                onConfirm={(ranking, events) =>
                  void send('initial', { ranking, events })
                }
              />
            </>
          )}
          {phase === 'discussion' &&
            session &&
            (session.warmupPending ? (
              <AudioPlayer
                key="warmup"
                session={session}
                send={send}
                busy={busy}
              />
            ) : (
              <div className="discussion-layout">
                <RankingReference
                  order={session.initial}
                  title="您的当前排序"
                  current={session.currentItem}
                />
                <Discussion
                  key={session.currentItem}
                  session={session}
                  send={send}
                  busy={busy}
                />
              </div>
            ))}
          {phase === 'revise' && session && (
            <>
              <p className="stage-intro">
                逐项交流已完成。下面展示您之前的排序与助手提供的排序建议。请根据自己的判断修改或确认下方排序。
              </p>
              <ScenarioInformation />
              <div className="revision-layout">
                <aside className="ai-suggestion">
                  <RankingReference
                    order={session.ai!}
                    title="AI 助手的排序建议"
                  />
                </aside>
                <section className="editable-ranking" aria-label="您的当前排序">
                  <h2>您的当前排序</h2>
                  <RankingBoard
                    initial={session.initial}
                    draftKey={`${session.id}-final`}
                    final
                    busy={busy}
                    onConfirm={(ranking, events) =>
                      void send('final', { ranking, events })
                    }
                  />
                </section>
              </div>
            </>
          )}
          {phase === 'questionnaire' && session && (
            <Questionnaire
              session={session}
              busy={busy}
              onSubmit={(answers, responseMs) =>
                void send('submit', {
                  answers,
                  responseMs,
                  hiddenCount: hiddenCount.current,
                })
              }
            />
          )}
          {phase === 'complete' && session && (
            <>
              <div className="completion-box">
                <CheckCircle2 />
                <p>您的回答已成功提交，不能再次提交或修改。</p>
                <span>完成码</span>
                <strong>{session.completionCode}</strong>
              </div>
              <div className="debrief-copy">
                <h2>研究说明</h2>
                <p>
                  本研究考察 AI
                  语音中的填充性停顿（例如“嗯”“呃”）如何影响人们的判断调整和交流体验。参与者被随机分配到两种语音条件之一，两种条件的区别仅在于语音中是否包含填充性停顿。所有语音均为事先准备的录音，并非根据您输入的理由实时生成。
                  您被分配到的是
                  {session.condition === 'disfluent'
                    ? '填充性停顿'
                    : '流畅语音'}
                  条件。
                </p>
                <p>
                  助手的排序由您的当前排序按固定规则转换得到，并不是专家给出的标准答案。研究关注您听取意见后如何调整排序，以及您感受到的社会临场感。预先不说明这些细节，是为了减少对判断的影响。
                </p>
                <p>
                  您无需迎合助手提供的信息，采纳或不采纳均没有对错。感谢您的时间与认真参与。
                </p>
                {config?.contact && (
                  <p>
                    如有疑问或需要按照研究说明申请数据撤回，请联系{' '}
                    {config.contact}，并提供完成码。
                  </p>
                )}
              </div>
            </>
          )}
          {phase === 'withdrawn' && (
            <div className="completion-box">
              <ShieldCheck />
              <p>感谢您的考虑。本次参与已经结束。</p>
              <p>您可以关闭此页面。</p>
            </div>
          )}
          {phase === 'demographics' && (
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => setEntry('consent')}
            >
              返回
            </Button>
          )}
          {!!history.length && (
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => setReview(history[0])}
            >
              返回
            </Button>
          )}
          {!['complete', 'withdrawn'].includes(session?.phase ?? phase) && (
            <footer className="experiment-footer">
              <span>已确认的进度会自动保存</span>
              <Button
                variant="ghost"
                disabled={busy}
                onClick={() => setWithdraw(true)}
              >
                退出实验
              </Button>
            </footer>
          )}
        </div>
      </section>
      <Dialog
        open={!!review}
        onOpenChange={(open) => {
          if (!open) setReview(null);
        }}
      >
        <DialogContent
          className="information-review relative"
          showCloseButton={false}
        >
          <DialogTitle>
            {review ? INFORMATION_TITLES[review] : '回顾说明'}
          </DialogTitle>
          <Button
            className="absolute right-3 top-3 h-8 w-8 p-0"
            onClick={() => setReview(null)}
            aria-label="关闭说明"
          >
            ×
          </Button>
          {review === 'consent' && <ConsentInformation config={config} />}
          {review === 'instructions' && <InstructionInformation />}
          {review === 'scenario' && <ScenarioInformation />}
          <div className="button-row">
            {review && history.indexOf(review) > 0 && (
              <Button
                variant="outline"
                onClick={() => setReview(history[history.indexOf(review) - 1])}
              >
                上一页
              </Button>
            )}
            {review && history.indexOf(review) < history.length - 1 && (
              <Button
                onClick={() => setReview(history[history.indexOf(review) + 1])}
              >
                下一页
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={() => {
                setReview(null);
                setWithdraw(true);
              }}
            >
              退出实验
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={withdraw}
        onOpenChange={(open) => {
          if (!busy) setWithdraw(open);
        }}
      >
        <AlertDialogContent className="study-confirmation">
          <AlertDialogTitle>确认退出实验？</AlertDialogTitle>
          <AlertDialogDescription>
            {session
              ? '确认退出后，您将无法再次参与本实验。本次实验产生的回答记录与基本信息将被删除；仅保留匿名参与状态信息，以避免重复参与。'
              : '您尚未开始正式实验，本页尚未提交研究数据。确认离开吗？开始正式实验后，若确认退出，将无法再次参与。'}
          </AlertDialogDescription>
          <div className="button-row">
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => setWithdraw(false)}
            >
              返回
            </Button>
            <Button
              variant="destructive"
              disabled={busy}
              onClick={async () => {
                if (session) {
                  const result = await send('withdraw');
                  if (!result) return;
                } else {
                  setEntry('withdrawn');
                  setAge('');
                  setGender('');
                  setConsent(false);
                  setEligibilityConfirmed(false);
                }
                setWithdraw(false);
              }}
            >
              确认退出
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
function Next({
  busy,
  onClick,
  children,
}: {
  busy: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="action-row end">
      <Button className="primary-action" disabled={busy} onClick={onClick}>
        {busy ? '正在保存…' : children}
        <ArrowRight />
      </Button>
    </div>
  );
}
type Send = (
  action: string,
  extra?: Record<string, unknown>,
) => Promise<Record<string, unknown> | null>;
function SoundCheck({ send, busy }: { send: Send; busy: boolean }) {
  const [played, setPlayed] = useState(false),
    [playing, setPlaying] = useState(false),
    [answer, setAnswer] = useState(''),
    [message, setMessage] = useState('');
  const context = useRef<AudioContext | null>(null);
  useEffect(
    () => () => {
      if (context.current?.state !== 'closed') void context.current?.close();
    },
    [],
  );
  const play = async () => {
    setPlayed(false);
    setAnswer('');
    setMessage('');
    setPlaying(true);
    try {
      const audio = new AudioContext();
      context.current = audio;
      await audio.resume();
      const r = await send('tone_start');
      if (!r) {
        await audio.close();
        setPlaying(false);
        return;
      }
      const count = Number(r.beeps),
        start = audio.currentTime + 0.12;
      for (let i = 0; i < count; i++) {
        const oscillator = audio.createOscillator(),
          gain = audio.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.value = 650;
        gain.gain.setValueAtTime(0, start + i * 0.65);
        gain.gain.linearRampToValueAtTime(0.12, start + i * 0.65 + 0.02);
        gain.gain.setValueAtTime(0.12, start + i * 0.65 + 0.2);
        gain.gain.linearRampToValueAtTime(0, start + i * 0.65 + 0.24);
        oscillator.connect(gain);
        gain.connect(audio.destination);
        oscillator.start(start + i * 0.65);
        oscillator.stop(start + i * 0.65 + 0.26);
      }
      await new Promise((resolve) => setTimeout(resolve, count * 650 + 300));
      if (audio.state !== 'running' || document.hidden)
        setMessage('播放受到中断，请重新检查声音。');
      else setPlayed(true);
      await audio.close();
    } catch {
      setMessage('无法播放声音，请确认设备和浏览器允许音频播放后重试。');
    }
    setPlaying(false);
  };
  return (
    <div className="sound-check">
      <div className="sound-icon">
        <Volume2 />
      </div>
      <p>
        请打开设备声音，确认没有将浏览器标签页静音。点击下方按钮，数一数您听到了几声短音。
      </p>
      <Button
        variant="outline"
        disabled={busy || playing}
        onClick={() => void play()}
      >
        <Volume2 />
        {playing ? '正在播放…' : played ? '重新播放检查音' : '播放检查音'}
      </Button>
      {message && <p role="alert">{message}</p>}
      {played && (
        <div className="item-enter">
          <fieldset>
            <legend>您听到了几声短音？</legend>
            <RadioGroup
              value={answer}
              onValueChange={(v) => setAnswer(String(v))}
              className="sound-choices"
            >
              {[2, 3, 4, 5].map((n) => (
                <label key={n} className="choice-label">
                  <RadioGroupItem value={String(n)} />
                  {n} 声
                </label>
              ))}
            </RadioGroup>
          </fieldset>
          <Button
            className="primary-action"
            disabled={!answer || busy}
            onClick={() => {
              setPlayed(false);
              setAnswer('');
              void send('tone_answer', { count: Number(answer) });
            }}
          >
            确认并继续
            <ArrowRight />
          </Button>
        </div>
      )}
      <p className="subtle">
        若听不清，请提高设备音量后重新播放。实验过程中请一直保持声音开启。
      </p>
    </div>
  );
}
function Discussion({
  session,
  send,
  busy,
}: {
  session: View;
  send: Send;
  busy: boolean;
}) {
  const item = ITEMS.find((x) => x.id === session.currentItem)!;
  const [selected, setSelected] = useState<string[]>([]),
    [other, setOther] = useState('');
  const reasonOptions = [
    {
      title: '这件物品比较重要，因为：',
      options: [
        '可以直接满足团队当前需求',
        '能够提供生存所需的资源或帮助',
        '能够解决当前情境中的具体问题',
        '有助于寻找方向或了解周围环境',
        '有助于获得救援或引起他人注意',
        '用途较多，可以用于不同情况',
        '可以与其他物品配合使用',
        '我认为该物品在当前情况下较为重要',
      ],
    },
    {
      title: '这件物品没那么重要，因为：',
      options: [
        '受到当前环境条件限制',
        '需要其他条件才能发挥作用',
        '相比其他物品，作用较有限',
        '我认为其他物品比它更值得优先考虑',
      ],
    },
  ];
  const otherOption = '其他原因';
  const started = useRef(0);
  useEffect(() => {
    started.current = performance.now();
  }, []);
  return (
    <div className="discussion-focus">
      <div className="item-focus-title">
        <span className="discussing-tag">当前物品 →</span>
        <h2>{item.label}</h2>
        <p>{item.detail}</p>
        <span>您的排名：第 {session.initial.indexOf(item.id) + 1} 位</span>
      </div>
      {!session.reason ? (
        <div className="reason-form">
          <label htmlFor="reason">您为什么把这件物品排在这个位置？</label>
          <div className="reason-option-group-wrap">
            {reasonOptions.map((group) => (
              <fieldset key={group.title} className="reason-option-group">
                <legend>{group.title}</legend>
                <div className="reason-options">
                  {group.options.map((option) => (
                    <label key={option} className="choice-label">
                      <Checkbox
                        checked={selected.includes(option)}
                        disabled={
                          busy ||
                          (!selected.includes(option) && selected.length >= 5)
                        }
                        onCheckedChange={(v) =>
                          setSelected((s) =>
                            v === true
                              ? [...s, option]
                              : s.filter((x) => x !== option),
                          )
                        }
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
            <fieldset className="reason-option-group">
              <legend>其他原因：</legend>
              <label className="choice-label">
                <Checkbox
                  checked={selected.includes(otherOption)}
                  disabled={
                    busy ||
                    (!selected.includes(otherOption) && selected.length >= 5)
                  }
                  onCheckedChange={(v) =>
                    setSelected((s) =>
                      v === true
                        ? [...s, otherOption]
                        : s.filter((x) => x !== otherOption),
                    )
                  }
                />
                {otherOption}
              </label>
              {selected.includes(otherOption) && (
                <Textarea
                  id="reason"
                  value={other}
                  maxLength={500}
                  onChange={(e) => setOther(e.target.value)}
                  placeholder="请填写其他原因"
                  disabled={busy}
                />
              )}
            </fieldset>
          </div>
          <div className="reason-footer">
            <small>{selected.length} / 5 项</small>
            <Button
              className="primary-action"
              disabled={
                busy ||
                selected.length < 1 ||
                (selected.includes(otherOption) && other.trim().length < 1)
              }
              onClick={() =>
                void send('reason', {
                  item: item.id,
                  reasonOptions: selected,
                  otherReason: other.trim(),
                  responseMs: Math.round(performance.now() - started.current),
                })
              }
            >
              {busy ? '正在保存…' : '说明理由并听取助手建议'}
              <ArrowRight />
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="submitted-reason">
            <span>
              <Check />
              您的理由
            </span>
            <p>{session.reason}</p>
          </div>
          <AudioPlayer
            key={item.id}
            session={session}
            send={send}
            busy={busy}
          />
        </>
      )}
    </div>
  );
}
function Questionnaire({
  session,
  busy,
  onSubmit,
}: {
  session: View;
  busy: boolean;
  onSubmit: (answers: number[], ms: number) => void;
}) {
  const [answers, setAnswers] = useState<number[]>(() => {
    try {
      const a = JSON.parse(
        sessionStorage.getItem(`${session.id}-survey`) ?? 'null',
      );
      if (
        Array.isArray(a) &&
        a.length === 5 &&
        a.every((v) => Number.isInteger(v) && v >= 0 && v <= 7)
      )
        return a;
    } catch {}
    return Array(5).fill(0);
  });
  const [confirming, setConfirming] = useState(false);
  const started = useRef(0);
  useEffect(() => {
    started.current = performance.now();
  }, []);
  useEffect(() => {
    try {
      sessionStorage.setItem(`${session.id}-survey`, JSON.stringify(answers));
    } catch {}
  }, [answers, session.id]);
  return (
    <div className="questionnaire">
      <p className="stage-intro">
        排序任务已完成。请回想刚才与 AI
        语音助手的交流，选择您对以下描述的同意程度。
      </p>
      <p className="scale-intro">1 = 非常不同意，4 = 一般，7 = 非常同意</p>
      {QUESTIONS.map((q, index) => (
        <fieldset key={q.id} className="likert-question">
          <legend>
            <span>{index + 1}.</span> {q.text}
          </legend>
          <RadioGroup
            value={answers[index] ? String(answers[index]) : ''}
            onValueChange={(v) =>
              setAnswers(
                answers.map((old, i) => (i === index ? Number(v) : old)),
              )
            }
            className="likert-scale"
            disabled={busy || confirming}
            aria-label={q.text}
          >
            {LIKERT_LABELS.map((label, i) => (
              <label
                className={`likert-choice ${answers[index] === i + 1 ? 'chosen' : ''}`}
                key={i}
              >
                <RadioGroupItem
                  value={String(i + 1)}
                  aria-label={`${i + 1}，${label}`}
                />
                <strong>{i + 1}</strong>
                <small>{label}</small>
              </label>
            ))}
          </RadioGroup>
        </fieldset>
      ))}
      <div className="confirmation-box">
        {confirming ? (
          <>
            <p>确认提交全部回答？</p>
            <div className="button-row">
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => setConfirming(false)}
              >
                返回
              </Button>
              <Button
                className="primary-action"
                disabled={busy}
                onClick={() =>
                  onSubmit(
                    answers,
                    Math.round(performance.now() - started.current),
                  )
                }
              >
                {busy ? '正在提交…' : '确认提交'}
                <Check />
              </Button>
            </div>
          </>
        ) : (
          <div className="action-row">
            <p>已回答 {answers.filter(Boolean).length} / 5 题</p>
            <Button
              className="primary-action"
              disabled={busy || !answers.every((n) => n >= 1 && n <= 7)}
              onClick={() => setConfirming(true)}
            >
              提交问卷
              <ArrowRight />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
