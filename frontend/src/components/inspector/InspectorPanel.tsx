import { useEditorStore } from '@/stores/editorStore';
import { WIRE_COLORS, WIRE_LINE_TYPES } from '@/lib/constants';
import { wireColor } from '@/lib/wireUtils';

/** Правая панель — свойства документа / элемента / провода (4.7). */
export function InspectorPanel(): React.JSX.Element {
  const data = useEditorStore((s) => s.data);
  const selectedId = useEditorStore((s) => s.selectedId);
  const selectedKind = useEditorStore((s) => s.selectedKind);
  const { remove, duplicate, rotate, setElementLayer, setElementLabel, removeLink, setLinkStyle, setLinkLayer } = useEditorStore();

  const el = selectedKind === 'element' ? data.elements.find((e) => e.id === selectedId) : undefined;
  const link = selectedKind === 'link' ? data.links.find((l) => l.id === selectedId) : undefined;
  const layers = data.layers ?? [];

  return (
    <aside className="w-72 overflow-auto border-l border-slate-200 bg-white p-4">
      <div className="mb-4 text-xs font-bold tracking-widest text-slate-500">INSPECTOR</div>

      {/* ── провод (4.7.3) ────────────────────────────────────────────── */}
      {link ? (
        <>
          <h3 className="font-semibold">📄 Свойства провода</h3>
          <div className="mt-3 space-y-3 text-xs text-slate-600">
            <div className="rounded bg-slate-50 p-2">
              От: {data.elements.find((e) => e.id === link.source)?.label ?? link.source} ({link.sourcePort})
              <br />
              До: {data.elements.find((e) => e.id === link.target)?.label ?? link.target} ({link.targetPort})
            </div>
            <div>
              <div className="mb-1 font-semibold text-slate-700">Цвет</div>
              <div className="flex gap-1">
                {WIRE_COLORS.map((c) => (
                  <button
                    key={c.key}
                    title={c.label}
                    className={`h-6 w-6 rounded-full border-2 ${wireColor(link) === c.color ? 'border-blue-600' : 'border-white'}`}
                    style={{ backgroundColor: c.color }}
                    onClick={() => setLinkStyle(link.id, { stroke: c.color })}
                  />
                ))}
              </div>
            </div>
            <div>
              <div className="mb-1 font-semibold text-slate-700">Тип линии</div>
              <select
                className="w-full rounded border border-slate-300 p-1.5"
                value={link.style?.lineType ?? 'solid'}
                onChange={(e) => setLinkStyle(link.id, { lineType: e.target.value as 'solid' | 'dashed' | 'dashdot' | 'dotdot' })}
              >
                {WIRE_LINE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            {link.layerId && (
              <label className="block">
                <span className="font-semibold text-slate-700">Слой</span>
                <select
                  className="mt-1 w-full rounded border border-slate-300 p-1.5"
                  value={link.layerId}
                  onChange={(e) => setLinkLayer(link.id, e.target.value)}
                >
                  {layers.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
          <div className="mt-6">
            <button onClick={() => removeLink(link.id)} className="w-full rounded bg-red-50 px-3 py-2 text-xs text-red-600 hover:bg-red-100">
              🗑️ Удалить провод
            </button>
          </div>
        </>
      ) : !el ? (
        /* ── документ (4.7.1) ─────────────────────────────────────────── */
        <>
          <h3 className="font-semibold">📄 Свойства документа</h3>
          <label className="mt-5 block text-xs text-slate-500">
            Формат
            <select className="mt-1 w-full rounded border p-2">
              <option>A4</option>
            </select>
          </label>
          <label className="mt-3 block text-xs text-slate-500">
            Сетка
            <select className="mt-1 w-full rounded border p-2">
              <option>5 мм</option>
            </select>
          </label>
          <div className="mt-4 text-xs text-slate-500">Фон: белый</div>
          <div className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
            Слоёв: {layers.length} · Элементов: {data.elements.length} · Проводов: {data.links.length}
          </div>
          <div className="mt-6 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
            Выберите компонент на холсте для просмотра свойств
          </div>
        </>
      ) : (
        /* ── компонент (4.7.2) ────────────────────────────────────────── */
        <>
          <h3 className="font-semibold text-slate-800">📦 {el.label}</h3>
          <div className="mt-4 space-y-3 text-xs">
            <label className="block">
              <span className="text-slate-500">Название</span>
              <input
                className="mt-1 w-full rounded border border-slate-300 p-1.5 outline-none focus:border-blue-500"
                value={el.label}
                onChange={(e) => setElementLabel(el.id, e.target.value)}
              />
            </label>
            <div>
              ID: <span className="text-slate-500">{el.id}</span>
            </div>
            <div>
              Позиция: {Math.round(el.x)}, {Math.round(el.y)}
            </div>
            <div>Поворот: {el.rotation}°</div>
            <label className="block">
              <span className="text-slate-500">Слой</span>
              <select
                className="mt-1 w-full rounded border border-slate-300 p-1.5"
                value={el.layerId ?? layers[0]?.id ?? ''}
                onChange={(e) => setElementLayer(el.id, e.target.value)}
              >
                {layers.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </label>
            {el.groupId && <div className="rounded bg-blue-50 p-2 text-blue-700">🔗 В группе</div>}
            <div>Клемм: {(Array.isArray(el.terminals) ? el.terminals : []).length}</div>
            <div className="border-t pt-3">Параметры</div>
            {Object.entries(el.params ?? {}).map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span>{k}</span>
                <b>{String(v)}</b>
              </div>
            ))}
          </div>
          <div className="mt-6 flex gap-2">
            <button onClick={duplicate} className="flex-1 rounded bg-blue-600 px-2 py-2 text-xs text-white hover:bg-blue-700">
              Дублировать
            </button>
            <button onClick={() => rotate(true)} className="rounded bg-slate-100 px-3 hover:bg-slate-200" title="Повернуть на 90°">
              ↻
            </button>
            <button onClick={remove} className="rounded bg-red-50 px-3 text-red-600 hover:bg-red-100">
              Удалить
            </button>
          </div>
        </>
      )}
    </aside>
  );
}
