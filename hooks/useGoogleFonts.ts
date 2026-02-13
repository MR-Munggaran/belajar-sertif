import { useMemo } from "react";

export interface FontOption {
  label: string;
  value: string;
}

/**
 * Hook untuk mendapatkan list Google Fonts populer
 * Dalam production, bisa diganti dengan fetch dari Google Fonts API
 */
export function useGoogleFonts(): FontOption[] {
  return useMemo(
    () => [
      // Serif Fonts
      { label: "Merriweather", value: "Merriweather" },
      { label: "Playfair Display", value: "Playfair Display" },
      { label: "Lora", value: "Lora" },
      { label: "Crimson Text", value: "Crimson Text" },
      { label: "EB Garamond", value: "EB Garamond" },
      { label: "Georgia", value: "Georgia" },
      { label: "Times New Roman", value: "Times New Roman" },

      // Sans-Serif Fonts
      { label: "Roboto", value: "Roboto" },
      { label: "Open Sans", value: "Open Sans" },
      { label: "Lato", value: "Lato" },
      { label: "Montserrat", value: "Montserrat" },
      { label: "Poppins", value: "Poppins" },
      { label: "Inter", value: "Inter" },
      { label: "Raleway", value: "Raleway" },
      { label: "Ubuntu", value: "Ubuntu" },
      { label: "Nunito", value: "Nunito" },
      { label: "Work Sans", value: "Work Sans" },
      { label: "Arial", value: "Arial" },
      { label: "Helvetica", value: "Helvetica" },
      { label: "Verdana", value: "Verdana" },

      // Display/Decorative Fonts
      { label: "Bebas Neue", value: "Bebas Neue" },
      { label: "Oswald", value: "Oswald" },
      { label: "Abril Fatface", value: "Abril Fatface" },
      { label: "Righteous", value: "Righteous" },
      { label: "Pacifico", value: "Pacifico" },
      { label: "Great Vibes", value: "Great Vibes" },
      { label: "Dancing Script", value: "Dancing Script" },
      { label: "Lobster", value: "Lobster" },

      // Monospace Fonts
      { label: "Courier New", value: "Courier New" },
      { label: "Roboto Mono", value: "Roboto Mono" },
      { label: "Source Code Pro", value: "Source Code Pro" },

      // Indonesian-friendly fonts
      { label: "Noto Sans", value: "Noto Sans" },
      { label: "Noto Serif", value: "Noto Serif" },

      // Elegant/Formal fonts (cocok untuk sertifikat)
      { label: "Cinzel", value: "Cinzel" },
      { label: "Cormorant Garamond", value: "Cormorant Garamond" },
      { label: "Libre Baskerville", value: "Libre Baskerville" },
      { label: "Philosopher", value: "Philosopher" },
    ],
    []
  );
}

/**
 * Filter fonts by category
 */
export function useGoogleFontsByCategory(category?: string): FontOption[] {
  const allFonts = useGoogleFonts();

  return useMemo(() => {
    if (!category) return allFonts;

    // Simple categorization (bisa diperluas)
    const categories: Record<string, string[]> = {
      serif: [
        "Merriweather",
        "Playfair Display",
        "Lora",
        "Crimson Text",
        "EB Garamond",
        "Georgia",
        "Times New Roman",
        "Noto Serif",
        "Cinzel",
        "Cormorant Garamond",
        "Libre Baskerville",
      ],
      "sans-serif": [
        "Roboto",
        "Open Sans",
        "Lato",
        "Montserrat",
        "Poppins",
        "Inter",
        "Raleway",
        "Ubuntu",
        "Nunito",
        "Work Sans",
        "Arial",
        "Helvetica",
        "Verdana",
        "Noto Sans",
      ],
      display: [
        "Bebas Neue",
        "Oswald",
        "Abril Fatface",
        "Righteous",
        "Pacifico",
        "Great Vibes",
        "Dancing Script",
        "Lobster",
        "Philosopher",
      ],
      monospace: ["Courier New", "Roboto Mono", "Source Code Pro"],
    };

    const categoryFonts = categories[category.toLowerCase()] || [];
    return allFonts.filter((font) => categoryFonts.includes(font.value));
  }, [allFonts, category]);
}