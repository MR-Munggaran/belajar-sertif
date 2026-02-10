import { create } from "zustand";
import { PaperSize, Orientation, getCanvasDimensions } from "@/utils/paperSizes";

// Gunakan interface Element yang sama
export interface CertificateElement {
  id: string;
  type: "static" | "field";
  field?: "participant.name" | "participant.email" | "certificate.number" | "certificate.date";
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

interface Page {
  id: string;
  elements: CertificateElement[];
  backgroundImage: string | null;
}

interface CertificateEditorState {
  // Global Settings
  paperSize: PaperSize;
  orientation: Orientation;
  canvasSize: { width: number; height: number };

  // Multi-page Data
  pages: Page[];
  activePageId: string;
  draggingId: string | null;

  // Actions
  setPaperSize: (size: PaperSize) => void;
  setOrientation: (orientation: Orientation) => void;
  
  // Page Management
  addPage: () => void;
  removePage: (id: string) => void;
  setActivePage: (id: string) => void;

  // Element & Background (Targeting Active Page)
  setBackgroundImage: (url: string | null) => void;
  setElements: (elements: CertificateElement[]) => void;
  addElement: (element: CertificateElement) => void;
  updateElement: (id: string, data: Partial<CertificateElement>) => void;
  removeElement: (id: string) => void;
  setDraggingId: (id: string | null) => void;
  
  reset: () => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

export const useCertificateEditor = create<CertificateEditorState>((set, get) => ({
  paperSize: "A4",
  orientation: "landscape",
  canvasSize: getCanvasDimensions("A4", "landscape"), // Default A4 Landscape
  
  pages: [{ id: "page_1", elements: [], backgroundImage: null }], // Default 1 halaman
  activePageId: "page_1",
  draggingId: null,

  setPaperSize: (size) => {
    const { orientation } = get();
    set({ 
      paperSize: size, 
      canvasSize: getCanvasDimensions(size, orientation) 
    });
  },

  setOrientation: (orientation) => {
    const { paperSize } = get();
    set({ 
      orientation, 
      canvasSize: getCanvasDimensions(paperSize, orientation) 
    });
  },

  addPage: () => set((state) => {
    const newPageId = `page_${generateId()}`;
    return {
      pages: [...state.pages, { id: newPageId, elements: [], backgroundImage: null }],
      activePageId: newPageId // Otomatis pindah ke page baru
    };
  }),

  removePage: (id) => set((state) => {
    if (state.pages.length <= 1) return state; // Minimal 1 page
    const newPages = state.pages.filter(p => p.id !== id);
    return {
      pages: newPages,
      activePageId: state.activePageId === id ? newPages[0].id : state.activePageId
    };
  }),

  setActivePage: (id) => set({ activePageId: id, draggingId: null }),

  // --- ACTIONS PER PAGE ---

  setBackgroundImage: (url) => set((state) => ({
    pages: state.pages.map(p => 
      p.id === state.activePageId ? { ...p, backgroundImage: url } : p
    )
  })),

  setElements: (elements) => set((state) => ({
    pages: state.pages.map(p => 
      p.id === state.activePageId ? { ...p, elements } : p
    )
  })),

  addElement: (element) => set((state) => ({
    pages: state.pages.map(p => 
      p.id === state.activePageId 
        ? { ...p, elements: [...p.elements, element] } 
        : p
    )
  })),

  updateElement: (elId, data) => set((state) => ({
    pages: state.pages.map(p => 
      p.id === state.activePageId 
        ? {
            ...p,
            elements: p.elements.map(el => el.id === elId ? { ...el, ...data } : el)
          }
        : p
    )
  })),

  removeElement: (elId) => set((state) => ({
    pages: state.pages.map(p => 
      p.id === state.activePageId 
        ? { ...p, elements: p.elements.filter(el => el.id !== elId) }
        : p
    ),
    draggingId: state.draggingId === elId ? null : state.draggingId
  })),

  setDraggingId: (id) => set({ draggingId: id }),

  reset: () => set({
    paperSize: "A4",
    orientation: "landscape",
    canvasSize: getCanvasDimensions("A4", "landscape"),
    pages: [{ id: "page_1", elements: [], backgroundImage: null }],
    activePageId: "page_1",
    draggingId: null
  })
}));