import { create } from 'zustand';

import type { Project } from '@/types';

/**
 * Стор проектов (этап 3).
 * Список последних проектов + текущий открытый проект (переход в редактор).
 */
interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  loading: boolean;
  error: string | null;
  setProjects: (projects: Project[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  /** Открыть проект (клик по карточке/после создания) → редактор. */
  openProject: (project: Project) => void;
  /** Закрыть редактор и вернуться на стартовое окно. */
  closeEditor: () => void;
  /** Добавить только что созданный проект. */
  addProject: (project: Project) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  currentProject: null,
  loading: false,
  error: null,
  setProjects: (projects) => set({ projects }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  openProject: (currentProject) => set({ currentProject }),
  closeEditor: () => set({ currentProject: null }),
  addProject: (project) =>
    set((state) => ({
      projects: [project, ...state.projects.filter((p) => p.id !== project.id)],
      currentProject: project,
    })),
}));
