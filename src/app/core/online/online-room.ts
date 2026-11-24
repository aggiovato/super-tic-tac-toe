import {
  computed,
  DestroyRef,
  DOCUMENT,
  inject,
  Injectable,
  InjectionToken,
  signal,
} from '@angular/core';
import { type GameId, gameById } from '@catalog';
import { type RemoteGame, RemoteSeat } from '@match';
import { GAME_ROOMS_PATH, type GameRoomState, type Seat, type ServerMessage } from '@protocol';
import { GameRoomsApi, RoomsUnreachable } from './game-rooms-api';
import type { RivalPresence, RoomProblem } from './online.model';
import { RoomCredentialsStore } from './room-credentials';
import { RoomSocket, type SocketFactory } from './room-socket';

/** The game an online route plays. */
export const ONLINE_GAME = new InjectionToken<GameId>('ONLINE_GAME');

/** How the room's socket is opened: a real WebSocket, unless a test provides its own. */
export const SOCKET_FACTORY = new InjectionToken<SocketFactory>('SOCKET_FACTORY', {
  providedIn: 'root',
  factory: () => (url) => new WebSocket(url),
});

/** A move of this player on its way: shown at once, dropped if the server refuses it. */
interface PendingMove {
  readonly commandId: string;
  readonly game: number;
  readonly expectedRevision: number;
  readonly move: unknown;
  /** The revision the server accepted it at (its `ack`), once known. */
  readonly acked?: number;
}

/**
 * The pending moves that still follow the server's state, in order; the rest are dropped. In a
 * game where both may move at once (Ship Sink's placements), a move stays until the state carries
 * it (its `ack` names where) or the server refuses it: the rival's move landing first does not
 * make it stale.
 */
function stillPending(
  pending: readonly PendingMove[],
  state: GameRoomState,
  simultaneous: ((moves: readonly unknown[]) => boolean) | null,
): PendingMove[] {
  if (simultaneous) {
    // Also dropped: a move the state already holds (resent after a reconnection, before its ack),
    // which no longer fits on top of the server's moves.
    const kept: PendingMove[] = [];
    let moves = state.moves;
    for (const move of pending) {
      const acked = move.acked !== undefined && move.acked <= state.revision;
      const next = [...moves, move.move];
      if (move.game === state.game && !acked && simultaneous(next)) {
        kept.push(move);
        moves = next;
      }
    }
    return kept;
  }
  const kept = pending.filter(
    (move) => move.game === state.game && move.expectedRevision >= state.revision,
  );
  // They must continue the server's moves without a gap; otherwise the server went another way.
  return kept.every((move, index) => move.expectedRevision === state.revision + index) ? kept : [];
}

/**
 * One online room, on its route: takes this device's seat (the saved one, or the guest's through
 * the invitation), keeps the room's socket open, mirrors the server's state and sends this
 * player's moves, shown at once and taken back if the server refuses them. The match reads it as
 * its `RemoteSeat`.
 */
@Injectable()
export class OnlineRoom extends RemoteSeat {
  private readonly gameId = inject(ONLINE_GAME);
  /**
   * In a game where both players may move at once (its rules say who may move): whether a list of
   * moves replays, as this seat sees it. Null for turn-based games.
   */
  private readonly simultaneous = this.replays();
  private readonly api = inject(GameRoomsApi);
  private readonly credentials = inject(RoomCredentialsStore);
  private readonly createSocket = inject(SOCKET_FACTORY);
  private readonly window = inject(DOCUMENT).defaultView;

  private readonly server = signal<GameRoomState | null>(null);
  private readonly pending = signal<readonly PendingMove[]>([]);
  private readonly socket = signal<RoomSocket | null>(null);

  /** The room's id, once opened. */
  readonly roomId = signal<string | null>(null);
  readonly problem = signal<RoomProblem | null>(null);
  /** This device left the room earlier and came back: it waits for `rejoin()`. */
  readonly left = signal(false);
  readonly connection = computed(() => this.socket()?.state() ?? 'connecting');

  readonly rival = computed((): RivalPresence | null => {
    const state = this.server();
    const seat = state?.seats[state.you === 0 ? 1 : 0];
    return seat ? { joined: seat.taken, online: seat.online } : null;
  });

  /** The link that brings the other player to this room. */
  readonly invitation = computed(() => {
    const id = this.roomId();
    const origin = this.window?.location.origin ?? '';
    return id ? `${origin}/${this.gameId}/online/${encodeURIComponent(id)}` : null;
  });

  readonly game = computed((): RemoteGame | null => {
    const state = this.server();
    if (!state) {
      return null;
    }
    return {
      number: state.game,
      rulesVersion: state.rulesVersion,
      variant: state.variant,
      xPlayer: state.xSeat,
      moves: [...state.moves, ...this.pending().map(({ move }) => move)],
      wins: state.score.wins,
      draws: state.score.draws,
      scored: state.result !== null,
      you: state.you,
    };
  });

  constructor() {
    super();
    const retry = () => this.socket()?.retryNow();
    const visible = () => {
      if (this.window?.document.visibilityState === 'visible') {
        retry();
      }
    };
    this.window?.addEventListener('online', retry);
    this.window?.document.addEventListener('visibilitychange', visible);
    inject(DestroyRef).onDestroy(() => {
      this.window?.removeEventListener('online', retry);
      this.window?.document.removeEventListener('visibilitychange', visible);
      this.socket()?.close();
      // Leaving the route inside the app is leaving the room: back here, it asks first. A reload
      // destroys nothing, so it reconnects as before.
      const roomId = this.roomId();
      if (roomId && this.socket()) {
        this.credentials.setLeft(roomId, true);
      }
    });
  }

  /** Takes this device's seat in `roomId` and connects; a second call for the same room does nothing. */
  async open(roomId: string): Promise<void> {
    if (this.roomId() === roomId) {
      return;
    }
    this.roomId.set(roomId);
    this.problem.set(null);
    const saved = this.credentials.get(roomId);
    if (saved?.left) {
      this.left.set(true);
      return;
    }
    const seat = saved ?? (await this.takeSeat(roomId));
    if (seat) {
      this.connect(roomId, seat.token);
    }
  }

  /** Takes back the seat this device left, and connects. */
  rejoin(): void {
    const roomId = this.roomId();
    const saved = roomId ? this.credentials.get(roomId) : null;
    if (roomId && saved && this.left()) {
      this.credentials.setLeft(roomId, false);
      this.left.set(false);
      this.connect(roomId, saved.token);
    }
  }

  /** Tries again after the server was out of reach. */
  retry(): void {
    const roomId = this.roomId();
    if (roomId && this.problem() === 'unreachable') {
      this.roomId.set(null);
      void this.open(roomId);
    }
  }

  play(move: unknown): void {
    const state = this.server();
    if (!state) {
      return;
    }
    const pending: PendingMove = {
      commandId: crypto.randomUUID(),
      game: state.game,
      expectedRevision: state.revision + this.pending().length,
      move,
    };
    this.pending.update((moves) => [...moves, pending]);
    this.send(pending);
  }

  rematch(): void {
    const state = this.server();
    if (state) {
      this.socket()?.send({ type: 'rematch', game: state.game });
    }
  }

  private async takeSeat(roomId: string): Promise<{ seat: Seat; token: string } | null> {
    try {
      const grant = await this.api.join(roomId);
      if (typeof grant === 'string') {
        this.problem.set(grant);
        return null;
      }
      this.credentials.save(roomId, { ...grant, gameId: this.gameId, savedAt: Date.now() });
      return grant;
    } catch (error) {
      if (!(error instanceof RoomsUnreachable)) {
        throw error;
      }
      this.problem.set('unreachable');
      return null;
    }
  }

  private connect(roomId: string, token: string): void {
    const location = this.window?.location;
    const scheme = location?.protocol === 'https:' ? 'wss:' : 'ws:';
    const path = `${GAME_ROOMS_PATH}/${encodeURIComponent(roomId)}/socket`;
    const url = `${scheme}//${location?.host ?? ''}${path}?token=${encodeURIComponent(token)}`;
    const socket = new RoomSocket(url, this.createSocket, {
      // What was on its way when the connection dropped goes again; the server keeps it once.
      open: () => this.pending().forEach((move) => this.send(move)),
      message: (message) => this.receive(message),
      expired: () => this.problem.set('expired'),
    });
    this.socket.set(socket);
    socket.connect();
  }

  private receive(message: ServerMessage): void {
    switch (message.type) {
      case 'state':
        // The new state first: whether a pending move still fits is read against it.
        this.server.set(message);
        this.pending.update((moves) => stillPending(moves, message, this.simultaneous));
        return;
      case 'refused':
        // That move and everything played after it go; the server's state stands.
        this.pending.update((moves) => {
          const at = moves.findIndex(({ commandId }) => commandId === message.commandId);
          return at === -1 ? moves : moves.slice(0, at);
        });
        return;
      case 'ack':
        // The state that follows carries the move; until then it stays pending.
        this.pending.update((moves) =>
          moves.map((move) =>
            move.commandId === message.commandId ? { ...move, acked: message.revision } : move,
          ),
        );
        return;
      case 'error':
        console.error('The room did not understand a message.', message.reason);
    }
  }

  private replays(): ((moves: readonly unknown[]) => boolean) | null {
    const { rules } = gameById(this.gameId);
    if (!rules.mayMove) return null;
    return (moves) => {
      const state = this.server();
      if (!state) return false;
      const viewer = state.you === state.xSeat ? 'X' : 'O';
      return rules.hidden
        ? rules.hidden.replayView(moves, state.rulesVersion, state.variant, viewer).ok
        : rules.replay(moves, state.rulesVersion, state.variant).ok;
    };
  }

  private send({ commandId, expectedRevision, move }: PendingMove): void {
    this.socket()?.send({ type: 'move', commandId, expectedRevision, move });
  }
}
