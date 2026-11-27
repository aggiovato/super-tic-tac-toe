import { shotsInOrder, viewOf } from '@fleet/core';
import { FLEET_A, FLEET_B, play, SINK_B } from '@fleet/core/testing';
import { MESSAGES } from '@i18n';
import { battleViews } from './fleet-views';

const FLEETS = { X: FLEET_A, O: FLEET_B };
const t = MESSAGES.en;

/** The battle as X sees it after `fired`, the last shot fresh or settled. */
function views(fired: string, fresh: boolean) {
  const view = viewOf(play(FLEETS, fired), 'X');
  const last = shotsInOrder(view).at(-1) ?? null;
  return battleViews(t, view, 'X', { last, fresh: fresh ? last : null });
}

describe('the battle views: what sparks and what shows the win', () => {
  it('marks the wreck just sunk as fresh, and only that one', () => {
    // J1–J5 sink the carrier; A10 then hits the next ship.
    const sunk = views('J1 J2 J3 J4 J5', true);
    expect(sunk.enemy.wrecks.map((wreck) => wreck.fresh)).toEqual([true]);
    const after = views('J1 J2 J3 J4 J5 A10', true);
    expect(after.enemy.wrecks.map((wreck) => wreck.fresh)).toEqual([false]);
  });

  it('keeps a sinking already on the board when it appeared still', () => {
    expect(views('J1 J2 J3 J4 J5', false).enemy.wrecks[0]?.fresh).toBe(false);
  });

  it("draws the winner's figure on the waters they emptied, flashing as the winning shot lands", () => {
    const won = views(SINK_B, true);
    expect(won.enemy).toMatchObject({ won: true, celebrate: true });
    expect(won.own).toMatchObject({ won: false, celebrate: false });
    // Reopened later, the figure stays in the win colour without flashing again.
    expect(views(SINK_B, false).enemy).toMatchObject({ won: true, celebrate: false });
  });

  it('shows no figure while the game goes on', () => {
    expect(views('J1 J2 J3 J4 J5', true).enemy).toMatchObject({ won: false, celebrate: false });
  });
});
