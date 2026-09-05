'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, GripVertical, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  ITEMS,
  ITEM_IDS,
  isRanking,
  placeItem,
  type RankingEvent,
} from '@/lib/protocol';

export function RankingBoard({
  initial,
  draftKey,
  onConfirm,
  busy,
  final = false,
}: {
  initial: string[];
  draftKey: string;
  onConfirm: (order: string[], events: RankingEvent[]) => void;
  busy: boolean;
  final?: boolean;
}) {
  const [slots, setSlots] = useState<(string | null)[]>(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(draftKey) ?? 'null');
      if (
        saved &&
        Array.isArray(saved.slots) &&
        saved.slots.length === ITEMS.length &&
        saved.slots.every(
          (x: unknown) =>
            x === null || (typeof x === 'string' && ITEM_IDS.includes(x)),
        ) &&
        new Set(saved.slots.filter(Boolean)).size ===
          saved.slots.filter(Boolean).length
      )
        return saved.slots;
    } catch {}
    return initial.length ? [...initial] : ITEMS.map(() => null);
  });
  const [moves, setMoves] = useState<RankingEvent[]>(() => {
    try {
      return (
        JSON.parse(sessionStorage.getItem(draftKey) ?? 'null')?.events ?? []
      );
    } catch {
      return [];
    }
  });
  const [selected, setSelected] = useState<string | null>(null),
    [announcement, setAnnouncement] = useState(''),
    [confirming, setConfirming] = useState(false);
  const started = useRef(0),
    touch = useRef<{ item: string; target: number } | null>(null);
  useEffect(() => {
    started.current = performance.now();
  }, []);
  useEffect(() => {
    try {
      sessionStorage.setItem(
        draftKey,
        JSON.stringify({ slots, events: moves }),
      );
    } catch {}
  }, [slots, moves, draftKey]);
  const move = (id: string, to: number, method: string) => {
    if (busy || confirming) return;
    const from = slots.indexOf(id),
      next = placeItem(slots, id, to);
    if (next === slots) return;
    setSlots(next);
    setSelected(null);
    setMoves((previous) => [
      ...previous.slice(-498),
      {
        item: id,
        from,
        to,
        atMs: Math.round(performance.now() - started.current),
        method,
      },
    ]);
    setAnnouncement(
      `${ITEMS.find((x) => x.id === id)?.label}已移至第 ${to + 1} 位`,
    );
  };
  const remove = (id: string) => {
    if (busy || confirming) return;
    const from = slots.indexOf(id);
    setSlots(slots.map((x) => (x === id ? null : x)));
    setMoves((previous) => [
      ...previous.slice(-498),
      {
        item: id,
        from,
        to: -1,
        atMs: Math.round(performance.now() - started.current),
        method: 'remove',
      },
    ]);
  };
  const filled = slots.filter(Boolean).length;
  return (
    <div className="ranking-board">
      <p className="ranking-hint">
        拖动物品到排名框；也可先点选物品，再点选位置。用上／下按钮可微调顺序。
      </p>
      <output className="sr-only">{announcement}</output>
      <div
        className={`ranking-layout ${filled === ITEMS.length ? 'all-placed' : ''}`}
      >
        {filled < ITEMS.length && (
          <aside className="item-tray" aria-label="待排序物品">
            <div className="tray-heading">
              <h2>待排序物品</h2>
              <span>{ITEMS.length - filled} 项</span>
            </div>
            <div className="tray-items">
              {ITEMS.filter((x) => !slots.includes(x.id)).map((item) => (
                <Button
                  key={item.id}
                  variant="outline"
                  className={`item-choice item-enter ${selected === item.id ? 'selected' : ''}`}
                  draggable
                  disabled={busy || confirming}
                  onDragStart={(e) =>
                    e.dataTransfer.setData('text/plain', item.id)
                  }
                  onClick={() => setSelected(item.id)}
                  aria-pressed={selected === item.id}
                >
                  <span>
                    <strong>{item.label}</strong>
                    <small>{item.detail}</small>
                  </span>
                  <GripVertical aria-hidden="true" />
                </Button>
              ))}
            </div>
          </aside>
        )}
        <div className="rank-column">
          <div className="ranking-status">
            <span>
              {selected
                ? `已选择：${ITEMS.find((x) => x.id === selected)?.label}`
                : '1 = 最重要'}
            </span>
            <span>
              {filled} / {ITEMS.length}
            </span>
          </div>
          <ol
            className="rank-list"
            aria-label={final ? '最终排序' : '初始排序'}
          >
            {slots.map((id, index) => {
              const item = ITEMS.find((x) => x.id === id);
              return (
                // Drag target supplements the keyboard/tap buttons inside this list item.
                // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
                <li
                  key={index}
                  className={`rank-slot ${id ? 'filled' : ''} ${selected ? 'accepting' : ''}`}
                  data-rank-target={index}
                  onDragOver={(e) => {
                    if (!busy && !confirming) e.preventDefault();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    move(e.dataTransfer.getData('text/plain'), index, 'drag');
                  }}
                >
                  <span className="rank-number">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <Button
                    variant="ghost"
                    className="slot-main"
                    disabled={busy || confirming}
                    onClick={() => {
                      if (selected) move(selected, index, 'tap');
                      else if (id) setSelected(id);
                    }}
                    aria-label={`第 ${index + 1} 位，${item?.label ?? '空位'}${selected ? '，放入所选物品' : ''}`}
                  >
                    {item ? (
                      <span>
                        <strong>{item.label}</strong>
                        <small>{item.detail}</small>
                      </span>
                    ) : (
                      <span className="empty-slot">拖入物品，或点此放入</span>
                    )}
                  </Button>
                  {id && (
                    <div className="rank-controls">
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={busy || confirming || index === 0}
                        aria-label={`${item!.label}上移`}
                        onClick={() => move(id, index - 1, 'up')}
                      >
                        <ArrowUp />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={
                          busy || confirming || index === slots.length - 1
                        }
                        aria-label={`${item!.label}下移`}
                        onClick={() => move(id, index + 1, 'down')}
                      >
                        <ArrowDown />
                      </Button>
                      {!final && (
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={busy || confirming}
                          aria-label={`移除${item!.label}`}
                          onClick={() => remove(id)}
                        >
                          <X />
                        </Button>
                      )}
                      <span
                        className="drag-handle"
                        draggable
                        aria-hidden="true"
                        onDragStart={(e) =>
                          e.dataTransfer.setData('text/plain', id)
                        }
                        onPointerDown={(e) => {
                          if (
                            e.pointerType !== 'mouse' &&
                            !busy &&
                            !confirming
                          ) {
                            touch.current = { item: id, target: index };
                            e.currentTarget.setPointerCapture(e.pointerId);
                          }
                        }}
                        onPointerMove={(e) => {
                          if (!touch.current) return;
                          const element = document
                            .elementFromPoint(e.clientX, e.clientY)
                            ?.closest('[data-rank-target]');
                          if (element)
                            touch.current.target = Number(
                              element.getAttribute('data-rank-target'),
                            );
                          const container =
                            e.currentTarget.closest('.experiment-card');
                          if (container) {
                            const box = container.getBoundingClientRect();
                            if (e.clientY > box.bottom - 70)
                              container.scrollBy(0, 15);
                            else if (e.clientY < box.top + 70)
                              container.scrollBy(0, -15);
                          }
                        }}
                        onPointerUp={() => {
                          if (touch.current)
                            move(
                              touch.current.item,
                              touch.current.target,
                              'drag',
                            );
                          touch.current = null;
                        }}
                        onPointerCancel={() => {
                          touch.current = null;
                        }}
                      >
                        <GripVertical />
                      </span>
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
          <p className="least-label">{ITEMS.length} = 最不重要</p>
        </div>
      </div>
      {isRanking(slots) && (
        <div className="confirmation-box item-enter">
          {confirming ? (
            <>
              <p>确认此排序后，将进入下一阶段，不能返回修改。</p>
              <div className="button-row">
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() => setConfirming(false)}
                >
                  再检查一下
                </Button>
                <Button
                  className="primary-action"
                  disabled={busy}
                  onClick={() => onConfirm(slots, moves)}
                >
                  <Check />
                  {busy ? '正在保存…' : '确认并继续'}
                </Button>
              </div>
            </>
          ) : (
            <div className="action-row">
              <p>
                {final
                  ? '您可以保留原排序，也可以按自己的判断调整。'
                  : '全部物品已放入，请检查您的排序。'}
              </p>
              <Button
                className="primary-action"
                disabled={busy}
                onClick={() => setConfirming(true)}
              >
                {final ? '确认最终排序' : '确认初始排序'}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
export function RankingReference({
  order,
  title,
  current,
}: {
  order: string[];
  title: string;
  current?: string | null;
}) {
  return (
    <div className="ranking-reference">
      <h2>{title}</h2>
      <ol>
        {order.map((id, index) => (
          <li
            key={id}
            className={id === current ? 'current-item' : ''}
            aria-current={id === current ? 'step' : undefined}
          >
            <span>{index + 1}</span>
            <strong>{ITEMS.find((x) => x.id === id)?.label}</strong>
            {id === current && (
              <span className="discussion-arrow" aria-label="正在讨论">
                ←
              </span>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
