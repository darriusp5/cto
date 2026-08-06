/**
 * Админ-панель (отдельный вход) (каркас, этап 1).
 * Реализация — этап 2 (разделы 4.1.2, 4.7 спецификации).
 */
export function AdminPanel(): React.JSX.Element {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-center">🛠 Админ-панель</h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Управление компонентами и пользователями — этап 2
        </p>
      </div>
    </div>
  );
}
