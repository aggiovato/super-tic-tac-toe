import type { Lang, Messages } from '../messages.model';
import { en } from './en';
import { es } from './es';

/** Every language's messages, typed so each one stays complete. */
export const MESSAGES: Record<Lang, Messages> = { es, en };
