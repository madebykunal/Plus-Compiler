const DB_NAME = "plus-compiler";
const STORE = "secrets";
const RECORD_ID = "anthropic-api-key";

type StoredKey = {
  cryptoKey: CryptoKey;
  iv: Uint8Array<ArrayBuffer>;
  data: ArrayBuffer;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function inStore<T>(mode: IDBTransactionMode, op: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const req = op(tx.objectStore(STORE));
      tx.oncomplete = () => resolve(req.result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

let writes: Promise<unknown> = Promise.resolve();
const queue = (write: () => Promise<unknown>): Promise<void> => {
  const next = writes.then(write, write);
  writes = next.catch(() => {});
  return next.then(() => {});
};

export function saveApiKey(apiKey: string): Promise<void> {
  return queue(async () => {
    const cryptoKey = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, [
      "encrypt",
      "decrypt",
    ]);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const data = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, cryptoKey, new TextEncoder().encode(apiKey));
    const record: StoredKey = { cryptoKey, iv, data };
    await inStore("readwrite", (store) => store.put(record, RECORD_ID));
  });
}

export function clearApiKey(): Promise<void> {
  return queue(() => inStore("readwrite", (store) => store.delete(RECORD_ID)));
}

export async function loadApiKey(): Promise<string | null> {
  try {
    const stored = await inStore<StoredKey | undefined>("readonly", (store) => store.get(RECORD_ID));
    if (!stored) return null;
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: stored.iv }, stored.cryptoKey, stored.data);
    return new TextDecoder().decode(plain);
  } catch {
    return null;
  }
}
