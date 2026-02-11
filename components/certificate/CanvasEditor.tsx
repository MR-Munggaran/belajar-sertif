"use client";

import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import {
  useCertificateEditor,
  CertificateElement,
} from "@/store/certificateEditor.store";
import { loadFont } from "@/utils/loadFont";

// Konfigurasi Visual Handle
const HANDLE_SIZE = 10;
const ROTATE_HANDLE_OFFSET = 25;
const SELECTION_PADDING = 8;

type InteractionMode = "drag" | "resize" | "rotate" | null;

// Tipe khusus untuk menyimpan state awal saat drag dimulai
interface DragState {
  x: number;
  y: number;
  fontSize: number;
  rotation: number;
}

interface PreviewProps {
  previewData?: {
    name: string;
    email?: string;
    certNumber?: string;
  } | null;
  readonly?: boolean;
}

// --- HELPER FUNCTIONS ---

function normalizeElement(
  el: CertificateElement,
  data: PreviewProps["previewData"]
): CertificateElement {
  let displayText = el.text ?? "";

  // Replace placeholder dengan data preview jika ada
  if (el.type === "field" && data) {
    if (el.field === "participant.name") displayText = data.name;
    if (el.field === "participant.email") displayText = data.email || "";
    if (el.field === "certificate.number") displayText = data.certNumber || "NO. 000";
    if (el.field === "certificate.date") displayText = new Date().toLocaleDateString();
  }

  return { ...el, text: displayText };
}

function setContextFont(ctx: CanvasRenderingContext2D, el: CertificateElement) {
  ctx.font = `${el.fontStyle || "normal"} ${el.fontWeight || "normal"} ${el.fontSize}px "${el.fontFamily || "Arial"}"`;
}

// Menghitung kotak pembatas (Bounding Box) elemen
function getElementBounds(ctx: CanvasRenderingContext2D, el: CertificateElement) {
  ctx.save();
  setContextFont(ctx, el);
  const metrics = ctx.measureText(el.text || "");
  const textWidth = metrics.width;
  const textHeight = el.fontSize; // Estimasi tinggi font
  ctx.restore();

  // Koordinat local (0,0 adalah tengah text karena textAlign center)
  const halfW = textWidth / 2;
  const halfH = textHeight / 2;

  return {
    x: el.x,
    y: el.y,
    width: textWidth,
    height: textHeight,
    left: el.x - halfW - SELECTION_PADDING,
    right: el.x + halfW + SELECTION_PADDING,
    top: el.y - halfH - SELECTION_PADDING,
    bottom: el.y + halfH + SELECTION_PADDING,
  };
}

export default function CanvasEditor({ previewData = null, readonly = false }: PreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // 1. AMBIL STATE DARI STORE BARU
  const { 
    pages, 
    activePageId, 
    canvasSize, 
    draggingId, 
    setDraggingId, 
    updateElement 
  } = useCertificateEditor();

  // 2. TENTUKAN PAGE & ELEMENTS AKTIF
  const activePage = pages.find((p) => p.id === activePageId);
  const elements = useMemo(
    () => activePage?.elements ?? [],
    [activePage]
  );
  const backgroundImage = activePage?.backgroundImage || null;

  const bgImageRef = useRef<HTMLImageElement | null>(null);
  const [mode, setMode] = useState<InteractionMode>(null);
  
  // Refs untuk drag logic
  const dragStart = useRef({ x: 0, y: 0 });
  
  // FIX: Gunakan Interface DragState yang jelas
  const initialElState = useRef<DragState>({
    x: 0, y: 0, fontSize: 0, rotation: 0
  });
  
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Reset ukuran canvas sesuai Store (Paper Size)
    if (canvas.width !== canvasSize.width || canvas.height !== canvasSize.height) {
      canvas.width = canvasSize.width;
      canvas.height = canvasSize.height;
    }

    // A. Draw Background
    const bgImage = bgImageRef.current;

    if (bgImage) {
      ctx.drawImage(bgImage, 0, 0, canvasSize.width, canvasSize.height);
    }
    else {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);
      ctx.strokeStyle = "#e5e7eb";
      ctx.lineWidth = 1;
      ctx.strokeRect(0, 0, canvasSize.width, canvasSize.height);
    }

    // B. Draw Elements
    elements.forEach((rawEl) => {
      const el = normalizeElement(rawEl, previewData);
      
      ctx.save();
      ctx.translate(el.x, el.y);
      ctx.rotate(((el.rotation || 0) * Math.PI) / 180);

      setContextFont(ctx, el);
      ctx.fillStyle = el.color;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      
      if (!readonly) {
        ctx.shadowColor = "rgba(0,0,0,0.1)";
        ctx.shadowBlur = 2;
      }

      ctx.fillText(el.text || "", 0, 0);

      // Render Underline
      if (el.underline) {
        const metrics = ctx.measureText(el.text || "");
        const w = metrics.width;
        const h = el.fontSize;
        ctx.beginPath();
        ctx.strokeStyle = el.color;
        ctx.lineWidth = Math.max(1, el.fontSize / 15);
        ctx.moveTo(-w / 2, h / 2);
        ctx.lineTo(w / 2, h / 2);
        ctx.stroke();
      }

      // C. Selection UI
      if (!readonly && el.id === draggingId) {
        const metrics = ctx.measureText(el.text || "");
        const w = metrics.width;
        const h = el.fontSize;
        
        // Box Garis Putus-putus
        ctx.strokeStyle = "#2563eb"; 
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 2]);
        ctx.strokeRect(
          -w / 2 - SELECTION_PADDING, 
          -h / 2 - SELECTION_PADDING, 
          w + SELECTION_PADDING * 2, 
          h + SELECTION_PADDING * 2
        );

        ctx.setLineDash([]); 

        // Handle Resize
        ctx.fillStyle = "#2563eb";
        ctx.fillRect(
          w / 2 + SELECTION_PADDING - HANDLE_SIZE / 2, 
          h / 2 + SELECTION_PADDING - HANDLE_SIZE / 2, 
          HANDLE_SIZE, 
          HANDLE_SIZE
        );

        // Handle Rotate
        ctx.beginPath();
        ctx.moveTo(0, -h / 2 - SELECTION_PADDING);
        ctx.lineTo(0, -h / 2 - SELECTION_PADDING - ROTATE_HANDLE_OFFSET);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, -h / 2 - SELECTION_PADDING - ROTATE_HANDLE_OFFSET, 5, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
        ctx.strokeStyle = "#2563eb";
        ctx.stroke();
      }

      ctx.restore();
    });
  }, [elements, draggingId, previewData, readonly, canvasSize]);

  useEffect(() => {
    let isActive = true;

    if (!backgroundImage) {
      bgImageRef.current = null;
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = backgroundImage;

    img.onload = () => {
      if (!isActive) return;
      bgImageRef.current = img;
      renderCanvas(); // redraw setelah load
    };

    img.onerror = () => {
      if (!isActive) return;
      bgImageRef.current = null;
      renderCanvas();
    };

    return () => {
      isActive = false;
    };
  }, [backgroundImage, renderCanvas]);



  // 4. LOAD FONTS
  useEffect(() => {
    elements.forEach((el) => {
      if (el.fontFamily) loadFont(el.fontFamily);
    });
  }, [elements]);


  // Animation Loop
  useEffect(() => {
    let animationId: number;
    const loop = () => {
      renderCanvas();
      animationId = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(animationId);
  }, [renderCanvas]);

  // --- MOUSE INTERACTION LOGIC ---

  const getMousePos = (e: React.MouseEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width; 
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const checkHit = (ctx: CanvasRenderingContext2D, x: number, y: number, el: CertificateElement) => {
    const bounds = getElementBounds(ctx, el);
    
    const inBounds = 
      x >= bounds.left && 
      x <= bounds.right && 
      y >= bounds.top && 
      y <= bounds.bottom;
      
    const isRotate = 
       x >= bounds.x - 10 && x <= bounds.x + 10 &&
       y >= bounds.top - ROTATE_HANDLE_OFFSET - 10 && y <= bounds.top - 5;

    const isResize = 
       x >= bounds.right - 10 && x <= bounds.right + 10 &&
       y >= bounds.bottom - 10 && y <= bounds.bottom + 10;

    return { inBounds, isRotate, isResize, bounds };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (readonly) return;
    const { x, y } = getMousePos(e);
    const ctx = canvasRef.current!.getContext("2d")!;

    for (let i = elements.length - 1; i >= 0; i--) {
      const el = normalizeElement(elements[i], previewData);
      const { inBounds, isRotate, isResize } = checkHit(ctx, x, y, el);

      const isCurrentSelection = el.id === draggingId;
      
      // FIX: Replace 'as any' with explicit mapping
      const saveInitialState = () => {
        initialElState.current = {
            x: el.x,
            y: el.y,
            fontSize: el.fontSize,
            rotation: el.rotation || 0
        };
      };

      if (isCurrentSelection && isRotate) {
        setMode("rotate");
        setDraggingId(el.id);
        dragStart.current = { x, y };
        saveInitialState();
        return;
      }

      if (isCurrentSelection && isResize) {
        setMode("resize");
        setDraggingId(el.id);
        dragStart.current = { x, y };
        saveInitialState();
        return;
      }

      if (inBounds) {
        setDraggingId(el.id);
        setMode("drag");
        dragStart.current = { x, y };
        saveInitialState();
        return;
      }
    }

    setDraggingId(null);
    setMode(null);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (readonly) return;
    const { x, y } = getMousePos(e);
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    if (draggingId && mode) {
      const dx = x - dragStart.current.x;
      const dy = y - dragStart.current.y;

      if (mode === "drag") {
        updateElement(draggingId, {
          x: initialElState.current.x + dx,
          y: initialElState.current.y + dy,
        });
        canvas.style.cursor = "move";
      } 
      else if (mode === "resize") {
        const scale = 0.5;
        const newSize = Math.max(8, initialElState.current.fontSize + (dx * scale));
        updateElement(draggingId, { fontSize: newSize });
        canvas.style.cursor = "nwse-resize";
      } 
      else if (mode === "rotate") {
        const cx = initialElState.current.x;
        const cy = initialElState.current.y;
        
        const angleStart = Math.atan2(dragStart.current.y - cy, dragStart.current.x - cx);
        const angleNow = Math.atan2(y - cy, x - cx);
        const angleDiff = (angleNow - angleStart) * (180 / Math.PI);
        
        updateElement(draggingId, { rotation: (initialElState.current.rotation + angleDiff) });
        canvas.style.cursor = "grabbing";
      }
      return;
    }

    // HOVER MODE logic (sama seperti sebelumnya)
    let cursor = "default";
    const activeEl = elements.find(el => el.id === draggingId);
    if (activeEl) {
       const el = normalizeElement(activeEl, previewData);
       const { isRotate, isResize, inBounds } = checkHit(ctx, x, y, el);
       if (isRotate) cursor = "grab";
       else if (isResize) cursor = "nwse-resize";
       else if (inBounds) cursor = "move";
    }

    if (cursor === "default") {
      for (let i = elements.length - 1; i >= 0; i--) {
        const el = normalizeElement(elements[i], previewData);
        if (el.id === draggingId) continue;
        const { inBounds } = checkHit(ctx, x, y, el);
        if (inBounds) {
          cursor = "move";
          break;
        }
      }
    }

    canvas.style.cursor = cursor;
  };

  const handleMouseUp = () => {
    setMode(null);
  };

  return (
    <div className="flex items-center justify-center bg-gray-200/50 p-8 w-full h-full overflow-auto">
      <div className="relative shadow-2xl">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="bg-white block touch-none"
          style={{
            maxWidth: "100%",
            maxHeight: "100%",
          }}
        />
      </div>
    </div>
  );
}