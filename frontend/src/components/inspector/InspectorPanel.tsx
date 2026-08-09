import { useEditorStore } from '@/stores/editorStore';

export function InspectorPanel(): React.JSX.Element {
  const { data, selectedId, remove, duplicate, rotate } = useEditorStore();
  const el = data.elements.find((e) => e.id === selectedId);
  return (
    <aside className="w-72 border-l border-slate-200 bg-white p-4">
      <div className="mb-4 text-xs font-bold tracking-widest text-slate-500">INSPECTOR</div>
      {!el ? (
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
          <div className="mt-6 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
            Выберите компонент на холсте для просмотра свойств
          </div>
        </>
      ) : (
        <>
          <h3 className="font-semibold text-slate-800">📦 {el.label}</h3>
          <div className="mt-4 space-y-3 text-xs">
            <div>
              ID: <span className="text-slate-500">{el.id}</span>
            </div>
            <div>
              Позиция: {el.x}, {el.y}
            </div>
            <div>Поворот: {el.rotation}°</div>
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
            <button onClick={duplicate} className="flex-1 rounded bg-blue-600 px-2 py-2 text-xs text-white">Дублировать</button>
            <button onClick={rotate} className="rounded bg-slate-100 px-3">↻</button>
            <button onClick={remove} className="rounded bg-red-50 px-3 text-red-600">Удалить</button>
          </div>
        </>
      )}
    </aside>
  );
}
