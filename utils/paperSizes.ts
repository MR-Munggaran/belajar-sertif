
export type PaperSize = "A4" | "A5" | "Letter" | "Legal";
export type Orientation = "portrait" | "landscape";

export const PAPER_DIMENSIONS: Record<PaperSize, { width: number; height: number }> = {
  A4: { width: 794, height: 1123 },
  A5: { width: 559, height: 794 },
  Letter: { width: 816, height: 1056 },
  Legal: { width: 816, height: 1344 },
};

export const getCanvasDimensions = (size: PaperSize, orientation: Orientation) => {
  const { width, height } = PAPER_DIMENSIONS[size];
  return orientation === "portrait" 
    ? { width, height } 
    : { width: height, height: width };
};