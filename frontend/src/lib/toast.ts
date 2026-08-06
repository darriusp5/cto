import { create } from 'zustand';

/** Лёгкие тосты (раздел 4.9.3 — всплывающие сообщения). */

export interface Toast {
  id: number;
  message: string;
  kind: 'info' | 'error' | 'success';
}

interface ToastState {
  toasts: Toast[];
  show: (message: string, kind?: Toast['kind']) => void;
  remove: (id: number) => void;
}

let nextId = 1;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  show: (message, kind = 'info') => {
    const id = nextId++;
    set((s) => ({ toasts: [...s.toasts.slice(-4), { id, message, kind }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), kind === 'error' ? 3000 : 1800);
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export function toast(message: string, kind: Toast['kind'] = 'info'): void {
  useToastStore.getState().show(message, kind);
}
