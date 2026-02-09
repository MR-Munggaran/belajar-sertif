"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import {
  useCertificateEditor,
  CertificateElement,
} from "@/store/certificateEditor.store";
import { loadFont } from "@/utils/loadFont";

// --- KONFIGURASI CONSTANTS ---
const DEFAULT_CANVAS = { width: 842, height: 595 }; // A4 Landscape
const HANDLE_SIZE = 12; // Ukuran kotak resize
const ROTATE_OFFSET = 35; // Jarak handle rotasi dari elemen

// --- TIPE DATA ---
type InteractionMode = "drag" | "resize" | "rotate" | null;

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

  if (el.type === "field" && data) {
    if (el.field === "participant.name") displayText = data.name;
    if (el.field === "participant.email") displayText = data.email || "";
    if (el.field === "certificate.number") displayText = data.certNumber || "NO. 000";
  }

  return { ...el, text: displayText };
}

function setContextFont(ctx: CanvasRenderingContext2D, el: CertificateElement) {
  ctx.font = `${el.fontStyle || "normal"} ${el.fontWeight || "normal"} ${el.fontSize}px "${el.fontFamily || "Arial"}"`;
}

function getElementBounds(ctx: CanvasRenderingContext2D, el: CertificateElement) {
  setContextFont(ctx, el);
  const metrics = ctx.measureText(el.text || "");
  const width = metrics.width;
  const height = el.fontSize;

  return {
    left: el.x - width / 2,
    right: el.x + width / 2,
    top: el.y - height / 2,
    bottom: el.y + height / 2,
    width,
    height,
  };
}



export default function CanvasEditor({ previewData = null, readonly = false }: PreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const { 
    elements, 
    backgroundImage, 
    draggingId, 
    setDraggingId, 
    updateElement 
  } = useCertificateEditor();

  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
  
  const [mode, setMode] = useState<InteractionMode>(null);
  const dragStart = useRef({ x: 0, y: 0 });
  const initialElState = useRef<{ x: number; y: number; fontSize: number; rotation: number }>({
    x: 0, y: 0, fontSize: 0, rotation: 0
  });

  // 1. Load Background Image
  useEffect(() => {
    let isActive = true;

    const loadBg = async () => {
      if (!backgroundImage) {
        if (isActive) setBgImage(null);
        return;
      }

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = backgroundImage;
      
      try {
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
        if (isActive) setBgImage(img);
      } catch (e) {
        // Handle error silent
      }
    };

    loadBg();

    return () => {
      isActive = false;
    };
  }, [backgroundImage]);

  // 2. Load Fonts
  useEffect(() => {
    elements.forEach((el) => {
      if (el.fontFamily) loadFont(el.fontFamily);
    });
  }, [elements]);

  // 3. Render Canvas
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Derived logic: Ukuran canvas mengikuti image atau default
    const width = bgImage?.width ?? DEFAULT_CANVAS.width;
    const height = bgImage?.height ?? DEFAULT_CANVAS.height;

    // Sync ukuran elemen canvas
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    // A. Background
    if (bgImage) {
      ctx.drawImage(bgImage, 0, 0);
    } else {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = "#e5e7eb";
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, width, height);
    }

    // B. Elements
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
        const p = 10;

        // Box Seleksi
        ctx.strokeStyle = "#3b82f6";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(-w / 2 - p, -h / 2 - p, w + p * 2, h + p * 2);

        // Handle Resize (Kanan Bawah)
        ctx.setLineDash([]);
        ctx.fillStyle = "#3b82f6";
        ctx.fillRect(w / 2 + p - HANDLE_SIZE / 2, h / 2 + p - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);

        // Handle Rotate (Atas Tengah)
        ctx.beginPath();
        ctx.arc(0, -h / 2 - p - ROTATE_OFFSET, 5, 0, Math.PI * 2);
        ctx.fillStyle = "#3b82f6";
        ctx.fill();
        
        // Garis penghubung ke rotate handle
        ctx.beginPath();
        ctx.moveTo(0, -h / 2 - p);
        ctx.lineTo(0, -h / 2 - p - ROTATE_OFFSET);
        ctx.stroke();
      }

      ctx.restore();
    });
  }, [elements, bgImage, draggingId, previewData, readonly]);

  useEffect(() => {
    let animationId: number;
    const loop = () => {
      renderCanvas();
      animationId = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(animationId);
  }, [renderCanvas]);

  // --- LOGIKA MOUSE ---

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

  const handleMouseDown = (e: React.MouseEvent) => {
    if (readonly) return;
    const { x, y } = getMousePos(e);
    const ctx = canvasRef.current!.getContext("2d")!;

    // Loop dari elemen paling atas (array terakhir)
    for (let i = elements.length - 1; i >= 0; i--) {
      const rawEl = elements[i];
      const el = normalizeElement(rawEl, previewData);
      
      const bounds = getElementBounds(ctx, el);
      const padding = 10;
      
      const inBounds = 
        x >= bounds.left - padding && 
        x <= bounds.right + padding && 
        y >= bounds.top - padding && 
        y <= bounds.bottom + padding;

      if (inBounds) {
        setDraggingId(el.id);
        dragStart.current = { x, y };
        initialElState.current = { 
            x: el.x, 
            y: el.y, 
            fontSize: el.fontSize, 
            rotation: el.rotation || 0 
        };

        // 1. Rotate Check (Area atas)
        if (y < bounds.top - 5 && x > bounds.left && x < bounds.right) {
            setMode("rotate");
            return;
        }

        // 2. Resize Check (Pojok kanan bawah)
        if (x > bounds.right - 10 && y > bounds.bottom - 10) {
            setMode("resize");
            return;
        }

        setMode("drag");
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

      // --- 1. LOGIKA SAAT DRAG/RESIZE/ROTATE (SEDANG DIKLIK) ---
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
              // Geser kanan = perbesar, kiri = perkecil
              const scaleFactor = 0.5; 
              const newSize = Math.max(10, initialElState.current.fontSize + (dx * scaleFactor));
              updateElement(draggingId, { fontSize: newSize });
              canvas.style.cursor = "nwse-resize";
          }
          else if (mode === "rotate") {
              // Hitung sudut
              const centerX = initialElState.current.x;
              const centerY = initialElState.current.y;
              const currentAngle = Math.atan2(y - centerY, x - centerX);
              const startAngle = Math.atan2(dragStart.current.y - centerY, dragStart.current.x - centerX);
              
              const rotationDiff = (currentAngle - startAngle) * (180 / Math.PI);
              updateElement(draggingId, { rotation: initialElState.current.rotation + rotationDiff });
              canvas.style.cursor = "grabbing";
          }
          return; // Keluar agar tidak lanjut ke logika hover
      }

      // --- 2. LOGIKA SAAT HOVER (TIDAK DIKLIK) ---
      // Kita cek apakah mouse sedang berada di atas elemen untuk mengubah kursor
      let hit = false;
      
      // Loop dari atas ke bawah untuk cek elemen teratas
      for (let i = elements.length - 1; i >= 0; i--) {
        const rawEl = elements[i];
        const el = normalizeElement(rawEl, previewData);
        const bounds = getElementBounds(ctx, el);
        const padding = 10;

        const inBounds = 
          x >= bounds.left - padding && 
          x <= bounds.right + padding && 
          y >= bounds.top - padding && 
          y <= bounds.bottom + padding;

        if (inBounds) {
          hit = true;
          
          // Cek area spesifik untuk kursor berbeda
          if (y < bounds.top - 5 && x > bounds.left && x < bounds.right) {
              canvas.style.cursor = "grab"; // Area Rotate
          } else if (x > bounds.right - 10 && y > bounds.bottom - 10) {
              canvas.style.cursor = "nwse-resize"; // Area Resize
          } else {
              canvas.style.cursor = "move"; // Area Drag
          }
          break; // Sudah ketemu yang paling atas, stop loop
        }
      }

      if (!hit) {
        canvas.style.cursor = "default";
      }
    };

  const handleMouseUp = () => {
    setMode(null);
  };

  return (
    <div className="flex items-center justify-center bg-gray-100/50 p-4 rounded-lg overflow-hidden w-full h-full">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="bg-white shadow-xl border border-gray-200 touch-none max-w-full max-h-full object-contain"
      />
    </div>
  );
}