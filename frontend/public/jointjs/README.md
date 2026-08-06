# JointJS (локально)

Копия дистрибутива JointJS 3.x (npm-пакет `jointjs`, бесплатная версия) — для локальной
отдачи без CDN (см. раздел 3.1 спецификации ekl.by).

Файлы скопированы из `node_modules/jointjs/dist/`:

- `joint.js` / `joint.min.js` — ядро JointJS (UMD-бандл со всеми зависимостями);
- `joint.css` / `joint.min.css` — базовые стили.

При обновлении пакета `jointjs` обновляйте и эти файлы:
`cp node_modules/jointjs/dist/joint.min.js node_modules/jointjs/dist/joint.css public/jointjs/`
