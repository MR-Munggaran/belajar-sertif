"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useCertificateEditor, CertificateElement } from "@/store/certificateEditor.store";

export default function CanvasEditor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Ambil state & action dari Global Store
  const { 
    elements, 
    backgroundImage, 
    updateElement, 
    draggingId,       // ID yang sedang diedit (Global)
    setDraggingId     // Function untuk set ID yang diedit
  } = useCertificateEditor();

  // State Local: Hanya untuk mendeteksi gerakan mouse (agar form tidak hilang saat mouse dilepas)
  const [isDragging, setIsDragging] = useState(false); 
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [loadedBgImage, setLoadedBgImage] = useState<HTMLImageElement | null>(null);

  // 1. Load Background Image
  useEffect(() => {
    if (!backgroundImage) return;

    const img = new Image();
    img.src = backgroundImage;
    let isActive = true;

    img.onload = () => {
      if (isActive) setLoadedBgImage(img);
    };

    return () => { isActive = false; };
  }, [backgroundImage]);

  // 2. Render Canvas
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Handle background
    const activeImage = backgroundImage ? loadedBgImage : null;
    const width = activeImage ? activeImage.width : 800;
    const height = activeImage ? activeImage.height : 600;
    
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    ctx.clearRect(0, 0, width, height);

    if (activeImage) {
      ctx.drawImage(activeImage, 0, 0);
    } else {
      ctx.fillStyle = "#f3f4f6";
      ctx.fillRect(0, 0, width, height);
    }

    // Render Elements
    const els = elements as CertificateElement[];
    els.forEach((el) => {
      ctx.font = `${el.fontStyle} ${el.fontWeight} ${el.fontSize}px "${el.fontFamily}"`;
      ctx.fillStyle = el.color;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle"; 
      
      ctx.fillText(el.text, el.x, el.y);

      // Highlight Box jika elemen sedang dipilih (draggingId sama)
      if (el.id === draggingId) {
        const metrics = ctx.measureText(el.text);
        const textWidth = metrics.width;
        const textHeight = el.fontSize;
        
        ctx.strokeStyle = "#3b82f6"; // Warna biru border
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 3]); // Garis putus-putus
        ctx.strokeRect(
          el.x - textWidth / 2 - 8, 
          el.y - textHeight / 2 - 4, 
          textWidth + 16, 
          textHeight + 8
        );
        ctx.setLineDash([]); // Reset line dash
      }
    });
  }, [elements, loadedBgImage, backgroundImage, draggingId]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // --- MOUSE HANDLERS ---

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

  const isMouseOverText = (ctx: CanvasRenderingContext2D, x: number, y: number, el: CertificateElement) => {
    ctx.font = `${el.fontStyle} ${el.fontWeight} ${el.fontSize}px "${el.fontFamily}"`;
    const metrics = ctx.measureText(el.text);
    const width = metrics.width;
    const height = el.fontSize;

    const left = el.x - width / 2 - 10; // Padding toleransi klik
    const right = el.x + width / 2 + 10;
    const top = el.y - height / 2 - 10;
    const bottom = el.y + height / 2 + 10;

    return x >= left && x <= right && y >= top && y <= bottom;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const mouse = getMousePos(e);
    const els = elements as CertificateElement[];
    
    let clickedElementId: string | null = null;

    // Cek apakah user mengklik salah satu text (loop dari atas ke bawah)
    for (let i = els.length - 1; i >= 0; i--) {
      const el = els[i];
      if (isMouseOverText(ctx, mouse.x, mouse.y, el)) {
        clickedElementId = el.id;
        
        // UPDATE STORE: Set element ini sebagai yang aktif diedit
        setDraggingId(el.id); 
        
        // UPDATE LOCAL: Mulai mode geser
        setIsDragging(true); 
        setDragOffset({
          x: mouse.x - el.x,
          y: mouse.y - el.y,
        });
        break; // Stop loop jika sudah ketemu
      }
    }

    // Jika klik di area kosong (bukan text), deselect
    if (!clickedElementId) {
      setDraggingId(null);
      setIsDragging(false);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if(!canvas) return;

    const ctx = canvas.getContext('2d');
    const mouse = getMousePos(e);

    // 1. Logic Ubah Cursor (UI UX)
    if (!isDragging) {
       let hovering = false;
       if(ctx) {
         const els = elements as CertificateElement[];
         for (let i = els.length - 1; i >= 0; i--) {
             if (isMouseOverText(ctx, mouse.x, mouse.y, els[i])) {
                 hovering = true;
                 break;
             }
         }
       }
       canvas.style.cursor = hovering ? 'grab' : 'default';
       return; 
    }

    // 2. Logic Geser (Hanya jalan jika isDragging = true DAN ada draggingId di store)
    if (isDragging && draggingId) {
        canvas.style.cursor = 'grabbing';
        updateElement(draggingId, {
          x: mouse.x - dragOffset.x,
          y: mouse.y - dragOffset.y,
        });
    }
  };

  const handleMouseUp = () => {
    // PENTING: Hanya stop mode geser (isDragging), 
    // TAPI JANGAN setDraggingId(null) agar Form tetap muncul setelah geser selesai.
    setIsDragging(false);
  };

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className="w-full border rounded shadow touch-none"
      style={{ maxWidth: "100%", height: "auto" }}
    />
  );
}