/**
 * Левая панель библиотеки (поиск, дерево, избранное) (каркас, этап 1).
 * Реализация — этап 2 (раздел 4.3 спецификации).
 */
export function LibraryPanel(): React.JSX.Element {
  return (
    <aside className="flex h-full w-64 flex-col border-r bg-card">
      <div className="border-b p-3">
        <input
          type="search"
          placeholder="Поиск…"
          disabled
          className="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
        />
      </div>
      <div className="flex flex-1 flex-col items-center justify-center p-4 text-sm text-muted-foreground">
        Библиотека компонентов — этап 2
      </div>
    </aside>
  );
}
