import { useEffect, useState } from 'react';
import { FileText, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createProject, fetchTemplates } from '@/lib/auth';
import { PROJECT_NAME_MAX_LENGTH } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { projectNameSchema } from '@/lib/validation';
import { useProjectStore } from '@/stores/projectStore';
import type { Template } from '@/types';

/**
 * Диалог «Создать новый чертёж» (раздел 4.2.1):
 * название (3–20 символов), «Пустой чертёж» (A4, портрет, сетка 5 мм, белый фон)
 * или шаблон из GET /api/templates; создание → POST /api/projects → редактор.
 */
interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EMPTY_PROJECT_DATA = JSON.stringify({
  version: '1.0',
  page: {
    format: 'A4',
    width: 210,
    height: 297,
    orientation: 'portrait',
    background: '#ffffff',
    grid: 5,
  },
  layers: [{ id: 'layer-1', name: 'Основной', visible: true, locked: false }],
  pages: [],
  settings: { snapToGrid: true, showGrid: true },
});

export function CreateProjectDialog({ open, onOpenChange }: CreateProjectDialogProps): React.JSX.Element {
  const addProject = useProjectStore((state) => state.addProject);

  const [name, setName] = useState('');
  const [selection, setSelection] = useState<'empty' | string>('empty');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName('');
    setSelection('empty');
    setError(null);
    setTemplatesLoading(true);
    fetchTemplates()
      .then(setTemplates)
      .catch(() => setTemplates([]))
      .finally(() => setTemplatesLoading(false));
  }, [open]);

  const validation = projectNameSchema.safeParse(name.trim());
  const nameError = name.length > 0 && !validation.success ? (validation.error.issues[0]?.message ?? null) : null;

  const handleCreate = async (): Promise<void> => {
    const parsed = projectNameSchema.safeParse(name.trim());
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Название: 3–20 символов');
      return;
    }
    const template = templates.find((t) => t.id === selection);
    const data = template ? template.data : EMPTY_PROJECT_DATA;
    setCreating(true);
    setError(null);
    try {
      const project = await createProject(parsed.data, data);
      addProject(project);
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось создать проект');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl border-white/10 bg-slate-900/95 text-slate-100 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-slate-100">✨ Создать новый чертёж</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="project-name" className="text-slate-300">
              📝 Название проекта
            </Label>
            <Input
              id="project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`От 3 до ${PROJECT_NAME_MAX_LENGTH} символов`}
              maxLength={PROJECT_NAME_MAX_LENGTH}
              autoFocus
              className="h-10 border-white/10 bg-slate-800/60 text-slate-100 placeholder:text-slate-500 focus-visible:ring-cyan-400/60"
            />
            <div className="flex justify-between text-xs">
              <span className={nameError ? 'text-red-400' : 'text-transparent'}>
                {nameError ?? '\u00A0'}
              </span>
              <span className={nameError ? 'text-red-400' : 'text-slate-500'}>
                {name.length}/{PROJECT_NAME_MAX_LENGTH}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Вариант</Label>
            <button
              type="button"
              onClick={() => setSelection('empty')}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl border p-4 text-left transition',
                selection === 'empty'
                  ? 'border-cyan-400/60 bg-cyan-400/10'
                  : 'border-white/10 bg-white/5 hover:bg-white/10',
              )}
            >
              <span className="text-2xl">📄</span>
              <span>
                <span className="block text-sm font-semibold text-white">ПУСТОЙ ЧЕРТЁЖ</span>
                <span className="block text-xs text-slate-400">
                  Создать с настройками по умолчанию: A4, портрет, сетка 5 мм, белый фон
                </span>
              </span>
            </button>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">ШАБЛОНЫ</Label>
            {templatesLoading ? (
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" /> Загрузка шаблонов…
              </div>
            ) : templates.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/10 px-4 py-6 text-center text-sm text-slate-500">
                Шаблоны появятся позже
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => setSelection(template.id)}
                    className={cn(
                      'flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition',
                      selection === template.id
                        ? 'border-cyan-400/60 bg-cyan-400/10'
                        : 'border-white/10 bg-white/5 hover:bg-white/10',
                    )}
                  >
                    <span className="flex h-16 w-full items-center justify-center overflow-hidden rounded-lg bg-white/10 text-slate-300">
                      {template.thumbnail ? (
                        <img
                          src={template.thumbnail}
                          alt={template.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <FileText className="h-6 w-6" />
                      )}
                    </span>
                    <span className="text-xs font-medium text-slate-200">{template.name}</span>
                    {template.category && (
                      <span className="text-[10px] uppercase tracking-wide text-slate-500">
                        {template.category}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 hover:text-slate-100"
            >
              Отмена
            </Button>
            <Button
              onClick={() => void handleCreate()}
              disabled={creating || !validation.success}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50"
            >
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Создать'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
