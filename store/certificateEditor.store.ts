import { create } from "zustand";
import { PaperSize, Orientation, getCanvasDimensions } from "@/utils/paperSizes";
import type { 
  CertificatePage, 
  CertificateElement,
  ElementStyle 
} from "@/db/schema/certificateTemplate";

// --- TYPES ---

interface CertificateEditorState {
  // Global Settings
  paperSize: PaperSize;
  orientation: Orientation;
  canvasSize: { width: number; height: number };

  // Multi-page Data
  pages: CertificatePage[];
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

  // Load Data (untuk Edit Template)
  loadTemplate: (pages: CertificatePage[]) => void;

  // Element & Background (Targeting Active Page)
  setBackgroundImage: (url: string | null) => void;
  addElement: (element: CertificateElement) => void;
  updateElementPosition: (id: string, x: number, y: number) => void;
  updateElementStyle: (id: string, style: Partial<ElementStyle>) => void;
  updateElementContent: (id: string, content: string) => void;
  updateElementRotation: (id: string, rotation: number) => void;
  removeElement: (id: string) => void;
  
  // Selection
  setDraggingId: (id: string | null) => void;
  
  // Reset
  reset: () => void;
}

// --- HELPER FUNCTIONS ---

const createDefaultPage = (id: string, pageNumber: number): CertificatePage => ({
  id,
  pageNumber,
  elements: [],
  backgroundImage: null,
});

// --- STORE IMPLEMENTATION ---

export const useCertificateEditor = create<CertificateEditorState>((set, get) => ({
  // Default State
  paperSize: "A4",
  orientation: "landscape",
  canvasSize: getCanvasDimensions("A4", "landscape"),
  
  // Default 1 Halaman Kosong
  pages: [createDefaultPage("page_1", 1)],
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
    const newPageNumber = state.pages.length + 1;
    
    return {
      pages: [
        ...state.pages, 
        createDefaultPage(newPageId, newPageNumber)
      ],
      activePageId: newPageId
    };
  }),

  removePage: (id) => set((state) => {
    // Minimal harus ada 1 halaman
    if (state.pages.length <= 1) return state;
    
    const newPages = state.pages.filter(p => p.id !== id);
    
    // Update pageNumber setelah delete
    const reindexedPages = newPages.map((page, index) => ({
      ...page,
      pageNumber: index + 1
    }));
    
    return {
      pages: reindexedPages,
      activePageId: state.activePageId === id ? reindexedPages[0].id : state.activePageId
    };
  }),

  setActivePage: (id) => set({ activePageId: id, draggingId: null }),

  // --- LOAD TEMPLATE ---

  loadTemplate: (pages) => set(() => {
    // Jika data kosong, reset ke default
    if (!pages || pages.length === 0) {
      return {
        pages: [createDefaultPage("page_1", 1)],
        activePageId: "page_1"
      };
    }
    
    // Pastikan setiap page punya struktur yang valid
    const validatedPages = pages.map((page, index) => ({
      ...page,
      pageNumber: page.pageNumber || index + 1,
      elements: page.elements || [],
      backgroundImage: page.backgroundImage || null,
    }));
    
    return {
      pages: validatedPages,
      activePageId: validatedPages[0].id
    };
  }),

  // --- ELEMENT ACTIONS (Focus pada Active Page) ---

  setBackgroundImage: (url) => set((state) => ({
    pages: state.pages.map(p => 
      p.id === state.activePageId ? { ...p, backgroundImage: url } : p
    )
  })),

  addElement: (element) => set((state) => ({
    pages: state.pages.map(p => 
      p.id === state.activePageId 
        ? { ...p, elements: [...p.elements, element] } 
        : p
    ),
    draggingId: element.id // Auto-select element yang baru ditambahkan
  })),

  // Update Posisi
  updateElementPosition: (elId, x, y) => set((state) => ({
    pages: state.pages.map(p => 
      p.id === state.activePageId 
        ? {
            ...p,
            elements: p.elements.map(el => 
              el.id === elId 
                ? { ...el, position: { x, y } } 
                : el
            )
          }
        : p
    )
  })),

  // Update Style
  updateElementStyle: (elId, newStyle) => set((state) => ({
    pages: state.pages.map(p => 
      p.id === state.activePageId 
        ? {
            ...p,
            elements: p.elements.map(el => 
              el.id === elId 
                ? { ...el, style: { ...el.style, ...newStyle } } 
                : el
            )
          }
        : p
    )
  })),

  // Update Content
  updateElementContent: (elId, content) => set((state) => ({
    pages: state.pages.map(p => 
      p.id === state.activePageId 
        ? {
            ...p,
            elements: p.elements.map(el => 
              el.id === elId ? { ...el, content } : el
            )
          }
        : p
    )
  })),

  // Update Rotation
  updateElementRotation: (elId, rotation) => set((state) => ({
    pages: state.pages.map(p => 
      p.id === state.activePageId 
        ? {
            ...p,
            elements: p.elements.map(el => 
              el.id === elId ? { ...el, rotation } : el
            )
          }
        : p
    )
  })),

  // Remove Element
  removeElement: (elId) => set((state) => ({
    pages: state.pages.map(p => 
      p.id === state.activePageId 
        ? { ...p, elements: p.elements.filter(el => el.id !== elId) }
        : p
    ),
    draggingId: state.draggingId === elId ? null : state.draggingId
  })),

  setDraggingId: (id) => set({ draggingId: id }),

  // Reset ke state awal
  reset: () => set({
    paperSize: "A4",
    orientation: "landscape",
    canvasSize: getCanvasDimensions("A4", "landscape"),
    pages: [createDefaultPage("page_1", 1)],
    activePageId: "page_1",
    draggingId: null
  })
}));

// --- SELECTORS ---

// Ambil halaman yang sedang aktif
export const useActivePage = () =>
  useCertificateEditor((s) =>
    s.pages.find((p) => p.id === s.activePageId)
  );

// Ambil element yang sedang dipilih
export const useActiveElement = () =>
  useCertificateEditor((s) => {
    const page = s.pages.find((p) => p.id === s.activePageId);
    return page?.elements.find((el) => el.id === s.draggingId) ?? null;
  });

// Ambil semua elements di halaman aktif
export const useActivePageElements = () =>
  useCertificateEditor((s) => {
    const page = s.pages.find((p) => p.id === s.activePageId);
    return page?.elements ?? [];
  });