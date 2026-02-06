"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useCertificateEditor, CertificateElement } from "@/store/certificateEditor.store";
import { loadFont } from "@/utils/loadFont";


export default function Preview() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const { 
    elements, 
    backgroundImage, 
    updateElement, 
    draggingId, 
    setDraggingId,
    setCanvasSize 
  } = useCertificateEditor();

  const [isDragging, setIsDragging] = useState(false); 
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [loadedBgImage, setLoadedBgImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!backgroundImage) {
        setCanvasSize(842, 595); 
        return;
    }

    const img = new Image();
    img.src = backgroundImage;
    img.crossOrigin = "anonymous";
    
    img.onload = () => {
      setLoadedBgImage(img);
      setCanvasSize(img.width, img.height);
    };

    elements.forEach(el => {
      if (el.fontFamily) {
        loadFont(el.fontFamily);
      }
    });
  }, [backgroundImage, setCanvasSize, elements]);

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = loadedBgImage ? loadedBgImage.width : 842;
    const height = loadedBgImage ? loadedBgImage.height : 595;

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    ctx.clearRect(0, 0, width, height);

    if (loadedBgImage) {
      ctx.drawImage(loadedBgImage, 0, 0, width, height);
    } else {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = "#e5e7eb";
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, width, height);
    }

    // B. Render Semua Elemen Teks
    elements.forEach((el) => {
      ctx.save();
      ctx.font = `${el.fontStyle} ${el.fontWeight} ${el.fontSize}px "${el.fontFamily}"`;
      ctx.fillStyle = el.color;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      
      // Shadow tipis agar teks terbaca di background gelap
      ctx.shadowColor = "rgba(0,0,0,0.3)";
      ctx.shadowBlur = 4;
      ctx.fillText(el.text, el.x, el.y);
      if (el.underline) {
        const metrics = ctx.measureText(el.text);
        const textWidth = metrics.width;

        const underlineY = el.y + el.fontSize / 2 + 2;

        ctx.beginPath();
        ctx.moveTo(el.x - textWidth / 2, underlineY);
        ctx.lineTo(el.x + textWidth / 2, underlineY);
        ctx.lineWidth = 2;
        ctx.strokeStyle = el.color;
        ctx.stroke();
      }
      ctx.restore();

      // C. Render Selection Box (Hanya jika elemen ini sedang dipilih)
      if (el.id === draggingId) {
        ctx.save();
        ctx.font = `${el.fontStyle} ${el.fontWeight} ${el.fontSize}px "${el.fontFamily}"`;
        const metrics = ctx.measureText(el.text);
        
        // Hitung bounding box
        const textWidth = metrics.width;
        const textHeight = el.fontSize; 
        const padding = 10;
        
        const boxX = el.x - textWidth / 2 - padding;
        const boxY = el.y - textHeight / 2 - padding;
        const boxW = textWidth + padding * 2;
        const boxH = textHeight + padding * 2;

        // Garis putus-putus biru
        ctx.strokeStyle = "#3b82f6";
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(boxX, boxY, boxW, boxH);

        // Handle (Kotak kecil di sudut)
        const handleSize = 8;
        ctx.fillStyle = "#3b82f6";
        ctx.setLineDash([]);
        // Kiri Atas
        ctx.fillRect(boxX - handleSize/2, boxY - handleSize/2, handleSize, handleSize);
        // Kanan Bawah
        ctx.fillRect(boxX + boxW - handleSize/2, boxY + boxH - handleSize/2, handleSize, handleSize);
        
        ctx.restore();
      }
    });
  }, [elements, loadedBgImage, draggingId]);

  // Trigger render loop
  useEffect(() => {
    let animationId: number;
    const animate = () => {
        renderCanvas();
        animationId = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(animationId);
  }, [renderCanvas]);

  // --- MOUSE HANDLERS (LOGIKA KOORDINAT) ---

  // Konversi koordinat Mouse (Layar) ke Koordinat Canvas (Resolusi Asli)
  const getCanvasCoordinates = (e: React.MouseEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    
    // Faktor Skala: (Resolusi Asli / Ukuran Tampil di Layar)
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const isMouseOverElement = (ctx: CanvasRenderingContext2D, mouseX: number, mouseY: number, el: CertificateElement) => {
    // Setup font context untuk pengukuran akurat
    ctx.font = `${el.fontStyle} ${el.fontWeight} ${el.fontSize}px "${el.fontFamily}"`;
    const metrics = ctx.measureText(el.text);
    const width = metrics.width;
    const height = el.fontSize;
    
    const padding = 15; // Area toleransi klik
    const left = el.x - width / 2 - padding;
    const right = el.x + width / 2 + padding;
    const top = el.y - height / 2 - padding;
    const bottom = el.y + height / 2 + padding;

    return mouseX >= left && mouseX <= right && mouseY >= top && mouseY <= bottom;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCanvasCoordinates(e);
    
    // Cek klik dari elemen paling atas (array terakhir) ke bawah
    for (let i = elements.length - 1; i >= 0; i--) {
      const el = elements[i];
      if (isMouseOverElement(ctx, x, y, el)) {
        setDraggingId(el.id);
        setIsDragging(true);
        // Simpan jarak antara klik mouse dengan titik pusat teks
        // Ini mencegah teks "melompat" ke tengah mouse saat mulai digeser
        setDragOffset({
            x: x - el.x,
            y: y - el.y
        });
        return; 
      }
    }

    // Klik di area kosong = Deselect
    setDraggingId(null);
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const { x, y } = getCanvasCoordinates(e);

    // 1. Ubah Cursor Style (Hover Effect)
    if (!isDragging) {
        const ctx = canvas.getContext('2d')!;
        let isHovering = false;
        // Cek hover
        for (let i = elements.length - 1; i >= 0; i--) {
            if (isMouseOverElement(ctx, x, y, elements[i])) {
                isHovering = true;
                break;
            }
        }
        canvas.style.cursor = isHovering ? 'move' : 'default';
        return;
    }

    // 2. Logic Dragging
    if (isDragging && draggingId) {
      canvas.style.cursor = 'grabbing';
      // Posisi baru = Posisi Mouse - Offset Awal
      updateElement(draggingId, {
        x: x - dragOffset.x,
        y: y - dragOffset.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if(canvasRef.current) canvasRef.current.style.cursor = 'default';
  };

  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-100/50 p-4 overflow-hidden rounded-lg">
        <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="bg-white shadow-xl border border-gray-200 touch-none"
            style={{ 
                // CSS menjaga agar canvas pas di layar, 
                // sementara atribut width/height menjaga resolusi tinggi
                maxWidth: "100%", 
                maxHeight: "100%",
                objectFit: "contain"
            }}
        />
    </div>
  );
}