/**
 * Верхнее меню (Файл / Правка / Вид / …) (каркас, этап 1).
 * Реализация — этап 2 (раздел 4.4 спецификации).
 */
export function MenuBar(): React.JSX.Element {
  const items = ['Файл', 'Правка', 'Вид', 'Положение', 'Доп', 'Помощь'];
  return (
    <nav className="flex items-center gap-1 border-b bg-card px-2 py-1 text-sm">
      {items.map((item) => (
        <button
          key={item}
          type="button"
          className="rounded px-2 py-0.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          {item}
        </button>
      ))}
    </nav>
  );
}
