/**
 * Типы предметной области (этапы 3–6).
 * Согласованы с ответами backend API и форматом .kul (раздел 4.17 спецификации).
 */

export type Role = 'user' | 'admin' | 'dev';

/** Пользователь — ответ GET /api/users/me и POST /api/auth/verify. */
export interface User {
  id: string;
  phone: string;
  name: string | null;
  role: Role;
  banned: boolean;
}

/** Проект — ответ /api/projects (поле data — строка JSON KulDocument). */
export interface Project {
  id: string;
  userId: string;
  title: string;
  data: string;
  thumbnail: string | null;
  lastOpened: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Шаблон — ответ GET /api/templates. */
export interface Template {
  id: string;
  name: string;
  category: string | null;
  thumbnail: string | null;
  data: string;
  isDefault: boolean;
  createdAt: string;
}

// ── Библиотека компонентов ──────────────────────────────────────────────────

export type TerminalSide = 'left' | 'right' | 'top' | 'bottom';
export type TerminalKind = 'in' | 'out' | 'both';

export interface Terminal {
  id: string;
  label: string;
  side: TerminalSide;
  kind: TerminalKind;
}

export interface Brand {
  id: string;
  name: string;
  logoUrl: string | null;
  website: string | null;
  active: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  parentId: string | null;
  sortOrder: number;
  createdAt: string;
  children?: Category[];
}

export interface ComponentItem {
  id: string;
  name: string;
  article: string | null;
  brandId: string | null;
  categoryId: string | null;
  type: string | null;
  imageUrl: string | null;
  /** JSON-строка массива Terminal (backend хранит как String). */
  terminals: string;
  /** JSON-строка параметров. */
  params: string;
  active: boolean;
  brand: Brand | null;
  category: Category | null;
  createdAt: string;
}

export interface ComponentParams {
  current?: number;
  voltage?: number;
  poles?: number;
  characteristic?: string;
  leak?: number;
  section?: number;
  length?: number;
  modules?: number;
  label?: string;
  size?: { w: number; h: number };
}

export function parseTerminals(item: Pick<ComponentItem, 'terminals'>): Terminal[] {
  try {
    const v = JSON.parse(item.terminals);
    return Array.isArray(v) ? (v as Terminal[]) : [];
  } catch {
    return [];
  }
}

export function parseParams(item: Pick<ComponentItem, 'params'>): ComponentParams {
  try {
    return JSON.parse(item.params ?? '{}') as ComponentParams;
  } catch {
    return {};
  }
}

// ── .kul документ (раздел 4.17) ─────────────────────────────────────────────

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  order: number;
}

export interface KulComponentElement {
  id: string;
  type: 'component';
  componentId: string;
  label: string;
  position: { x: number; y: number };
  size: { w: number; h: number };
  rotation: number;
  locked: boolean;
  visible: boolean;
  layerId: string;
  params: ComponentParams;
  style: { fill: string; stroke: string; strokeWidth: number; opacity: number };
  connections: { terminal: string; wireId: string }[];
}

export interface KulWireElement {
  id: string;
  type: 'wire';
  source: string;
  sourcePort: string;
  target: string;
  targetPort: string;
  vertices: { x: number; y: number }[];
  style: {
    stroke: string;
    strokeWidth: number;
    lineJoin: string;
    lineType: 'solid' | 'dashed' | 'dashdot' | 'dotdot';
    startType: string;
    endType: string;
  };
  params: { wireColor?: string; section?: number; marking?: string; length?: number };
  layerId: string;
}

export type KulElement = KulComponentElement | KulWireElement;

export interface KulPage {
  id: string;
  name: string;
  elements: KulElement[];
}

export interface KulDocument {
  version: string;
  metadata: {
    id: string;
    title: string;
    customer: string;
    executor: string;
    date?: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
    units: 'mm' | 'cm' | 'in';
    grid: number;
  };
  page: {
    format: string;
    width: number;
    height: number;
    orientation: 'portrait' | 'landscape';
    background: string;
  };
  layers: Layer[];
  pages: KulPage[];
  settings: {
    autosave: boolean;
    snapToGrid: boolean;
    showRuler: boolean;
    showGrid: boolean;
    showGuides: boolean;
  };
}

/** Узел дерева библиотеки (категория или компонент). */
export interface LibraryNode {
  id: string;
  name: string;
  parentId: string | null;
  isFavorite: boolean;
  children?: LibraryNode[];
}

export interface Component { id: string; name: string; article: string | null; type: string | null; terminals: string; params: string | null; brand?: { name: string } | null; category?: { id: string; name: string } | null; }

/** Терминал элемента на холсте (позиция в % от стороны). */
export interface ElementTerminal { id: string; name: string; side: string; pos: number; }

/** Элемент (компонент) на холсте. */
export interface DiagramElement {
  id: string;
  componentId: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  terminals: ElementTerminal[];
  params: Record<string, string | number>;
  layerId?: string;
  groupId?: string;
}

/** Провод между клеммами двух элементов (раздел 4.9). */
export interface DiagramLink {
  id: string;
  source: string;
  sourcePort: string;
  target: string;
  targetPort: string;
  vertices?: { x: number; y: number }[];
  layerId?: string;
  style?: {
    stroke?: string;
    strokeWidth?: number;
    lineType?: 'solid' | 'dashed' | 'dashdot' | 'dotdot';
  };
}

/** Группа элементов (раздел 4.12). */
export interface DiagramGroup { id: string; name: string; elementIds: string[]; }

export interface DiagramData {
  format: string;
  grid: number;
  elements: DiagramElement[];
  links: DiagramLink[];
  layers?: Layer[];
  groups?: DiagramGroup[];
  settings?: { showGrid?: boolean; snapToGrid?: boolean };
}

export interface AuthSession {
  user: User | null;
  token: string | null;
}
