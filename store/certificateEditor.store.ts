import { create } from "zustand";
import { PaperSize, Orientation, getCanvasDimensions } from "@/utils/paperSizes";

// --- TYPES ---

// Pastikan ini match dengan Schema Database
export interface CertificateElement {
  id: string;
  type: "static" | "field";
  field?: "participant.name" | "participant.email" | "certificate.number" | "certificate.date";
  text?: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  fontStyle: string;
  underline: boolean;
  color: string;
  rotation?: number;
  width?: number; // Opsional: untuk gambar/shape kedepannya
  height?: number;
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

  // --- ACTIONS ---
  
  // Settings
  setPaperSize: (size: PaperSize) => void;
  setOrientation: (orientation: Orientation) => void;
  
  // Page Management
  addPage: () => void;
  removePage: (id: string) => void;
  setActivePage: (id: string) => void;

  // Load Data (PENTING untuk Edit Template)
  loadTemplate: (data: { backgroundImage: string; elements: CertificateElement[] }) => void;

  // Element & Background (Targeting Active Page)
  setBackgroundImage: (url: string | null) => void;
  setElements: (elements: CertificateElement[]) => void;
  addElement: (element: CertificateElement) => void;
  updateElement: (id: string, data: Partial<CertificateElement>) => void;
  removeElement: (id: string) => void;
  duplicateElement: (id: string) => void; // Fitur Baru
  
  // Layering (Z-Index)
  bringToFront: (id: string) => void; // Fitur Baru
  sendToBack: (id: string) => void;   // Fitur Baru

  // Selection
  setDraggingId: (id: string | null) => void;
  
  // Reset
  reset: () => void;
}

// Helper ID Generator yang lebih aman
const generateId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `el_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const useCertificateEditor = create<CertificateEditorState>((set, get) => ({
  // Default State
  paperSize: "A4",
  orientation: "landscape",
  canvasSize: getCanvasDimensions("A4", "landscape"),
  
  pages: [{ id: "page_1", elements: [], backgroundImage: null }],
  activePageId: "page_1",
  draggingId: null,

  // --- SETTINGS ---

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

  // --- PAGE MANAGEMENT ---

  addPage: () => set((state) => {
    const newPageId = `page_${Date.now()}`;
    return {
      pages: [...state.pages, { id: newPageId, elements: [], backgroundImage: null }],
      activePageId: newPageId
    };
  }),

  removePage: (id) => set((state) => {
    if (state.pages.length <= 1) return state;
    const newPages = state.pages.filter(p => p.id !== id);
    return {
      pages: newPages,
      activePageId: state.activePageId === id ? newPages[0].id : state.activePageId
    };
  }),

  setActivePage: (id) => set({ activePageId: id, draggingId: null }),

  // --- LOAD & SAVE HELPERS ---

  loadTemplate: ({ backgroundImage, elements }) => set((state) => {
    // Override page aktif dengan data dari DB
    return {
      pages: state.pages.map(p => 
        p.id === state.activePageId 
          ? { ...p, backgroundImage, elements } 
          : p
      )
    };
  }),

  // --- ELEMENT ACTIONS ---

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

  duplicateElement: (elId) => set((state) => {
    const activePage = state.pages.find(p => p.id === state.activePageId);
    if (!activePage) return state;

    const elToCopy = activePage.elements.find(el => el.id === elId);
    if (!elToCopy) return state;

    const newElement: CertificateElement = {
      ...elToCopy,
      id: generateId(),
      x: elToCopy.x + 20, // Offset sedikit biar terlihat
      y: elToCopy.y + 20,
    };

    return {
      pages: state.pages.map(p => 
        p.id === state.activePageId 
          ? { ...p, elements: [...p.elements, newElement] }
          : p
      ),
      draggingId: newElement.id // Otomatis select elemen baru
    };
  }),

  // --- LAYERING (Z-INDEX) ---
  // Dalam Canvas, urutan array menentukan tumpukan (index 0 paling bawah)

  bringToFront: (elId) => set((state) => {
    const page = state.pages.find(p => p.id === state.activePageId);
    if (!page) return state;

    const elIndex = page.elements.findIndex(el => el.id === elId);
    if (elIndex < 0 || elIndex === page.elements.length - 1) return state;

    const newElements = [...page.elements];
    const [element] = newElements.splice(elIndex, 1);
    newElements.push(element); // Pindah ke paling akhir (paling atas)

    return {
      pages: state.pages.map(p => 
        p.id === state.activePageId ? { ...p, elements: newElements } : p
      )
    };
  }),

  sendToBack: (elId) => set((state) => {
    const page = state.pages.find(p => p.id === state.activePageId);
    if (!page) return state;

    const elIndex = page.elements.findIndex(el => el.id === elId);
    if (elIndex <= 0) return state; // Sudah paling bawah

    const newElements = [...page.elements];
    const [element] = newElements.splice(elIndex, 1);
    newElements.unshift(element); // Pindah ke paling awal (paling bawah)

    return {
      pages: state.pages.map(p => 
        p.id === state.activePageId ? { ...p, elements: newElements } : p
      )
    };
  }),

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