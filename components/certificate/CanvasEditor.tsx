"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import {
  useCertificateEditor,
  CertificateElement,
} from "@/store/certificateEditor.store";
import { loadFont } from "@/utils/loadFont";

const DEFAULT_CANVAS = { width: 842, height: 595 };

type InteractionMode = null | "drag" | "resize" | "rotate";


type NormalizedElement = CertificateElement & {
  text: string;
  fontFamily: string;
  fontStyle: string;
  fontWeight: string;
  color: string;
};

function normalizeElement(el: CertificateElement): NormalizedElement {
  return {
    ...el,
    text:
      el.type === "field"
        ? `{{ ${el.field ?? ""} }}`
        : el.text ?? "",
    fontFamily: el.fontFamily ?? "Arial",
    fontStyle: el.fontStyle ?? "normal",
    fontWeight: el.fontWeight ?? "normal",
    color: el.color ?? "#000000",
  };
}

function setFont(
  ctx: CanvasRenderingContext2D,
  el: NormalizedElement
) {
  ctx.font = `${el.fontStyle} ${el.fontWeight} ${el.fontSize}px "${el.fontFamily}"`;
}

function getTextBounds(
  ctx: CanvasRenderingContext2D,
  el: NormalizedElement,
  padding = 0
) {
  setFont(ctx, el);
  const metrics = ctx.measureText(el.text);
  const width = metrics.width;
  const height = el.fontSize;

  return {
    left: el.x - width / 2 - padding,
    right: el.x + width / 2 + padding,
    top: el.y - height / 2 - padding,
    bottom: el.y + height / 2 + padding,
    width,
    height,
  };
}

export default function Preview() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const {
    elements,
    backgroundImage,
    updateElement,
    draggingId,
    setDraggingId,
    setCanvasSize,
  } = useCertificateEditor();

  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);


  const [mode, setMode] = useState<InteractionMode>(null);
  const resizeStart = useRef({ x: 0, fontSize: 0 });
  const rotateStart = useRef(0);

  useEffect(() => {
    if (!backgroundImage) {
      setCanvasSize(DEFAULT_CANVAS.width, DEFAULT_CANVAS.height);
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = backgroundImage;

    img.onload = () => {
      setBgImage(img);
      setCanvasSize(img.width, img.height);
    };

    elements.forEach((el) => {
      if (el.fontFamily) loadFont(el.fontFamily);
    });
  }, [backgroundImage, elements, setCanvasSize]);


  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = bgImage?.width ?? DEFAULT_CANVAS.width;
    const height = bgImage?.height ?? DEFAULT_CANVAS.height;

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    ctx.clearRect(0, 0, width, height);

    // Background
    if (bgImage) {
      ctx.drawImage(bgImage, 0, 0, width, height);
    } else {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = "#e5e7eb";
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, width, height);
    }

    // Text Elements
    elements.forEach((raw) => {
      const el = normalizeElement(raw);

      ctx.save();
      setFont(ctx, el);

      ctx.fillStyle = el.color;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "rgba(0,0,0,0.3)";
      ctx.shadowBlur = 4;

      ctx.translate(el.x, el.y);
      ctx.rotate(((el.rotation ?? 0) * Math.PI) / 180);
      ctx.fillText(el.text, 0, 0);


      // underline
      if (el.underline) {
        const bounds = getTextBounds(ctx, el);
        const underlineY = el.y + el.fontSize / 2 + 2;

        ctx.beginPath();
        ctx.moveTo(el.x - bounds.width / 2, underlineY);
        ctx.lineTo(el.x + bounds.width / 2, underlineY);
        ctx.lineWidth = 2;
        ctx.strokeStyle = el.color;
        ctx.stroke();
      }

      ctx.restore();

      // Selection Box
      if (el.id === draggingId) {
        const bounds = getTextBounds(ctx, el, 10);

        ctx.save();
        ctx.strokeStyle = "#3b82f6";
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(
          bounds.left,
          bounds.top,
          bounds.right - bounds.left,
          bounds.bottom - bounds.top
        );

        ctx.setLineDash([]);
        ctx.fillStyle = "#3b82f6";
        const HANDLE_SIZE = 14;
        ctx.fillRect(
          bounds.right - HANDLE_SIZE / 2,
          bounds.bottom - HANDLE_SIZE / 2,
          HANDLE_SIZE,
          HANDLE_SIZE
        );


        // rotate handle
        ctx.beginPath();
        const ROTATE_RADIUS = 8;
        const ROTATE_OFFSET = 30;

        ctx.beginPath();
        ctx.arc(el.x, bounds.top - ROTATE_OFFSET, ROTATE_RADIUS, 0, Math.PI * 2);
        ctx.fill();

        ctx.fill();

        ctx.restore();
      }
    });
  }, [elements, bgImage, draggingId]);

  useEffect(() => {
    let raf: number;
    const loop = () => {
      renderCanvas();
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, [renderCanvas]);

  const getCanvasPoint = (e: React.MouseEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();

    return {
      x: ((e.clientX - rect.left) * canvas.width) / rect.width,
      y: ((e.clientY - rect.top) * canvas.height) / rect.height,
    };
  };

  const hitTest = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    el: CertificateElement
  ) => {
    const n = normalizeElement(el);
    const b = getTextBounds(ctx, n, 15);
    return x >= b.left && x <= b.right && y >= b.top && y <= b.bottom;
  };

  const isOnResizeHandle = (
    x: number,
    y: number,
    b: ReturnType<typeof getTextBounds>
  ) => {
    const s = 18;
    return Math.abs(x - b.right) < s && Math.abs(y - b.bottom) < s;
  };

  const isOnRotateHandle = (
    x: number,
    y: number,
    b: ReturnType<typeof getTextBounds>
  ) => {
    return x >= b.left && x <= b.right && y >= b.top - 45 && y <= b.top - 15;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCanvasPoint(e);

    for (let i = elements.length - 1; i >= 0; i--) {
      const el = elements[i];
      const n = normalizeElement(el);
      const bounds = getTextBounds(ctx, n, 10);

      if (isOnResizeHandle(x, y, bounds)) {
        setDraggingId(el.id);
        setMode("resize");
        resizeStart.current = { x, fontSize: el.fontSize };
        return;
      }

      if (isOnRotateHandle(x, y, bounds)) {
        setDraggingId(el.id);
        setMode("rotate");
        rotateStart.current = Math.atan2(y - el.y, x - el.x);
        return;
      }

      if (hitTest(ctx, x, y, el)) {
        setDraggingId(el.id);
        setMode("drag");
        setDragOffset({ x: x - el.x, y: y - el.y });
        return;
      }
    }


    setDraggingId(null);
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const { x, y } = getCanvasPoint(e);

    // =========================
    // HOVER
    // =========================
    if (!mode) {
      const ctx = canvas.getContext("2d")!;

      const hit = [...elements].reverse().find(raw => {
        const n = normalizeElement(raw);
        const bounds = getTextBounds(ctx, n);

        return (
          isOnResizeHandle(x, y, bounds) ||
          isOnRotateHandle(x, y, bounds) ||
          isMouseOverElement(ctx, x, y, n)
        );
      });

      if (hit) {
        const n = normalizeElement(hit);
        const bounds = getTextBounds(ctx, n);

        if (isOnResizeHandle(x, y, bounds)) {
          canvas.style.cursor = "nwse-resize";
        } else if (isOnRotateHandle(x, y, bounds)) {
          canvas.style.cursor = "grab";
        } else {
          canvas.style.cursor = "move";
        }
      } else {
        canvas.style.cursor = "default";
      }
    }

    if (!draggingId || !mode) return;

    const el = elements.find(e => e.id === draggingId);
    if (!el) return;

    canvas.style.cursor = "grabbing";

    if (mode === "drag") {
      updateElement(draggingId, {
        x: x - dragOffset.x,
        y: y - dragOffset.y,
      });
    }

    if (mode === "resize") {
      const dx = x - resizeStart.current.x;
      updateElement(draggingId, {
        fontSize: Math.max(8, resizeStart.current.fontSize + dx * 0.2),
      });
    }

    if (mode === "rotate") {
      const angle =
        (Math.atan2(y - el.y, x - el.x) - rotateStart.current) *
        (180 / Math.PI);

      updateElement(draggingId, { rotation: angle });
    }
  };

  function isMouseOverElement(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    el: NormalizedElement
  ) {
    const bounds = getTextBounds(ctx, el, 10);
    return (
      x >= bounds.left &&
      x <= bounds.right &&
      y >= bounds.top &&
      y <= bounds.bottom
    );
  }

  const handleMouseUp = () => {
    setMode(null);
    if (canvasRef.current) {
      canvasRef.current.style.cursor = "default";
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-100/50 p-4 rounded-lg overflow-hidden">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="bg-white shadow-xl border border-gray-200 touch-none"
        style={{
          maxWidth: "100%",
          maxHeight: "100%",
          objectFit: "contain",
        }}
      />
    </div>
  );
}
