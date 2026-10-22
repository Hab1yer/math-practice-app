/// <reference types="node" />
import { describe, expect, it } from 'vitest';
import { createStorageService, STORAGE_KEYS } from './storageService';
import { calculateStatistics } from './statisticsService';
import { reviewMiss } from '../test/reviewFixtures';
import type { PracticeSessionState } from '../types/session';
import { mkdirSync, writeFileSync } from 'node:fs';

describe('large practice histories', () => {
  it('preserves every answer and aggregate across a 5,000-attempt round trip', () => {
    const attempts = Array.from({ length: 5000 }, (_, index) =>
      reviewMiss({
        id: `scale-${index}`,
        questionId: `question-${index}`,
        selfReportedCorrect: index % 4 !== 0,
      }),
    );
    const state: PracticeSessionState = {
      session: {
        id: 'seed-session',
        mode: 'regular',
        startedAt: '2026-10-22T09:00:00.000Z',
        completedAt: '2026-10-22T10:00:00.000Z',
        operations: ['addition'],
        difficulty: 1,
        sessionLength: 'continuous',
        attempted: 5000,
        correct: 3750,
        incorrect: 1250,
      },
      attempts,
      currentQuestion: null,
      currentQuestionIndex: 5000,
      isActive: false,
    };
    const start = performance.now();
    const store = createStorageService();
    store.saveSession(state);
    const loaded = createStorageService();
    const elapsedMs = performance.now() - start;
    expect(loaded.getHistory().attempts).toHaveLength(5000);
    expect(calculateStatistics(loaded.getHistory().attempts)).toMatchObject({
      attempted: 5000,
      correct: 3750,
      incorrect: 1250,
    });
    expect(loaded.getMistakePatterns()[0].incorrectCount).toBe(1250);
    expect(loaded.getRecentSessions(10)).toHaveLength(1);
    const utf16Bytes = localStorage.getItem(STORAGE_KEYS.history)!.length * 2;
    expect(utf16Bytes).toBeLessThan(5 * 1024 * 1024);
    console.info(
      JSON.stringify({
        benchmark: '5000-attempt round trip',
        elapsedMs: Math.round(elapsedMs),
        utf16Bytes,
      }),
    );
    mkdirSync('.local', { recursive: true });
    writeFileSync(
      '.local/history-benchmark.json',
      JSON.stringify(
        { attempts: 5000, elapsedMs: Math.round(elapsedMs), utf16Bytes },
        null,
        2,
      ),
    );
  });
});
