export const PREVIEW_TARGET = "plus-compiler-preview";

export function previewUrl(sourceCode: string): string {
  return `/preview.html?run=${Date.now()}#${toBase64Url(sourceCode)}`;
}

// Returns false when a pop-up blocker stopped the tab: most return null,
// some hand back a window that is already closed.
export function openPreviewTab(url: string): boolean {
  const win = window.open(url, PREVIEW_TARGET);
  if (!win || win.closed) return false;
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
