/** Quiet, opt-in tones triggered only by a user reporting an answer. */
export function playAnswerSound(correct: boolean) {
  if (typeof window.AudioContext !== 'function') return;
  try {
    const context = new window.AudioContext();
    const close = () => {
      void context.close().catch(() => {});
    };
    void context
      .resume()
      .then(() => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.value = correct ? 660 : 330;
        gain.gain.setValueAtTime(0.035, context.currentTime);
        gain.gain.exponentialRampToValueAtTime(
          0.0001,
          context.currentTime + 0.12,
        );
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.onended = close;
        oscillator.start();
        oscillator.stop(context.currentTime + 0.13);
      })
      .catch(close);
  } catch {
    /* Audio support/permission never blocks practice. */
  }
}
