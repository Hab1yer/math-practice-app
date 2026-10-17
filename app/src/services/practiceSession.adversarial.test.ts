import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PracticeConfiguration } from '../types/session';
import {
  endPracticeSession,
  isValidConfiguration,
  recordPracticeResult,
  startPracticeSession,
} from './practiceSession';
import { isValidQuestion } from '../utils/validation';

afterEach(() => vi.restoreAllMocks());
const config: PracticeConfiguration = {
  operations: ['addition', 'subtraction', 'multiplication', 'division'],
  difficulty: 4,
  sessionLength: 'continuous',
  mode: 'regular',
};

describe('adversarial session transitions', () => {
  it('preserves invariants under 1000 answers interleaved with stale, duplicate and malformed events', () => {
    let seed = 90501;
    vi.spyOn(Math, 'random').mockImplementation(() => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    });
    let state = startPracticeSession(config);
    let expectedCorrect = 0;
    const questionIds = new Set<string>();
    for (let index = 0; index < 1000; index++) {
      const question = state.currentQuestion!;
      expect(isValidQuestion(question)).toBe(true);
      const submission = {
        questionId: question.id,
        selectedAnswer: question.choices[index % 4],
        selfReportedCorrect: index % 3 === 0,
      };
      expect(
        recordPracticeResult(state, { ...submission, questionId: 'stale-id' }),
      ).toBe(state);
      expect(
        recordPracticeResult(state, { ...submission, selectedAnswer: NaN }),
      ).toBe(state);
      expect(
        recordPracticeResult(state, {
          ...submission,
          selfReportedCorrect: 'true' as unknown as boolean,
        }),
      ).toBe(state);
      Object.freeze(state.session);
      Object.freeze(state.attempts);
      Object.freeze(state);
      const next = recordPracticeResult(state, submission);
      expect(recordPracticeResult(next, submission)).toBe(next);
      expect(
        recordPracticeResult(next, {
          ...submission,
          selfReportedCorrect: !submission.selfReportedCorrect,
        }),
      ).toBe(next);
      questionIds.add(question.id);
      if (submission.selfReportedCorrect) expectedCorrect++;
      expect(next.session.attempted).toBe(index + 1);
      expect(next.currentQuestionIndex).toBe(index + 1);
      expect(next.attempts).toHaveLength(index + 1);
      expect(next.session.correct).toBe(expectedCorrect);
      expect(next.session.incorrect).toBe(index + 1 - expectedCorrect);
      expect(next.isActive).toBe(true);
      expect(next.currentQuestion!.id).not.toBe(question.id);
      state = next;
    }
    expect(questionIds.size).toBe(1000);
    expect(new Set(state.attempts.map((attempt) => attempt.id)).size).toBe(
      1000,
    );
    const ended = endPracticeSession(state);
    expect(ended.session.attempted).toBe(1000);
    expect(ended.currentQuestion).toBeNull();
    expect(ended.isActive).toBe(false);
    expect(endPracticeSession(ended)).toBe(ended);
  });

  it('rejects a late answer from a previous session even when arithmetic matches', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const old = startPracticeSession(config);
    const replacement = startPracticeSession(config);
    expect(old.currentQuestion!.displayText).toBe(
      replacement.currentQuestion!.displayText,
    );
    expect(
      recordPracticeResult(replacement, {
        questionId: old.currentQuestion!.id,
        selectedAnswer: old.currentQuestion!.choices[0],
        selfReportedCorrect: true,
      }),
    ).toBe(replacement);
    expect(replacement.session.attempted).toBe(0);
  });

  it.each([
    { ...config, operations: new Array(1) },
    { ...config, operations: ['constructor'] },
    { ...config, difficulty: NaN },
    { ...config, difficulty: '1' },
    { ...config, sessionLength: '5' },
    { ...config, sessionLength: Infinity },
  ])('rejects malformed configuration %#', (candidate) => {
    expect(isValidConfiguration(candidate)).toBe(false);
    expect(() =>
      startPracticeSession(candidate as PracticeConfiguration),
    ).toThrow(RangeError);
  });
});
