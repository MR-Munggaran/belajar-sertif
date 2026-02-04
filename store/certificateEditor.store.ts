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
  draggingId: string | null; // <--- DITAMBAHKAN (Penting untuk ElementForm)

  setBackgroundImage: (url: string | null) => void;
  setElements: (elements: CertificateElement[]) => void;
  addElement: (element: CertificateElement) => void;
  updateElement: (id: string, data: Partial<CertificateElement>) => void;
  setDraggingId: (id: string | null) => void; // <--- DITAMBAHKAN
  reset: () => void;
}

export const useCertificateEditor = create<CertificateEditorState>((set) => ({
  backgroundImage: null,
  elements: [],
  draggingId: null, // Default null

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

  reset: () =>
    set({
      backgroundImage: null,
      elements: [],
      draggingId: null,
    }),
}));