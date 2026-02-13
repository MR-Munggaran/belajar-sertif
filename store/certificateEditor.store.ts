import { create } from "zustand";
import { PaperSize, Orientation, getCanvasDimensions } from "@/utils/paperSizes";
import type { 
  CertificatePage, 
  CertificateElement,
  ElementStyle 
} from "@/db/schema/certificateTemplate";

// --- TYPES ---

interface CertificateEditorState {
  // Global Settings (UI State - diambil dari active page)
  paperSize: PaperSize;
  orientation: Orientation;
  canvasSize: { width: number; height: number };

  // Multi-page Data
  pages: CertificatePage[];
  activePageId: string;
  draggingId: string | null;

  // --- ACTIONS ---
  
  // Settings (Update ke active page)
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

// Helper untuk convert page paper size ke PaperSize yang valid
const normalizePaperSize = (size: string | undefined): PaperSize => {
  if (size === "A4" || size === "Letter") return size;
  return "A4"; // Default fallback
};

const normalizeOrientation = (orientation: string | undefined): Orientation => {
  if (orientation === "portrait" || orientation === "landscape") return orientation;
  return "landscape"; // Default fallback
};

const createDefaultPage = (id: string, pageNumber: number): CertificatePage => ({
  id,
  pageNumber,
  elements: [],
  backgroundImage: null,
  paperSize: "A4", // Default paper size
  orientation: "landscape", // Default orientation
});

// --- STORE IMPLEMENTATION ---

export const useCertificateEditor = create<CertificateEditorState>((set) => ({
  // Default State
  paperSize: "A4",
  orientation: "landscape",
  canvasSize: getCanvasDimensions("A4", "landscape"),
  
  // Default 1 Halaman Kosong
  pages: [createDefaultPage("page_1", 1)],
  activePageId: "page_1",
  draggingId: null,

  // --- SETTINGS ---

  setPaperSize: (size) => set((state) => {
    const activePage = state.pages.find(p => p.id === state.activePageId);
    const orientation = normalizeOrientation(activePage?.orientation);
    
    return {
      paperSize: size,
      canvasSize: getCanvasDimensions(size, orientation),
      pages: state.pages.map(p => 
        p.id === state.activePageId 
          ? { ...p, paperSize: size }
          : p
      )
    };
  }),

  setOrientation: (orientation) => set((state) => {
    const activePage = state.pages.find(p => p.id === state.activePageId);
    const paperSize = normalizePaperSize(activePage?.paperSize);
    
    return {
      orientation,
      canvasSize: getCanvasDimensions(paperSize, orientation),
      pages: state.pages.map(p => 
        p.id === state.activePageId 
          ? { ...p, orientation }
          : p
      )
    };
  }),

  // --- PAGE MANAGEMENT ---

  addPage: () => set((state) => {
    const newPageId = `page_${Date.now()}`;
    const newPageNumber = state.pages.length + 1;
    
    return {
      pages: [
        ...state.pages, 
        createDefaultPage(newPageId, newPageNumber)
      ],
      activePageId: newPageId,
      // Reset ke default saat page baru
      paperSize: "A4" as PaperSize,
      orientation: "landscape" as Orientation,
      canvasSize: getCanvasDimensions("A4", "landscape")
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
    
    // Ambil page yang akan jadi aktif
    const newActivePage = state.activePageId === id 
      ? reindexedPages[0] 
      : reindexedPages.find(p => p.id === state.activePageId)!;
    
    const normalizedSize = normalizePaperSize(newActivePage.paperSize);
    const normalizedOrientation = normalizeOrientation(newActivePage.orientation);
    
    return {
      pages: reindexedPages,
      activePageId: newActivePage.id,
      paperSize: normalizedSize,
      orientation: normalizedOrientation,
      canvasSize: getCanvasDimensions(normalizedSize, normalizedOrientation)
    };
  }),

  setActivePage: (id) => set((state) => {
    const page = state.pages.find(p => p.id === id);
    if (!page) return state;
    
    const normalizedSize = normalizePaperSize(page.paperSize);
    const normalizedOrientation = normalizeOrientation(page.orientation);
    
    return {
      activePageId: id,
      draggingId: null,
      paperSize: normalizedSize,
      orientation: normalizedOrientation,
      canvasSize: getCanvasDimensions(normalizedSize, normalizedOrientation)
    };
  }),

  // --- LOAD TEMPLATE ---

  loadTemplate: (pages) => set(() => {
    // Jika data kosong, reset ke default
    if (!pages || pages.length === 0) {
      return {
        pages: [createDefaultPage("page_1", 1)],
        activePageId: "page_1",
        paperSize: "A4" as PaperSize,
        orientation: "landscape" as Orientation,
        canvasSize: getCanvasDimensions("A4", "landscape")
      };
    }
    
    // Pastikan setiap page punya struktur yang valid
    const validatedPages = pages.map((page, index) => ({
      ...page,
      pageNumber: page.pageNumber || index + 1,
      elements: page.elements || [],
      backgroundImage: page.backgroundImage || null,
      paperSize: page.paperSize || "A4",
      orientation: page.orientation || "landscape",
    }));
    
    const firstPage = validatedPages[0];
    const normalizedSize = normalizePaperSize(firstPage.paperSize);
    const normalizedOrientation = normalizeOrientation(firstPage.orientation);
    
    return {
      pages: validatedPages,
      activePageId: firstPage.id,
      paperSize: normalizedSize,
      orientation: normalizedOrientation,
      canvasSize: getCanvasDimensions(normalizedSize, normalizedOrientation)
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
    paperSize: "A4" as PaperSize,
    orientation: "landscape" as Orientation,
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