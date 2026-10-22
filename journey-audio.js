/* Original synthesized landscape sound design; these are NOT field recordings.
 * No assets, dependencies, requests, autoplay, timers, or animation frames.
 * Call enable() directly from the sound-button gesture and await its boolean.
 * Scenes: 0 ferry/water, 1 falls/water, 2 pine/dusk, 3 Hanshan Temple/night.
 * The temple scene adds a distant bell and a soft nonverbal vowel/drone texture.
 * It contains no words, scripture, human voice, or claim of an authentic chant.
 * Effects: 'ripple', 'egret' (flutter + stylized croak), 'temple', 'bell'.
 * mute() and suspend() both revoke playback, including pending enable requests.
 * Returning from a hidden page or an encounter requires a NEW enable gesture.
 * The caller owns button state; read enabled after every lifecycle transition.
 */
(() => {
  'use strict';
  const MASTER_LEVEL = .21;
  const MAX_EFFECTS = 3;
  const SCENES = [
    { wind: .25, water: .21, falls: 0, temple: 0, chant: 0 },
    { wind: .18, water: .13, falls: .26, temple: 0, chant: 0 },
    { wind: .31, water: .065, falls: 0, temple: 0, chant: 0 },
    { wind: .17, water: .08, falls: 0, temple: .15, chant: .11 }
  ];
  const EFFECTS = {
    ripple: { duration: 1.15, level: .30, cooldown: .30 },
    egret: { duration: 1.5, level: .30, cooldown: 1.25 },
    temple: { duration: 5.6, level: .20, cooldown: 4 },
    bell: { duration: 7.7, level: .23, cooldown: 5 }
  };
  let graph = null, desired = false, active = false, revision = 0, scene = 0;
  const voices = new Set();
  const pendingEnables = new Set();
  const lastEffect = new Map();
  const hidden = () => typeof document !== 'undefined' && document.hidden === true;
  const swallow = promise => { if (promise && typeof promise.catch === 'function') promise.catch(() => {}); };
  const disconnect = node => { try { node.disconnect(); } catch (_) { /* Already released. */ } };
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  function dispose(group) {
    if (!group || group.disposed) return;
    group.disposed = true;
    voices.delete(group);
    for (const source of group.sources) {
      source.onended = null;
      try { source.stop(); } catch (_) { /* Stopped, closed, or never started. */ }
    }
    for (const node of group.nodes) disconnect(node);
  }
  function stopAll(state) {
    for (const voice of Array.from(voices)) dispose(voice);
    if (state) { dispose(state.ambient); state.ambient = null; }
    lastEffect.clear();
  }
  function silence(state) {
    if (!state || !state.master) return;
    try {
      const now = state.context.currentTime;
      state.master.gain.cancelScheduledValues(now);
      state.master.gain.setValueAtTime(0, now);
    } catch (_) { /* Closed contexts cannot produce new sound. */ }
  }
  function suspendContext(state) {
    if (!state || state.context.state === 'closed') return;
    try { swallow(state.context.suspend()); } catch (_) { /* The output is already zero. */ }
  }
  function cancelPendingEnables() {
    for (const pending of pendingEnables) pending.cancel();
    pendingEnables.clear();
  }
  function mute() {
    ++revision;
    desired = false; active = false;
    cancelPendingEnables();
    silence(graph); stopAll(graph); suspendContext(graph);
    if(typeof CustomEvent === 'function') window.dispatchEvent(new CustomEvent('ink-journey-sound',{detail:{enabled:false}}));
  }
  // Suspension never retains permission to restart or resumes automatically.
  function suspend() { mute(); }
  function release(state) {
    if (!state) return;
    silence(state); stopAll(state);
    state.context.onstatechange = null;
    for (const node of state.nodes) disconnect(node);
    if (state.context.state !== 'closed') {
      try { swallow(state.context.close()); } catch (_) { /* An unusable graph stays silent. */ }
    }
  }

  function generator(seed) {
    return () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2147483648 - 1);
  }
  function buffer(state, duration, render) {
    // A bounded synthesis rate keeps even high-rate hardware memory-friendly.
    const sampleRate = Math.min(state.context.sampleRate, 32000);
    const result = state.context.createBuffer(1, Math.ceil(duration * sampleRate), sampleRate);
    render(result.getChannelData(0), sampleRate);
    return result;
  }
  function noiseLoop(state, duration, seed, color) {
    return buffer(state, duration, (data, sampleRate) => {
      const overlap = Math.max(2, Math.round(sampleRate * .18));
      const raw = new Float32Array(data.length + overlap);
      const random = generator(seed);
      // Continuous, sample-rate-correct low-pass noise before Web Audio filters.
      const smoothing = 1 - Math.exp(-2 * Math.PI * color / sampleRate);
      let previous = 0;
      for (let i = 0; i < raw.length; ++i) {
        previous += (random() - previous) * smoothing;
        raw[i] = previous;
      }
      for (let i = 0; i < data.length; ++i) {
        if (i < overlap) {
          const x = i / (overlap - 1), blend = x * x * (3 - 2 * x);
          // The last sample and first sample remain neighboring noise samples.
          data[i] = raw[data.length + i] * (1 - blend) + raw[i] * blend;
        } else data[i] = raw[i];
      }
    });
  }
  function bell(t) {
    if (t <= 0 || t >= 5.5) return 0;
    const attack = Math.min(1, t / .035), tail = Math.min(1, (5.5 - t) / .45);
    return attack * tail * (
      .40 * Math.sin(2 * Math.PI * 196 * t) * Math.exp(-t * .79) +
      .21 * Math.sin(2 * Math.PI * 293.3 * t) * Math.exp(-t * 1.03) +
      .12 * Math.sin(2 * Math.PI * 513.7 * t) * Math.exp(-t * 1.65) +
      .05 * Math.sin(2 * Math.PI * 872.2 * t) * Math.exp(-t * 2.2)
    );
  }
  function templeBell(t) {
    if (t <= 0 || t >= 7.6) return 0;
    const envelope = Math.min(1, t / .045) * Math.min(1, (7.6 - t) / .6);
    return envelope * (
      .38 * Math.sin(2 * Math.PI * 130.8 * t) * Math.exp(-t * .52) +
      .22 * Math.sin(2 * Math.PI * 197.4 * t) * Math.exp(-t * .68) +
      .12 * Math.sin(2 * Math.PI * 351.1 * t) * Math.exp(-t * .91) +
      .065 * Math.sin(2 * Math.PI * 549.7 * t) * Math.exp(-t * 1.6)
    );
  }
  function makeChant(state) {
    return buffer(state, 12.8, (data, sampleRate) => {
      for (let i = 0; i < data.length; ++i) {
        const t = i / sampleRate;
        // Wordless vowel-like harmonic clusters; a synthesized breath/drone,
        // not a sampled person, religious text, or imitation of a real service.
        const breath = Math.sin(Math.PI * t / 12.8) ** 2;
        const sway = .83 + .17 * Math.sin(2 * Math.PI * t / 6.4);
        const a = 2 * Math.PI * 98 * t + .16 * Math.sin(2 * Math.PI * t / 3.2);
        const b = 2 * Math.PI * 98.7 * t + .13 * Math.sin(2 * Math.PI * t / 4.1);
        const vowel = .26 * (Math.sin(a) + .64 * Math.sin(b)) +
          .12 * Math.sin(a * 3) + .075 * Math.sin(b * 4) +
          .06 * Math.sin(a * 7) + .035 * Math.sin(b * 9);
        data[i] = vowel * breath * sway;
      }
    });
  }
  function makeEffect(state, kind) {
    return buffer(state, EFFECTS[kind].duration, (data, sampleRate) => {
      const random = generator(kind === 'egret' ? 0x73ba11 : 0x5a103);
      let phase = 0, softNoise = 0;
      for (let i = 0; i < data.length; ++i) {
        const t = i / sampleRate, n = random();
        softNoise += (n - softNoise) * (1 - Math.exp(-2 * Math.PI * 1900 / sampleRate));
        if (kind === 'temple' || kind === 'bell') { data[i] = kind === 'bell' ? templeBell(t) : bell(t); continue; }
        if (kind === 'ripple') {
          const attack = Math.min(1, t / .012);
          phase += 2 * Math.PI * (175 + 660 * Math.exp(-t * 16)) / sampleRate;
          const drop = Math.sin(phase) * .53 * Math.exp(-t * 8.5);
          const splash = softNoise * .32 * Math.exp(-t * 13);
          const after = t > .16 ? Math.sin(2 * Math.PI * 321 * (t - .16)) * .09 * Math.exp(-(t - .16) * 11) * Math.min(1, (t - .16) / .018) : 0;
          data[i] = (drop + splash + after) * attack * Math.min(1, (1.15 - t) / .1);
          continue;
        }
        // Four soft wing beats; two short, hoarse calls rather than birdsong.
        let flutter = 0;
        for (const start of [0, .14, .30, .49]) {
          const u = (t - start) / .15;
          if (u > 0 && u < 1) flutter += Math.sin(Math.PI * u) ** 2;
        }
        let call = 0;
        for (const start of [.43, .83]) {
          const u = t - start;
          if (u <= 0 || u >= .30) continue;
          const envelope = Math.sin(Math.PI * u / .30) ** 1.4;
          const angle = 2 * Math.PI * (455 * u - 170 * u * u);
          const rough = .63 * Math.sin(angle) + .22 * Math.sin(angle * 2.02) + .15 * softNoise;
          call += rough * envelope * (.72 + .28 * Math.sin(2 * Math.PI * 33 * u));
        }
        data[i] = softNoise * flutter * .34 + call * .36;
      }
    });
  }
  function build() {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return null;
    const context = new Audio({ latencyHint: 'interactive' });
    const state = { context, nodes: [], buffers: {}, effectBuffers: {}, ambient: null, master: null, input: null };
    const own = node => { state.nodes.push(node); return node; };
    try {
      const highpass = own(context.createBiquadFilter());
      highpass.type = 'highpass'; highpass.frequency.value = 65; highpass.Q.value = .55;
      const lowpass = own(context.createBiquadFilter());
      lowpass.type = 'lowpass'; lowpass.frequency.value = 3800; lowpass.Q.value = .55;
      const compressor = own(context.createDynamicsCompressor());
      compressor.threshold.value = -23; compressor.knee.value = 18; compressor.ratio.value = 6;
      compressor.attack.value = .008; compressor.release.value = .24;
      const limiter = own(context.createWaveShaper()), curve = new Float32Array(1025);
      for (let i = 0; i < curve.length; ++i) curve[i] = Math.tanh((i / (curve.length - 1) * 2 - 1) * 1.1);
      limiter.curve = curve; limiter.oversample = '2x';
      const master = own(context.createGain()); master.gain.value = 0;
      state.input = highpass; state.master = master;
      highpass.connect(lowpass); lowpass.connect(compressor); compressor.connect(limiter);
      limiter.connect(master); master.connect(context.destination);
      state.buffers.wind = noiseLoop(state, 6.3, 0x40a11, 680);
      state.buffers.water = noiseLoop(state, 5.7, 0x170a, 4200);
      state.buffers.falls = noiseLoop(state, 7.1, 0x8fa11, 3200);
      state.buffers.temple = buffer(state, 17, (data, rate) => {
        for (let i = 0; i < data.length; ++i) data[i] = templeBell(i / rate - .28);
      });
      state.buffers.chant = makeChant(state);
      context.onstatechange = () => {
        if (graph !== state) return;
        // Browser interruption cannot silently re-enable a previous permission.
        if (active && context.state !== 'running') suspend();
        else if (!desired && context.state === 'running') { silence(state); stopAll(state); suspendContext(state); }
      };
      return state;
    } catch (error) { release(state); throw error; }
  }
  function makeGroup() { return { nodes: [], sources: [], disposed: false }; }
  function own(group, node) { group.nodes.push(node); return node; }
  function source(group, node) { own(group, node); group.sources.push(node); return node; }
  function settle(param, value, now, seconds) {
    if (typeof param.cancelAndHoldAtTime === 'function') param.cancelAndHoldAtTime(now);
    else { const current = param.value; param.cancelScheduledValues(now); param.setValueAtTime(current, now); }
    param.setTargetAtTime(value, now, seconds);
  }
  function mixScene(state, immediate = false) {
    if (!state || !state.ambient) return;
    const levels = SCENES[scene], now = state.context.currentTime;
    for (const [kind, gain] of Object.entries(state.ambient.mix)) {
      if (immediate) gain.gain.setValueAtTime(levels[kind], now);
      else settle(gain.gain, levels[kind], now, .65);
    }
  }
  function startAmbient(state) {
    dispose(state.ambient);
    const group = makeGroup(), context = state.context, now = context.currentTime;
    state.ambient = group; group.mix = {};
    const profiles = {
      wind: { type: 'lowpass', frequency: 630, pan: -.25, rate: .083, depth: .22 },
      water: { type: 'bandpass', frequency: 1050, pan: .14, rate: .19, depth: .17 },
      falls: { type: 'lowpass', frequency: 2100, pan: .31, rate: .12, depth: .08 },
      temple: { type: 'lowpass', frequency: 1500, pan: -.12, rate: 0, depth: 0 },
      chant: { type: 'lowpass', frequency: 1250, pan: .07, rate: 0, depth: 0 }
    };
    for (const [kind, profile] of Object.entries(profiles)) {
      const node = source(group, context.createBufferSource()); node.buffer = state.buffers[kind]; node.loop = true;
      const filter = own(group, context.createBiquadFilter());
      filter.type = profile.type; filter.frequency.value = profile.frequency; filter.Q.value = .55;
      const breath = own(group, context.createGain()); breath.gain.value = profile.rate ? .74 : 1;
      const mix = own(group, context.createGain()); mix.gain.value = 0; group.mix[kind] = mix;
      node.connect(filter); filter.connect(breath); breath.connect(mix);
      if (typeof context.createStereoPanner === 'function') {
        const pan = own(group, context.createStereoPanner()); pan.pan.value = profile.pan;
        mix.connect(pan); pan.connect(state.input);
      } else mix.connect(state.input);
      if (profile.rate) {
        const drift = source(group, context.createOscillator()), amount = own(group, context.createGain());
        drift.type = 'sine'; drift.frequency.value = profile.rate; amount.gain.value = profile.depth;
        drift.connect(amount); amount.connect(breath.gain);
      }
    }
    mixScene(state, true);
    for (const node of group.sources) node.start(now);
  }
  async function enable() {
    if (hidden()) { suspend(); return false; }
    if (active && graph && graph.context.state === 'running') return true;
    const request = ++revision;
    cancelPendingEnables();
    desired = true;
    let state = graph, ticket = null;
    try {
      if (!state || state.context.state === 'closed') {
        release(state); graph = null;
        state = build(); graph = state;
        if (!state) { if (request === revision) { desired = false; active = false; } return false; }
      }
      const cancelled = new Promise(resolve => { ticket = { cancel: () => resolve(false) }; });
      pendingEnables.add(ticket);
      // resume is invoked synchronously inside the caller's original gesture.
      // Cancel also settles the public enable promise if a browser leaves resume
      // pending; a late browser completion still gets the silence backstop.
      const resumed = Promise.resolve(state.context.resume()).then(() => {
        if (state === graph && !desired) { silence(state); stopAll(state); suspendContext(state); }
        return true;
      });
      if (!await Promise.race([resumed, cancelled])) return false;
      if (request !== revision || state !== graph) {
        // A late completion after mute must not leave a running audio context.
        // Conversely, an older enable must not suspend a newer valid enable.
        if (state === graph && !desired) { silence(state); stopAll(state); suspendContext(state); }
        return false;
      }
      if (!desired || hidden() || state.context.state !== 'running') { mute(); return false; }
      stopAll(state);
      startAmbient(state);
      const now = state.context.currentTime;
      state.master.gain.cancelScheduledValues(now);
      state.master.gain.setValueAtTime(0, now);
      state.master.gain.linearRampToValueAtTime(MASTER_LEVEL, now + .65);
      active = true;
      return true;
    } catch (_) {
      if (request === revision) {
        mute();
        // Discard partial ambient graphs or failed browser implementations.
        if (graph === state) { graph = null; release(state); }
      }
      return false;
    } finally { if (ticket) pendingEnables.delete(ticket); }
  }
  function setScene(index) {
    if (typeof index !== 'number' || !Number.isFinite(index)) return false;
    const next = clamp(Math.trunc(index), 0, SCENES.length - 1);
    if (scene === next) return true;
    scene = next;
    if (active && graph && graph.context.state === 'running') {
      try { mixScene(graph); } catch (_) { mute(); return false; }
    }
    return true;
  }
  function effect(kind) {
    if (typeof kind !== 'string') return false;
    if (hidden()) { suspend(); return false; }
    if (!active || !desired || !graph || graph.context.state !== 'running') return false;
    const aliases = { water: 'ripple', bird: 'egret', flutter: 'egret', pine: 'egret', pavilion: 'temple' };
    kind = aliases[kind] || kind;
    if (!Object.prototype.hasOwnProperty.call(EFFECTS, kind)) return false;
    const profile = EFFECTS[kind], state = graph, now = state.context.currentTime;
    if (now - (lastEffect.get(kind) ?? -Infinity) < profile.cooldown) return false;
    if (voices.size >= MAX_EFFECTS) dispose(voices.values().next().value);
    const voice = makeGroup(); voices.add(voice);
    try {
      if (!state.effectBuffers[kind]) state.effectBuffers[kind] = makeEffect(state, kind);
      const node = source(voice, state.context.createBufferSource()); node.buffer = state.effectBuffers[kind];
      const gain = own(voice, state.context.createGain()); gain.gain.value = profile.level;
      node.connect(gain); gain.connect(state.input);
      node.onended = () => dispose(voice);
      node.start(now); node.stop(now + profile.duration + .02);
      lastEffect.set(kind, now);
      return true;
    } catch (_) { dispose(voice); return false; }
  }
  window.InkJourneyAudio = Object.freeze({
    enable, mute, suspend, setScene, effect,
    get enabled() { return active && desired && !!graph && graph.context.state === 'running' && !hidden(); }
  });
  // Safety backstops only: neither event has a corresponding automatic resume.
  if (typeof document !== 'undefined') document.addEventListener('visibilitychange', () => { if (hidden()) suspend(); });
  window.addEventListener('pagehide', suspend);
})();
