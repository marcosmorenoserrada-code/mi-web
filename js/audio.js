// Ambiente sonoro procedural: olas, viento entre palmeras y aves costeras.
let ctx = null, master = null, birdTimer = 0;
function noiseBuffer(c, type) {
  const len = c.sampleRate * 4, b = c.createBuffer(1, len, c.sampleRate), d = b.getChannelData(0);
  let last = 0, b0 = 0, b1 = 0, b2 = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    if (type === 'brown') { last = (last + .02 * w) / 1.02; d[i] = last * 3.5; }
    else { b0 = .99765 * b0 + w * .099; b1 = .963 * b1 + w * .2965; b2 = .57 * b2 + w * 1.0526; d[i] = (b0 + b1 + b2 + w * .1848) * .11; }
  }
  return b;
}
function loopNoise(type, filterType, freq, gain) {
  const src = ctx.createBufferSource(); src.buffer = noiseBuffer(ctx, type); src.loop = true;
  const f = ctx.createBiquadFilter(); f.type = filterType; f.frequency.value = freq;
  const g = ctx.createGain(); g.gain.value = gain;
  src.connect(f).connect(g).connect(master); src.start();
  return { g, f };
}
function lfo(param, rate, depth, base) {
  const o = ctx.createOscillator(), og = ctx.createGain(); o.frequency.value = rate; og.gain.value = depth;
  param.value = base; o.connect(og).connect(param); o.start();
}
function chirp() {
  if (!ctx) return;
  const t = ctx.currentTime, n = 2 + Math.floor(Math.random() * 3), base = 2400 + Math.random() * 1600;
  for (let i = 0; i < n; i++) {
    const o = ctx.createOscillator(), g = ctx.createGain(), s = t + i * .13;
    o.type = 'sine'; o.frequency.setValueAtTime(base, s); o.frequency.exponentialRampToValueAtTime(base * (1.3 + Math.random() * .4), s + .07);
    g.gain.setValueAtTime(0, s); g.gain.linearRampToValueAtTime(.025, s + .02); g.gain.exponentialRampToValueAtTime(.0001, s + .11);
    o.connect(g).connect(master); o.start(s); o.stop(s + .13);
  }
  birdTimer = setTimeout(chirp, 3000 + Math.random() * 7000);
}
export function startAudio() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
    const waves = loopNoise('brown', 'lowpass', 520, .55); lfo(waves.g.gain, .11, .32, .45);
    const surf = loopNoise('pink', 'bandpass', 900, .05); lfo(surf.g.gain, .11, .04, .05);
    const windN = loopNoise('pink', 'bandpass', 380, .05); lfo(windN.f.frequency, .05, 160, 420);
  }
  ctx.resume(); master.gain.cancelScheduledValues(ctx.currentTime); master.gain.linearRampToValueAtTime(.7, ctx.currentTime + 1.5);
  clearTimeout(birdTimer); birdTimer = setTimeout(chirp, 1200);
}
export function stopAudio() {
  if (!ctx) return; clearTimeout(birdTimer);
  master.gain.cancelScheduledValues(ctx.currentTime); master.gain.linearRampToValueAtTime(0, ctx.currentTime + .8);
}
