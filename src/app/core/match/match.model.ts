import type { Signal } from '@angular/core';
import type { GameRules, Position, PositionStatus } from '@catalog';
import type { ComputerLevel } from '@catalog';
import type { PlayMode } from '@preferences';
import type { SaveFailure } from '@storage';
import type { Player } from '@tictac';

/** Participant index (0 or 1) in a series; symbols swap on every rematch. */
export type Participant = 0 | 1;

/**
 * Who plays: two people on one device, a person against the computer, or two people online (only
 * on an online route, never saved as a preference).
 */
export type Mode = PlayMode | 'online';

/** How strong the computer plays. */
export type Level = ComputerLevel;

/** How a game stands, in any game of the family: a win need not be a line (boxes are counted). */
export type MatchStatus = PositionStatus;

/** What a match needs from any game's position: whose turn, how it stands and its moves. */
export type MatchGame<M> = Position<M>;

/** An engine's answer to a move: the new position, or why it was refused. */
export type MatchResult<S, R> =
  { readonly ok: true; readonly state: S } | { readonly ok: false; readonly reason: R };

/** What the computer player is asked (`@match/worker`, shared with its Worker). */
export type { ComputerRequest } from './worker';

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
  /** Online, the participant playing on this device; null when both play here or the computer does. */
  readonly seat: Participant | null;
}

/** What the app around a game (score, actions, settings) may read and do with its match. */
export interface MatchApi {
  readonly game: Signal<MatchGame<unknown>>;
  readonly wins: Signal<readonly [number, number]>;
  readonly draws: Signal<number>;
  readonly mode: Signal<Mode>;
  /** The game's variant (a board size), '' for games that have one shape. */
  readonly variant: Signal<string>;
  /** Online, the participant playing on this device; null otherwise. */
  readonly seat: Signal<Participant | null>;
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
