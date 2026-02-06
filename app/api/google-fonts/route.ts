export async function GET() {
  try {
    const API_KEY = process.env.GOOGLE_FONTS_KEY;

    if (!API_KEY) {
      return Response.json({ items: [] });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(
      `https://www.googleapis.com/webfonts/v1/webfonts?sort=popularity&key=${API_KEY}`,
      { signal: controller.signal }
    );

    clearTimeout(timeout);

    if (!res.ok) {
      return Response.json({ items: [] });
    }

    const data = await res.json();
    return Response.json(data);

  } catch (err) {
    console.error("Google fonts fetch failed:", err);
    return Response.json({ items: [] });
  }
}


