import { create } from 'zustand';

import { createProject, deleteProject, fetchProjects, importProject, updateProject } from '@/lib/auth';
import { createDefaultDoc } from '@/lib/kul';
import type { KulDocument, Project } from '@/types';

/**
 * Стор проектов (этапы 3–6): список последних, текущий проект, сохранение на сервер,
 * автосохранение, импорт .kul, удаление.
 */
interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  currentDoc: KulDocument | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  loadProjects: () => Promise<void>;
  /** Открыть проект (клик по карточке) → редактор. */
  openProject: (project: Project) => void;
  /** Создать проект (пустой или по шаблону) и открыть редактор. */
  createNew: (title: string, templateData?: string) => Promise<Project>;
  /** Открыть редактор с готовым документом (шаблон/импорт). */
  openWithDoc: (title: string, doc: KulDocument, persisted?: Project) => Promise<void>;
  /** Добавить только что созданный проект (диалог создания). */
  addProject: (project: Project) => void;
  /** Импорт .kul с диска: создаёт проект на сервере и открывает редактор. */
  importKul: (file: File) => Promise<void>;
  /** Сохранить текущий документ на сервер. */
  saveCurrent: () => Promise<void>;
  deleteCurrent: () => Promise<void>;
  closeEditor: () => void;
  setCurrentDoc: (doc: KulDocument) => void;
  setError: (error: string | null) => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  currentProject: null,
  currentDoc: null,
  loading: false,
  saving: false,
  error: null,

  loadProjects: async () => {
    set({ loading: true, error: null });
    try {
      const list = await fetchProjects();
      const sorted = [...list].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      set({ projects: sorted, loading: false });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Не удалось загрузить проекты', loading: false });
    }
  },

  openProject: (project) => {
    let doc: KulDocument;
    try {
      doc = JSON.parse(project.data) as KulDocument;
      if (!doc.pages || doc.pages.length === 0) doc = createDefaultDoc(project.title);
    } catch {
      doc = createDefaultDoc(project.title);
    }
    set({ currentProject: project, currentDoc: doc, error: null });
  },

  createNew: async (title, templateData) => {
    const doc = templateData ? (JSON.parse(templateData) as KulDocument) : createDefaultDoc(title);
    if (templateData) doc.metadata.title = title;
    const project = await createProject(title, JSON.stringify(doc));
    set((s) => ({
      projects: [project, ...s.projects.filter((p) => p.id !== project.id)],
      currentProject: project,
      currentDoc: doc,
    }));
    return project;
  },

  openWithDoc: async (title, doc, persisted) => {
    let project = persisted;
    if (!project) {
      project = await createProject(title, JSON.stringify(doc));
      set((s) => ({ projects: [project!, ...s.projects.filter((p) => p.id !== project!.id)] }));
    }
    set({ currentProject: project, currentDoc: doc });
  },

  addProject: (project) => {
    let doc: KulDocument;
    try {
      doc = JSON.parse(project.data) as KulDocument;
      if (!doc.pages || doc.pages.length === 0) doc = createDefaultDoc(project.title);
    } catch {
      doc = createDefaultDoc(project.title);
    }
    set((s) => ({
      projects: [project, ...s.projects.filter((p) => p.id !== project.id)],
      currentProject: project,
      currentDoc: doc,
    }));
  },

  importKul: async (file) => {
    const project = await importProject(file);
    const doc = JSON.parse(project.data) as KulDocument;
    set((s) => ({
      projects: [project, ...s.projects.filter((p) => p.id !== project.id)],
      currentProject: project,
      currentDoc: doc,
      error: null,
    }));
  },

  saveCurrent: async () => {
    const { currentProject, currentDoc, saving } = get();
    if (!currentProject || !currentDoc || saving) return;
    set({ saving: true });
    try {
      const doc: KulDocument = {
        ...currentDoc,
        metadata: { ...currentDoc.metadata, updatedAt: new Date().toISOString() },
      };
      const updated = await updateProject(currentProject.id, { data: JSON.stringify(doc) });
      set((s) => ({
        currentProject: { ...s.currentProject!, ...updated },
        currentDoc: doc,
        saving: false,
        projects: s.projects.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)),
      }));
    } catch (e) {
      set({ saving: false, error: e instanceof Error ? e.message : 'Ошибка сохранения' });
      throw e;
    }
  },

  deleteCurrent: async () => {
    const { currentProject } = get();
    if (!currentProject) return;
    try {
      await deleteProject(currentProject.id);
      set((s) => ({
        projects: s.projects.filter((p) => p.id !== currentProject.id),
        currentProject: null,
        currentDoc: null,
      }));
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Ошибка удаления' });
      throw e;
    }
  },

  closeEditor: () => set({ currentProject: null, currentDoc: null }),
  setCurrentDoc: (doc) => set({ currentDoc: doc }),
  setError: (error) => set({ error }),
}));
