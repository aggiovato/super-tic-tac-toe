import type { Signal } from '@angular/core';
import type { GameRules } from '@catalog';
import type { ComputerLevel } from '@catalog';
import type { PlayMode } from '@preferences';
import type { SaveFailure } from '@storage';
import type { Player } from '@tictac';

/** Participant index (0 or 1) in a series; symbols swap on every rematch. */
export type Participant = 0 | 1;

/** Who plays: two people on one device, or a person against the computer. */
export type Mode = PlayMode;

/** How strong the computer plays. */
export type Level = ComputerLevel;

/** How a game stands, in any game of the family: a win need not be a line (boxes are counted). */
export type MatchStatus =
  | { readonly kind: 'in-progress' }
  | { readonly kind: 'won'; readonly winner: Player }
  | { readonly kind: 'drawn' };

/** What a match needs from any game's position: whose turn, how it stands and its moves. */
export interface MatchGame<M> {
  readonly rulesVersion: number;
  readonly turn: Player;
  readonly status: MatchStatus;
  readonly moves: readonly M[];
}

/** An engine's answer to a move: the new position, or why it was refused. */
export type MatchResult<S, R> =
  { readonly ok: true; readonly state: S } | { readonly ok: false; readonly reason: R };

/** What the opponent needs to reply: the game so far and how to play it. */
export interface ComputerRequest<M> {
  /** Accepted moves in order; the opponent rebuilds the position from them. */
  readonly moves: readonly M[];
  readonly level: Level;
  /** Integer seed kept for the whole game. */
  readonly seed: number;
  /** The game's variant (a board size), '' for games that have one shape. */
  readonly variant: string;
}

/** The engine a match plays, from the game's definition (`@catalog`). */
export type { GameRules };

/** A series between two participants, in any game of the family. */
/** Where the match's last save stands: never asked, on its way, done, or why it failed. */
export type SaveStatus = 'idle' | 'saving' | 'saved' | SaveFailure;

export interface MatchState<S, R> {
  readonly game: S;
  /** The game's variant (a board size), '' for games that have one shape; kept by rematches. */
  readonly variant: string;
  /** This game's identity: a result is recorded once per id. */
  readonly id: string;
  /** The series it belongs to; a rematch keeps it, a new series or mode starts another. */
  readonly seriesId: string;
  readonly startedAt: number;
  /** The saved match has been restored (or there was none): until then the board takes no moves. */
  readonly ready: boolean;
  readonly saveStatus: SaveStatus;
  /** Integer seed of the opponent's choices for this game. */
  readonly seed: number;
  readonly mode: Mode;
  readonly level: Level;
  /** The opponent is working on its reply; the player cannot move meanwhile. */
  readonly thinking: boolean;
  /** ComputerPlayer moves applied so far; a board can watch it to follow the reply. */
  readonly computerMoves: number;
  readonly lastRejection: R | null;
  /** Participant playing X in the current game. X always starts. */
  readonly xPlayer: Participant;
  readonly wins: readonly [number, number];
  readonly draws: number;
  /** Whether the current game's result is already in the series score. */
  readonly scored: boolean;
}

/** What the app around a game (score, actions, settings) may read and do with its match. */
export interface MatchApi {
  readonly game: Signal<MatchGame<unknown>>;
  readonly wins: Signal<readonly [number, number]>;
  readonly draws: Signal<number>;
  readonly mode: Signal<Mode>;
  /** The computer's level (kept while two people play, for when it comes back). */
  readonly level: Signal<Level>;
  readonly toMove: Signal<Participant>;
  readonly isOver: Signal<boolean>;
  readonly canUndo: Signal<boolean>;
  /** A score or a game under way: something a change would throw away. */
  readonly seriesStarted: Signal<boolean>;
  readonly saveStatus: Signal<SaveStatus>;
  symbolOf(participant: Participant): Player;
  retrySave(): void;
  undo(): void;
  rematch(): void;
  newSeries(): void;
  setMode(mode: Mode, level: Level, variant?: string): void;
}
