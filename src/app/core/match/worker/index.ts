// What the computer player's Worker shares with the match: its messages, as plain types. Its own
// alias (`@match/worker`) so a Worker imports nothing else of `@match` (no Angular, no DOM).
export type {
  ComputerReplyMessage,
  ComputerRequest,
  ComputerRequestMessage,
} from './computer-message.model';
