import { useRef, useState } from 'react';
import { useEditorStore } from '@/stores/editorStore';
import { toast } from '@/lib/toast';
import {
  terminalPoint,
  linkPoints,
  linkPathD,
  wireColor,
  wireDash,
  connectionAllowed,
} from '@/lib/wireUtils';
import type { DiagramElement } from '@/types';

interface FlashState {
  elId: string;
  termId: string;
  kind: 'ok' | 'error';
}

/** Холст (4.8, 4.9): лист A4, элементы, клеммы, SVG-слой проводов. */
export function Canvas(): React.JSX.Element {
  const data = useEditorStore((s) => s.data);
  const selectedId = useEditorStore((s) => s.selectedId);
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const selectedKind = useEditorStore((s) => s.selectedKind);
  const select = useEditorStore((s) => s.select);
  const toggleSelect = useEditorStore((s) => s.toggleSelect);
  const clearSelection = useEditorStore((s) => s.clearSelection);
  const zoom = useEditorStore((s) => s.zoom);
  const setZoom = useEditorStore((s) => s.setZoom);
  const grid = useEditorStore((s) => s.grid);
  const wireDraft = useEditorStore((s) => s.wireDraft);
  const startWire = useEditorStore((s) => s.startWire);
  const addWirePoint = useEditorStore((s) => s.addWirePoint);
  const finishWire = useEditorStore((s) => s.finishWire);
  const cancelWire = useEditorStore((s) => s.cancelWire);
  const snapshot = useEditorStore((s) => s.snapshot);
  const moveBy = useEditorStore((s) => s.moveBy);
  const openContextMenu = useEditorStore((s) => s.openContextMenu);
  const setCursorPos = useEditorStore((s) => s.setCursorPos);

  const sheetRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; moved: boolean; targets: string[] } | null>(null);
  const [flash, setFlash] = useState<FlashState | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  const visibleLayerIds = new Set((data.layers ?? []).filter((l) => l.visible).map((l) => l.id));
  const visibleElements = data.elements.filter((e) => visibleLayerIds.has(e.layerId ?? data.layers?.[0]?.id ?? ''));
  const visibleLinks = data.links.filter((lk) => visibleLayerIds.has(lk.layerId ?? data.layers?.[0]?.id ?? ''));

  /** Переводит клиентские координаты в координаты листа (учёт зума). */
  function toSheet(e: { clientX: number; clientY: number }): { x: number; y: number } {
    const rect = sheetRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: (e.clientX - rect.left) / zoom, y: (e.clientY - rect.top) / zoom };
  }

  function groupMembers(id: string): string[] {
    const el = data.elements.find((x) => x.id === id);
    if (el?.groupId) {
      return data.elements.filter((x) => x.groupId === el.groupId).map((x) => x.id);
    }
    if (selectedIds.includes(id) && selectedIds.length > 1) return selectedIds;
    return [id];
  }

  function onTerminalClick(el: DiagramElement, t: { id: string; name: string }) {
    const st = useEditorStore.getState();
    if (!st.wireDraft) {
      startWire(el.id, t.id);
      setFlash({ elId: el.id, termId: t.id, kind: 'ok' });
      window.setTimeout(() => setFlash(null), 400);
      return;
    }
    if (st.wireDraft.source === el.id) {
      // повторный клик по клемме того же элемента — отмена трассировки
      cancelWire();
      return;
    }
    const res = finishWire(el.id, t.id);
    const srcEl = data.elements.find((x) => x.id === st.wireDraft?.source);
    const srcTerm = srcEl?.terminals?.find((x) => x.id === st.wireDraft?.sourcePort);
    if (!res.ok) {
      setFlash({ elId: el.id, termId: t.id, kind: 'error' });
      if (srcEl && srcTerm) setFlash({ elId: srcEl.id, termId: srcTerm.id, kind: 'error' });
      toast(res.error ?? 'Ошибка соединения', 'error');
      window.setTimeout(() => setFlash(null), 400);
    } else {
      setFlash({ elId: el.id, termId: t.id, kind: 'ok' });
      window.setTimeout(() => setFlash(null), 400);
    }
  }

  function terminalDotClass(el: DiagramElement, t: { id: string; name: string }): string {
    const base = 'block h-3 w-3 rounded-full ring-2 ring-white transition-colors';
    const draft = useEditorStore.getState().wireDraft;
    if (flash?.elId === el.id && flash.termId === t.id) {
      return `${base} ${flash.kind === 'ok' ? 'bg-green-500' : 'bg-red-600 animate-pulse'}`;
    }
    if (draft) {
      if (draft.source === el.id) return `${base} bg-green-500`;
      const allowed = connectionAllowed({ id: t.id, name: t.name }, { id: draft.sourcePort, name: '' });
      return `${base} ${allowed ? 'bg-green-400' : 'bg-red-500'}`;
    }
    return `${base} bg-red-500 hover:scale-125`;
  }

  // ── drag элементов ───────────────────────────────────────────────────
  function onElPointerDown(e: React.PointerEvent, el: DiagramElement) {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('[data-terminal]')) return;
    const layer = (data.layers ?? []).find((l) => l.id === el.layerId);
    if (layer?.locked) return;
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { pointerId: e.pointerId, startX: e.clientX, startY: e.clientY, moved: false, targets: groupMembers(el.id) };
  }

  function onElPointerMove(e: React.PointerEvent) {
    const d = dragRef.current;
    if (!d || e.pointerId !== d.pointerId) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (!d.moved && Math.abs(dx) + Math.abs(dy) > 3) {
      d.moved = true;
      snapshot();
    }
    if (d.moved) {
      const sx = dx / zoom;
      const sy = dy / zoom;
      d.targets.forEach((id) => moveBy(id, sx, sy));
      d.startX = e.clientX;
      d.startY = e.clientY;
    }
  }

  function onElPointerUp(e: React.PointerEvent, el: DiagramElement) {
    const d = dragRef.current;
    if (!d || e.pointerId !== d.pointerId) return;
    dragRef.current = null;
    if (!d.moved) {
      cancelWire();
      if (e.shiftKey) toggleSelect(el.id);
      else select(el.id, 'element');
    }
  }

  function onSheetPointerMove(e: React.PointerEvent) {
    const pt = toSheet(e);
    setCursorPos(pt);
    if (useEditorStore.getState().wireDraft) setMousePos(pt);
  }

  function onSheetClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (e.target !== e.currentTarget) return;
    const st = useEditorStore.getState();
    if (st.wireDraft) {
      if (st.wireMode === 'multipoint') {
        const pt = toSheet(e);
        addWirePoint(pt.x, pt.y);
      } else {
        cancelWire();
      }
      return;
    }
    clearSelection();
  }

  function onElementContextMenu(e: React.MouseEvent, el: DiagramElement) {
    e.preventDefault();
    e.stopPropagation();
    select(el.id, 'element');
    openContextMenu({ x: e.clientX, y: e.clientY, kind: 'element', elementId: el.id });
  }

  function onSheetContextMenu(e: React.MouseEvent) {
    e.preventDefault();
    openContextMenu({ x: e.clientX, y: e.clientY, kind: 'canvas' });
  }

  const draftPts = wireDraft
    ? (() => {
        const srcEl = data.elements.find((e) => e.id === wireDraft.source);
        const srcPt = srcEl ? terminalPoint(srcEl, wireDraft.sourcePort) : null;
        const pts = srcPt ? [srcPt, ...wireDraft.points] : [...wireDraft.points];
        if (mousePos) pts.push(mousePos);
        return pts;
      })()
    : null;

  return (
    <div className="relative flex-1 overflow-auto bg-slate-100 p-8" onClick={() => clearSelection()}>
      <div
        ref={sheetRef}
        className="relative mx-auto h-[760px] w-[540px] origin-top-left bg-white shadow-2xl"
        style={{
          transform: `scale(${zoom})`,
          backgroundImage: grid
            ? 'linear-gradient(#dbeafe 1px, transparent 1px),linear-gradient(90deg,#dbeafe 1px,transparent 1px)'
            : 'none',
          backgroundSize: '19px 19px',
        }}
        onPointerMove={onSheetPointerMove}
        onClick={onSheetClick}
        onContextMenu={onSheetContextMenu}
      >
        <div className="pointer-events-none absolute right-3 top-3 z-20 text-[10px] text-slate-400">
          A4 · {data.grid} мм
        </div>

        {/* SVG-слой проводов поверх элементов (4.9) */}
        <svg className="pointer-events-none absolute inset-0 z-10 h-full w-full" style={{ overflow: 'visible' }}>
          {visibleLinks.map((lk) => {
            const pts = linkPoints(data, lk);
            if (pts.length < 2) return null;
            const d = linkPathD(pts);
            const color = wireColor(lk);
            const dash = wireDash(lk.style?.lineType);
            const isSel = selectedKind === 'link' && selectedId === lk.id;
            return (
              <g key={lk.id} className="ekl-wire">
                <path
                  d={d}
                  fill="none"
                  stroke={color}
                  strokeWidth={isSel ? 3.5 : 2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  strokeDasharray={dash}
                  pathLength={1}
                  className="ekl-wire-anim"
                />
                {isSel && <path d={d} fill="none" stroke={color} strokeWidth={9} strokeLinejoin="round" opacity={0.18} />}
                <path
                  d={d}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={12}
                  className="pointer-events-auto cursor-pointer"
                  onClick={(ev) => {
                    ev.stopPropagation();
                    select(lk.id, 'link');
                  }}
                  onContextMenu={(ev) => {
                    ev.preventDefault();
                    ev.stopPropagation();
                    select(lk.id, 'link');
                    openContextMenu({ x: ev.clientX, y: ev.clientY, kind: 'element' });
                  }}
                />
              </g>
            );
          })}
          {draftPts && draftPts.length >= 2 && (
            <path
              d={linkPathD(draftPts)}
              fill="none"
              stroke="#22c55e"
              strokeWidth={2}
              strokeDasharray="6 4"
              strokeLinejoin="round"
              className="pointer-events-none"
            />
          )}
        </svg>

        {/* Элементы */}
        {visibleElements.map((el) => {
          const isSel = selectedKind === 'element' && (selectedId === el.id || selectedIds.includes(el.id));
          const layer = (data.layers ?? []).find((l) => l.id === el.layerId);
          const locked = !!layer?.locked;
          return (
            <div
              key={el.id}
              data-el={el.id}
              onPointerDown={(e) => onElPointerDown(e, el)}
              onPointerMove={onElPointerMove}
              onPointerUp={(e) => onElPointerUp(e, el)}
              onContextMenu={(e) => onElementContextMenu(e, el)}
              className={`absolute flex select-none flex-col items-center justify-center rounded-xl border-2 bg-white px-2 py-3 text-center text-xs font-semibold text-slate-700 shadow-lg transition-colors ${
                isSel ? 'border-blue-600 ring-4 ring-blue-100' : 'border-slate-400'
              } ${locked ? 'cursor-not-allowed opacity-80' : 'cursor-move'}`}
              style={{
                left: el.x,
                top: el.y,
                width: el.width,
                height: el.height,
                transform: `rotate(${el.rotation ?? 0}deg)`,
              }}
            >
              <span>{el.label}</span>
              {(Array.isArray(el.terminals) ? el.terminals : []).map((t) => {
                const posStyle: React.CSSProperties =
                  t.side === 'left'
                    ? { left: 0, top: `${t.pos}%` }
                    : t.side === 'right'
                      ? { right: 0, top: `${t.pos}%` }
                      : t.side === 'top'
                        ? { top: 0, left: `${t.pos}%` }
                        : { bottom: 0, left: `${t.pos}%` };
                return (
                  <span
                    key={t.id}
                    data-terminal
                    className="absolute z-10 flex h-4 w-4 -translate-x-1/2 -translate-y-1/2 cursor-crosshair items-center justify-center"
                    style={posStyle}
                    title={`${t.name} (${t.id})`}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      onTerminalClick(el, t);
                    }}
                  >
                    <i className={terminalDotClass(el, t)} />
                  </span>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Панель масштаба (4.8.2) */}
      <div className="absolute bottom-4 right-4 flex items-center gap-2 rounded-lg bg-white p-2 shadow">
        <button className="px-2 text-lg leading-none" title="Уменьшить" onClick={() => setZoom(zoom - 0.1)}>
          −
        </button>
        <span className="w-12 text-center text-xs">{Math.round(zoom * 100)}%</span>
        <button className="px-2 text-lg leading-none" title="Увеличить" onClick={() => setZoom(zoom + 0.1)}>
          +
        </button>
      </div>
    </div>
  );
}
