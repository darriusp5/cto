import { AuthScreen } from '@/components/auth/AuthScreen';
import { EditorScreen } from '@/components/editor/EditorScreen';
import { AppHeader } from '@/components/layout/AppHeader';
import { StartScreen } from '@/components/start-screen/StartScreen';
import { useAuthStore } from '@/stores/authStore';
import { useProjectStore } from '@/stores/projectStore';

/**
 * Корневой компонент (этап 3).
 * Не авторизован → экран входа. Авторизован → верхняя панель + стартовое окно,
 * при открытом проекте — редактор (заглушка до этапа 4).
 */
function AppShell(): React.JSX.Element {
  const currentProject = useProjectStore((state) => state.currentProject);

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="flex flex-1 flex-col">
        {currentProject ? <EditorScreen /> : <StartScreen />}
      </main>
    </div>
  );
}

export default function App(): React.JSX.Element {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? <AppShell /> : <AuthScreen />;
}
