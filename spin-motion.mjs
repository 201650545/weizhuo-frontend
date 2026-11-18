// Pure, clock-independent motion plan. Default: 800ms for EXACTLY two turns,
// then 1200ms for the remaining forward alignment (the requested 1000ms slow return
// plus 200ms to make the complete transition exactly 2000ms). No light/camera mutation.
const TAU = Math.PI * 2;
export function createSpeakerMotion(from, target, duration = 2000, decel = 3, fastMs = 800) {
  if (![from, target, duration, decel].every(Number.isFinite) || duration <= 0 || decel < 2) throw Error('invalid spin plan');
  let alignment = ((target - from) % TAU + TAU) % TAU;
  if (alignment < 1e-10 || TAU - alignment < 1e-10) alignment = 0;
  if (!Number.isFinite(fastMs) || fastMs <= 0 || fastMs >= duration) throw Error('invalid fast phase');
  const settleMs = duration - fastMs, fastTravel = 2 * TAU;
  // Match angular velocity at the join without making the fast phase accelerate.
  // The effective tail exponent stays >1, giving zero speed at the final target.
  const joinSpeed = alignment ? Math.min(fastTravel / fastMs, decel * alignment / settleMs) : 0;
  const settleExponent = alignment ? joinSpeed * settleMs / alignment : decel;
  return { from, to: from + fastTravel + alignment, duration, fastMs, settleMs, fastTravel, alignment, joinSpeed, settleExponent, travel: fastTravel + alignment };
}
export function speakerMotionAt(plan, elapsed) {
  const ms = Math.max(0, Math.min(plan.duration, elapsed));
  if (ms >= plan.duration) return plan.to;
  if (ms <= plan.fastMs) {
    const u = ms / plan.fastMs;
    return plan.from + plan.fastTravel * (2 * u - u * u) + plan.joinSpeed * plan.fastMs * (u * u - u);
  }
  const v = (ms - plan.fastMs) / plan.settleMs;
  return plan.from + plan.fastTravel + plan.alignment * (1 - Math.pow(1 - v, plan.settleExponent));
}
