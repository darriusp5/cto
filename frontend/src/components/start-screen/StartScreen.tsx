/**
 * Стартовое окно (создать / открыть / последние проекты) (каркас, этап 1).
 * Реализация — этап 2 (раздел 4.2 спецификации).
 */
export function StartScreen(): React.JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center gap-8 p-8">
      <div>
        <h1 className="text-2xl font-semibold">📐 Монтажная схема</h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          Стартовое окно — этап 2
        </p>
      </div>
      <div className="flex gap-4">
        <div className="flex w-52 flex-col items-center gap-2 rounded-lg border bg-card p-6">
          <span className="text-3xl">📄</span>
          <span className="font-medium">Создать новую диаграмму</span>
          <span className="text-center text-xs text-muted-foreground">этап 2</span>
        </div>
        <div className="flex w-52 flex-col items-center gap-2 rounded-lg border bg-card p-6">
          <span className="text-3xl">📂</span>
          <span className="font-medium">Открыть существующую</span>
          <span className="text-center text-xs text-muted-foreground">этап 2</span>
        </div>
      </div>
    </div>
  );
}
