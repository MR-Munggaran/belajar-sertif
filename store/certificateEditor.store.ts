import { create } from "zustand";

export interface CertificateElement {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: string; // "normal" | "bold"
  fontStyle: string;  // "normal" | "italic"
  color: string;
}

interface CertificateEditorState {
  backgroundImage: string | null;
  elements: CertificateElement[];
  draggingId: string | null;
  canvasSize: { width: number; height: number }; // <-- BARU: Simpan ukuran asli

  setBackgroundImage: (url: string | null) => void;
  setElements: (elements: CertificateElement[]) => void;
  addElement: (element: CertificateElement) => void;
  updateElement: (id: string, data: Partial<CertificateElement>) => void;
  setDraggingId: (id: string | null) => void;
  setCanvasSize: (width: number, height: number) => void; // <-- BARU
  reset: () => void;
}

export const useCertificateEditor = create<CertificateEditorState>((set) => ({
  backgroundImage: null,
  elements: [],
  draggingId: null,
  canvasSize: { width: 800, height: 600 }, // Default fallback

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