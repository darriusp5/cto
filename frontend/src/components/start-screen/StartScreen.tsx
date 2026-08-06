import { useEffect, useRef, useState } from 'react';
import { FileText, Loader2, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/format';
import { toast } from '@/lib/toast';
import { useAuthStore } from '@/stores/authStore';
import { useProjectStore } from '@/stores/projectStore';
import { CreateProjectDialog } from './CreateProjectDialog';

/**
 * Стартовое окно (раздел 4.2): «Создать новую диаграмму» (в т.ч. по шаблону),
 * «Открыть существующую» (.kul с диска) и «Последние проекты».
 */
export function StartScreen(): React.JSX.Element {
  const user = useAuthStore((state) => state.user);
  const projects = useProjectStore((state) => state.projects);
  const loading = useProjectStore((state) => state.loading);
  const error = useProjectStore((state) => state.error);
  const loadProjects = useProjectStore((state) => state.loadProjects);
  const openProject = useProjectStore((state) => state.openProject);
  const importKul = useProjectStore((state) => state.importKul);
  const setError = useProjectStore((state) => state.setError);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  const handleKulPick = async (file: File | undefined): Promise<void> => {
    if (!file) return;
    setImporting(true);
    setError(null);
    try {
      await importKul(file);
      toast('Проект импортирован', 'success');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось импортировать .kul');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-white">📐 Монтажная схема</h1>
        <p className="mt-2 text-sm text-slate-400">
          Добро пожаловать{user?.name ? `, ${user.name}` : ''}!
        </p>
      </div>

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
            Новый проект с нуля или по шаблону из библиотеки
          </span>
        </button>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={importing}
          className="group rounded-2xl border border-white/10 bg-white/5 p-8 text-left transition hover:border-violet-400/40 hover:bg-white/10 disabled:opacity-50"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-2xl shadow-lg shadow-indigo-500/25 transition group-hover:scale-105">
            {importing ? <Loader2 className="h-6 w-6 animate-spin" /> : '📂'}
          </span>
          <span className="mt-4 block text-base font-semibold text-white">
            ОТКРЫТЬ СУЩЕСТВУЮЩУЮ
          </span>
          <span className="mt-2 block text-sm leading-relaxed text-slate-400">
            Импорт файла .kul с компьютера (раздел 4.2.2)
          </span>
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".kul,.json"
        className="hidden"
        onChange={(e) => {
          void handleKulPick(e.target.files?.[0]);
          e.target.value = '';
        }}
      />

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
