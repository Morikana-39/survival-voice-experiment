'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ShieldCheck,
  Volume2,
  Compass,
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
  isEligibleAge,
  type View,
} from '@/lib/protocol';
import { usePreviewTools } from '@/hooks/use-preview-tools';

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
  scenario: '沙漠中的一次决定',
  initial: '您的初始排序',
  discussion: '交换想法',
  revise: '您的最终决定',
  questionnaire: '回顾交流体验',
  complete: '感谢您的参与',
  withdrawn: '您已退出实验',
  updated: '实验内容已更新',
};
const phases = Object.keys(titles);

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
  const [restart, setRestart] = useState(false),
    [previewRequested, setPreviewRequested] = useState(false);
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
    preview = session
      ? session.mode === 'preview'
      : previewRequested || !config?.open;
  const step = Math.min(10, phases.indexOf(phase) + 1);
  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/study', { cache: 'no-store' });
      const data = (await r.json()) as Config & { error?: string };
      if (!r.ok) throw new Error(data.error);
      setConfig(data);
      setSession(data.session);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : '连接失败，请重新加载。');
    }
  }, []);
  useEffect(() => {
    const timer = setTimeout(() => {
      setPreviewRequested(
        new URLSearchParams(location.search).get('preview') === '1',
      );
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
      const r = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
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
      if (e instanceof TypeError) setFailedRequest({ path, body });
      setError(e instanceof Error ? e.message : '网络连接中断，请重试。');
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
      actionId: crypto.randomUUID(),
      revision: session?.revision,
      ...extra,
    });
  const begin = () =>
    request('/api/session', {
      consent: consent && eligibilityConfirmed,
      age: Number(age),
      gender,
      invitation: invitation.trim(),
      preview,
      restart,
    });
  const restartPreview = () => {
    setSession(null);
    setRestart(true);
    setEntry('consent');
    setEligibilityConfirmed(false);
    setConsent(false);
    setError('');
    setFailedRequest(null);
    setWithdraw(false);
  };
  usePreviewTools(preview, phase, busy, restartPreview);
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
            <p className="eyebrow">荒漠生存决策研究</p>
            <p className="step-label">
              {phase === 'withdrawn' ? '参与已结束' : `第 ${step} 步，共 10 步`}
            </p>
          </div>
          <span className="study-mark">
            <ShieldCheck />
            {preview ? '流程预览' : '自愿参与'}
          </span>
        </header>
        <Progress
          value={phase === 'withdrawn' ? 100 : step * 10}
          aria-label="实验进度"
          className="experiment-progress"
        />
        {preview && (
          <div className="preview-ribbon">
            预览版 · 12 项物品 · 流畅语音试听 · 本次回答不计入正式研究
          </div>
        )}
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
                {phase === 'discussion'
                  ? `第 ${(session?.discussionIndex ?? 0) + 1} 项，共 ${ITEMS.length} 项 · 请按提示依次交流`
                  : phase === 'consent'
                    ? '请先阅读参与说明。整个任务预计需要 20–30 分钟。'
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
                <p>
                  本页已更新为 12 项物品。旧版记录会保留，但不能与新流程混用。
                </p>
                {preview ? (
                  <Button disabled={busy} onClick={restartPreview}>
                    重新开始 12 项预览
                  </Button>
                ) : (
                  <p>请联系研究人员处理您的原有参与记录，不要重新参加。</p>
                )}
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
              <div className="consent-copy">
                <p>
                  本研究关注人们与 AI
                  语音助手交流时的决策与体验。您将阅读一个虚构的沙漠生存情境，对{' '}
                  {ITEMS.length}{' '}
                  件物品排序，逐项输入简短理由、收听助手的看法，然后再次排序并填写
                  5 道问卷题。
                </p>
                <p>
                  参与完全自愿，您可以在最终提交前点击“退出实验”。退出时会清除本次已记录的回答与基本信息，并保留参与码的使用状态以防止重复参加。虚构情境涉及飞机迫降；如感到不适，可随时退出。
                </p>
                <p>
                  我们记录年龄、性别选项、排序、文字理由、语音播放情况和作答时间，不要求姓名或手机号，也不录制您的声音。请不要在理由中输入身份或联系方式。浏览器使用会话标识来恢复进度并防止重复提交。
                </p>
                <p>
                  研究结束后会解释具体研究目的。为避免影响您的判断，部分研究细节将在最后告知。
                </p>
                <p className="draft-note">
                  未成年人正式参与前，研究人员需落实经审核的监护人许可、参与者本人同意及数据保护流程。本页的勾选不能代替监护人许可；预览测试请勿提交未成年人的真实资料。
                </p>
                {config?.contact ? (
                  <p>
                    研究人员：{config.researcher}（{config.institution}）<br />
                    联系方式：{config.contact}
                    <br />
                    数据保存：{config.retention}
                    {config.ethics && (
                      <>
                        <br />
                        伦理审核编号：{config.ethics}
                      </>
                    )}
                  </p>
                ) : (
                  <p className="draft-note">
                    预览提示：正式招募前，研究人员将补充机构、联系方式、数据保存期限和经确认的知情同意说明。
                  </p>
                )}
              </div>
              <fieldset className="consent-checks">
                <legend className="sr-only">参与同意</legend>
                <label className="consent-option" htmlFor="age-eligibility">
                  <Checkbox
                    id="age-eligibility"
                    checked={eligibilityConfirmed}
                    onCheckedChange={(v) => setEligibilityConfirmed(v === true)}
                  />
                  <span>
                    {preview ? '本次测试使用的虚构年龄不小于' : '我已年满'}{' '}
                    {MINIMUM_AGE} 周岁，已阅读并理解以上说明。
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
                <Button variant="ghost" onClick={() => setEntry('withdrawn')}>
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
              <p>
                {preview
                  ? '预览仅供研究人员测试。请使用虚构年龄和其他测试信息，不要填写未成年人的真实资料。'
                  : '以下信息仅用于研究分析。请按实际情况填写。'}
              </p>
              <label className="field-label" htmlFor="age">
                年龄（周岁）
                <Input
                  id="age"
                  type="number"
                  min={MINIMUM_AGE}
                  inputMode="numeric"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="请输入年龄"
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
                    ['other', '其他'],
                    ['undisclosed', '不愿透露'],
                  ].map(([value, label]) => (
                    <label key={value} className="choice-label">
                      <RadioGroupItem value={value} />
                      <span>{label}</span>
                    </label>
                  ))}
                </RadioGroup>
              </fieldset>
              {!preview && (
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
                    (!preview && !invitation.trim())
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
              <div className="instruction-steps">
                {[
                  [
                    '独立判断',
                    '先阅读情境，将全部物品按生存重要性排序。没有必须达到的分数。',
                  ],
                  [
                    '逐项交流',
                    '您先说明理由，再听 AI 语音助手的看法。讨论顺序由实验设定，与您的排名无关。',
                  ],
                  [
                    '再次决定',
                    '所有物品讨论完后，您将看到双方排序，可自行决定保留或调整。',
                  ],
                  ['分享感受', '最后请根据真实体验回答问卷。'],
                ].map(([title, detail], i) => (
                  <div key={title}>
                    <span>{i + 1}</span>
                    <div>
                      <h2>{title}</h2>
                      <p>{detail}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="notice-card">
                <Compass />
                <p>
                  请独立完成，不搜索资料、不与他人讨论。助手的意见供参考，不一定完整或正确。是否采纳由您决定。
                </p>
              </div>
              <Next busy={busy} onClick={() => void send('instructions')}>
                开始声音检查
              </Next>
            </>
          )}
          {phase === 'audio' && <SoundCheck send={send} busy={busy} />}
          {phase === 'scenario' && (
            <>
              <div className="scenario-facts">
                <span>8 月中旬</span>
                <span>上午 10:00</span>
                <span>美国西南部 · 索诺兰沙漠</span>
              </div>
              <div className="scenario-copy">
                <p>
                  想象您与同行者正在美国旅行。一个 8 月中旬的上午，约 10
                  点，你们乘坐的小型飞机在索诺兰沙漠迫降。
                </p>
                <p>
                  你们都能正常行动，但无法使用通讯设备。周围炎热干燥，暂时看不到居民点；救援到达的时间不确定。你们从飞机中取出了下面{' '}
                  {ITEMS.length} 件物品。
                </p>
                <p>
                  您的任务是根据这些物品对团队生存的重要性排序：
                  <strong>第 1 位最重要，第 {ITEMS.length} 位最不重要</strong>
                  。请只依据此情境和自己的判断完成任务。
                </p>
              </div>
              <p className="subtle">
                这是用于研究的虚构情境，不构成现实中的野外求生建议。物品数量及规格在排序时可查看。
              </p>
              <Next busy={busy} onClick={() => void send('scenario')}>
                开始独立排序
              </Next>
            </>
          )}
          {phase === 'initial' && session && (
            <RankingBoard
              initial={[]}
              draftKey={`${session.id}-initial`}
              busy={busy}
              onConfirm={(ranking, events) =>
                void send('initial', { ranking, events })
              }
            />
          )}
          {phase === 'discussion' && session && (
            <div className="discussion-layout">
              <RankingReference
                order={session.initial}
                title="您的初始排序"
                current={session.currentItem}
              />
              <Discussion
                key={session.currentItem}
                session={session}
                send={send}
                busy={busy}
              />
            </div>
          )}
          {phase === 'revise' && session && (
            <>
              <p className="stage-intro">
                逐项交流已完成。下面是您最初的排序与助手的排序。请根据自己的判断，调整下方的最终排序；也可以保持不变。
              </p>
              <div className="comparison">
                <RankingReference
                  order={session.initial}
                  title="您的初始排序"
                />
                <RankingReference order={session.ai!} title="AI 助手的排序" />
              </div>
              <h2 className="editor-title">调整您的最终排序</h2>
              <RankingBoard
                initial={session.initial}
                draftKey={`${session.id}-final`}
                final
                busy={busy}
                onConfirm={(ranking, events) =>
                  void send('final', { ranking, events })
                }
              />
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
                <p>
                  {preview
                    ? '本次预览已完成，回答不会进入正式研究分析。'
                    : '您的回答已成功提交，不能再次提交或修改。'}
                </p>
                <span>完成码</span>
                <strong>{session.completionCode}</strong>
              </div>
              <div className="debrief-copy">
                <h2>研究说明</h2>
                <p>
                  本研究考察 AI
                  语音中是否出现填充性停顿（例如“嗯”“呃”）对人们的决策和交流体验的影响。参与者被随机分配到两种语音条件之一。所有语音均为事先准备的录音，并非根据您输入的理由即时生成。
                </p>
                <p>
                  助手的排序由您的初始排序按固定规则转换得到，并不是专家给出的标准答案。研究关注您听取意见后如何调整排序，以及您感受到的社会临场感。预先不说明这些细节，是为了减少对判断的影响。
                </p>
                <p>
                  您无需迎合助手的意见，采纳或不采纳均没有对错。感谢您的时间与认真参与。
                </p>
                {config?.contact && (
                  <p>
                    如有疑问或需要按照研究说明申请数据撤回，请联系{' '}
                    {config.contact}，并提供完成码。
                  </p>
                )}
              </div>
              {preview && (
                <div className="action-row">
                  <p>您可以重新体验；新的预览会话仍与正式数据分开。</p>
                  <Button variant="outline" onClick={restartPreview}>
                    <RotateCcw />
                    重新预览
                  </Button>
                </div>
              )}
            </>
          )}
          {phase === 'withdrawn' && (
            <div className="completion-box">
              <ShieldCheck />
              <p>感谢您的考虑。本次参与已经结束。</p>
              <p>您可以关闭此页面。</p>
            </div>
          )}
          {session && !['complete', 'withdrawn'].includes(session.phase) && (
            <footer className="experiment-footer">
              {withdraw ? (
                <div className="withdraw-confirm">
                  <p>退出将清除本次已记录的回答与基本信息。确认退出吗？</p>
                  <Button
                    variant="outline"
                    disabled={busy}
                    onClick={() => setWithdraw(false)}
                  >
                    继续参与
                  </Button>
                  <Button
                    variant="destructive"
                    disabled={busy}
                    onClick={() => {
                      void send('withdraw');
                      setWithdraw(false);
                    }}
                  >
                    确认退出
                  </Button>
                </div>
              ) : (
                <>
                  <span>已确认的进度会自动保存</span>
                  <Button
                    variant="ghost"
                    disabled={busy}
                    onClick={() => setWithdraw(true)}
                  >
                    退出实验
                  </Button>
                </>
              )}
            </footer>
          )}
        </div>
      </section>
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
            onClick={() => void send('tone_answer', { count: Number(answer) })}
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
  const item = ITEMS.find((x) => x.id === session.currentItem)!,
    key = `${session.id}-reason-${item.id}`;
  const [reason, setReason] = useState(() => {
    try {
      return sessionStorage.getItem(key) ?? '';
    } catch {
      return '';
    }
  });
  const started = useRef(0);
  useEffect(() => {
    started.current = performance.now();
  }, []);
  useEffect(() => {
    try {
      sessionStorage.setItem(key, reason);
    } catch {}
  }, [key, reason]);
  return (
    <div className="discussion-focus">
      <div className="item-focus-title">
        <span className="discussing-tag">正在讨论 →</span>
        <h2>{item.label}</h2>
        <p>{item.detail}</p>
        <span>您的初始排名：第 {session.initial.indexOf(item.id) + 1} 位</span>
      </div>
      {!session.reason ? (
        <div className="reason-form">
          <label htmlFor="reason">您为什么把这件物品排在这个位置？</label>
          <Textarea
            id="reason"
            value={reason}
            maxLength={500}
            onChange={(e) => setReason(e.target.value)}
            placeholder="请用一两句话说明您的考虑，无需查找资料。"
            disabled={busy}
          />
          <div className="reason-footer">
            <small>{reason.trim().length} / 500 字</small>
            <Button
              className="primary-action"
              disabled={busy || reason.trim().length < 2}
              onClick={() =>
                void send('reason', {
                  item: item.id,
                  reason: reason.trim(),
                  responseMs: Math.round(performance.now() - started.current),
                })
              }
            >
              {busy ? '正在保存…' : '提交理由并听取助手意见'}
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
        语音助手的交流，选择您对以下描述的同意程度。没有正确或错误的答案。
      </p>
      <p className="scale-intro">
        1 = 非常不同意，4 = 既不同意也不反对，7 = 非常同意
      </p>
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
            <p>确认提交全部回答？提交成功后无法修改或重复提交。</p>
            <div className="button-row">
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => setConfirming(false)}
              >
                返回检查
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
