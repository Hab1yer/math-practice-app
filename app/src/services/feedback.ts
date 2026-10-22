const correctMessages = [
  'Nice work. Keep going!',
  'You’ve got this!',
  'Another step forward.',
];
const wrongMessages = [
  'This is a chance to learn. Try the next one.',
  'Keep practicing. You can come back to this fact.',
  'Take your time. Every try helps.',
];
export function answerFeedback(correct: boolean): string {
  const messages = correct ? correctMessages : wrongMessages;
  const random = Math.random();
  return messages[
    Number.isFinite(random) && random >= 0 && random < 1
      ? Math.floor(random * messages.length)
      : 0
  ];
}
