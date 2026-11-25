// Saffron Hour — Rooftop Kitchen: tiny WebAudio synth. No audio files: every
// sound is an oscillator or a noise burst shaped in code, created lazily on
// the first user gesture so the browser allows it.

let ctx = null;
let muted = false;

function ensureContext() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  return ctx;
}

export function unlockAudio() {
  const ac = ensureContext();
  if (ac && ac.state === 'suspended') ac.resume();
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

export function isMuted() {
  return muted;
}

function tone(freq, dur, type = 'sine', gain = 0.12, when = 0, slideTo = null) {
  if (muted) return;
  const ac = ensureContext();
  if (!ac) return;
  const t0 = ac.currentTime + when;
  const osc = ac.createOscillator();
  const amp = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  amp.gain.setValueAtTime(gain, t0);
  amp.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.connect(amp).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

function noiseBurst(dur, gain = 0.08, when = 0, highpass = 1200) {
  if (muted) return;
  const ac = ensureContext();
  if (!ac) return;
  const t0 = ac.currentTime + when;
  const len = Math.max(1, Math.floor(ac.sampleRate * dur));
  const buffer = ac.createBuffer(1, len, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ac.createBufferSource();
  src.buffer = buffer;
  const filter = ac.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = highpass;
  const amp = ac.createGain();
  amp.gain.value = gain;
  src.connect(filter).connect(amp).connect(ac.destination);
  src.start(t0);
}

export const sfx = {
  pickup() { tone(520, 0.07, 'triangle', 0.08); },
  chop() { noiseBurst(0.06, 0.16, 0, 500); tone(180, 0.05, 'square', 0.05); },
  sizzle() { noiseBurst(0.25, 0.05, 0, 2500); },
  flip() { tone(300, 0.09, 'sine', 0.08, 0, 620); },
  pour() { noiseBurst(0.3, 0.06, 0, 900); tone(700, 0.2, 'sine', 0.04, 0, 950); },
  ding() { tone(1180, 0.35, 'sine', 0.12); tone(1560, 0.3, 'sine', 0.06, 0.02); },
  coin() { tone(940, 0.08, 'square', 0.07); tone(1320, 0.16, 'square', 0.07, 0.07); },
  serve() { tone(660, 0.1, 'triangle', 0.1); tone(880, 0.12, 'triangle', 0.1, 0.08); sfx.coin(); },
  error() { tone(200, 0.16, 'sawtooth', 0.07, 0, 140); },
  lost() { tone(420, 0.3, 'triangle', 0.09, 0, 190); },
  bell() { tone(1560, 0.5, 'sine', 0.1); },
  star() { [660, 830, 990, 1320].forEach((f, i) => tone(f, 0.18, 'triangle', 0.09, i * 0.09)); },
};
