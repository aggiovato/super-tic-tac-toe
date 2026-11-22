/** How strong the computer player plays, in every game. */
export type ComputerLevel = 'beginner' | 'intermediate' | 'advanced';

/** The computer player's levels, weakest first. */
export const COMPUTER_LEVELS: readonly ComputerLevel[] = ['beginner', 'intermediate', 'advanced'];
