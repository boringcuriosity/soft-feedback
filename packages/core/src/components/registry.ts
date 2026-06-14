/**
 * Maps a `Question` to the right presentational component factory.
 *
 * Rating questions dispatch on `display` ('number' | 'stars' | 'emoji' | 'thumbs' |
 * 'emoji-dial'); the other question types map by `type`. The renderer calls this once per
 * question and mounts the returned handle's element into its content slot.
 */

import type { Question, RatingDisplay } from '../types';
import type { QuestionComponentFactory } from '../internal/contracts';

import { createRatingNumber } from './rating-number';
import { createRatingStars } from './rating-stars';
import { createRatingEmoji } from './rating-emoji';
import { createRatingThumbs } from './rating-thumbs';
import { createEmojiDial } from './emoji-dial';
import { createChoice } from './choice';
import { createText } from './text';
import { createLink } from './link';

const RATING_FACTORIES: Record<RatingDisplay, QuestionComponentFactory> = {
  number: createRatingNumber,
  stars: createRatingStars,
  emoji: createRatingEmoji,
  thumbs: createRatingThumbs,
  'emoji-dial': createEmojiDial,
};

export function getQuestionComponent(question: Question): QuestionComponentFactory {
  switch (question.type) {
    case 'rating':
      return RATING_FACTORIES[question.display] ?? createRatingNumber;
    case 'choice':
      return createChoice;
    case 'text':
      return createText;
    case 'link':
      return createLink;
    default: {
      // Exhaustiveness guard: if a new QuestionType is added, this errors at compile time.
      const _never: never = question;
      throw new Error(`No component for question type: ${JSON.stringify(_never)}`);
    }
  }
}
