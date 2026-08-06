/**
 * Правая панель свойств (каркас, этап 1).
 * Реализация — этап 4 (раздел 4.3 спецификации).
 */
export function InspectorPanel(): React.JSX.Element {
  return (
    <aside className="flex h-full w-72 flex-col border-l bg-card">
      <div className="border-b px-4 py-3 text-sm font-medium">📄 Свойства</div>
      <div className="flex flex-1 items-center justify-center p-4 text-sm text-muted-foreground">
        Панель свойств — этап 4
      </div>
    </aside>
  );
}
