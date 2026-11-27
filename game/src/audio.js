// Gobble Dash — all sound is synthesized with Web Audio, no files.
// One job: every gobble, whoosh, sizzle and jingle in the game.
export function createAudio() {
  let ctx = null;
  let muted = false;
  let master = null;

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.35;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type = 'sine', vol = 0.5, slideTo = null, delay = 0) {
    if (muted) return;
    const c = ensure();
    if (!c) return;
    const t0 = c.currentTime + delay;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo !== null) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  function noise(dur, vol = 0.4, filterFreq = 1200, delay = 0) {
    if (muted) return;
    const c = ensure();
    if (!c) return;
    const t0 = c.currentTime + delay;
    const len = Math.max(1, Math.floor(c.sampleRate * dur));
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = c.createBufferSource();
    src.buffer = buf;
    const filter = c.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterFreq;
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(master);
    src.start(t0);
  }

  return {
    unlock() { ensure(); },
    toggleMute() { muted = !muted; return muted; },
    isMuted() { return muted; },
    // The turkey's signature sound: two quick low gobbles.
    gobble() {
      tone(180, 0.09, 'sawtooth', 0.35, 120);
      tone(150, 0.09, 'sawtooth', 0.35, 100, 0.1);
      tone(200, 0.07, 'sawtooth', 0.3, 140, 0.2);
    },
    jump() { tone(320, 0.14, 'sine', 0.4, 640); },
    doubleJump() { tone(420, 0.12, 'sine', 0.35, 820); },
    dash() { noise(0.18, 0.3, 2400); },
    corn() { tone(880, 0.08, 'triangle', 0.45, 1320); },
    pie() { tone(523, 0.1, 'triangle', 0.45); tone(659, 0.1, 'triangle', 0.45, null, 0.09); tone(784, 0.16, 'triangle', 0.45, null, 0.18); },
    hurt() { tone(220, 0.25, 'sawtooth', 0.5, 60); noise(0.2, 0.35, 500); },
    knifeWhoosh() { noise(0.22, 0.4, 3200); },
    knifeThud() { tone(90, 0.12, 'square', 0.4, 50); noise(0.1, 0.3, 300); },
    ovenSizzle() { noise(0.5, 0.25, 5200); },
    spotted() { tone(1100, 0.09, 'square', 0.35, 1100); tone(1100, 0.09, 'square', 0.35, 1100, 0.12); },
    caught() {
      tone(392, 0.18, 'sawtooth', 0.4);
      tone(370, 0.18, 'sawtooth', 0.4, null, 0.18);
      tone(349, 0.18, 'sawtooth', 0.4, null, 0.36);
      tone(311, 0.5, 'sawtooth', 0.45, null, 0.54);
    },
    stageClear() {
      [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.14, 'triangle', 0.4, null, i * 0.09));
    },
    escaped() {
      [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tone(f, 0.18, 'triangle', 0.42, null, i * 0.11));
    },
    hide() { tone(500, 0.12, 'sine', 0.25, 260); },
  };
}
