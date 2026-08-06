/**
 * Экран входа (телефон + SMS) (каркас, этап 1).
 * Реализация — этап 2 (раздел 4.1 спецификации).
 */
export function AuthScreen(): React.JSX.Element {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-sm rounded-lg border bg-card p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-center">🔐 Вход в систему</h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Вход по номеру телефона + SMS-код (этап 2)
        </p>
      </div>
    </div>
  );
}
