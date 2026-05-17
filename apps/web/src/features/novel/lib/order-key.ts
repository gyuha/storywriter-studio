const INITIAL_GAP = 1000;
const MIN_GAP = 0.001;

// Calculates a new order_key for the item at targetIndex after an arrayMove
export function calcOrderKey(
  reordered: { order_key: number }[],
  targetIndex: number
): number {
  const prev = reordered[targetIndex - 1]?.order_key;
  const next = reordered[targetIndex + 1]?.order_key;
  if (prev === undefined && next === undefined) return INITIAL_GAP;
  if (prev === undefined) return next! - INITIAL_GAP;
  if (next === undefined) return prev + INITIAL_GAP;
  return (prev + next) / 2;
}

// Returns true when adjacent order_keys are too close (needs reindex)
export function needsReindex(chapters: { order_key: number }[]): boolean {
  for (let i = 0; i < chapters.length - 1; i++) {
    if (chapters[i + 1].order_key - chapters[i].order_key < MIN_GAP) return true;
  }
  return false;
}
