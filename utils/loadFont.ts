export function loadFont(fontFamily: string) {
  const id = `font-${fontFamily}`;

  if (document.getElementById(id)) return;

  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/ /g,"+")}&display=swap`;

  document.head.appendChild(link);
}
