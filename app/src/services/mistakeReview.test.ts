import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  eligibleMistakes,
  generateReviewQuestion,
  reviewPriority,
} from './mistakeReview';
import { trackMistakes } from './mistakeTracking';
import { startPracticeSession, recordPracticeResult } from './practiceSession';
import { createStorageService } from './storageService';
import {
  reviewPattern,
  reviewMiss,
  seedReviewState,
} from '../test/reviewFixtures';
import type { PracticeConfiguration } from '../types/session';

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});
const config: PracticeConfiguration = {
  operations: ['addition', 'subtraction'],
  difficulty: 1,
  sessionLength: 10,
  mode: 'mistake-review',
};
describe('review and mastery', () => {
  it('prioritizes frequency, recency and low successful progress independently', () => {
    const pattern = reviewPattern();
    const now = Date.parse(pattern.lastIncorrectAt);
    const score = reviewPriority(pattern, 3, now);
    expect(
      reviewPriority({ ...pattern, incorrectCount: 5 }, 3, now),
    ).toBeGreaterThan(score);
    expect(
      reviewPriority(
        { ...pattern, lastIncorrectAt: '2026-09-01T09:00:01.000Z' },
        3,
        now,
      ),
    ).toBeLessThan(score);
    expect(
      reviewPriority({ ...pattern, similarCorrectCount: 2 }, 3, now),
    ).toBeLessThan(score);
  });
  it('randomizes tied candidates and alternates patterns', () => {
    const patterns = [reviewPattern(), reviewPattern('subtraction')];
    const spy = vi.spyOn(Math, 'random');
    spy.mockReturnValueOnce(0).mockReturnValueOnce(0.99).mockReturnValue(0.5);
    const question = generateReviewQuestion(
      { patterns, masteryThreshold: 3 },
      config,
    );
    expect(question.mistakePatternId).toBe(patterns[1].id);
    const next = generateReviewQuestion(
      { patterns, masteryThreshold: 3 },
      config,
      [
        reviewMiss({
          source: 'mistake-review',
          mistakePatternId: question.mistakePatternId,
        }),
      ],
    );
    expect(next.mistakePatternId).toBe(patterns[0].id);
  });
  it('excludes mastered, other operations and other difficulty levels', () => {
    const pattern = reviewPattern();
    expect(
      eligibleMistakes(
        [
          pattern,
          { ...pattern, mastered: true },
          { ...pattern, difficulty: 2 },
        ],
        config,
      ),
    ).toEqual([pattern]);
    expect(eligibleMistakes([reviewPattern('division')], config)).toEqual([]);
    expect(() => startPracticeSession(config)).toThrow();
  });
  it('ends early on mastery, saves linked results once and restores mastery after reload', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-22T10:00:00.000Z'));
    const store = createStorageService();
    store.saveSession(seedReviewState());
    let state = startPracticeSession(config, {
      patterns: store.getMistakePatterns(),
      masteryThreshold: 3,
    });
    store.saveSession(state);
    for (let index = 0; index < 3; index++) {
      const question = state.currentQuestion!;
      const submission = {
        questionId: question.id,
        selectedAnswer: question.choices[0],
        selfReportedCorrect: true,
      };
      state = recordPracticeResult(state, submission);
      expect(recordPracticeResult(state, submission)).toBe(state);
      store.saveSession(state);
    }
    expect(state.isActive).toBe(false);
    expect(state.session).toMatchObject({
      attempted: 3,
      completionReason: 'mastered',
    });
    expect(createStorageService().getMistakePatterns()[0]).toMatchObject({
      similarCorrectCount: 3,
      mastered: true,
      incorrectCount: 1,
    });
    expect(
      createStorageService()
        .getHistory()
        .attempts.filter((attempt) => attempt.source === 'mistake-review'),
    ).toHaveLength(3);
  });
  it('resets the original pattern on a missed inverse question and reopens future exact misses', () => {
    const miss = reviewMiss();
    const id = trackMistakes([miss])[0].id;
    const correct = reviewMiss({
      id: 'correct-review',
      questionId: 'correct-review',
      source: 'mistake-review',
      mistakePatternId: id,
      selfReportedCorrect: true,
    });
    const wrong = {
      ...correct,
      id: 'wrong-review',
      questionId: 'wrong-review',
      operation: 'subtraction' as const,
      firstOperand: 7,
      secondOperand: 3,
      correctAnswer: 4,
      selfReportedCorrect: false,
    };
    expect(trackMistakes([miss, correct, wrong])).toHaveLength(1);
    expect(trackMistakes([miss, correct, wrong])[0]).toMatchObject({
      operation: 'addition',
      incorrectCount: 2,
      similarCorrectCount: 0,
      mastered: false,
    });
    const ledger = [
      miss,
      correct,
      { ...correct, id: 'r2' },
      { ...correct, id: 'r3' },
    ];
    expect(trackMistakes(ledger)[0].mastered).toBe(true);
    expect(
      trackMistakes([...ledger, { ...miss, id: 'future' }])[0].mastered,
    ).toBe(false);
    expect(trackMistakes(ledger, 5)[0].mastered).toBe(false);
  });
});
