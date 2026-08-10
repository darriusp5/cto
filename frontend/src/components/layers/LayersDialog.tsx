import { useState } from 'react';
import { useEditorStore } from '@/stores/editorStore';
import { toast } from '@/lib/toast';

/** Панель управления слоями (4.11): Ctrl+Shift+L. */
export function LayersDialog(): React.JSX.Element | null {
  const open = useEditorStore((s) => s.layersOpen);
  const data = useEditorStore((s) => s.data);
  const activeLayerId = useEditorStore((s) => s.activeLayerId);
  const [newName, setNewName] = useState('');

  if (!open) return null;

  const st = useEditorStore.getState();
  const layers = [...(data.layers ?? [])].sort((a, b) => a.order - b.order);

  function countFor(layerId: string): number {
    return data.elements.filter((e) => e.layerId === layerId).length + data.links.filter((l) => l.layerId === layerId).length;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onMouseDown={() => st.openLayers(false)}>
      <div
        className="w-[460px] rounded-xl bg-white p-5 shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
        data-layers-dialog
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold">📚 Управление слоями</h2>
          <button className="rounded px-2 text-lg text-slate-400 hover:bg-slate-100" onClick={() => st.openLayers(false)}>
            ×
          </button>
        </div>

        <div className="mb-3 flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Название нового слоя"
            className="flex-1 rounded border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newName.trim()) {
                st.addLayer(newName.trim());
                setNewName('');
              }
            }}
          />
          <button
            className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
            onClick={() => {
              if (!newName.trim()) return;
              st.addLayer(newName.trim());
              setNewName('');
            }}
          >
            ➕ Создать слой
          </button>
        </div>

        <div className="max-h-72 space-y-1 overflow-auto">
          {layers.map((l) => (
            <div
              key={l.id}
              className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 text-sm ${
                l.id === activeLayerId ? 'border-blue-300 bg-blue-50' : 'border-slate-200'
              }`}
            >
              <button
                title={l.visible ? 'Скрыть слой' : 'Показать слой'}
                className={`w-7 text-base ${l.visible ? '' : 'opacity-30 line-through'}`}
                onClick={() => st.setLayerVisibility(l.id, !l.visible)}
              >
                👁️
              </button>
              <button
                title={l.locked ? 'Разблокировать' : 'Заблокировать'}
                className={`w-7 text-base ${l.locked ? '' : 'opacity-30'}`}
                onClick={() => st.setLayerLocked(l.id, !l.locked)}
              >
                🔒
              </button>
              <span className="flex-1 truncate">
                {l.name}
                <span className="ml-2 text-[10px] text-slate-400">({countFor(l.id)} объектов)</span>
              </span>
              <button
                title="Активный слой"
                onClick={() => {
                  st.setActiveLayer(l.id);
                  toast(`Активный слой: ${l.name}`, 'success');
                }}
                className={`h-3.5 w-3.5 rounded-full border-2 ${l.id === activeLayerId ? 'border-blue-600 bg-blue-600' : 'border-slate-300 hover:border-blue-400'}`}
              />
              <button
                title="Переименовать"
                className="rounded px-1.5 text-xs text-slate-500 hover:bg-slate-100"
                onClick={() => {
                  const name = window.prompt('Название слоя:', l.name);
                  if (name && name.trim()) st.renameLayer(l.id, name.trim());
                }}
              >
                ✏️
              </button>
              <button
                title="Удалить слой (объекты перейдут в «Основной»)"
                className="rounded px-1.5 text-xs text-red-500 hover:bg-red-50"
                onClick={() => st.deleteLayer(l.id)}
              >
                🗑️
              </button>
              <span className="flex flex-col">
                <button
                  className="text-[9px] leading-none text-slate-400 hover:text-slate-700 disabled:opacity-20"
                  disabled={l.order === 0}
                  onClick={() => st.moveLayer(l.id, -1)}
                >
                  ▲
                </button>
                <button
                  className="text-[9px] leading-none text-slate-400 hover:text-slate-700 disabled:opacity-20"
                  disabled={l.order === layers.length - 1}
                  onClick={() => st.moveLayer(l.id, 1)}
                >
                  ▼
                </button>
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button className="rounded border border-slate-300 px-4 py-1.5 text-sm hover:bg-slate-50" onClick={() => st.openLayers(false)}>
            Отмена
          </button>
          <button className="rounded bg-blue-600 px-4 py-1.5 text-sm text-white hover:bg-blue-700" onClick={() => st.openLayers(false)}>
            Применить
          </button>
        </div>
      </div>
    </div>
  );
}
