const armed = new WeakSet<ClipboardItem>();
let installed = false;

export function quietMonacoClipboard() {
  if (installed || typeof ClipboardItem === "undefined" || !navigator.clipboard?.write) return;
  installed = true;

  const NativeClipboardItem = window.ClipboardItem;
  class TrackedClipboardItem extends NativeClipboardItem {
    constructor(items: Record<string, string | Blob | PromiseLike<string | Blob>>, options?: ClipboardItemOptions) {
      super(items, options);
      const pending = Object.values(items).filter((value) => typeof (value as PromiseLike<unknown>)?.then === "function");
      if (pending.length === 0) return;
      armed.add(this);
      for (const value of pending) Promise.resolve(value).catch(() => {});
    }
  }
  window.ClipboardItem = TrackedClipboardItem;

  const write = navigator.clipboard.write.bind(navigator.clipboard);
  navigator.clipboard.write = (data) =>
    write(data).catch((err: unknown) => {
      const preArmed = data.length > 0 && data.every((item) => armed.has(item));
      if (preArmed && err instanceof DOMException && err.name === "NotAllowedError") return;
      throw err;
    });
}
