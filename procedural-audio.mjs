// Procedural ambience: every sound is synthesised at runtime. No audio files, no recordings.
// Nothing plays until the player starts it, and no cue is linked to a culprit or an answer.
let ctx = null;
let master = null;
let nodes = [];
let pulseTimer = null;
let started = false;
let muted = false;

// Deterministic noise so the same page sounds the same on every load.
function noiseBuffer(audio, seconds = 2) {
  const length = Math.floor(audio.sampleRate * seconds);
  const buffer = audio.createBuffer(1, length, audio.sampleRate);
  const data = buffer.getChannelData(0);
  let seed = 19981106;
  const random = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 1073741824 - 1;
  };
  let last = 0;
  for (let i = 0; i < length; i += 1) {
    // Brown-ish noise reads as distant factory wind rather than a hiss.
    last = (last + 0.02 * random()) / 1.02;
    data[i] = last * 3.2;
  }
  return buffer;
}

export function audioState() {
  return { started, muted, running: !!ctx && ctx.state === 'running', state: ctx ? ctx.state : 'idle' };
}

export function startAudio() {
  if (started) return audioState();
  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtor) return audioState();
  ctx = new AudioCtor();
  master = ctx.createGain();
  master.gain.value = muted ? 0 : 0.5;
  master.connect(ctx.destination);

  // Layer one: low wind bed.
  const wind = ctx.createBufferSource();
  wind.buffer = noiseBuffer(ctx, 3);
  wind.loop = true;
  const windFilter = ctx.createBiquadFilter();
  windFilter.type = 'lowpass';
  windFilter.frequency.value = 420;
  const windGain = ctx.createGain();
  windGain.gain.value = 0.16;
  const sweep = ctx.createOscillator();
  sweep.frequency.value = 0.07;
  const sweepGain = ctx.createGain();
  sweepGain.gain.value = 0.05;
  sweep.connect(sweepGain).connect(windGain.gain);
  wind.connect(windFilter).connect(windGain).connect(master);

  // Layer two: sparse mechanical pulses, deliberately uneven like an old works.
  const pulse = () => {
    if (!ctx || ctx.state !== 'running') return;
    const at = ctx.currentTime + 0.05;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = 92;
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(0.09, at + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.42);
    osc.connect(gain).connect(master);
    osc.start(at);
    osc.stop(at + 0.5);
    pulseTimer = setTimeout(pulse, 2400 + Math.random() * 3600);
  };

  wind.start();
  sweep.start();
  nodes = [wind, sweep, windFilter, windGain, sweepGain];
  started = true;
  if (ctx.state === 'suspended' && ctx.resume) ctx.resume().catch(() => {});
  pulse();
  return audioState();
}

export function stopAudio() {
  if (pulseTimer) clearTimeout(pulseTimer);
  pulseTimer = null;
  for (const node of nodes) {
    try { if (node.stop) node.stop(); } catch (error) { /* already stopped */ }
    try { if (node.disconnect) node.disconnect(); } catch (error) { /* already detached */ }
  }
  nodes = [];
  if (ctx && ctx.close) ctx.close().catch(() => {});
  ctx = null;
  master = null;
  started = false;
  return audioState();
}

export function setMuted(next) {
  muted = !!next;
  if (master) master.gain.value = muted ? 0 : 0.5;
  return audioState();
}

// The story whistle is a narrative cue only; it never signals a correct answer.
export function playWhistle() {
  if (!ctx || ctx.state !== 'running' || muted) return audioState();
  const at = ctx.currentTime + 0.02;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(310, at);
  osc.frequency.linearRampToValueAtTime(232, at + 1.6);
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(0.12, at + 0.25);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + 2.1);
  osc.connect(gain).connect(master);
  osc.start(at);
  osc.stop(at + 2.2);
  return audioState();
}
