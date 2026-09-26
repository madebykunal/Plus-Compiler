export function runHtmlPreview(sourceCode: string): boolean {
  const url = `/preview.html?run=${Date.now()}#${toBase64Url(sourceCode)}`;
  const win = window.open(url, "plus-compiler-preview");
  if (!win) return false;
  win.focus();
  return true;
}

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
