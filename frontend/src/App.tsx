import { AuthScreen } from '@/components/auth/AuthScreen';
import { StartScreen } from '@/components/start-screen/StartScreen';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';
import { APP_NAME } from '@/lib/constants';

/**
 * Корневой компонент приложения (каркас, этап 1).
 * Маршрутизация между экранами — на этапе 2.
 */
function AppShell(): React.JSX.Element {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b bg-card px-4 py-2">
        <span className="font-semibold">📱 {APP_NAME}</span>
        <span className={cn('text-sm text-muted-foreground')}>
          {user ? user.phone : 'не авторизован'}
        </span>
      </header>
      <main className="flex flex-1 flex-col">
        <StartScreen />
      </main>
    </div>
  );
}

export default function App(): React.JSX.Element {
  // Каркас: показываем стартовый экран, авторизация — этап 2.
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? <AppShell /> : <AuthScreen />;
}
