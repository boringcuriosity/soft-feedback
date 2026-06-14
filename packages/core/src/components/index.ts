/**
 * Barrel for the presentational question components.
 *
 * Each factory takes a `QuestionComponentContext` and returns a `QuestionComponentHandle`
 * (`{ el, focus, destroy }`). Use `getQuestionComponent(question)` to pick the right one.
 */

export { createRatingNumber } from './rating-number';
export { createRatingStars } from './rating-stars';
export { createRatingEmoji } from './rating-emoji';
export { createRatingThumbs } from './rating-thumbs';
export { createEmojiDial } from './emoji-dial';
export { createChoice } from './choice';
export { createText } from './text';
export { createLink } from './link';
export { getQuestionComponent } from './registry';

export type {
  QuestionComponentContext,
  QuestionComponentHandle,
  QuestionComponentFactory,
} from '../internal/contracts';
