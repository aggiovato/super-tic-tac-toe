import { DOCUMENT, inject, Injectable } from '@angular/core';
import type { RoomCredentials } from './online.model';

const KEY = 'super3t.online-rooms';
/** A room expires after a week idle; its seat is forgotten a day later. */
const KEEP_MS = 8 * 24 * 60 * 60 * 1000;

/**
 * The seats this device holds, by room id, in local storage: reopening an invitation link takes
 * back the same seat instead of asking for a new one. Without storage (private mode) it keeps them
 * for this visit only.
 */
@Injectable({ providedIn: 'root' })
export class RoomCredentialsStore {
  private readonly storage = inject(DOCUMENT).defaultView?.localStorage ?? null;
  private memory: Record<string, RoomCredentials> = {};

  get(roomId: string): RoomCredentials | null {
    return this.read()[roomId] ?? null;
  }

  save(roomId: string, credentials: RoomCredentials): void {
    const now = credentials.savedAt;
    const kept = Object.fromEntries(
      Object.entries(this.read()).filter(([, saved]) => now - saved.savedAt < KEEP_MS),
    );
    this.write({ ...kept, [roomId]: credentials });
  }

  /** Marks the seat in `roomId` as left, or taken back; nothing when this device holds none. */
  setLeft(roomId: string, left: boolean): void {
    const saved = this.get(roomId);
    if (saved && !!saved.left !== left) {
      this.write({ ...this.read(), [roomId]: { ...saved, left } });
    }
  }

  private read(): Record<string, RoomCredentials> {
    try {
      const raw = this.storage?.getItem(KEY);
      return raw ? (JSON.parse(raw) as Record<string, RoomCredentials>) : this.memory;
    } catch {
      return this.memory;
    }
  }

  private write(all: Record<string, RoomCredentials>): void {
    this.memory = all;
    try {
      this.storage?.setItem(KEY, JSON.stringify(all));
    } catch {
      // Storage full or blocked: the seat lasts for this visit.
    }
  }
}
