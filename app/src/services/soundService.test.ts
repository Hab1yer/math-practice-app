import { afterEach, describe, expect, it, vi } from 'vitest';
import { playAnswerSound } from './soundService';

afterEach(() => vi.unstubAllGlobals());
describe('optional answer sounds', () => {
  it('does nothing when audio support is missing', () => {
    vi.stubGlobal('AudioContext', undefined);
    expect(() => playAnswerSound(true)).not.toThrow();
  });
  it.each([
    [true, 660],
    [false, 330],
  ])(
    'schedules a quiet tone and releases audio resources for result %s',
    async (correct, frequency) => {
      const oscillator = {
        type: '',
        frequency: { value: 0 },
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
        onended: null as null | (() => void),
      };
      const gain = {
        gain: {
          setValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn(),
        },
        connect: vi.fn(),
      };
      const close = vi.fn().mockResolvedValue(undefined);
      class FakeAudioContext {
        currentTime = 1;
        destination = {};
        resume = () => Promise.resolve();
        createOscillator = () => oscillator;
        createGain = () => gain;
        close = close;
      }
      vi.stubGlobal('AudioContext', FakeAudioContext);
      playAnswerSound(correct);
      await Promise.resolve();
      expect(oscillator.frequency.value).toBe(frequency);
      expect(gain.gain.setValueAtTime).toHaveBeenCalledWith(0.035, 1);
      expect(oscillator.stop).toHaveBeenCalledWith(1.13);
      oscillator.onended?.();
      expect(close).toHaveBeenCalledOnce();
    },
  );
  it('handles denied audio without rejecting the answer interaction', async () => {
    const close = vi.fn().mockResolvedValue(undefined);
    class DeniedAudioContext {
      resume = () => Promise.reject(new Error('Denied'));
      close = close;
    }
    vi.stubGlobal('AudioContext', DeniedAudioContext);
    playAnswerSound(false);
    await Promise.resolve();
    await Promise.resolve();
    expect(close).toHaveBeenCalledOnce();
  });
});
