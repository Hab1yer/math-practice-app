import { afterEach, describe, expect, it, vi } from 'vitest';
import type {
  PracticeConfiguration,
  PracticeSessionState,
} from '../types/session';
import type { DifficultyLevel, MathOperation } from '../types/question';
import {
  startPracticeSession,
  recordPracticeResult,
  endPracticeSession,
  isValidConfiguration,
} from './practiceSession';
import * as generator from './questionGenerator';
import { isValidQuestion } from '../utils/validation';

afterEach(() => vi.restoreAllMocks());
const config: PracticeConfiguration = {
  operations: ['addition'],
  difficulty: 1,
  sessionLength: 5,
  mode: 'regular',
};
function answer(state: PracticeSessionState, correct = true) {
  return recordPracticeResult(state, {
    questionId: state.currentQuestion!.id,
    selectedAnswer: state.currentQuestion!.choices[0],
    selfReportedCorrect: correct,
  });
}

describe('practice session lifecycle', () => {
  it('stores a fresh session, immutable configuration and first question', () => {
    const input = { ...config, operations: [...config.operations] };
    const state = startPracticeSession(input);
    input.operations.push('division');
    expect(state.session.operations).toEqual(['addition']);
    expect(state.session.id).toBeTruthy();
    expect(Number.isNaN(Date.parse(state.session.startedAt))).toBe(false);
    expect(state.isActive).toBe(true);
    expect(state.currentQuestionIndex).toBe(0);
    expect(state.session.attempted).toBe(0);
    expect(state.attempts).toEqual([]);
    expect(isValidQuestion(state.currentQuestion)).toBe(true);
  });
  it.each([5, 10, 20] as const)(
    'ends exactly at %s attempts and preserves self-reported totals',
    (length) => {
      let state = startPracticeSession({ ...config, sessionLength: length });
      const sessionId = state.session.id;
      const ids = new Set<string>();
      for (let index = 0; index < length; index++) {
        const previous = state;
        const question = state.currentQuestion!;
        const wrongChoice = question.choices.find(
          (choice) => choice !== question.correctAnswer,
        )!;
        ids.add(question.id);
        state = recordPracticeResult(state, {
          questionId: question.id,
          selectedAnswer: wrongChoice,
          selfReportedCorrect: index % 2 === 0,
        });
        expect(previous.session.attempted).toBe(index);
        expect(state.session.attempted).toBe(index + 1);
        expect(state.currentQuestionIndex).toBe(index + 1);
        expect(state.attempts[index]).toMatchObject({
          sessionId,
          questionId: question.id,
          selectedAnswer: wrongChoice,
          selfReportedCorrect: index % 2 === 0,
          operation: question.operation,
          correctAnswer: question.correctAnswer,
        });
        expect(state.isActive).toBe(index + 1 < length);
      }
      expect(ids.size).toBe(length);
      expect(state.session.correct).toBe(Math.ceil(length / 2));
      expect(state.session.incorrect).toBe(Math.floor(length / 2));
      expect(state.currentQuestion).toBeNull();
      expect(state.session.completedAt).toBeTruthy();
      expect(endPracticeSession(state)).toBe(state);
    },
  );
  it('ignores duplicate, stale, invalid and post-completion submissions', () => {
    const initial = startPracticeSession(config);
    const submission = {
      questionId: initial.currentQuestion!.id,
      selectedAnswer: initial.currentQuestion!.choices[0],
      selfReportedCorrect: true,
    };
    const next = recordPracticeResult(initial, submission);
    expect(recordPracticeResult(next, submission)).toBe(next);
    expect(
      recordPracticeResult(next, { ...submission, questionId: 'stale' }),
    ).toBe(next);
    expect(
      recordPracticeResult(next, {
        ...submission,
        questionId: next.currentQuestion!.id,
        selectedAnswer: -999,
      }),
    ).toBe(next);
    const ended = endPracticeSession(next);
    expect(recordPracticeResult(ended, submission)).toBe(ended);
    expect(ended.attempts).toHaveLength(1);
  });
  it('continues beyond fixed lengths until explicitly ended', () => {
    let state = startPracticeSession({
      ...config,
      sessionLength: 'continuous',
    });
    for (let index = 0; index < 25; index++) state = answer(state, false);
    expect(state.isActive).toBe(true);
    expect(state.session.attempted).toBe(25);
    state = endPracticeSession(state);
    expect(state.isActive).toBe(false);
    expect(state.session.incorrect).toBe(25);
    expect(state.session.completedAt).toBeTruthy();
  });
  it('can end before an answer without inventing an attempt', () => {
    const state = endPracticeSession(startPracticeSession(config));
    expect(state.attempts).toEqual([]);
    expect(state.session.attempted).toBe(0);
    expect(state.isActive).toBe(false);
  });
  it('keeps the recorded answer if preparing the next question fails', () => {
    const initial = startPracticeSession(config);
    vi.spyOn(generator, 'generateNextQuestion').mockImplementation(() => {
      throw new Error('generation failed');
    });
    const next = answer(initial);
    expect(next.session.attempted).toBe(1);
    expect(next.attempts).toHaveLength(1);
    expect(next.currentQuestion).toBeNull();
    expect(next.isActive).toBe(true);
    expect(endPracticeSession(next).session.correct).toBe(1);
  });
  it.each([
    null,
    {},
    { ...config, operations: [] },
    { ...config, operations: ['remainder'] },
    { ...config, difficulty: 5 },
    { ...config, sessionLength: 0 },
    { ...config, mode: 'mistake-review' },
  ])('rejects invalid configuration %#', (value) => {
    expect(isValidConfiguration(value)).toBe(false);
    expect(() => startPracticeSession(value as PracticeConfiguration)).toThrow(
      RangeError,
    );
  });
  it.each(
    (
      [
        'addition',
        'subtraction',
        'multiplication',
        'division',
      ] as MathOperation[]
    ).flatMap((operation) =>
      ([1, 2, 3, 4] as DifficultyLevel[]).map(
        (difficulty) => [operation, difficulty] as const,
      ),
    ),
  )(
    'avoids consecutive %s level %s repeats even with constant randomness',
    (operation, difficulty) => {
      vi.spyOn(Math, 'random').mockReturnValue(0);
      let state = startPracticeSession({
        ...config,
        operations: [operation],
        difficulty,
      });
      for (let index = 0; index < 4; index++) {
        const previous = state.currentQuestion!;
        state = answer(state);
        const next = state.currentQuestion!;
        expect(isValidQuestion(next)).toBe(true);
        expect([
          next.operation,
          next.firstOperand,
          next.secondOperand,
        ]).not.toEqual([
          previous.operation,
          previous.firstOperand,
          previous.secondOperand,
        ]);
      }
    },
  );
});
