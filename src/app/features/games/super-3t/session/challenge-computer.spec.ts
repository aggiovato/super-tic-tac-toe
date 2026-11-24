import { TestBed } from '@angular/core/testing';
import { CHALLENGES } from '@super3t/challenge';
import type { Move } from '@super3t/core';
import { ChallengeComputer } from './challenge-computer';
import { ChallengeRun } from './challenge-run';
import { ChallengeSession } from './challenge-session';
import { COMPUTER_PACE_MS } from '@match';

// The easy challenge: X is forced onto board 2 and 2.8 is the key move.
const easy = CHALLENGES[0];
const KEY: Move = { board: 2, cell: 8 };
const WRONG: Move = { board: 2, cell: 0 };

describe('the challenge session and its defender', () => {
  let run: ChallengeRun;
  let session: ChallengeSession;
  let opponent: ChallengeComputer;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [ChallengeRun, ChallengeSession, ChallengeComputer],
    });
    run = TestBed.inject(ChallengeRun);
    session = TestBed.inject(ChallengeSession);
    opponent = TestBed.inject(ChallengeComputer);
    if (easy) {
      run.challenge.set(easy);
    }
  });

  afterEach(() => vi.useRealTimers());

  const movesAfter = (...moves: Move[]): Move[] => [...run.start().moves, ...moves];

  it('starts every game from the prepared position', () => {
    expect(session.start().moves).toEqual(easy?.moves);
    expect(session.start().turn).toBe('X');
  });

  it('defends after the key move, at the pace of the Worker', async () => {
    let reply: Move | null | undefined;
    void opponent
      .reply({ moves: movesAfter(KEY), level: 'beginner', player: 'O', seed: 1, variant: '' })
      .then((move) => {
        reply = move;
      });
    await vi.advanceTimersByTimeAsync(COMPUTER_PACE_MS - 1);
    expect(reply).toBeUndefined();
    await vi.advanceTimersByTimeAsync(1);
    expect(reply?.board).toBe(8);
  });

  it('passes after any other move, so the attempt stops there', async () => {
    const answer = opponent.reply({
      moves: movesAfter(WRONG),
      level: 'beginner',
      player: 'O',
      seed: 1,
      variant: '',
    });
    await vi.advanceTimersByTimeAsync(COMPUTER_PACE_MS);
    expect(await answer).toBeNull();
  });

  it('resolves a cancelled request with null', async () => {
    const answer = opponent.reply({
      moves: movesAfter(KEY),
      level: 'beginner',
      player: 'O',
      seed: 1,
      variant: '',
    });
    opponent.cancel();
    expect(await answer).toBeNull();
  });

  it('reports a solved attempt once, with the challenge id', () => {
    const solved: string[] = [];
    run.onSolved = (id) => solved.push(id);
    const keyed = session.play(session.start(), KEY);
    if (!keyed.ok) {
      throw new Error('the key move was refused');
    }
    // Board 8 sends X to a closed board: a free choice, and 2.5 wins board 2 and the game.
    const replied = session.play(keyed.state, { board: 8, cell: 4 });
    if (!replied.ok) {
      throw new Error('the reply was refused');
    }
    expect(solved).toEqual([]);
    expect(session.play(replied.state, { board: 2, cell: 5 }).ok).toBe(true);
    expect(solved).toEqual([easy?.id]);
  });
});
