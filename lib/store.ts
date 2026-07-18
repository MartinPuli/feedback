import { type FeedbackSignal } from '@/lib/data';

const memory: FeedbackSignal[] = [];
const MAX = 1000;

export function saveSignal(signal: FeedbackSignal) {
  memory.unshift(signal);
  if (memory.length > MAX) memory.pop();
}

export function getSignals(): FeedbackSignal[] {
  return [...memory];
}

export function clearSignals() {
  memory.length = 0;
}
