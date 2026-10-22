/* 山门 · Two hinged wooden leaves, painted directly into the landscape.
 *
 * window.InkTempleGate.create({x, y, width, height})
 * x/y are the OPENING'S top-left, in landscape/world coordinates.
 * draw(ctx, sceneTimeSeconds, {motion:true}) uses the caller's transform/clock.
 * toggle(time) returns the new open target. Interrupted swings retain both
 * position and velocity. No RAF, timers, audio, DOM, images or dependencies.
 * motion:false snaps the target; repeated draws at frozen time are identical.
 * hit(x,y), active(time), openness(time), reset(), bounds, open are provided.
 * Every painted pixel is clipped to the opening, preserving its stone jamb.
 */
'use strict';
(() => {
  const W = 100, H = 150, EYE_Y = 72, FOCAL = 205;
  const OMEGA = 8, POS_EPS = .00035, SPEED_EPS = .002;
  const clamp = (n, a = 0, b = 1) => Math.max(a, Math.min(b, n));
  const TAU = Math.PI * 2;

  function path(c, points, close = true) {
    c.beginPath(); c.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) c.lineTo(points[i][0], points[i][1]);
    if (close) c.closePath();
  }
  function polygon(c, points, fill, stroke, width = .65) {
    path(c, points);
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); }
  }
  function line(c, points, color, width = .65) {
    path(c, points, false); c.strokeStyle = color; c.lineWidth = width; c.stroke();
  }
  function ellipse(c, x, y, rx, ry, fill) {
    c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU); c.fillStyle = fill; c.fill();
  }
  // All flecks and grain paths are fixed. A redraw never consumes randomness.
  const grain = Array.from({length: 74}, (_, i) => ({
    u: 1.6 + ((i * 7.931 + Math.sin(i * 2.7) * 2) % 46.8),
    y: 3 + (i * 23.131) % 116,
    length: 8 + (i * 11.917) % 30,
    bend: Math.sin(i * 3.8) * .5,
    light: i % 4 === 0
  }));
  const dust = Array.from({length: 85}, (_, i) => ({
    x: 2 + (i * 29.371) % 96, y: 2 + (i * 43.191) % 145,
    r: .2 + (i % 4) * .13
  }));

  function interior(c, amount) {
    // Opaque backing replaces the painted shut doorway, rather than merely
    // placing a glow on top of it. The opening is revealed between the leaves.
    const back = c.createLinearGradient(0, 0, 0, H);
    back.addColorStop(0, '#211f18'); back.addColorStop(.55, '#453925');
    back.addColorStop(1, '#64513a'); c.fillStyle = back; c.fillRect(0, 0, W, H);
    polygon(c, [[0,0],[100,0],[75,25],[25,25]], '#29281f');
    polygon(c, [[0,0],[25,25],[25,116],[0,150]], '#373126');
    polygon(c, [[100,0],[75,25],[75,116],[100,150]], '#302c23');
    const glow = c.createRadialGradient(50, 64, 0, 50, 64, 59);
    glow.addColorStop(0, 'rgba(197,151,77,.38)');
    glow.addColorStop(.55, 'rgba(151,111,52,.16)');
    glow.addColorStop(1, 'rgba(151,111,52,0)');
    c.fillStyle = glow; c.fillRect(0, 3, 100, 143);
    polygon(c, [[0,150],[25,116],[75,116],[100,150]], '#796449');
    polygon(c, [[28,116],[72,116],[77,123],[23,123]], '#443e2e');
    line(c, [[25,25],[25,116],[0,150]], 'rgba(160,132,84,.32)', .75);
    line(c, [[75,25],[75,116],[100,150]], 'rgba(151,125,82,.28)', .7);
    // Floor courses converge into the shadowed hall.
    for (const y of [126, 137, 148]) {
      const f = (y - 116) / 34;
      line(c, [[25*(1-f),y],[75+25*f,y+.1]], 'rgba(45,40,30,.29)', .75);
    }
    line(c, [[37,116],[29,150]], 'rgba(53,45,32,.25)', .7);
    line(c, [[63,116],[71,150]], 'rgba(53,45,32,.25)', .7);
    // A quiet wooden altar and hanging lantern give the room real depth.
    polygon(c, [[33,91],[67,91],[68,95],[32,95]], '#55432a', '#241f18', .6);
    polygon(c, [[35,95],[65,95],[65,100],[35,100]], '#413321');
    polygon(c, [[35,99],[39,99],[38,115],[35,115]], '#352c20');
    polygon(c, [[61,99],[65,99],[65,115],[62,115]], '#32291e');
    line(c, [[39,106],[61,106]], '#2e281d', 1.5);
    ellipse(c, 50, 90.5, 7.8, 1.4, '#7a633b');
    polygon(c, [[44,86],[56,86],[54,91],[46,91]], '#9a7c42', '#4d4029', .6);
    line(c, [[48,86],[47.6,80]], '#c2a665', .55);
    line(c, [[51,86],[51.4,79]], '#bba16c', .55);
    line(c, [[50,12],[50,34]], '#8f794f', .55);
    const lamp = c.createRadialGradient(50, 46, 1, 50, 46, 21);
    lamp.addColorStop(0, 'rgba(237,200,124,.46)');
    lamp.addColorStop(.36, 'rgba(214,167,83,.22)');
    lamp.addColorStop(1, 'rgba(214,167,83,0)');
    c.fillStyle = lamp; c.fillRect(29, 25, 42, 43);
    polygon(c, [[45,36],[55,36],[57,49],[54,56],[46,56],[43,49]], '#b99152', '#51422a', .8);
    polygon(c, [[47,38],[53,38],[54,49],[52,54],[48,54],[46,49]], '#e1c18a');
    line(c, [[45,36],[55,36]], '#473b28', 1.8);
    line(c, [[45,51],[55,51]], '#695132', .75);
    line(c, [[50,37],[50,54]], 'rgba(104,77,41,.7)', .55);
    line(c, [[50,56],[50,62]], '#a28751', .65);
    c.fillStyle = 'rgba(224,205,150,.07)';
    for (const p of dust) { c.beginPath(); c.arc(p.x, p.y, p.r, 0, TAU); c.fill(); }
    // Thin threshold light, never a modern-looking emissive outline.
    c.fillStyle = `rgba(202,168,104,${.08 + amount * .22})`; c.fillRect(1, 146, 98, 2);
  }

  function leaf(c, side, amount) {
    // Orthogonal hinges and a pinhole projection: all planks, metalwork and
    // rings follow the same inward-moving quadrilateral, not a flat resize.
    const angle = amount * 1.505; // 86.2 degrees: the edge stays visible when open.
    const co = Math.cos(angle), si = Math.sin(angle), left = side === 0;
    const hinge = left ? 0 : W, direction = left ? 1 : -1;
    function p(u, v, depth = 0) {
      const z = u * si + depth * co;
      const scale = FOCAL / (FOCAL + z);
      return [50 + (hinge + direction * (u * co - depth * si) - 50) * scale,
        EYE_Y + (v - EYE_Y) * scale];
    }
    function quad(x, y, width, height, fill, stroke, lineWidth) {
      polygon(c, [p(x,y),p(x+width,y),p(x+width,y+height),p(x,y+height)], fill, stroke, lineWidth);
    }
    function mappedLine(points, color, width = .5) {
      path(c, points.map(a => p(a[0], a[1])), false);
      c.strokeStyle = color; c.lineWidth = width; c.stroke();
    }
    function ring(u, v, rx, ry, color, width, offset = 0) {
      const points = [];
      for (let i = 0; i <= 30; i++) {
        const a = i / 30 * TAU;
        points.push(p(u + Math.cos(a) * rx, v + Math.sin(a) * ry + offset));
      }
      path(c, points, false); c.strokeStyle = color; c.lineWidth = width; c.stroke();
    }
    function disc(u, v, rx, ry, fill) {
      const points = [];
      for (let i = 0; i < 16; i++) {
        const a = i / 16 * TAU; points.push(p(u + Math.cos(a)*rx, v + Math.sin(a)*ry));
      }
      polygon(c, points, fill);
    }
    // The inner stile's thickness is visible as a narrow warm edge.
    polygon(c, [p(50,0),p(50,150),p(50,150,1.6),p(50,0,1.6)], '#80613c', '#30291f', .65);
    quad(0, 0, 50, 150, left ? '#4a3b2b' : '#44382a', '#26271f', .9);
    const plankColors = left
      ? ['#4e3e2c','#52422e','#493c2b','#55432e','#493a2a','#51402c','#493b2b']
      : ['#47392a','#4d3f2c','#463929','#51402d','#493a28','#4f3e2b','#463929'];
    for (let i = 0; i < 7; i++) {
      const u = 1.1 + i * 6.85;
      quad(u, 2, 6.65, 146, plankColors[i]);
      mappedLine([[u,3],[u-.13,55],[u+.14,101],[u,148]], 'rgba(26,28,22,.61)', .6);
      mappedLine([[u+.8,3],[u+.63,77],[u+.8,147]], 'rgba(176,139,83,.15)', .4);
    }
    for (const g of grain) {
      const y = left ? g.y : 149 - g.y - g.length;
      mappedLine([[g.u,y],[g.u+g.bend,y+g.length*.26],
        [g.u-g.bend*.6,y+g.length*.62],[g.u+g.bend*.2,y+g.length]],
      g.light ? 'rgba(180,144,93,.14)' : 'rgba(29,29,22,.25)', g.light ? .38 : .46);
    }
    // Raised perimeter stiles and cross rails, with a dry-brush highlight.
    quad(1.5, 1.5, 3.8, 147, '#59452e', '#302d22', .45);
    quad(44.7, 1.5, 4, 147, '#56432d', '#2b291f', .5);
    for (const y of [7, 40, 111, 138]) {
      quad(4.7, y, 40.3, 4.5, '#5b472e', '#302a20', .55);
      mappedLine([[5.2,y+.65],[44.6,y+.65]], 'rgba(175,137,78,.36)', .5);
      mappedLine([[5.2,y+4.4],[44.6,y+4.4]], 'rgba(23,26,20,.48)', .7);
    }
    mappedLine([[2.1,3],[2,148]], 'rgba(188,150,92,.27)', .45);
    mappedLine([[45.3,3],[45.3,147]], 'rgba(188,150,92,.22)', .45);
    // A restrained stud grid, keeping the door readable at landscape scale.
    for (const y of [25, 56, 98, 128]) for (const u of [11.5, 25, 38.5]) {
      disc(u+.22, y+.35, 1.65, 1.7, 'rgba(25,27,21,.8)');
      disc(u, y, 1.45, 1.5, '#9a7c49');
      disc(u-.32, y-.4, .5, .5, '#c0a56a');
    }
    // Bronze escutcheon and hanging circular pull, entirely perspective-mapped.
    const handleU = 36.5;
    disc(handleU, 74, 4.1, 4.7, '#2b2a21');
    disc(handleU, 73.7, 3.5, 4.1, '#8d7245');
    disc(handleU, 73.5, 2.5, 3.1, '#6c5737');
    disc(handleU, 73.5, 1, 1, '#c0a26b');
    ring(handleU, 78, 4.5, 5.1, 'rgba(20,24,19,.8)', 1.45, .8);
    ring(handleU, 78, 4.5, 5.1, '#b29255', .95);
    // A few dashes break the ring highlight like rubbed, aged metal.
    mappedLine([[handleU-3.9,76],[handleU-3.1,74.6],[handleU-1.7,73.4]], '#d1b77b', .55);
    mappedLine([[handleU+1.8,82.4],[handleU+3.4,81.5]], '#695638', .65);
    // Narrow hinge straps on the fixed side of each leaf.
    for (const y of [19, 125]) {
      quad(.4, y, 5.8, 2.5, '#37372a', '#6f6646', .35);
      disc(3.1, y+1.2, .62, .6, '#a68c53');
    }
    // Interior shadow changes with the physical turn, no glowing leaf overlay.
    if (amount > 0) quad(0, 0, 50, 150, `rgba(15,23,19,${amount*.24})`);
  }

  function frame(c, amount) {
    // The original painting supplies the stone jamb and lintel. This narrow
    // timber lining stays INSIDE the opening and never paints over the stone.
    polygon(c, [[0,0],[2.4,1.5],[2.4,148],[0,150]], '#4b402e');
    polygon(c, [[97.6,1.5],[100,0],[100,150],[97.6,148]], '#403929');
    polygon(c, [[0,0],[100,0],[98,2.7],[2,2.7]], '#3a3326');
    line(c, [[1.4,3],[1.5,147]], 'rgba(176,150,102,.24)', .6);
    line(c, [[98.5,3],[98.5,147]], 'rgba(156,136,88,.23)', .55);
    line(c, [[2,2.8],[98,2.8]], 'rgba(22,25,19,.8)', 1.1);
    c.fillStyle = '#615a43'; c.fillRect(0, 148, 100, 2);
    line(c, [[1,148.5],[99,148.5]], `rgba(199,176,121,${.22+amount*.25})`, .7);
    line(c, [[1,149.8],[99,149.8]], 'rgba(40,43,31,.66)', .6);
  }

  function create({x = 0, y = 0, width = 90, height = 135} = {}) {
    if (![x,y,width,height].every(Number.isFinite) || width <= 0 || height <= 0)
      throw new TypeError('InkTempleGate needs finite x/y and positive width/height.');
    let target = 0, origin = 0, velocity = 0, start = 0, lastTime = 0, motion = true;
    const bounds = Object.freeze({x, y, width, height});
    const clock = value => Number.isFinite(value) ? value : lastTime;
    function sample(value) {
      const dt = Math.max(0, clock(value) - start), delta = origin - target;
      const b = velocity + OMEGA * delta, exponential = Math.exp(-OMEGA * dt);
      const position = target + (delta + b * dt) * exponential;
      const speed = (velocity - OMEGA * b * dt) * exponential;
      if (Math.abs(position-target) <= POS_EPS && Math.abs(speed) <= SPEED_EPS)
        return {position:target, speed:0, active:false};
      return {position:clamp(position), speed, active:true};
    }
    function draw(c, time, options = {}) {
      lastTime = clock(time); motion = options.motion !== false;
      if (!motion) { origin = target; velocity = 0; start = lastTime; }
      const amount = sample(lastTime).position;
      c.save();
      c.translate(x, y); c.scale(width/W, height/H);
      c.lineJoin = 'round'; c.lineCap = 'round';
      // Interior is clipped inside the doorway, including all lantern washes.
      c.save(); c.beginPath(); c.rect(0, 0, W, H); c.clip();
      interior(c, amount); leaf(c, 0, amount); leaf(c, 1, amount); frame(c, amount);
      c.restore(); c.restore();
      return amount;
    }
    function toggle(time, options = {}) {
      const now = clock(time), previous = sample(now);
      if (typeof options.motion === 'boolean') motion = options.motion;
      target = target ? 0 : 1; origin = motion ? previous.position : target;
      velocity = motion ? previous.speed : 0; start = now; lastTime = now;
      return Boolean(target);
    }
    function reset() {
      target = origin = velocity = start = lastTime = 0;
      // Keep the last motion preference, as reset does not change accessibility.
    }
    return Object.freeze({
      draw, toggle, reset, bounds,
      hit: (px, py) => Number.isFinite(px) && Number.isFinite(py) &&
        px >= x - width*.09 && px <= x + width*1.09 &&
        py >= y - height*.04 && py <= y + height*1.06,
      active: time => motion && sample(time).active,
      openness: time => sample(time).position,
      get open() { return Boolean(target); }
    });
  }
  window.InkTempleGate = Object.freeze({create});
})();
