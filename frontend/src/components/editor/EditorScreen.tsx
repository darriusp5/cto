import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Save,
  Grid3X3,
  ZoomIn,
  ZoomOut,
  Undo2,
  Redo2,
  Layers,
  Link2,
  Unlink,
  RotateCw,
  Keyboard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { useProjectStore } from '@/stores/projectStore';
import { useEditorStore } from '@/stores/editorStore';
import { useToastStore } from '@/lib/toast';
import { apiFetch } from '@/lib/auth';
import { LibraryPanel } from '@/components/library/LibraryPanel';
import { Canvas } from '@/components/canvas/Canvas';
import { InspectorPanel } from '@/components/inspector/InspectorPanel';
import { ContextMenu } from '@/components/context-menu/ContextMenu';
import { LayersDialog } from '@/components/layers/LayersDialog';
import { ZOOM_LEVELS } from '@/lib/constants';
import type { DiagramData } from '@/types';

const SHORTCUTS: Array<[string, string]> = [
  ['Ctrl+S', 'Сохранить'],
  ['Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y', 'Отменить / Вернуть'],
  ['Ctrl+C / Ctrl+V / Ctrl+X', 'Копировать / Вставить / Вырезать'],
  ['Ctrl+D', 'Дублировать со смещением +20, +20'],
  ['Delete / Backspace', 'Удалить выделенное'],
  ['Ctrl+G / Ctrl+Shift+G', 'Группировать / Разгруппировать'],
  ['R / Ctrl+R / Ctrl+Shift+R', 'Поворот на 90° / против 90°'],
  ['Ctrl+Shift+F / Ctrl+Shift+B', 'На передний / задний план'],
  ['Ctrl+Shift+L', 'Слои'],
  ['Ctrl+A / Esc', 'Выбрать всё / Сбросить выделение'],
  ['F8', 'ORTHO (шаг поворота 90°)'],
  ['Ctrl+0', 'Масштаб 100%'],
];

function isTypingTarget(e: Event): boolean {
  const t = e.target as HTMLElement | null;
  return !!t?.closest('input, textarea, select, [contenteditable="true"]');
}

export function EditorScreen(): React.JSX.Element {
  const project = useProjectStore((s) => s.currentProject);
  const close = useProjectStore((s) => s.closeEditor);
  const { data, setData, dirty, markClean, grid, toggleGrid, setZoom, zoom } = useEditorStore();
  const [helpOpen, setHelpOpen] = useState(false);
  const toasts = useToastStore((s) => s.toasts);

  useEffect(() => {
    if (project) {
      try {
        setData(JSON.parse(project.data) as DiagramData);
      } catch {
        setData({ format: 'A4', grid: 5, elements: [], links: [] });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id]);

  const save = async (): Promise<void> => {
    if (!project) return;
    const saved = await apiFetch<typeof project>(`/api/projects/${project.id}`, {
      method: 'PUT',
      body: JSON.stringify({ title: project.title, data: JSON.stringify({ ...data, settings: { ...data.settings, showGrid: grid } }) }),
    });
    useProjectStore.getState().openProject(saved);
    markClean();
  };

  // ── горячие клавиши ─────────────────────────────────────────────────
  useEffect(() => {
    const key = (e: KeyboardEvent): void => {
      const st = useEditorStore.getState();
      const mod = e.ctrlKey || e.metaKey;
      const k = e.key.toLowerCase();

      if (mod && k === 's') {
        e.preventDefault();
        void save();
        return;
      }
      if (isTypingTarget(e)) return;

      if (mod && k === 'z' && !e.shiftKey) {
        e.preventDefault();
        st.undo();
        return;
      }
      if ((mod && k === 'z' && e.shiftKey) || (mod && k === 'y')) {
        e.preventDefault();
        st.redo();
        return;
      }
      if (mod && k === 'c') {
        e.preventDefault();
        st.copySelection();
        return;
      }
      if (mod && k === 'x') {
        e.preventDefault();
        st.cutSelection();
        return;
      }
      if (mod && k === 'v') {
        e.preventDefault();
        st.pasteAt(st.cursorPos ?? undefined);
        return;
      }
      if (mod && k === 'd') {
        e.preventDefault();
        st.duplicate();
        return;
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        st.remove();
        return;
      }
      if (mod && k === 'g' && !e.shiftKey) {
        e.preventDefault();
        st.group();
        return;
      }
      if (mod && k === 'g' && e.shiftKey) {
        e.preventDefault();
        st.ungroup();
        return;
      }
      if (mod && k === 'r' && !e.shiftKey) {
        e.preventDefault();
        st.rotate(true);
        return;
      }
      if (mod && k === 'r' && e.shiftKey) {
        e.preventDefault();
        st.rotate(false);
        return;
      }
      if (!mod && k === 'r') {
        st.rotate(true);
        return;
      }
      if (mod && e.shiftKey && k === 'f') {
        e.preventDefault();
        st.toFront();
        return;
      }
      if (mod && e.shiftKey && k === 'b') {
        e.preventDefault();
        st.toBack();
        return;
      }
      if (mod && e.shiftKey && k === 'l') {
        e.preventDefault();
        st.openLayers(true);
        return;
      }
      if (e.key === 'F8') {
        e.preventDefault();
        st.toggleOrtho();
        return;
      }
      if (mod && k === 'a') {
        e.preventDefault();
        st.selectAll();
        return;
      }
      if (e.key === 'Escape') {
        if (st.contextMenu) st.openContextMenu(null);
        else if (st.wireDraft) st.cancelWire();
        else st.clearSelection();
        return;
      }
      if (mod && k === '0') {
        e.preventDefault();
        setZoom(1);
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project]);

  const canUndo = useEditorStore((s) => s.past.length > 0);
  const canRedo = useEditorStore((s) => s.future.length > 0);
  const ortho = useEditorStore((s) => s.ortho);

  return (
    <div className="flex flex-1 flex-col bg-slate-100">
      {/* ── верхняя панель + меню ─────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b bg-slate-900 px-4 py-2 text-white">
        <Button variant="ghost" size="sm" onClick={close} className="text-slate-300">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Проекты
        </Button>
        <strong className="mr-5">{project?.title}</strong>
        <nav className="flex items-center gap-0.5 text-sm text-slate-300">
          <DropdownMenu>
            <DropdownMenuTrigger className="rounded px-2 py-1 hover:bg-slate-700">Файл</DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={close}>📄 Новый проект</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => void save()}>
                💾 Сохранить <span className="ml-6 text-xs text-slate-400">Ctrl+S</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={close}>🚪 Выйти</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger className="rounded px-2 py-1 hover:bg-slate-700">Правка</DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem disabled={!canUndo} onClick={() => useEditorStore.getState().undo()}>
                ↩️ Отменить <span className="ml-6 text-xs text-slate-400">Ctrl+Z</span>
              </DropdownMenuItem>
              <DropdownMenuItem disabled={!canRedo} onClick={() => useEditorStore.getState().redo()}>
                ↪️ Вернуть <span className="ml-6 text-xs text-slate-400">Ctrl+Y</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => useEditorStore.getState().copySelection()}>
                📋 Копировать <span className="ml-6 text-xs text-slate-400">Ctrl+C</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => useEditorStore.getState().cutSelection()}>
                ✂️ Вырезать <span className="ml-6 text-xs text-slate-400">Ctrl+X</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => useEditorStore.getState().pasteAt(useEditorStore.getState().cursorPos ?? undefined)}>
                📑 Вставить <span className="ml-6 text-xs text-slate-400">Ctrl+V</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => useEditorStore.getState().remove()}>
                🗑️ Удалить <span className="ml-6 text-xs text-slate-400">Delete</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => useEditorStore.getState().duplicate()}>
                🔄 Дублировать <span className="ml-6 text-xs text-slate-400">Ctrl+D</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => useEditorStore.getState().selectAll()}>
                📋 Выбрать всё <span className="ml-6 text-xs text-slate-400">Ctrl+A</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => useEditorStore.getState().clearSelection()}>
                🔄 Сбросить выделение <span className="ml-6 text-xs text-slate-400">Esc</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger className="rounded px-2 py-1 hover:bg-slate-700">Вид</DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuCheckboxItem checked={grid} onCheckedChange={toggleGrid}>
                ☑ Сетка
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={ortho} onCheckedChange={() => useEditorStore.getState().toggleOrtho()}>
                🟦 ORTHO (F8)
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => useEditorStore.getState().openLayers(true)}>
                📚 Слои <span className="ml-6 text-xs text-slate-400">Ctrl+Shift+L</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Масштаб</DropdownMenuLabel>
              {ZOOM_LEVELS.map((z) => (
                <DropdownMenuItem key={z} onClick={() => setZoom(z)}>
                  {Math.round(z * 100)}% {z === 1 && <span className="ml-6 text-xs text-slate-400">Ctrl+0</span>}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger className="rounded px-2 py-1 hover:bg-slate-700">Положение</DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => useEditorStore.getState().rotate(true)}>
                🔄 Повернуть на 90° <span className="ml-6 text-xs text-slate-400">Ctrl+R</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => useEditorStore.getState().rotate(false)}>
                🔄 Повернуть против 90° <span className="ml-6 text-xs text-slate-400">Ctrl+Shift+R</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => useEditorStore.getState().group()}>
                🔗 Группировать <span className="ml-6 text-xs text-slate-400">Ctrl+G</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => useEditorStore.getState().ungroup()}>
                🔓 Разгруппировать <span className="ml-6 text-xs text-slate-400">Ctrl+Shift+G</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => useEditorStore.getState().toFront()}>
                ⬆️ На передний план <span className="ml-6 text-xs text-slate-400">Ctrl+Shift+F</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => useEditorStore.getState().toBack()}>
                ⬇️ На задний план <span className="ml-6 text-xs text-slate-400">Ctrl+Shift+B</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger className="rounded px-2 py-1 hover:bg-slate-700">Доп</DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>⭐ Избранное</DropdownMenuItem>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>📚 Библиотека</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled>📊 Статистика проекта</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger className="rounded px-2 py-1 hover:bg-slate-700">Помощь</DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setHelpOpen(true)}>⌨️ Горячие клавиши</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled>ℹ️ О программе</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>

      {/* ── тулбар ────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 border-b bg-white px-3 py-2 shadow-sm">
        <button title="Сохранить (Ctrl+S)" onClick={() => void save()} className="toolbar">
          <Save className="h-4 w-4" />
        </button>
        <button title="Отменить (Ctrl+Z)" disabled={!canUndo} onClick={() => useEditorStore.getState().undo()} className="toolbar">
          <Undo2 className="h-4 w-4" />
        </button>
        <button title="Вернуть (Ctrl+Shift+Z)" disabled={!canRedo} onClick={() => useEditorStore.getState().redo()} className="toolbar">
          <Redo2 className="h-4 w-4" />
        </button>
        <span className="mx-1 h-5 w-px bg-slate-200" />
        <button title="Уменьшить" onClick={() => setZoom(zoom - 0.1)} className="toolbar">
          <ZoomOut className="h-4 w-4" />
        </button>
        <span className="w-11 text-center text-xs text-slate-600">{Math.round(zoom * 100)}%</span>
        <button title="Увеличить" onClick={() => setZoom(zoom + 0.1)} className="toolbar">
          <ZoomIn className="h-4 w-4" />
        </button>
        <button title="Сетка" onClick={toggleGrid} className={`toolbar ${grid ? 'text-blue-600' : ''}`}>
          <Grid3X3 className="h-4 w-4" />
        </button>
        <span className="mx-1 h-5 w-px bg-slate-200" />
        <button title="Слои (Ctrl+Shift+L)" onClick={() => useEditorStore.getState().openLayers(true)} className="toolbar">
          <Layers className="h-4 w-4" />
        </button>
        <button title="Группировать (Ctrl+G)" onClick={() => useEditorStore.getState().group()} className="toolbar">
          <Link2 className="h-4 w-4" />
        </button>
        <button title="Разгруппировать (Ctrl+Shift+G)" onClick={() => useEditorStore.getState().ungroup()} className="toolbar">
          <Unlink className="h-4 w-4" />
        </button>
        <button title="Повернуть на 90° (R)" onClick={() => useEditorStore.getState().rotate(true)} className="toolbar">
          <RotateCw className="h-4 w-4" />
        </button>
        <span className="ml-auto text-xs text-slate-500">{dirty ? 'Изменения не сохранены' : 'Сохранено'}</span>
      </div>

      {/* ── рабочая область ──────────────────────────────────────────── */}
      <div className="flex min-h-0 flex-1">
        <LibraryPanel />
        <Canvas />
        <InspectorPanel />
      </div>

      {/* ── статус-бар ───────────────────────────────────────────────── */}
      <div className="flex justify-between border-t bg-white px-4 py-1 text-xs text-slate-500">
        <span>A4 · 210×297 мм · Сетка {data.grid} мм</span>
        <span>
          {ortho ? '🟦 ORTHO: ON' : 'ORTHO: OFF'} · Сетка {grid ? 'включена' : 'выключена'} · {Math.round(zoom * 100)}%
        </span>
      </div>

      <ContextMenu />
      <LayersDialog />

      {/* тосты (4.9.3) */}
      <div className="pointer-events-none fixed right-4 top-4 z-[60] space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`rounded-lg px-4 py-2 text-sm text-white shadow-lg ${
              t.kind === 'error' ? 'bg-red-600' : t.kind === 'success' ? 'bg-green-600' : 'bg-slate-800'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>

      {/* справка по горячим клавишам */}
      {helpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setHelpOpen(false)}>
          <div className="w-[460px] rounded-xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-base font-bold">
                <Keyboard className="h-4 w-4" /> Горячие клавиши
              </h2>
              <button className="rounded px-2 text-lg text-slate-400 hover:bg-slate-100" onClick={() => setHelpOpen(false)}>
                ×
              </button>
            </div>
            <div className="max-h-80 overflow-auto">
              {SHORTCUTS.map(([keys, desc]) => (
                <div key={keys} className="flex justify-between border-b border-slate-100 py-1.5 text-sm last:border-0">
                  <span className="font-mono text-xs text-blue-700">{keys}</span>
                  <span className="text-slate-600">{desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
