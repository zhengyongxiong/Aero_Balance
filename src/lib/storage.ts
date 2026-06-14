import type { DataSource, PressureSample } from "@/types/domain";

const DATABASE = "aerobalance";
const VERSION = 1;

export interface PressureSessionRecord {
  id: string;
  startedAt: number;
  endedAt?: number;
  source: DataSource;
  profileId?: string;
  deviceName?: string;
  seedId?: "user-a" | "user-b" | "user-c";
}

const openDatabase = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE, VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains("sessions")) {
        const sessions = database.createObjectStore("sessions", {
          keyPath: "id",
        });
        sessions.createIndex("startedAt", "startedAt");
        sessions.createIndex("source", "source");
      }
      if (!database.objectStoreNames.contains("pressureSamples")) {
        const samples = database.createObjectStore("pressureSamples", {
          keyPath: "id",
        });
        samples.createIndex("sessionId", "sessionId");
        samples.createIndex("timestamp", "timestamp");
        samples.createIndex(
          "sessionTimestamp",
          ["sessionId", "timestamp"],
          { unique: true },
        );
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const complete = (transaction: IDBTransaction) =>
  new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });

export async function savePressureSession(record: PressureSessionRecord) {
  const database = await openDatabase();
  const transaction = database.transaction("sessions", "readwrite");
  transaction.objectStore("sessions").put(record);
  await complete(transaction);
  database.close();
}

export async function savePressureSample(sample: PressureSample) {
  const database = await openDatabase();
  const transaction = database.transaction(
    "pressureSamples",
    "readwrite",
  );
  transaction.objectStore("pressureSamples").put(sample);
  await complete(transaction);
  database.close();
}

export async function loadSessionSamples(
  sessionId: string,
): Promise<PressureSample[]> {
  const database = await openDatabase();
  const transaction = database.transaction("pressureSamples", "readonly");
  const index = transaction
    .objectStore("pressureSamples")
    .index("sessionId");
  const request = index.getAll(sessionId);
  const samples = await new Promise<PressureSample[]>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  database.close();
  return samples.sort((a, b) => a.timestamp - b.timestamp);
}

export async function clearPressureDatabase() {
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DATABASE);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => resolve();
  });
}
