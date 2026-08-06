import { useEffect, useState } from 'react';
import { ChevronDown, LogOut, Phone } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { APP_NAME } from '@/lib/constants';
import { updateMe } from '@/lib/auth';
import { userNameSchema } from '@/lib/validation';
import { useAuthStore } from '@/stores/authStore';

/**
 * Верхняя панель (раздел 4.1.3): слева логотип «ekl.by», справа — телефон/имя.
 * Клик по имени → меню: редактирование имени (PUT /api/users/me),
 * телефон (только просмотр), «Выйти».
 */
export function AppHeader(): React.JSX.Element {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const logout = useAuthStore((state) => state.logout);

  const [nameDraft, setNameDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  useEffect(() => {
    setNameDraft(user?.name ?? '');
  }, [user?.name]);

  const handleSaveName = async (): Promise<void> => {
    const parsed = userNameSchema.safeParse(nameDraft);
    if (!parsed.success) {
      setNameError(parsed.error.issues[0]?.message ?? 'Некорректное имя');
      return;
    }
    setSaving(true);
    setNameError(null);
    try {
      const updated = await updateMe(parsed.data);
      setUser(updated);
    } catch (e) {
      setNameError(e instanceof Error ? e.message : 'Не удалось сохранить имя');
    } finally {
      setSaving(false);
    }
  };

  const display = user?.name || user?.phone || '';
  const initial = (user?.name?.[0] ?? user?.phone?.[0] ?? '?').toUpperCase();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 text-base shadow shadow-cyan-500/25">
            📱
          </span>
          <span className="text-lg font-bold tracking-tight text-white">{APP_NAME}</span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1.5 pl-1.5 pr-3 text-sm text-slate-200 transition hover:bg-white/10"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 text-xs font-semibold text-white">
                {initial}
              </span>
              <span className="max-w-44 truncate">{display}</span>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-80 border-white/10 bg-slate-900/95 text-slate-200 shadow-2xl backdrop-blur-xl"
          >
            <DropdownMenuLabel className="text-xs text-slate-400">Мой профиль</DropdownMenuLabel>
            <div className="space-y-3 px-2 pb-2">
              <div className="space-y-1.5">
                <Label htmlFor="header-name" className="text-xs text-slate-400">
                  Имя
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="header-name"
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') void handleSaveName();
                    }}
                    placeholder="Введите имя"
                    className="h-9 border-white/10 bg-slate-800/60 text-slate-100 placeholder:text-slate-500 focus-visible:ring-cyan-400/60"
                  />
                  <Button
                    size="sm"
                    onClick={() => void handleSaveName()}
                    disabled={saving}
                    className="h-9 shrink-0 bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500"
                  >
                    {saving ? '…' : 'Сохранить'}
                  </Button>
                </div>
                {nameError && <p className="text-xs text-red-400">{nameError}</p>}
              </div>

              <div className="flex items-center gap-2 rounded-md border border-white/10 bg-slate-800/40 px-3 py-2 text-sm">
                <Phone className="h-4 w-4 shrink-0 text-slate-400" />
                <span className="truncate text-slate-300">{user?.phone}</span>
                <span className="ml-auto shrink-0 text-xs text-slate-500">только просмотр</span>
              </div>
            </div>
            <DropdownMenuSeparator className="bg-white/10" />
            <button
              type="button"
              onClick={() => void logout()}
              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
            >
              <LogOut className="h-4 w-4" />
              Выйти
            </button>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
