import { useCallback, useEffect, useRef, useState } from 'react';
import { FileText, Loader2, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { fetchProjects } from '@/lib/auth';
import { formatDateTime } from '@/lib/format';
import { useAuthStore } from '@/stores/authStore';
import { useProjectStore } from '@/stores/projectStore';
import { CreateProjectDialog } from './CreateProjectDialog';

/**
 * Стартовое окно (раздел 4.2): «Создать новую диаграмму»,
 * «Открыть существующую» (.kul, заглушка) и «Последние проекты».
 */
export function StartScreen(): React.JSX.Element {
  const user = useAuthStore((state) => state.user);
  const projects = useProjectStore((state) => state.projects);
  const loading = useProjectStore((state) => state.loading);
  const error = useProjectStore((state) => state.error);
  const setProjects = useProjectStore((state) => state.setProjects);
  const setLoading = useProjectStore((state) => state.setLoading);
  const setError = useProjectStore((state) => state.setError);
  const openProject = useProjectStore((state) => state.openProject);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [kulNotice, setKulNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchProjects();
      // Сортировка по updatedAt (убывание) — см. раздел 4.2.2
      const sorted = [...list].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
      setProjects(sorted);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить проекты');
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setProjects]);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  const handleKulPick = (file: File | undefined): void => {
    setKulNotice(
      file
        ? `Файл «${file.name}» выбран. Формат .kul подключается на этапе 5.`
        : null,
    );
  };

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-white">📐 Монтажная схема</h1>
        <p className="mt-2 text-sm text-slate-400">
          Добро пожаловать{user?.name ? `, ${user.name}` : ''}!
        </p>
      </div>

      {/* Карточки действий */}
      <div className="grid gap-5 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          className="group rounded-2xl border border-white/10 bg-white/5 p-8 text-left transition hover:border-cyan-400/40 hover:bg-white/10"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 text-2xl shadow-lg shadow-cyan-500/25 transition group-hover:scale-105">
            📄
          </span>
          <span className="mt-4 block text-base font-semibold text-white">
            СОЗДАТЬ НОВУЮ ДИАГРАММУ
          </span>
          <span className="mt-2 block text-sm leading-relaxed text-slate-400">
            Начать новый проект с нуля или по шаблону
          </span>
        </button>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="group rounded-2xl border border-white/10 bg-white/5 p-8 text-left transition hover:border-violet-400/40 hover:bg-white/10"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-2xl shadow-lg shadow-indigo-500/25 transition group-hover:scale-105">
            📂
          </span>
          <span className="mt-4 block text-base font-semibold text-white">
            ОТКРЫТЬ СУЩЕСТВУЮЩУЮ
          </span>
          <span className="mt-2 block text-sm leading-relaxed text-slate-400">
            Открыть файл .kul с компьютера
          </span>
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".kul,.json"
        className="hidden"
        onChange={(e) => {
          handleKulPick(e.target.files?.[0]);
          e.target.value = '';
        }}
      />

      {kulNotice && (
        <div className="mt-4 rounded-lg border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
          {kulNotice}
        </div>
      )}

      {/* Последние проекты */}
      <div className="mt-10">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-300">
          📂 Последние проекты
        </h2>

        {loading ? (
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-6 text-sm text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" /> Загрузка проектов…
          </div>
        ) : error ? (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-4 text-sm text-red-300">
            <span>{error}</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => void loadProjects()}
              className="shrink-0 border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
            >
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Повторить
            </Button>
          </div>
        ) : projects.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 px-6 py-10 text-center text-sm text-slate-500">
            Проектов пока нет — создайте первый чертёж
          </div>
        ) : (
          <ul className="divide-y divide-white/5 overflow-hidden rounded-xl border border-white/10 bg-white/5">
            {projects.map((project) => (
              <li key={project.id}>
                <button
                  type="button"
                  onClick={() => openProject(project)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-white/10"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-slate-300">
                    <FileText className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-100">
                    {project.title}
                  </span>
                  <span className="shrink-0 text-xs text-slate-500">
                    {formatDateTime(project.updatedAt)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <CreateProjectDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
