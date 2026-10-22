/* Original, locally synthesized tiger-like growl and air swish.
 * No assets, dependencies, network, listeners, or automatic playback.
 * InkTigerAudio.enable() must be called from the user's sound-button gesture.
 * The encounter owns lifecycle: call mute() on hide/close, stop() to cut a roar.
 * Synthetic sound design, not a recording or a biologically exact tiger call.
 */
(() => {
  'use strict';
  const DURATION = 2.35;
  const MAX_VOICES = 2;
  const MASTER_LEVEL = .29;
  let context = null, master = null, input = null, buffers = null;
  let permitted = false, destroyed = false, revision = 0, lastRoar = -Infinity;
  const graph = [];
  const voices = new Set();
  const hidden = () => typeof document !== 'undefined' && document.hidden === true;
  const swallow = value => {
    if (value && typeof value.catch === 'function') value.catch(() => {});
  };
  function suspend() {
    if (!context || context.state === 'closed') return;
    try { swallow(context.suspend()); } catch (_) { /* A closing context is silent. */ }
  }
  function disconnect(node) {
    try { node.disconnect(); } catch (_) { /* Already disconnected. */ }
  }
  function removeVoice(voice) {
    if (voice.disposed) return;
    voice.disposed = true;
    voices.delete(voice);
    for (const source of voice.sources) {
      source.onended = null;
      try { source.stop(); } catch (_) { /* Already stopped or never started. */ }
    }
    for (const node of voice.nodes) disconnect(node);
  }
  function stop() {
    for (const voice of Array.from(voices)) removeVoice(voice);
    lastRoar = -Infinity;
  }
  function silence() {
    if (!master || !context) return;
    try {
      master.gain.cancelScheduledValues(context.currentTime);
      master.gain.setValueAtTime(0, context.currentTime);
    } catch (_) { /* Context may have closed independently. */ }
  }
  function mute() {
    ++revision;
    permitted = false;
    silence();
    stop();
    suspend();
  }

  function makeBuffers(ctx) {
    const count = Math.ceil(ctx.sampleRate * DURATION);
    const result = Array.from({ length: 3 }, () => ctx.createBuffer(1, count, ctx.sampleRate));
    const [vocal, breath, swish] = result.map(buffer => buffer.getChannelData(0));
    let seed = 0x51c0a7, phase = 0, cycle = 0, rumble = 0, jitter = 0;
    const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2147483648 - 1);
    const tau = 2 * Math.PI;
    for (let i = 0; i < count; ++i) {
      const t = i / ctx.sampleRate;
      const n = random();
      // Slow irregularity and alternating glottal cycles supply chesty roughness.
      jitter += (n - jitter) * .0018;
      const f = 61 - 21 * Math.min(t / 1.9, 1) + 2.9 * Math.sin(tau * 4.1 * t) + jitter * 24;
      phase += f / ctx.sampleRate;
      if (phase >= 1) { phase -= 1; ++cycle; }
      const pulse = phase < .39
        ? Math.pow(Math.sin(Math.PI * phase / .39), 1.5)
        : phase < .65 ? -.72 * Math.sin(Math.PI * (phase - .39) / .26) : 0;
      const attack = Math.min(t / .13, 1);
      const release = Math.pow(Math.max(0, 1 - t / DURATION), .65);
      const swell = .7 + .3 * Math.pow(Math.sin(tau * 1.5 * t + .4), 2);
      const rasp = .76 + .24 * Math.sin(tau * 26 * t + .8 * Math.sin(tau * 3.7 * t));
      const envelope = attack * release * swell;
      rumble = .985 * rumble + n * .015;
      vocal[i] = (pulse * (cycle % 2 ? .64 : 1) * rasp + rumble * .9) * envelope * .9;
      // Unpitched throat turbulence shares the vocal envelope, then exhales.
      breath[i] = n * envelope * (.38 + .27 * Math.min(t, 1));
      const airTime = t - .05;
      const air = airTime > 0 && airTime < .68 ? Math.pow(Math.sin(Math.PI * airTime / .68), 2) : 0;
      swish[i] = random() * air * .43;
    }
    return result;
  }

  function build() {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return false;
    context = new Audio({ latencyHint: 'interactive' });
    input = context.createBiquadFilter();
    input.type = 'highpass'; input.frequency.value = 29; input.Q.value = .5;
    graph.push(input);
    const lowpass = context.createBiquadFilter();
    lowpass.type = 'lowpass'; lowpass.frequency.value = 2600; lowpass.Q.value = .45;
    graph.push(lowpass);
    const compressor = context.createDynamicsCompressor();
    compressor.threshold.value = -17; compressor.knee.value = 16;
    compressor.ratio.value = 5; compressor.attack.value = .009; compressor.release.value = .18;
    graph.push(compressor);
    // Soft saturation bounds the signal before the conservative output gain.
    const limiter = context.createWaveShaper();
    const curve = new Float32Array(2049);
    for (let i = 0; i < curve.length; ++i) curve[i] = Math.tanh((i / (curve.length - 1) * 2 - 1) * 1.4);
    limiter.curve = curve; limiter.oversample = '2x';
    graph.push(limiter);
    master = context.createGain(); master.gain.value = 0;
    graph.push(master);
    input.connect(lowpass); lowpass.connect(compressor); compressor.connect(limiter);
    limiter.connect(master); master.connect(context.destination);
    buffers = makeBuffers(context);
    return true;
  }

  async function enable() {
    if (destroyed || hidden()) return false;
    const request = ++revision;
    permitted = true;
    try {
      if (!context || context.state === 'closed') {
        // A closed context cannot be resumed; release its old graph first.
        stop();
        for (const node of graph.splice(0)) disconnect(node);
        context = null; master = null; input = null; buffers = null;
        if (!build()) { permitted = false; return false; }
      }
      // Invoke synchronously in the click gesture, before the first await.
      await context.resume();
      if (request !== revision || !permitted || destroyed || hidden() || context.state !== 'running') {
        if (request === revision || !permitted || destroyed) {
          permitted = false; silence(); stop(); suspend();
        }
        return false;
      }
      master.gain.cancelScheduledValues(context.currentTime);
      master.gain.setValueAtTime(MASTER_LEVEL, context.currentTime);
      return true;
    } catch (_) {
      if (request === revision) {
        permitted = false; silence(); stop(); suspend();
        // A partial graph must never be reused as a successfully enabled one.
        if (!buffers) {
          for (const node of graph.splice(0)) disconnect(node);
          const failed = context;
          context = null; master = null; input = null;
          if (failed && failed.state !== 'closed') {
            try { swallow(failed.close()); } catch (_) { /* Failed construction. */ }
          }
        }
      }
      return false;
    }
  }

  function roar(strength = 1) {
    if (hidden()) { mute(); return false; }
    if (!permitted || destroyed || !context || context.state !== 'running' || !buffers) return false;
    strength = typeof strength === 'number' && Number.isFinite(strength)
      ? Math.max(0, Math.min(strength, 1)) : 1;
    if (strength === 0) return false;
    const now = context.currentTime;
    if (now - lastRoar < .3) return false;
    lastRoar = now;
    if (voices.size >= MAX_VOICES) removeVoice(voices.values().next().value);
    const voice = { sources: [], nodes: [], disposed: false, ended: 0 };
    voices.add(voice);
    try {
      const own = node => { voice.nodes.push(node); return node; };
      const gain = value => { const node = own(context.createGain()); node.gain.value = value; return node; };
      const filter = (type, frequency, q = .7) => {
        const node = own(context.createBiquadFilter());
        node.type = type; node.frequency.value = frequency; node.Q.value = q; return node;
      };
      const output = gain(.56 * strength);
      output.connect(input);
      const rate = .95 + Math.random() * .1;
      const source = index => {
        const node = own(context.createBufferSource());
        node.buffer = buffers[index]; node.playbackRate.value = rate;
        voice.sources.push(node);
        node.onended = () => {
          if (++voice.ended === voice.sources.length) removeVoice(voice);
        };
        return node;
      };
      const vocal = source(0);
      const chest = filter('lowpass', 380, .8), chestGain = gain(.92);
      vocal.connect(chest); chest.connect(chestGain); chestGain.connect(output);
      // Broad vocal-tract resonances keep the result animal-like rather than tonal.
      const throat = filter('bandpass', 470, 1.15), throatGain = gain(.65);
      vocal.connect(throat); throat.connect(throatGain); throatGain.connect(output);
      const snarl = filter('bandpass', 970, 1.1), snarlGain = gain(.23);
      vocal.connect(snarl); snarl.connect(snarlGain); snarlGain.connect(output);
      const breath = source(1), breathHP = filter('highpass', 160), breathLP = filter('lowpass', 1500), breathGain = gain(.59);
      breath.connect(breathHP); breathHP.connect(breathLP); breathLP.connect(breathGain); breathGain.connect(output);
      const air = source(2), airFilter = filter('bandpass', 1100, .65), airGain = gain(.48);
      airFilter.frequency.setValueAtTime(1500, now);
      airFilter.frequency.exponentialRampToValueAtTime(460, now + .7);
      air.connect(airFilter); airFilter.connect(airGain); airGain.connect(output);
      // The source buffers include smooth attacks/releases and are never looped.
      // Explicit stop bounds lifetime even if a browser delays its ended event.
      for (const node of voice.sources) {
        node.start(now);
        node.stop(now + DURATION / rate + .02);
      }
      return true;
    } catch (_) {
      removeVoice(voice);
      return false;
    }
  }

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    mute();
    for (const node of graph.splice(0)) disconnect(node);
    const old = context;
    context = null; input = null; master = null; buffers = null;
    if (old && old.state !== 'closed') {
      try { swallow(old.close()); } catch (_) { /* Already closed. */ }
    }
  }

  window.InkTigerAudio = Object.freeze({
    enable, mute, roar, stop, destroy,
    get enabled() { return !destroyed && permitted && !!context && context.state === 'running' && !hidden(); }
  });
})();
