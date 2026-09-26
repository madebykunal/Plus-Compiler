export const PREVIEW_PATH = "/preview.html";
export const PREVIEW_TARGET = "plus-compiler-preview";

export function previewUrl(sourceCode: string): string {
  return `${PREVIEW_PATH}?run=${Date.now()}#${toBase64Url(sourceCode)}`;
}

export function openPreviewTab(url: string) {
  const link = document.createElement("a");
  link.href = url;
  link.target = PREVIEW_TARGET;
  link.click();
}

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
