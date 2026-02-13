// Cache untuk tracking font yang sudah diload
const loadedFonts = new Set<string>();

/**
 * Load Google Font secara dinamis
 * @param fontFamily - Nama font family (e.g., "Roboto", "Open Sans")
 */
export async function loadFont(fontFamily: string): Promise<void> {
  // Jika font sudah pernah diload, skip
  if (loadedFonts.has(fontFamily)) {
    return;
  }

  try {
    // Font system/default tidak perlu diload
    const systemFonts = [
      "Arial",
      "Helvetica",
      "Times New Roman",
      "Courier New",
      "Verdana",
      "Georgia",
      "Palatino",
      "Garamond",
      "Comic Sans MS",
      "Trebuchet MS",
      "Impact",
    ];

    if (systemFonts.includes(fontFamily)) {
      loadedFonts.add(fontFamily);
      return;
    }

    // Load Google Font
    const fontUrl = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(
      / /g,
      "+"
    )}:wght@400;700&display=swap`;

    // Cek apakah link element sudah ada
    const existingLink = document.querySelector(
      `link[href="${fontUrl}"]`
    ) as HTMLLinkElement;

    if (existingLink) {
      loadedFonts.add(fontFamily);
      return;
    }

    // Buat link element baru
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = fontUrl;

    // Tambahkan ke head
    document.head.appendChild(link);

    // Wait for font to load
    await new Promise<void>((resolve, reject) => {
      link.onload = () => {
        loadedFonts.add(fontFamily);
        resolve();
      };
      link.onerror = () => {
        console.warn(`Failed to load font: ${fontFamily}`);
        reject(new Error(`Failed to load font: ${fontFamily}`));
      };

      // Timeout after 5 seconds
      setTimeout(() => {
        if (!loadedFonts.has(fontFamily)) {
          console.warn(`Font loading timeout: ${fontFamily}`);
          resolve(); // Resolve anyway to not block
        }
      }, 5000);
    });
  } catch (error) {
    console.error(`Error loading font ${fontFamily}:`, error);
  }
}

/**
 * Preload multiple fonts
 * @param fonts - Array of font family names
 */
export async function loadFonts(fonts: string[]): Promise<void> {
  await Promise.all(fonts.map((font) => loadFont(font)));
}

/**
 * Check if a font is loaded
 * @param fontFamily - Font family name
 * @returns true if font is loaded
 */
export function isFontLoaded(fontFamily: string): boolean {
  return loadedFonts.has(fontFamily);
}

/**
 * Clear font cache (useful for testing)
 */
export function clearFontCache(): void {
  loadedFonts.clear();
}