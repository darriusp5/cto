import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useProjectStore } from '@/stores/projectStore';

/**
 * Контейнер редактора (заглушка, этап 3 → наполнение JointJS на этапе 4).
 * Открывается после создания проекта или клика по проекту из «Последних проектов».
 */
export function EditorScreen(): React.JSX.Element {
  const project = useProjectStore((state) => state.currentProject);
  const closeEditor = useProjectStore((state) => state.closeEditor);

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center gap-3 border-b border-white/10 bg-white/5 px-4 py-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={closeEditor}
          className="text-slate-300 hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Стартовое окно</span>
        </Button>
        <h1 className="truncate text-sm font-semibold text-white">🖼️ {project?.title}</h1>
        <span className="ml-auto shrink-0 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-0.5 text-xs text-cyan-300">
          Редактор — этап 4
        </span>
      </div>

      <div className="flex flex-1 items-center justify-center p-10">
        <div className="max-w-md rounded-2xl border border-dashed border-white/10 bg-white/5 px-8 py-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 text-2xl shadow-lg shadow-cyan-500/25">
            📐
          </div>
          <p className="mt-4 text-sm text-slate-300">
            Проект «{project?.title}» создан и сохранён на сервере.
          </p>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">
            Холст JointJS (A4, сетка 5 мм, библиотека, трассировка проводов) будет подключён на
            этапе 4.
          </p>
        </div>
      </div>
    </div>
  );
}
