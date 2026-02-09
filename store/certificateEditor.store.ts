import { create } from "zustand";

export interface CertificateElement {
  id: string;
  type: "static" | "field";
  field?: 
    | "participant.name"
    | "participant.email"
    | "certificate.number"
    | "certificate.date"
  text?: string;
  x: number;
  y: number;
  fontSize: number;
  rotation?: number;
  width?: number;
  height?: number;
  fontFamily: string;
  fontWeight: string;
  fontStyle: string;
  underline: boolean;
  color: string;
}

interface CertificateEditorState {
  backgroundImage: string | null;
  elements: CertificateElement[];
  draggingId: string | null;
  canvasSize: { width: number; height: number };

  setBackgroundImage: (url: string | null) => void;
  setElements: (elements: CertificateElement[]) => void;
  addElement: (element: CertificateElement) => void;
  updateElement: (id: string, data: Partial<CertificateElement>) => void;
  removeElement: (id: string) => void; // <-- TAMBAHAN
  setDraggingId: (id: string | null) => void;
  setCanvasSize: (width: number, height: number) => void;
  reset: () => void;
}

export const useCertificateEditor = create<CertificateEditorState>((set) => ({
  backgroundImage: null,
  elements: [],
  draggingId: null,
  canvasSize: { width: 800, height: 600 },

  setBackgroundImage: (url) => set({ backgroundImage: url }),

  setElements: (elements) => set({ elements }),

  addElement: (element) =>
    set((state) => ({
      elements: [...state.elements, element],
    })),

  updateElement: (id, data) =>
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id ? { ...el, ...data } : el
      ),
    })),

  // =========================
  // DELETE ELEMENT
  // =========================
  removeElement: (id) =>
    set((state) => ({
      elements: state.elements.filter((el) => el.id !== id),
      draggingId: state.draggingId === id ? null : state.draggingId,
    })),

  setDraggingId: (id) => set({ draggingId: id }),

  setCanvasSize: (width, height) => set({ canvasSize: { width, height } }),

  reset: () =>
    set({
      backgroundImage: null,
      elements: [],
      draggingId: null,
      canvasSize: { width: 800, height: 600 },
    }),
}));
