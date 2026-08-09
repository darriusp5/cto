import { useEditorStore } from '@/stores/editorStore';

export function Canvas(): React.JSX.Element {
  const { data, selectedId, select, zoom, grid } = useEditorStore();
  return (
    <div className="relative flex-1 overflow-auto bg-slate-100 p-8" onClick={() => select(null)}>
      <div
        className="relative mx-auto min-h-[760px] w-[540px] origin-top-left bg-white shadow-2xl"
        style={{
          transform: `scale(${zoom})`,
          backgroundImage: grid
            ? 'linear-gradient(#dbeafe 1px, transparent 1px),linear-gradient(90deg,#dbeafe 1px,transparent 1px)'
            : 'none',
          backgroundSize: '19px 19px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute right-3 top-3 text-[10px] text-slate-400">A4 · {data.grid} мм</div>
        {data.elements.map((el) => (
          <button
            key={el.id}
            onClick={() => select(el.id)}
            className={`absolute rounded-xl border-2 bg-white px-3 py-4 text-center text-xs font-semibold text-slate-700 shadow-lg transition ${
              selectedId === el.id ? 'border-blue-600 ring-4 ring-blue-100' : 'border-slate-400'
            }`}
            style={{
              left: el.x,
              top: el.y,
              width: el.width,
              height: el.height,
              transform: `rotate(${el.rotation}deg)`,
            }}
          >
            <span>{el.label}</span>
            {(Array.isArray(el.terminals) ? el.terminals : []).map((t) => (
              <i
                key={t.id}
                className="absolute h-3 w-3 rounded-full bg-red-500 ring-2 ring-white"
                style={{ [t.side === 'left' ? 'left' : 'right']: '-7px', top: `${t.pos}%` }}
                title={t.name}
              />
            ))}
          </button>
        ))}
      </div>
      <div className="absolute bottom-4 right-4 flex items-center gap-2 rounded-lg bg-white p-2 shadow">
        <button className="px-2" onClick={() => useEditorStore.getState().setZoom(zoom - 0.1)}>−</button>
        <span className="text-xs">{Math.round(zoom * 100)}%</span>
        <button className="px-2" onClick={() => useEditorStore.getState().setZoom(zoom + 0.1)}>+</button>
      </div>
    </div>
  );
}
