// Geometry for the standalone prototype; dimensions are in metres.
export function seatLayout(count, { width = 1, depth = 1, spacing = 1, groups = [] } = {}) {
  if (!Number.isInteger(count) || count < 4 || count > 8 || ![width, depth, spacing].every(Number.isFinite) || width < .8 || width > 1.2 || depth < .8 || depth > 1.2 || spacing < .9 || spacing > 1.15 || !Array.isArray(groups)) throw Error('invalid layout');
  const assigned = new Set();
  for (const group of groups) {
    if (!Array.isArray(group) || group.length < 2 || group.length > count) throw Error('invalid group');
    for (const i of group) { if (!Number.isInteger(i) || i < 0 || i >= count || assigned.has(i)) throw Error('invalid group member'); assigned.add(i); }
  }
  // Neighbouring members in a group share successive places around the table.
  const order = []; for (const group of groups) order.push(...group); for (let i = 0; i < count; i++) if (!assigned.has(i)) order.push(i);
  const slots = Array(count);
  order.forEach((index, position) => { const angle = 2 * Math.PI * position / count; slots[index] = { angle, x: -Math.sin(angle) * 1.78 * width * spacing, z: Math.cos(angle) * 1.78 * depth * spacing }; });
  return slots;
}
