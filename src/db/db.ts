// src/db/db.ts
import Dexie, { Table } from 'dexie';

// Extend Window interface to include FileSystemFileHandle
declare global {
  interface Window {
    FileSystemFileHandle: typeof FileSystemFileHandle;
  }
}

export class Beat {
  id!: string; // uuid
  title!: string;
  bpm!: number; // float
  key!: string;
  tags!: string[];
  // Store the FileSystemFileHandle directly for local-first access (Chrome/Edge)
  fileHandle?: FileSystemFileHandle;
  // Fallback for browsers without File System Access API (Firefox)
  fileBlob?: Blob;
}

export class BeatCatalogDB extends Dexie {
  beats!: Table<Beat>;

  constructor() {
    super('BeatCatalogDB');
    this.version(1).stores({
      beats: '++id, title, bpm, key, *tags' // 'id' as primary key, 'tags' indexed for searching
    });
    // For storing FileSystemFileHandle
    this.beats.mapToClass(Beat);
  }
}

export const db = new BeatCatalogDB();
