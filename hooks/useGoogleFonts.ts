"use client";
import { useEffect, useState } from "react";

type GoogleFontItem = {
  family: string;
};

type GoogleFontsResponse = {
  items: GoogleFontItem[];
};

export function useGoogleFonts() {
  const [fonts, setFonts] = useState<{ label: string; value: string }[]>([]);

  useEffect(() => {
    fetch("/api/google-fonts")
      .then(res => res.json())
      .then((data: GoogleFontsResponse) => {
        if (!data?.items) return;

        const mapped = data.items.slice(0, 200).map((f) => ({
          label: f.family,
          value: f.family
        }));

        setFonts(mapped);
      })
      .catch(() => setFonts([]));
  }, []);


  return fonts;
}
