export type PaperSize = "A4" | "Letter";
export type Orientation = "portrait" | "landscape";

interface CanvasDimensions {
  width: number;
  height: number;
}

// Dimensi kertas dalam pixels (at 96 DPI)
const PAPER_SIZES: Record<PaperSize, CanvasDimensions> = {
  A4: {
    width: 794, // 210mm
    height: 1123, // 297mm
  },
  Letter: {
    width: 816, // 8.5 inch
    height: 1056, // 11 inch
  },
};

/**
 * Get canvas dimensions based on paper size and orientation
 */
export function getCanvasDimensions(
  size: PaperSize,
  orientation: Orientation
): CanvasDimensions {
  const dimensions = PAPER_SIZES[size];

  if (orientation === "landscape") {
    return {
      width: dimensions.height,
      height: dimensions.width,
    };
  }

  return dimensions;
}

/**
 * Get all available paper sizes
 */
export function getAvailablePaperSizes(): PaperSize[] {
  return Object.keys(PAPER_SIZES) as PaperSize[];
}

/**
 * Convert pixels to millimeters
 */
export function pixelsToMm(pixels: number): number {
  return (pixels * 25.4) / 96; // 96 DPI
}

/**
 * Convert millimeters to pixels
 */
export function mmToPixels(mm: number): number {
  return (mm * 96) / 25.4;
}

/**
 * Get paper size info
 */
export function getPaperSizeInfo(size: PaperSize): {
  size: PaperSize;
  widthMm: number;
  heightMm: number;
  widthInch: number;
  heightInch: number;
  widthPx: number;
  heightPx: number;
} {
  const dimensions = PAPER_SIZES[size];

  return {
    size,
    widthMm: pixelsToMm(dimensions.width),
    heightMm: pixelsToMm(dimensions.height),
    widthInch: dimensions.width / 96,
    heightInch: dimensions.height / 96,
    widthPx: dimensions.width,
    heightPx: dimensions.height,
  };
}