/**
 * Сид-скрипт ekl.by (этап 6): бренды, категории, компоненты, шаблоны, админ.
 * Идемпотентный — безопасен для повторного запуска (upsert по уникальным ключам).
 *
 * Запуск: npx prisma db seed   (или: npx tsx prisma/seed.ts)
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/** Клемма компонента (раздел 4.8.4 — точки подключения). */
interface Terminal {
  id: string;
  label: string;
  side: 'left' | 'right' | 'top' | 'bottom';
  kind: 'in' | 'out' | 'both';
}

/** Сгенерировать клеммы автоматического выключателя по числу полюсов. */
function breakerTerminals(poles: number): Terminal[] {
  const t: Terminal[] = [];
  for (let i = 0; i < poles; i++) {
    t.push({ id: `in${i + 1}`, label: `IN${i + 1}`, side: 'left', kind: 'in' });
    t.push({ id: `out${i + 1}`, label: `OUT${i + 1}`, side: 'right', kind: 'out' });
  }
  return t;
}

const rcd2p = [
  { id: 'in1', label: 'IN L', side: 'left', kind: 'in' },
  { id: 'in2', label: 'IN N', side: 'left', kind: 'in' },
  { id: 'out1', label: 'OUT L', side: 'right', kind: 'out' },
  { id: 'out2', label: 'OUT N', side: 'right', kind: 'out' },
] as Terminal[];

const rcd4p = [
  { id: 'in1', label: 'IN L1', side: 'left', kind: 'in' },
  { id: 'in2', label: 'IN L2', side: 'left', kind: 'in' },
  { id: 'in3', label: 'IN L3', side: 'left', kind: 'in' },
  { id: 'in4', label: 'IN N', side: 'left', kind: 'in' },
  { id: 'out1', label: 'OUT L1', side: 'right', kind: 'out' },
  { id: 'out2', label: 'OUT L2', side: 'right', kind: 'out' },
  { id: 'out3', label: 'OUT L3', side: 'right', kind: 'out' },
  { id: 'out4', label: 'OUT N', side: 'right', kind: 'out' },
] as Terminal[];

const railTerminals = [
  { id: 'l', label: 'L', side: 'left', kind: 'both' },
  { id: 'r', label: 'R', side: 'right', kind: 'both' },
] as Terminal[];

const busTerminals = [
  { id: 'in', label: 'IN', side: 'left', kind: 'in' },
  { id: 'out', label: 'OUT', side: 'right', kind: 'out' },
] as Terminal[];

interface ComponentSeed {
  name: string;
  article: string;
  type: string;
  brandKey: string;
  categoryKey: string;
  terminals: Terminal[];
  params: Record<string, unknown>;
  size?: { w: number; h: number };
}

const COMPONENTS: ComponentSeed[] = [
  {
    name: 'ABB QF1 — Автомат 16A 2P', article: 'S201-B16', type: 'automaten',
    brandKey: 'ABB', categoryKey: 'automat-ABB', terminals: breakerTerminals(2),
    params: { current: 16, voltage: 230, poles: 2, characteristic: 'C', label: 'QF1' }, size: { w: 36, h: 90 },
  },
  {
    name: 'ABB QF2 — Автомат 25A 2P', article: 'S201-B25', type: 'automaten',
    brandKey: 'ABB', categoryKey: 'automat-ABB', terminals: breakerTerminals(2),
    params: { current: 25, voltage: 230, poles: 2, characteristic: 'C', label: 'QF2' }, size: { w: 36, h: 90 },
  },
  {
    name: 'ABB QF3 — Автомат 16A 1P', article: 'S201-B16-1P', type: 'automaten',
    brandKey: 'ABB', categoryKey: 'automat-ABB', terminals: breakerTerminals(1),
    params: { current: 16, voltage: 230, poles: 1, characteristic: 'B', label: 'QF3' }, size: { w: 36, h: 48 },
  },
  {
    name: 'ABB QF4 — Автомат 32A 3P', article: 'S203-B32', type: 'automaten',
    brandKey: 'ABB', categoryKey: 'automat-ABB', terminals: breakerTerminals(3),
    params: { current: 32, voltage: 400, poles: 3, characteristic: 'C', label: 'QF4' }, size: { w: 36, h: 130 },
  },
  {
    name: 'DEKraft QF1 — Автомат 16A 1P', article: 'DK-101', type: 'automaten',
    brandKey: 'DEKraft', categoryKey: 'automat-DEKraft', terminals: breakerTerminals(1),
    params: { current: 16, voltage: 230, poles: 1, characteristic: 'C', label: 'QF1' }, size: { w: 36, h: 48 },
  },
  {
    name: 'DEKraft QF2 — Автомат 25A 2P', article: 'DK-102', type: 'automaten',
    brandKey: 'DEKraft', categoryKey: 'automat-DEKraft', terminals: breakerTerminals(2),
    params: { current: 25, voltage: 230, poles: 2, characteristic: 'C', label: 'QF2' }, size: { w: 36, h: 90 },
  },
  {
    name: 'IEK QF1 — Автомат 16A 1P', article: 'ВА47-29', type: 'automaten',
    brandKey: 'IEK', categoryKey: 'automat-IEK', terminals: breakerTerminals(1),
    params: { current: 16, voltage: 230, poles: 1, characteristic: 'C', label: 'QF1' }, size: { w: 36, h: 48 },
  },
  {
    name: 'ABB УЗО 2P 40A 30мА', article: 'F204-40', type: 'rcd',
    brandKey: 'ABB', categoryKey: 'uzo', terminals: rcd2p,
    params: { current: 40, voltage: 230, poles: 2, leak: 30, label: 'УЗО1' }, size: { w: 36, h: 90 },
  },
  {
    name: 'ABB УЗО 4P 63A 30мА', article: 'F204-63', type: 'rcd',
    brandKey: 'ABB', categoryKey: 'uzo', terminals: rcd4p,
    params: { current: 63, voltage: 400, poles: 4, leak: 30, label: 'УЗО2' }, size: { w: 36, h: 170 },
  },
  {
    name: 'DEKraft УЗО 2P 25A', article: 'DK-201', type: 'rcd',
    brandKey: 'DEKraft', categoryKey: 'uzo', terminals: rcd2p,
    params: { current: 25, voltage: 230, poles: 2, leak: 30, label: 'УЗО3' }, size: { w: 36, h: 90 },
  },
  {
    name: 'DIN-рейка 35мм (1м)', article: 'DR-35-1M', type: 'din-rail',
    brandKey: 'ABB', categoryKey: 'din', terminals: railTerminals,
    params: { length: 1000, label: 'Рейка' }, size: { w: 300, h: 12 },
  },
  {
    name: 'DIN-рейка 35мм (2м)', article: 'DR-35-2M', type: 'din-rail',
    brandKey: 'IEK', categoryKey: 'din', terminals: railTerminals,
    params: { length: 2000, label: 'Рейка' }, size: { w: 600, h: 12 },
  },
  {
    name: 'Клемма WAGO 222 (2-пров.)', article: 'WAGO-222-412', type: 'terminal',
    brandKey: 'ABB', categoryKey: 'accessory', terminals: busTerminals,
    params: { section: 4, label: 'Клемма' }, size: { w: 24, h: 24 },
  },
  {
    name: 'Шина N (нулевая)', article: 'BUS-N', type: 'busbar',
    brandKey: 'ABB', categoryKey: 'accessory', terminals: railTerminals,
    params: { label: 'N' }, size: { w: 200, h: 20 },
  },
  {
    name: 'Шина PE (заземление)', article: 'BUS-PE', type: 'busbar',
    brandKey: 'ABB', categoryKey: 'accessory', terminals: railTerminals,
    params: { label: 'PE' }, size: { w: 200, h: 20 },
  },
  {
    name: 'Щит распределительный ABB (12 мод.)', article: 'SH-12M', type: 'panel',
    brandKey: 'ABB', categoryKey: 'shields', terminals: [
      { id: 'in', label: 'ВВОД', side: 'left', kind: 'in' },
      { id: 'out', label: 'ВЫХОД', side: 'right', kind: 'out' },
    ] as Terminal[],
    params: { modules: 12, label: 'Щит' }, size: { w: 160, h: 200 },
  },
];

/** Построить .kul-документ шаблона (структура — раздел 4.17). */
function kulDoc(title: string, elements: unknown[]): Record<string, unknown> {
  return {
    version: '1.0',
    metadata: {
      id: 'template-' + title.toLowerCase().replace(/\s+/g, '-'),
      title,
      customer: '',
      executor: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      units: 'mm',
      grid: 5,
    },
    page: { format: 'A4', width: 210, height: 297, orientation: 'portrait', background: '#ffffff' },
    layers: [
      { id: 'layer-main', name: 'Основной', visible: true, locked: false, order: 0 },
      { id: 'layer-wires', name: 'Провода', visible: true, locked: false, order: 1 },
    ],
    pages: [{ id: 'page-1', name: 'Страница 1', elements }],
    settings: { autosave: true, snapToGrid: true, showRuler: true, showGrid: true, showGuides: true },
  };
}

/** Примерный набор элементов для шаблонов (componentId — имя из сида). */
function templateElements(componentNames: string[], offsetX = 40, offsetY = 60, stepY = 100): unknown[] {
  return componentNames.map((name, i) => ({
    id: `tpl-comp-${i + 1}`,
    type: 'component',
    componentId: name,
    label: `QF${i + 1}`,
    position: { x: offsetX, y: offsetY + i * stepY },
    size: { w: 36, h: 90 },
    rotation: 0,
    locked: false,
    visible: true,
    layerId: 'layer-main',
    params: { current: 16, voltage: 230, poles: 2, characteristic: 'C' },
    style: { fill: '#ffffff', stroke: '#000000', strokeWidth: 1, opacity: 1 },
    connections: [],
  }));
}

async function main(): Promise<void> {
  console.log('🌱 Seeding ekl.by…');

  // ── Бренды ────────────────────────────────────────────────────────────────
  const brands: Record<string, string> = {};
  for (const name of ['ABB', 'DEKraft', 'IEK']) {
    const b = await prisma.brand.upsert({
      where: { id: name.toLowerCase() },
      create: { id: name.toLowerCase(), name, website: `https://www.${name.toLowerCase()}.com` },
      update: { name },
    });
    brands[name] = b.id;
  }

  // ── Категории ─────────────────────────────────────────────────────────────
  const cat = async (key: string, name: string, parentKey?: string, sort = 0): Promise<string> => {
    const parentId = parentKey ? await cat(parentKey, '') : undefined;
    const c = await prisma.category.upsert({
      where: { id: key },
      create: { id: key, name, parentId: parentId ?? null, sortOrder: sort },
      update: { name, parentId: parentId ?? null, sortOrder: sort },
    });
    return c.id;
  };

  await cat('accessory', 'Аксессуары для DIN-реек и шин');
  await cat('shields', 'Щиты ABB');
  await cat('automat', 'Автоматические выключатели', undefined, 2);
  await cat('automat-ABB', 'ABB', 'automat', 0);
  await cat('automat-DEKraft', 'DEKraft', 'automat', 1);
  await cat('automat-IEK', 'IEK', 'automat', 2);
  await cat('uzo', 'УЗО', undefined, 3);
  await cat('din', 'DIN-рейки', undefined, 4);

  // ── Компоненты ────────────────────────────────────────────────────────────
  for (const c of COMPONENTS) {
    const slug = c.article.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    const existing = await prisma.component.findFirst({ where: { article: c.article } });
    const data = {
      name: c.name,
      article: c.article,
      type: c.type,
      brandId: brands[c.brandKey],
      categoryId: c.categoryKey,
      terminals: JSON.stringify(c.terminals),
      params: JSON.stringify({ ...c.params, size: c.size ?? { w: 36, h: 90 } }),
    };
    await prisma.component.upsert({
      where: { id: existing?.id ?? `seed-${slug}` },
      create: data,
      update: data,
    });
  }

  // ── Шаблоны ───────────────────────────────────────────────────────────────
  const templates: { name: string; category: string; isDefault: boolean; data: Record<string, unknown> }[] = [
    { name: 'Пустой чертёж', category: 'Базовые', isDefault: true, data: kulDoc('Пустой чертёж', []) },
    {
      name: 'Вводной щит', category: 'Щиты', isDefault: false,
      data: kulDoc('Вводной щит', templateElements(['ABB QF1 — Автомат 16A 2P', 'ABB УЗО 2P 40A 30мА', 'ABB QF2 — Автомат 25A 2P'])),
    },
    {
      name: 'Распределитель', category: 'Щиты', isDefault: false,
      data: kulDoc('Распределитель', templateElements(['ABB QF1 — Автомат 16A 2P', 'ABB QF2 — Автомат 25A 2P', 'ABB QF4 — Автомат 32A 3P'])),
    },
    {
      name: 'Освещение', category: 'Электрика', isDefault: false,
      data: kulDoc('Освещение', templateElements(['DEKraft QF1 — Автомат 16A 1P', 'DEKraft QF2 — Автомат 25A 2P', 'DEKraft УЗО 2P 25A'])),
    },
    {
      name: 'Резервный ввод', category: 'Электрика', isDefault: false,
      data: kulDoc('Резервный ввод', templateElements(['IEK QF1 — Автомат 16A 1P', 'ABB УЗО 2P 40A 30мА', 'ABB QF3 — Автомат 16A 1P'])),
    },
  ];
  for (const t of templates) {
    const slug = `seed-tpl-${t.name.toLowerCase().replace(/\s+/g, '-')}`;
    const existing = await prisma.template.findFirst({ where: { name: t.name } });
    const data = { name: t.name, category: t.category, isDefault: t.isDefault, data: JSON.stringify(t.data) };
    await prisma.template.upsert({ where: { id: existing?.id ?? slug }, create: data, update: data });
  }

  // ── Пользователи и админ ──────────────────────────────────────────────────
  const adminUser = await prisma.user.upsert({
    where: { phone: '+375 (29) 000-00-00' },
    create: { phone: '+375 (29) 000-00-00', name: 'Администратор', role: 'admin', lastActive: new Date() },
    update: { name: 'Администратор', role: 'admin' },
  });
  const passwordHash = await bcrypt.hash('admin123', 10);
  await prisma.admin.upsert({
    where: { id: adminUser.id },
    create: { id: adminUser.id, email: 'admin@ekl.by', passwordHash },
    update: { email: 'admin@ekl.by', passwordHash },
  });

  const demoUser = await prisma.user.upsert({
    where: { phone: '+375 (29) 111-11-11' },
    create: { phone: '+375 (29) 111-11-11', name: 'Иван Петров', role: 'user', lastActive: new Date() },
    update: { name: 'Иван Петров' },
  });

  // Демо-проект для быстрого старта
  const demoProject = await prisma.project.findFirst({ where: { userId: demoUser.id, title: 'Вводной щит (квартира)' } });
  if (!demoProject) {
    await prisma.project.create({
      data: {
        userId: demoUser.id,
        title: 'Вводной щит (квартира)',
        data: JSON.stringify(kulDoc('Вводной щит (квартира)', templateElements(['ABB QF1 — Автомат 16A 2P', 'ABB УЗО 2P 40A 30мА']))),
        lastOpened: new Date(),
      },
    });
  }

  console.log('✅ Seed завершён: бренды, категории, компоненты, шаблоны, админ admin@ekl.by / admin123, демо-пользователь +375 (29) 111-11-11.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
