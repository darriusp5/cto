import { useEffect, useState } from 'react';
import { useEditorStore } from '@/stores/editorStore';
import { toast } from '@/lib/toast';

interface Item {
  label: string;
  shortcut?: string;
  action?: () => void;
  danger?: boolean;
  children?: Item[];
  info?: boolean;
  checked?: boolean;
}

/** Контекстное меню (4.10): правый клик по элементу или пустому месту холста. */
export function ContextMenu(): React.JSX.Element | null {
  const menu = useEditorStore((s) => s.contextMenu);
  const close = () => useEditorStore.getState().openContextMenu(null);
  const data = useEditorStore((s) => s.data);
  const [subOpen, setSubOpen] = useState(false);

  useEffect(() => {
    if (!menu) return;
    const onDown = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent && e.key === 'Escape') {
        close();
        return;
      }
      // клик вне меню
      const t = e.target as HTMLElement | null;
      if (t && t.closest('[data-ctx-menu]')) return;
      close();
    };
    window.addEventListener('mousedown', onDown);
    window.addEventListener('contextmenu', onDown);
    window.addEventListener('keydown', onDown);
    window.addEventListener('resize', close);
    window.addEventListener('scroll', close, true);
    return () => {
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('contextmenu', onDown);
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('resize', close);
      window.removeEventListener('scroll', close, true);
    };
  }, [menu]);

  if (!menu) return null;

  const st = useEditorStore.getState();
  const el = menu.kind === 'element' && menu.elementId ? data.elements.find((e) => e.id === menu.elementId) : undefined;

  const items: Item[] =
    menu.kind === 'element' && el
      ? [
          { label: 'Вырезать', shortcut: 'Ctrl+X', action: () => st.cutSelection() },
          { label: 'Копировать', shortcut: 'Ctrl+C', action: () => st.copySelection() },
          { label: 'Вставить', shortcut: 'Ctrl+V', action: () => st.pasteAt(st.cursorPos ?? undefined) },
          { label: 'Удалить', shortcut: 'Delete', action: () => st.remove(), danger: true },
          { label: '—', info: true },
          { label: 'Дублировать', shortcut: 'Ctrl+D', action: () => st.duplicate() },
          { label: '—', info: true },
          { label: 'На передний план', shortcut: 'Ctrl+Shift+F', action: () => st.toFront() },
          { label: 'На задний план', shortcut: 'Ctrl+Shift+B', action: () => st.toBack() },
          { label: '—', info: true },
          { label: `Высота: ${Math.round(el.height)} мм`, info: true },
          { label: `Ширина: ${Math.round(el.width)} мм`, info: true },
          { label: '—', info: true },
          { label: 'Найти на схеме', action: () => st.select(el.id, 'element') },
          { label: 'Редактировать свойства', action: () => st.select(el.id, 'element') },
        ]
      : [
          { label: 'Вставить', shortcut: 'Ctrl+V', action: () => st.pasteAt(st.cursorPos ?? undefined) },
          { label: '—', info: true },
          {
            label: 'Режим трассировки',
            children: [
              { label: '🔌 Одиночная', checked: st.wireMode === 'single', action: () => st.setTraceMode('single') },
              { label: '🔀 Ведомственная', checked: st.wireMode === 'multipoint', action: () => st.setTraceMode('multipoint') },
              { label: '〰️ Шинопровод', checked: st.wireMode === 'bus', action: () => { st.setTraceMode('bus'); toast('Шинопровод: соедините две клеммы', 'info'); } },
            ],
          },
          { label: '—', info: true },
          { label: 'Найти', shortcut: 'Ctrl+F', action: () => window.dispatchEvent(new CustomEvent('ekl-focus-search')) },
          { label: '—', info: true },
          { label: 'Свойства страницы', action: () => st.select(null) },
        ];

  const x = Math.min(menu.x, window.innerWidth - 260);
  const y = Math.min(menu.y, window.innerHeight - items.length * 34 - 24);

  return (
    <div
      data-ctx-menu
      className="fixed z-50 w-60 rounded-lg border border-slate-200 bg-white py-1 shadow-2xl"
      style={{ left: x, top: y }}
      onMouseLeave={() => setSubOpen(false)}
    >
      {items.map((it, i) =>
        it.info ? (
          <div key={i} className="my-1 border-t border-slate-100" />
        ) : (
          <div
            key={i}
            className={`relative flex items-center justify-between px-3 py-1.5 text-xs ${it.info ? '' : 'cursor-pointer hover:bg-blue-50'}`}
            onMouseEnter={() => setSubOpen(true)}
            onClick={() => {
              if (!it.action || it.children) return;
              it.action();
              close();
            }}
          >
            {it.children ? (
              <>
                <span>{it.label}</span>
                <span className="text-slate-400">▶</span>
                {subOpen && (
                  <div className="absolute left-full top-0 z-50 w-52 rounded-lg border border-slate-200 bg-white py-1 shadow-xl">
                    {it.children.map((c, j) => (
                      <div
                        key={j}
                        className="flex cursor-pointer items-center justify-between px-3 py-1.5 text-xs hover:bg-blue-50"
                        onClick={() => {
                          c.action?.();
                          close();
                        }}
                      >
                        <span>{c.label}</span>
                        {c.checked && <span className="text-blue-600">✓</span>}
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <span className={it.danger ? 'text-red-600' : it.info ? 'text-slate-500' : ''}>{it.label}</span>
                {it.shortcut && <span className="ml-3 text-[10px] text-slate-400">{it.shortcut}</span>}
              </>
            )}
          </div>
        ),
      )}
    </div>
  );
}
