/* Image-based encounter, explicit action phases and cancellable input. Offline. */
'use strict';
(() => {
  const $ = id => document.getElementById(id), dialog = $('tiger-dialog'), canvas = $('tiger-cinema'), c = canvas.getContext('2d');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const actions = Object.freeze({
    roar: { anticipation: .48, action: 1.45, recovery: .85, title: '一啸入云', preparing: '它收住呼吸，喉间渐起低鸣。', caption: '轻唤有应，虎啸穿过层山。', strength: .8 },
    swipe: { anticipation: .38, action: .82, recovery: .8, title: '探爪生风', preparing: '前爪微收，山风忽然屏息。', caption: '一爪拂过，墨风斜掠眼前。', strength: .42 },
    lunge: { anticipation: .66, action: 1, recovery: 1.1, title: '山君扑近', preparing: '它沉肩蓄势，目光仍在你身上。', caption: '虎影扑近，落墨有声。', strength: 1 }
  });
  const actionButtons = [[$('encounter-roar'), 'roar'], [$('encounter-swipe'), 'swipe'], [$('encounter-strike'), 'lunge']];
  const zoneButtons = [[$('encounter-face-zone'), 'roar'], [$('encounter-paw-zone'), 'swipe']];
  let active = false, paused = false, hidden = false, raf = 0, last = 0, time = 0, phase = 'approach', action = null, phaseTime = 0;
  let previousFocus = null, backdrop = null, width = 1200, height = 800, revision = 0, pointer = null;
  let attention = { x: 0, y: 0 }, attentionTarget = { x: 0, y: 0 }, completed = { roar: 0, swipe: 0, lunge: 0 };
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const smooth = v => { v = clamp(v); return v * v * (3 - 2 * v); };
  const canInteract = () => active && !paused && !hidden && phase === 'idle';
  const sceneOptions = () => ({ time: reduced.matches ? 0 : time, phase, action, phaseTime, reduced: reduced.matches, attention });
  function getState() { return { active, paused, hidden, phase, action, phaseTime, canInteract: canInteract(), attention: { ...attention }, completed: { ...completed }, zones: window.InkTigerScene?.zones(width, height, sceneOptions()) || [] }; }
  function emitState() { window.dispatchEvent(new CustomEvent('ink-encounter-state', { detail: getState() })); }
  function updateControls() {
    const available = canInteract();
    for (const [button, kind] of [...actionButtons, ...zoneButtons]) {
      button.disabled = !available;
      button.setAttribute('aria-pressed', String(action === kind && phase !== 'idle'));
    }
    dialog.dataset.phase = phase; dialog.dataset.action = action || ''; dialog.dataset.paused = String(paused);
    $('encounter-pause').textContent = paused ? '继续' : '静观';
    $('encounter-pause').setAttribute('aria-pressed', String(paused));
    $('encounter-state').textContent = paused ? '已静观 · 继续后再互动' : phase === 'idle' ? '移近相望 · 轻触面庞或前爪' : phase === 'approach' ? '山君将至' : phase === 'anticipation' ? '蓄势 · 等它回应' : phase === 'action' ? actions[action].title : '收势 · 待风静';
  }
  function setPhase(next) {
    phase = next; phaseTime = 0;
    if (next === 'idle') action = null;
    const title = next === 'approach' ? '山君近前' : next === 'idle' ? '与山君相逢' : next === 'recovery' ? '余威未散' : actions[action].title;
    const caption = next === 'approach' ? '山风止息，林间有影。' : next === 'idle' ? '移近相望，轻唤有应。\n也可试探前爪，或邀它扑近。' : next === 'anticipation' ? actions[action].preparing : next === 'recovery' ? '它缓缓收势。待风静，再试一式。' : actions[action].caption;
    $('encounter-title').textContent = title; $('encounter-caption').textContent = caption;
    updateControls(); emitState();
  }
  function emit(open) { window.dispatchEvent(new CustomEvent('ink-encounter', { detail: { open } })); }
  function resize() { const r = canvas.getBoundingClientRect(); width = r.width || 1200; height = r.height || 800; const dpr = Math.min(window.devicePixelRatio || 1, 1.5); canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr); render(); }
  function mountain(ctx, w, h) {
    ctx.fillStyle = '#d9d9c8'; ctx.fillRect(0, 0, w, h);
    if (backdrop) { ctx.save(); ctx.globalAlpha = .4; ctx.drawImage(backdrop, 0, 0, w, h); ctx.restore(); }
    for (let layer = 0; layer < 3; layer++) {
      ctx.beginPath(); ctx.moveTo(0, h);
      for (let i = 0; i <= 24; i++) { const x = i / 24 * w, y = h * (.2 + layer * .13) + Math.sin(i * 1.73 + layer * 2) * h * .075 + Math.sin(i * .54) * h * .06; ctx.lineTo(x, y); }
      ctx.lineTo(w, h); ctx.closePath(); ctx.fillStyle = ['rgba(53,65,52,.04)', 'rgba(45,57,43,.06)', 'rgba(38,49,36,.08)'][layer]; ctx.fill();
    }
    const mist = ctx.createLinearGradient(0, h * .25, 0, h); mist.addColorStop(0, 'rgba(232,232,213,0)'); mist.addColorStop(.7, 'rgba(230,230,210,.75)'); mist.addColorStop(1, '#b4b7a0'); ctx.fillStyle = mist; ctx.fillRect(0, 0, w, h);
  }
  function drawGesture(ctx, w, h) {
    if (phase !== 'action') return;
    const a = phaseTime, quiet = reduced.matches;
    // Paw response is an expressive ink sweep, not a detached moving paw cutout.
    if (action === 'swipe') {
      const p = quiet ? .75 : clamp((a - .09) / .46), opacity = quiet ? .22 : .65 * Math.sin(clamp(a / .82) * Math.PI);
      ctx.save(); ctx.lineCap = 'round';
      for (let j = 0; j < 3; j++) {
        const x = w * (.19 + j * .072), y = h * (.69 + j * .037), dx = w * .52 * p, dy = -h * .30 * p;
        ctx.strokeStyle = `rgba(26,31,22,${opacity})`; ctx.lineWidth = Math.max(2, Math.min(w, h) * (.007 - j * .001));
        ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + dx * .40, y + dy * .78, x + dx, y + dy); ctx.stroke();
        if (!quiet) { ctx.strokeStyle = `rgba(232,226,202,${opacity * .52})`; ctx.lineWidth = 1; ctx.stroke(); }
      }
      ctx.restore();
    } else if (action === 'lunge' && !quiet && a > .12 && a < .82) {
      const opacity = Math.sin(clamp((a - .12) / .7) * Math.PI) * .32;
      ctx.save(); ctx.strokeStyle = `rgba(28,34,23,${opacity})`; ctx.lineWidth = Math.max(2, w * .002);
      for (let j = 0; j < 5; j++) { const side = j % 2 ? -1 : 1, x = w / 2 + side * w * (.34 + j * .025), y = h * (.15 + j * .17); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + side * w * .12, y + (y - h / 2) * .4); ctx.stroke(); }
      ctx.restore();
    }
  }
  function updateZones() {
    const zones = window.InkTigerScene?.zones(width, height, sceneOptions()) || [];
    for (let i = 0; i < zoneButtons.length; i++) {
      const button = zoneButtons[i][0], zone = zones[i];
      button.hidden = !zone || !zone.visible || phase !== 'idle' || paused || hidden;
      if (zone) { button.style.left = `${zone.x}px`; button.style.top = `${zone.y}px`; }
    }
    let progress = 0;
    if (action) { const config = actions[action], total = config.anticipation + config.action + config.recovery; progress = (phaseTime + (phase === 'action' ? config.anticipation : phase === 'recovery' ? config.anticipation + config.action : 0)) / total; }
    $('encounter-progress').style.transform = `scaleX(${clamp(progress)})`;
  }
  function render(target = c, w = width, h = height) {
    if (!active) return;
    target.setTransform(target === c ? canvas.width / w : 1, 0, 0, target === c ? canvas.height / h : 1, 0, 0); target.clearRect(0, 0, w, h);
    const quiet = reduced.matches, a = phaseTime;
    const thrust = phase === 'action' && action === 'lunge' ? a < .28 ? smooth(a / .28) : 1 - smooth((a - .28) / .72) : 0;
    const shake = !quiet && phase === 'action' && action === 'lunge' && a > .2 && a < .65 ? Math.sin((a - .2) / .45 * Math.PI) * Math.min(5, w * .007) : 0;
    target.save(); target.translate(Math.sin(a * 67) * shake, Math.cos(a * 53) * shake * .5);
    const raster = window.InkTigerScene?.draw(target, w, h, sceneOptions());
    if (!raster) {
      mountain(target, w, h);
      if (window.InkTigerFace) {
        const mouth = phase === 'action' ? quiet ? (action === 'swipe' ? .2 : .8) : action === 'swipe' ? .4 : Math.sin(clamp(a / actions[action].action) * Math.PI) : 0;
        const size = Math.min(w * .94, h * .95);
        window.InkTigerFace.draw(target, w * .5 + (quiet ? 0 : attention.x * w * .012), h * .42, size * (quiet ? 1 : 1 + thrust * .3), quiet ? 0 : time, { mouth, menace: action ? 1 : .65, reach: quiet ? 0 : thrust });
      }
    }
    target.restore(); drawGesture(target, w, h);
    const vignette = target.createRadialGradient(w * .5, h * .46, Math.min(w, h) * .2, w * .5, h * .5, Math.max(w, h) * .72); vignette.addColorStop(0, 'rgba(20,29,21,0)'); vignette.addColorStop(1, 'rgba(18,26,19,.66)'); target.fillStyle = vignette; target.fillRect(0, 0, w, h);
    if (target === c) updateZones();
  }
  function schedule() { if (active && !hidden && !paused && !raf && (!reduced.matches || phase !== 'idle')) raf = requestAnimationFrame(frame); }
  function frame(now) {
    raf = 0; if (!active || hidden || paused) return;
    if (last && now - last < 31) { schedule(); return; }
    const dt = Math.min(.05, last ? (now - last) / 1000 : 0); last = now; time += dt; phaseTime += dt;
    if (!reduced.matches) { const follow = 1 - Math.exp(-dt * 6); attention.x += (attentionTarget.x - attention.x) * follow; attention.y += (attentionTarget.y - attention.y) * follow; }
    if (phase === 'approach' && phaseTime >= 2.8) setPhase('idle');
    else if (action && phaseTime >= actions[action][phase]) {
      if (phase === 'anticipation') { setPhase('action'); window.InkTigerAudio?.roar(actions[action].strength); }
      else if (phase === 'action') setPhase('recovery');
      else if (phase === 'recovery') { completed[action]++; setPhase('idle'); }
    }
    render(); schedule();
  }
  function perform(kind) {
    if (!Object.prototype.hasOwnProperty.call(actions, kind) || !canInteract()) return false;
    action = kind; clearPointer(); attentionTarget = { x: 0, y: 0 }; setPhase('anticipation'); last = 0; render(); schedule(); return true;
  }
  function soundUI() { const on = !!window.InkTigerAudio?.enabled; $('encounter-sound').textContent = on ? '虎鸣 · 开' : '虎鸣 · 静音'; $('encounter-sound').setAttribute('aria-pressed', String(on)); }
  function stopFrame() { if (raf) cancelAnimationFrame(raf); raf = 0; last = 0; }
  function clearPointer() {
    const old = pointer; pointer = null;
    if (old && canvas.hasPointerCapture?.(old.id)) { try { canvas.releasePointerCapture(old.id); } catch (_) { /* Pointer may already have ended. */ } }
  }
  function resetAttention() {
    clearPointer(); attention = { x: 0, y: 0 }; attentionTarget = { x: 0, y: 0 };
  }
  function close() {
    if (!active) return;
    active = false; revision++; stopFrame(); resetAttention(); action = null; phase = 'idle'; phaseTime = 0;
    window.InkTigerAudio?.mute(); soundUI(); dialog.close(); document.body.classList.remove('encounter-open'); emit(false); emitState(); previousFocus?.focus?.(); backdrop = null;
  }
  function open() {
    if (active) return;
    previousFocus = document.activeElement; active = true; paused = false; hidden = document.hidden; time = 0; last = 0; revision++; resetAttention(); action = null;
    window.InkTigerAudio?.mute(); soundUI();
    const landscape = $('landscape'); backdrop = document.createElement('canvas'); backdrop.width = landscape.width; backdrop.height = landscape.height; backdrop.getContext('2d').drawImage(landscape, 0, 0);
    setPhase(reduced.matches ? 'idle' : 'approach'); dialog.showModal(); document.body.classList.add('encounter-open'); emit(true); resize(); $('encounter-close').focus(); schedule();
  }
  function locate(event) { const r = canvas.getBoundingClientRect(); return { x: event.clientX - r.left, y: event.clientY - r.top }; }
  function attend(point) {
    if (!canInteract() || reduced.matches) return;
    attentionTarget = { x: clamp(point.x / width * 2 - 1, -1, 1), y: clamp(point.y / height * 2 - 1, -1, 1) }; schedule();
  }
  canvas.addEventListener('pointerdown', event => {
    if (!canInteract() || pointer || event.isPrimary === false || (event.button !== undefined && event.button !== 0)) return;
    const point = locate(event); pointer = { id: event.pointerId, ...point, moved: false }; attend(point); canvas.setPointerCapture?.(event.pointerId);
  });
  canvas.addEventListener('pointermove', event => {
    if ((pointer && pointer.id !== event.pointerId) || event.isPrimary === false) return;
    const point = locate(event); attend(point);
    if (pointer && pointer.id === event.pointerId && Math.hypot(point.x - pointer.x, point.y - pointer.y) > 14) pointer.moved = true;
  });
  canvas.addEventListener('pointerup', event => {
    if (!pointer || pointer.id !== event.pointerId) return;
    const start = pointer, point = locate(event); pointer = null;
    if (canvas.hasPointerCapture?.(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    if (event.pointerType !== 'mouse') attentionTarget = { x: 0, y: 0 };
    if (start.moved || Math.hypot(point.x - start.x, point.y - start.y) > 14 || !canInteract()) return;
    const zone = getState().zones.find(z => z.visible && ((point.x - z.x) / z.rx) ** 2 + ((point.y - z.y) / z.ry) ** 2 <= 1);
    if (zone) perform(zone.action);
  });
  canvas.addEventListener('pointercancel', event => { if (!pointer || pointer.id !== event.pointerId) return; clearPointer(); attentionTarget = { x: 0, y: 0 }; });
  canvas.addEventListener('lostpointercapture', event => { if (!pointer || pointer.id !== event.pointerId) return; clearPointer(); attentionTarget = { x: 0, y: 0 }; });
  canvas.addEventListener('pointerleave', () => { if (!pointer) attentionTarget = { x: 0, y: 0 }; });
  for (const [button, kind] of [...actionButtons, ...zoneButtons]) button.onclick = () => perform(kind);
  $('encounter-close').onclick = close;
  dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
  dialog.addEventListener('close', () => { if (active) close(); });
  dialog.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.repeat) return;
    const kind = { '1': 'roar', '2': 'swipe', '3': 'lunge' }[event.key];
    if (kind) { event.preventDefault(); perform(kind); }
  });
  $('encounter-pause').onclick = () => {
    if (!active) return; paused = !paused;
    if (paused) { stopFrame(); clearPointer(); attentionTarget = { ...attention }; window.InkTigerAudio?.stop(); }
    else { last = 0; schedule(); }
    updateControls(); render(); emitState();
  };
  $('encounter-sound').onclick = async () => {
    const button = $('encounter-sound'), token = revision; if (button.disabled) return; button.disabled = true;
    try {
      if (window.InkTigerAudio?.enabled) window.InkTigerAudio.mute();
      else { const ok = await window.InkTigerAudio?.enable(); if (!active || hidden || token !== revision) window.InkTigerAudio?.mute(); else if (ok && !paused) window.InkTigerAudio.roar(.55); }
    } finally { button.disabled = false; soundUI(); }
  };
  $('encounter-export').onclick = () => {
    if (!active) return;
    const out = document.createElement('canvas'); out.height = 1200; out.width = Math.round(width / height * 1200); render(out.getContext('2d'), out.width, out.height);
    out.toBlob(blob => { if (!blob) return; const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = 'ink-journey-tiger-encounter.png'; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 60000); }, 'image/png');
  };
  function suspend() {
    hidden = true; revision++; stopFrame(); resetAttention(); if (active) setPhase('idle'); window.InkTigerAudio?.mute(); soundUI();
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) suspend(); else { hidden = false; last = 0; updateControls(); render(); schedule(); } });
  window.addEventListener('pagehide', suspend);
  window.addEventListener('pageshow', () => { hidden = document.hidden; last = 0; updateControls(); if (!hidden) render(); schedule(); });
  reduced.addEventListener?.('change', () => { if (!active) return; stopFrame(); resetAttention(); if (reduced.matches) { window.InkTigerAudio?.stop(); setPhase('idle'); } render(); schedule(); });
  window.addEventListener('ink-tiger-art-ready', () => { if (active && !hidden) render(); });
  new ResizeObserver(() => { if (active) resize(); }).observe(canvas);
  window.InkEncounter = Object.freeze({ open, close, perform, getState });
})();
