// Public API of the app shell: what surrounds every game (title, score, actions, settings).
export { ACTIVE_GAME, provideActiveGame, type ActiveGame } from './active-game';
export { BrandTitle } from './brand-title/brand-title';
export { GameActions } from './game-actions/game-actions';
export { GameLayout } from './game-layout/game-layout';
export { HistoryLink } from './history-link/history-link';
export { HistoryPage } from './history-page/history-page';
export { participantName } from './participant-name';
export { SaveNotice } from './save-notice/save-notice';
export { ScoreBoard } from './score-board/score-board';
export { SettingsSheet } from './settings-sheet/settings-sheet';
export { CONFIRM_WINDOW_MS, TwoPress } from './two-press';
