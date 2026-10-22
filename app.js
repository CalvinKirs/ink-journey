/* 山水之间 v15. Original procedural art; local-only, dependency-free interaction. */
'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const canvas = $('landscape'), ctx = canvas.getContext('2d');
  const { W, H, minX = 0, maxX = W } = window.InkLandscapeScene;
  const reducedQuery = matchMedia('(prefers-reduced-motion: reduce)');
  let motion = !reducedQuery.matches, manuallyPaused = false, interactionTime = 0;
  let panoramic = true, tigerCloseup = false, viewH = H, cameraY = 0;
  const inkScale=Math.min(.5,16000/W);
  const ink = document.createElement('canvas'); ink.width = Math.ceil(W*inkScale); ink.height = Math.ceil(H*inkScale);
  const inkCtx = ink.getContext('2d'); inkCtx.setTransform(inkScale,0,0,inkScale,-minX*inkScale,0);
  // Keep the size-capped ink buffer (at most half scale) authoritative, but never
  // submit that mutable panorama to every animation frame. Tiles are allocated
  // only where a settled dab exists; gutters preserve bilinear edge sampling.
  const inkTileSize = 1024, inkTileGutter = 2, inkTiles = new Map();
  function dirtyInkTiles(d, radius) {
    const reach = radius * 1.1 + 4;
    const x0 = Math.max(0, Math.floor(((d.x - reach - minX) * inkScale - inkTileGutter) / inkTileSize));
    const x1 = Math.min(Math.ceil(ink.width / inkTileSize) - 1, Math.floor(((d.x + reach - minX) * inkScale + inkTileGutter) / inkTileSize));
    const y0 = Math.max(0, Math.floor(((d.y - reach) * inkScale - inkTileGutter) / inkTileSize));
    const y1 = Math.min(Math.ceil(ink.height / inkTileSize) - 1, Math.floor(((d.y + reach) * inkScale + inkTileGutter) / inkTileSize));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const key = x + ',' + y;
      let tile = inkTiles.get(key);
      if (!tile) {
        const left = x * inkTileSize, top = y * inkTileSize;
        tile = {left, top, width: Math.min(inkTileSize, ink.width - left), height: Math.min(inkTileSize, ink.height - top), dirty: true};
        tile.sx = Math.max(0, left - inkTileGutter); tile.sy = Math.max(0, top - inkTileGutter);
        tile.canvas = document.createElement('canvas');
        tile.canvas.width = Math.min(ink.width, left + tile.width + inkTileGutter) - tile.sx;
        tile.canvas.height = Math.min(ink.height, top + tile.height + inkTileGutter) - tile.sy;
        tile.ctx = tile.canvas.getContext('2d'); inkTiles.set(key, tile);
      }
      tile.dirty = true;
    }
  }
  function drawInkTiles(c) {
    for (const tile of inkTiles.values()) {
      const x = minX + tile.left / inkScale - camera, y = tile.top / inkScale;
      if (x >= viewW || x + tile.width / inkScale <= 0 || y >= cameraY + viewH || y + tile.height / inkScale <= cameraY) continue;
      if (tile.dirty) {
        tile.ctx.putImageData(inkCtx.getImageData(tile.sx, tile.sy, tile.canvas.width, tile.canvas.height), 0, 0);
        tile.dirty = false;
      }
      c.drawImage(tile.canvas, tile.left - tile.sx, tile.top - tile.sy, tile.width, tile.height, x, y, tile.width / inkScale, tile.height / inkScale);
    }
  }
  const chapters = [
    { center: 1296, title: '汀洲<br>白鹭', eyebrow: '第一境 · 晨水', poem: '水阔一双鹭<br>风轻半日闲' },
    { center: 2592, title: '云峡<br>听瀑', eyebrow: '第二境 · 山岚', poem: '循声入深谷<br>飞泉落九天' },
    { center: 4464, title: '松隐<br>山君', eyebrow: '第三境 · 暮山', poem: '林深藏虎迹<br>万岭起松风' },
    { center: 6048, title: '寒山<br>晚钟', eyebrow: '第四境 · 寒山寺意境', poem: '钟声随水远<br>一灯照归舟' }
  ];
  const landmarks = [{id:'egret',x:2200,y:1900},{id:'water',x:3300,y:2020},{id:'falls',x:2280,y:1120},{id:'pine',x:3920,y:1150},{id:'tiger',x:4420,y:1355},{id:'pavilion',x:6870,y:700},{id:'lantern',x:4200,y:1970},{id:'gate',x:5906,y:1415}];
  const journey = window.InkJourneyInteractions;
  const journeyPlaces = journey?.hotspots || [];
  const gate = window.InkTempleGate?.create({x:5808,y:1170,width:196,height:245});
  const poems = { gate:['门','轻叩山门，循着灯火步入庭院。池鱼、香烟与晚钟，在门内等你。'], lantern: ['舟', '一苇渡江，随水缓行。再轻点舟身，可让它停靠。'], egret: ['鹭', '一声轻唤，白鹭掠水而起。等一等，它们还会归来。'], water: ['水', '水动鱼惊，涟漪替你写下一圈回声。'], falls: ['瀑', '循着水声入山，飞泉与云雾一同落下。'], pine: ['松', '你一停步，松间的归鸟便有了去处。'], pavilion: ['钟', '枫桥夜泊，遥听寒山。此景为艺术想象；钟声与无词吟唱均为合成音。'], tiger: ['虎', '山君也有玩心。邀它飞扑、打滚，或在山径上趴一会儿。'] };
  const egrets = window.InkEgrets?.create({x:2200,y:1900});
  let bellAt=-100000, fallsAt=-100000, lanternAt=-100000;
  const discovered = new Set();
  let glade, tigerGlanceAt = -100000, tigerEncountered = false;
  let art, viewW = 2400, camera = 0, targetCamera = 0, chapter = -1, preferredChapter = 0, mode = 'explore', scenicEnd = null;
  let down = null, current = null, strokes = [], pending = [], dabCount = 0;
  let ripples = [], birds = [], reveal = 0, revealTarget = 0;
  let encounterActive = false;
  let raf = 0, lastFrame = 0, sceneTime = 0, initialized = false, running = true;
  let soundOn = false, soundBusy = false, soundGeneration = 0;
  const MAX_DABS = 5000;
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const maxCamera = () => Math.max(minX, maxX - viewW);
  const announce = text => { $('status').textContent = text; };
  function viewport() { const r = canvas.getBoundingClientRect(); return { r, scale: r.height / viewH }; }
  function point(e) { const { r, scale } = viewport(); return { x: camera + (e.clientX - r.left) / scale, y: cameraY + (e.clientY - r.top) / scale }; }
  function setPosition(value, smooth = false) {
    targetCamera = clamp(value, minX, maxCamera());
    if (!smooth || !motion) camera = targetCamera;
    updateScene(); requestRender();
  }
  function updateScene() {
    $('position').value = maxCamera()>minX ? Math.round((camera-minX) / (maxCamera()-minX) * 1000) : 0;
    const center = camera + viewW / 2;
    const nextEnd = center < 0 ? 'left' : center > 7200 ? 'right' : null;
    for(const end of ['left','right']){const button=$('scroll-'+end);button.disabled=end==='left'?minX>=0:maxX<=7200;button.classList.toggle('active',nextEnd===end);button.setAttribute('aria-current',String(nextEnd===end));}
    $('position').setAttribute('aria-valuetext',`${Math.round(Number($('position').value)/10)}% · ${nextEnd==='left'?'卷首远山':nextEnd==='right'?'卷尾江天':'山水四境'}`);
    // Chapter cameras clamp near the scroll edges; compare actual reachable
    // targets rather than world midpoints, which mislabel wide close views.
    let next = preferredChapter;
    let distance = Math.abs(camera - clamp(chapters[next].center - viewW / 2, minX, maxCamera()));
    chapters.forEach((item, i) => {
      const d = Math.abs(camera - clamp(item.center - viewW / 2, minX, maxCamera()));
      if (d < distance - .001) { distance = d; next = i; }
    });
    preferredChapter = next;
    if (next !== chapter || nextEnd !== scenicEnd) {
      scenicEnd = nextEnd;
      chapter = next;
      const endScene=scenicEnd==='left'?{title:'远山<br>启卷',eyebrow:'卷首 · 溯水入山',poem:'山外还有山<br>一水引长卷'}:scenicEnd==='right'?{title:'江天<br>余韵',eyebrow:'卷尾 · 江山未尽',poem:'行到水云处<br>山河入远天'}:null;
      $('scene-title').innerHTML = endScene?.title || (tigerCloseup ? '山君<br>入境' : chapters[next].title);
      $('scene-eyebrow').textContent = endScene?.eyebrow || (tigerCloseup ? '林间邂逅 · 山君' : chapters[next].eyebrow);
      $('scene-poem').innerHTML = endScene?.poem || (tigerCloseup ? '一身风与骨<br>万岭入眸中' : chapters[next].poem);
      document.querySelectorAll('button[data-chapter]').forEach((button, i) => {
        button.classList.toggle('active', !scenicEnd && i === next); button.setAttribute('aria-current', String(!scenicEnd && i === next));
      });
      canvas.dataset.chapter = String(next); canvas.dataset.scrollRegion = scenicEnd || 'core';
      $('chapter-action').hidden=!!scenicEnd;
      document.querySelector('.experience').classList.remove('night');
      window.InkJourneyAudio?.setScene(next);
      $('chapter-action').innerHTML=['唤白鹭 ↗','听飞瀑 ↗','逗山君 ↗','叩山门 ↗'][next];
      $('chapter-action').title=['轻唤白鹭并看它归来','走近飞瀑','邀请画中山君飞扑','叩门进入寒山寺庭景'][next];
    }
    const boatPosition=window.InkSceneryActors?.boat(interactionTime/1000);
    if(boatPosition){const item=landmarks.find(l=>l.id==='lantern');item.x=boatPosition.x;item.y=boatPosition.y;}
    for (const landmark of [...landmarks, ...journeyPlaces.map(p=>({...p,id:'journey-'+p.id}))]) {
      const el = $(landmark.id), x = (landmark.x - camera) / viewW * 100;
      const markerPercentY=(landmark.y-cameraY)/viewH*100;
      el.hidden = mode === 'paint' || x < 3 || x > 97 || markerPercentY<3 || markerPercentY>97;
      const markerY = landmark.y;
      el.style.left = `${x}%`; el.style.top = `${(markerY - cameraY) / viewH * 100}%`;
    }
    for(const place of journeyPlaces){$('journey-'+place.id).disabled=manuallyPaused;$('excursion-'+place.id).disabled=manuallyPaused;}
  }
  function wash(c, x, y, radius, alpha, rgb = '41,58,41') {
    const g = c.createRadialGradient(x, y, 0, x, y, radius);
    g.addColorStop(0, `rgba(${rgb},${alpha})`); g.addColorStop(.55, `rgba(${rgb},${alpha * .5})`); g.addColorStop(1, `rgba(${rgb},0)`);
    c.fillStyle = g; c.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }
  function ellipse(c, x, y, rx, ry, color, lineWidth = 1) {
    c.beginPath(); c.ellipse(x, y, Math.max(.1, rx), Math.max(.1, ry), 0, 0, Math.PI * 2); c.strokeStyle = color; c.lineWidth = lineWidth; c.stroke();
  }
  function drawDab(c, d, age) {
    const t = clamp(age / 1600, 0, 1), r = d.r * (.5 + .5 * t);
    c.save(); c.translate(d.x, d.y); c.rotate(d.angle); c.scale(1, .74);
    wash(c, 0, 0, r, .16); wash(c, r * .1, -r * .1, r * .62, .19 * (1 - t * .25));
    for (let i = 0; i < 5; i++) { const a = i * 1.256 + d.angle; wash(c, Math.cos(a) * r * .45, Math.sin(a) * r * .45, r * .6, .023); }
    c.restore();
    if (c === inkCtx) dirtyInkTiles(d, r);
  }
  function drawSignature(c) {
    const fontSize = Math.min(39 * viewH / 1200, viewW * .05), x = chapter === 3 ? viewW*.86 : viewW - Math.max(45, viewW * .045); let y = cameraY + 95 * viewH / 1200;
    c.save();
    const inscriptionLength = Array.from($('inscription').value.trim()).slice(0, 12).length;
    const sealPresent = Boolean($('seal').value.trim());
    if (inscriptionLength || sealPresent) {
      const paperWash = c.createLinearGradient(x - 70, 0, x + 70, 0);
      paperWash.addColorStop(0, 'rgba(243,242,225,0)'); paperWash.addColorStop(.35, 'rgba(243,242,225,.62)');
      paperWash.addColorStop(.65, 'rgba(243,242,225,.62)'); paperWash.addColorStop(1, 'rgba(243,242,225,0)');
      c.fillStyle = paperWash; c.fillRect(x - 70, y - 15, 140, inscriptionLength * fontSize * 1.25 + (sealPresent ? 90 : 25));
    }
    c.textBaseline = 'top'; c.textAlign = 'center'; c.fillStyle = '#354a3c';
    c.font = `${fontSize}px "Noto Serif CJK SC", "Songti SC", SimSun, serif`;
    Array.from($('inscription').value.trim()).slice(0, 12).forEach(ch => { c.fillText(ch, x, y); y += fontSize * 1.25; });
    const chars = Array.from($('seal').value.trim()).slice(0, 4);
    if (chars.length) {
      y += 20; c.strokeStyle = '#a04d3e'; c.lineWidth = 2; c.strokeRect(x - 24, y, 48, 48); c.strokeRect(x - 20, y + 4, 40, 40);
      c.fillStyle = '#a04d3e'; c.textBaseline = 'middle'; c.font = `${chars.length <= 2 ? 19 : 16}px "Noto Serif CJK SC", serif`;
      chars.forEach((ch, i) => c.fillText(ch, chars.length <= 2 ? x : x + (i % 2 ? 1 : -1) * 10, chars.length <= 2 ? y + 48 / (chars.length + 1) * (i + 1) : y + 14 + Math.floor(i / 2) * 21));
    }
    c.restore();
  }
  // A reusable mist brush, not full-scene filters, keeps animation light on phones.
  const mist = document.createElement('canvas'); mist.width = 500; mist.height = 160;
  const mc = mist.getContext('2d'); mc.scale(1, .3); wash(mc, 250, 266, 250, .72, '239,241,226');
  function drawWorld(c, now, exporting = false) {
    const dusk = clamp((camera + viewW / 2 - 3600) / 3600, 0, 1);
    const sky = c.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, `rgb(${239 + dusk * 5},${239 - dusk * 8},${221 - dusk * 17})`); sky.addColorStop(.7, '#e7eddf'); sky.addColorStop(1, '#eeecdb');
    c.fillStyle = sky; c.fillRect(0, 0, viewW, H);
    const paintedLandscape = window.InkLandscapeScene.draw(c, camera, viewW);
    if (!paintedLandscape) for (const layer of art.layers) {
      const offset = camera * layer.parallax;
      c.drawImage(layer.canvas, 0, 0, layer.canvas.width, layer.canvas.height, -offset, 0, window.InkArt.W, H);
    }
    c.save(); c.translate(-camera, 0);
    if (paintedLandscape) {
      window.InkRiverMotion?.draw(c, interactionTime / 1000, {camera, viewW, motion: !reducedQuery.matches});
      window.InkCloudMotion?.draw(c, interactionTime / 1000, {camera, viewW, motion: !reducedQuery.matches});
    }
    const t = sceneTime / 1000;
    // The ferry drifts rather than looping abruptly across the entire scene.
    const boatX = 792 + Math.sin(t * .045) * 20;
    if (!paintedLandscape) {
    art.drawBoat(c, boatX, 972 + Math.sin(t * .65) * 2, t);
    art.drawBoat(c, 5830 + Math.sin(t * .025 + 1) * 70, 950 + Math.sin(t * .5) * 1.5, t);
    for (let i = 0; i < 4; i++) ellipse(c, boatX - 20 - i * 12, 988 + i * 7, 58 + i * 15, 2 + i * 1.5, `rgba(73,103,79,${.1 - i * .018})`, .8);
    if (reveal > .01) { c.save(); c.globalAlpha = reveal; art.drawPavilion(c, 3600, 720); c.restore(); }
    }
    // Fine reflected water marks follow the painted river, never cover its banks.
    if (paintedLandscape) for (let i=0;i<9;i++) ellipse(c,900+i*245,1020+(i%3)*35,35+Math.sin(t*.3+i)*10,1.2,`rgba(244,229,193,${.10+Math.sin(t*.4+i)*.025})`,1);
    for (const event of ripples) {
      const age = reducedQuery.matches ? Math.min(900, interactionTime - event.time) : interactionTime - event.time;
      const life = clamp(1 - (interactionTime - event.time) / 6200, 0, 1);
      for (let i = 0; i < 3; i++) { const r = ((age * .035 + i * 22) % 180); ellipse(c, event.x, event.y, r, r * .22, `rgba(68,104,81,${life * .32 * (1 - r / 210)})`, 1.5); }
      for (let i = 0; i < 3; i++) {
        const a = age * .0005 + i * 2.1, radius = 38 + i * 16;
        c.save(); c.globalAlpha = life * .7; c.translate(event.x + Math.cos(a) * radius, event.y + Math.sin(a) * radius * .35); c.rotate(Math.atan2(Math.cos(a) * .35, -Math.sin(a))); art.drawFish(c, 0, 0, age / 1000 + i); c.restore();
      }
    }
    for (const flock of birds) {
      const age = reducedQuery.matches ? .8 : (interactionTime - flock.time) / 1000;
      for (let i = 0; i < 7; i++) { c.save(); c.globalAlpha = clamp(1 - (interactionTime - flock.time) / 10000, 0, 1); art.drawBird(c, flock.x + age * 70 + i * 32, flock.y - age * 46 - Math.sin(i) * 28, age * 5 + i); c.restore(); }
    }
    if(paintedLandscape) {
      window.InkWaterfall?.draw(c,interactionTime/1000,{motion:!reducedQuery.matches});
      window.InkSceneryActors?.draw(c,interactionTime/1000,{motion:!reducedQuery.matches});
      journey?.draw(c,interactionTime/1000,{camera,viewW,motion:!reducedQuery.matches});
      gate?.draw(c,interactionTime/1000,{motion:!reducedQuery.matches});
      egrets?.draw(c,interactionTime/1000,{motion:!reducedQuery.matches});
      const falling=clamp(1-(interactionTime-fallsAt)/4500,0,1);
      if(falling>0){c.save();c.globalAlpha=falling*.2;c.drawImage(mist,1850+Math.sin(t)*20,1250,900,210);c.restore();}
      const lanternLife=clamp(1-(interactionTime-lanternAt)/9000,0,1);
      if(lanternLife>0)wash(c,4200,1850,75,lanternLife*(.15+Math.sin(t*2)*.02),'255,197,92');
      const bellAge=(interactionTime-bellAt)/1000;
      if(bellAge>=0&&bellAge<5)for(let i=0;i<3;i++){const r=(bellAge*65+i*60)%300;ellipse(c,6870,700,r,r*.35,`rgba(240,205,139,${(1-bellAge/5)*(1-r/300)*.35})`,1.4);}
    }
    c.restore();
    if (!paintedLandscape) drawTigerGlade(c, now);
    // Slow translucent veils between the viewer and the land.
    if (!paintedLandscape) for (let i = 0; i < 12; i++) {
      const x = i * 1300 - 100 - camera + Math.sin(t * .025 + i * 1.7) * 35;
      c.save(); c.globalAlpha = paintedLandscape ? (i === 1 ? .10 * (1 - reveal * .8) : .045) : .22;
      c.drawImage(mist, x, 600 + Math.sin(i * 2) * 55, 1500, 210); c.restore();
    }
    const rain = !paintedLandscape && camera < 2400 && camera + viewW > 1200 ? 1 : 0;
    if (rain > .05) {
      c.strokeStyle = `rgba(99,123,109,${rain * .13})`; c.lineWidth = 1;
      c.beginPath();
      for (let i = 0; i < 95; i++) { const x = 2400 + ((i * 137.3 + t * 15) % 2400) - camera, y = ((i * 79.9 + t * 230) % 1070); c.moveTo(x, y); c.lineTo(x - 4, y + 18); }
      c.stroke();
    }
    if (dabCount > 0) drawInkTiles(c);
    c.save(); c.translate(-camera, 0); pending.forEach(d => drawDab(c, d, now - d.time)); c.restore();
    drawSignature(c);
  }
  function tigerTrail() {
    const phase = (sceneTime / 1000 / 15.45 + .30) % 1;
    return { phase, x: 5240 + phase * 270, y: 1088 };
  }
  function drawTigerGlade(c, now) {
    if (!glade || !window.InkTiger) return;
    c.save(); c.translate(-camera, 0);
    c.drawImage(glade.canvas, glade.x, glade.y, glade.width, glade.height);
    const t = sceneTime / 1000;
    // The animal follows one short sheltered trail; mist hides the loop's ends.
    const { phase, x, y } = tigerTrail();
    const emergence = reducedQuery.matches ? 1 : Math.min(1, (sceneTime + 1200) / 2800);
    const edgeFade = Math.min(1, phase / .13, (1 - phase) / .13);
    const age = (sceneTime - tigerGlanceAt) / 1000;
    const glance = tigerEncountered ? (reducedQuery.matches ? 1 : Math.sin(Math.min(1, Math.max(0, age / 5)) * Math.PI)) : 0;
    c.save(); c.globalAlpha = emergence * edgeFade;
    window.InkTiger.draw(c, x, y, t, { scale: .82, glance, moving: !reducedQuery.matches });
    c.restore();
    // A few grasses bend beside the trail; no particle pools or physics engine.
    for (let i = 0; i < 18; i++) {
      const gx = i < 9 ? 5168 + i * 5 : 5565 + (i - 9) * 7;
      const h = 14 + (i * 13 % 29), sway = Math.sin(t * .8 + i * .7) * 5;
      c.beginPath(); c.moveTo(gx, 1098); c.quadraticCurveTo(gx - 3 + sway, 1098 - h * .65, gx + sway + 5, 1098 - h);
      c.strokeStyle = `rgba(69,85,57,${.26 + (i % 3) * .05})`; c.lineWidth = 1.3; c.stroke();
    }
    // Quiet ground-hugging vapor and dry ink stirred by the paws.
    c.save(); c.globalAlpha = .12 + Math.sin(t * .17) * .035;
    c.drawImage(mist, 5150 + Math.sin(t * .12) * 40, 1048, 570, 82); c.restore();
    if (!reducedQuery.matches && emergence > .5) for (let i = 0; i < 5; i++) {
      const cycle = (t * .38 + i * .2) % 1;
      wash(c, x - 88 - cycle * 30 + i * 9, y - 4 - cycle * 12, 7 + cycle * 8, .025 * (1 - cycle), '100,91,65');
    }
    if (tigerEncountered && age >= 0 && age < 5) for (let i = 0; i < 8; i++) {
      const a = reducedQuery.matches ? 1.5 : age;
      const px = 5530 - a * (19 + i * 2) + Math.sin(a * 1.3 + i) * 14;
      const py = 941 + i * 9 + a * 16;
      c.save(); c.translate(px, py); c.rotate(Math.sin(a + i) * .7); c.globalAlpha = reducedQuery.matches ? .25 : Math.sin(age / 5 * Math.PI) * .4;
      c.fillStyle = i % 2 ? '#8c8d61' : '#a38d5b'; c.beginPath(); c.ellipse(0, 0, 4, 1.3, 0, 0, Math.PI * 2); c.fill(); c.restore();
    }
    c.restore();
  }
  function frame(now) {
    raf = 0;
    if (!running || document.hidden || encounterActive || !art) return;
    if (lastFrame && now - lastFrame < 31) { requestRender(); return; }
    const dt = Math.min(now - (lastFrame || now), 60); lastFrame = now;
    if (motion) sceneTime += dt;
    if (!manuallyPaused) interactionTime += dt;
    if (Math.abs(camera - targetCamera) > .5) { camera += (targetCamera - camera) * (motion ? Math.min(1, dt / 170) : 1); updateScene(); } else camera = targetCamera;
    reveal += (revealTarget - reveal) * (motion ? .065 : 1);
    for (let i = pending.length - 1; i >= 0; i--) if (now - pending[i].time >= 1600 || reducedQuery.matches) { drawDab(inkCtx, pending[i], 1600); pending.splice(i, 1); }
    ripples = ripples.filter(e => interactionTime - e.time < 6200); birds = birds.filter(e => interactionTime - e.time < 10000);
    ctx.setTransform(canvas.width / viewW, 0, 0, canvas.height / viewH, 0, -cameraY * canvas.height / viewH);
    drawWorld(ctx, now);
    if(window.InkSceneryActors?.active)updateScene();
    updateShoreControls();
    if (motion || (!manuallyPaused && (journey?.getState(interactionTime/1000)?.active || egrets?.active || window.InkShoreTiger?.active || gate?.active(interactionTime/1000) || window.InkSceneryActors?.active || interactionTime-bellAt<5000 || interactionTime-fallsAt<4500 || interactionTime-lanternAt<9000)) || pending.length || (!manuallyPaused && (ripples.length || birds.length)) || Math.abs(camera - targetCamera) > .5 || Math.abs(reveal - revealTarget) > .01) requestRender();
  }
  window.addEventListener('ink-language-change',()=>requestRender());
  function requestRender() { if (!raf && running && !document.hidden && !encounterActive) raf = requestAnimationFrame(frame); }
  function resize() {
    document.querySelector('.experience').classList.toggle('tiger-closeup', tigerCloseup);
    const r = canvas.getBoundingClientRect(); if (!r.width || !r.height) return;
    const firstResize=!initialized;
    const center = initialized ? camera + viewW / 2 : chapters[0].center;
    const centerY=initialized?cameraY+viewH/2:H/2;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.6);
    canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr);
    ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
    // Never magnify a tiny crop as if it contained new detail. Preserve at least
    // one source pixel per 1.1 CSS pixels; high-DPI backing pixels do not invent art.
    const sourceHeight=window.InkLandscapeScene.sourceHeight || 724;
    const nativeViewH = r.height * H / (sourceHeight * 1.1);
    viewH = panoramic ? H : Math.min(H,Math.max(H*.52,nativeViewH));
    viewW = Math.min(W, r.width / r.height * viewH);
    viewH = viewW / (r.width / r.height);
    canvas.dataset.sourceScale=String(r.height/(viewH/H*sourceHeight));
    cameraY = panoramic ? (H-viewH)/2 : clamp(centerY-viewH/2,0,H-viewH); initialized = true;
    setPosition(firstResize ? Math.max(0, center - viewW / 2) : center - viewW / 2);
  }
  function discover(id, location) {
    if (mode === 'paint') return;
    const now = interactionTime;
    if (id === 'water') { ripples.push({ x: location?.x ?? 3300, y: location?.y ?? 2020, time: now }); ripples = ripples.slice(-8); }
    if(id==='gate'){if(!gate?.open)gate?.toggle(interactionTime/1000);$('gate').setAttribute('aria-pressed','true');window.InkCourtyard?.open();}
    if (id === 'egret' && egrets && !egrets.startle(interactionTime/1000)) return;
    if (id === 'pine') { birds.push({ x: 3920, y: 1150, time: now }); birds = birds.slice(-3); }
    if (id === 'pavilion') { revealTarget = 1; bellAt=interactionTime; }
    if (id === 'falls') {fallsAt=interactionTime;window.InkWaterfall?.splash(interactionTime/1000);}
    if (id === 'lantern') {window.InkSceneryActors?.toggleBoat(interactionTime/1000,{motion:!reducedQuery.matches});$('lantern').setAttribute('aria-pressed',String(window.InkSceneryActors?.sailing));}
    if (id === 'tiger') { tigerEncountered = true; tigerGlanceAt = sceneTime; if(location?.closeup)window.InkEncounter?.open();else triggerShoreTiger(location?.action||'pounce'); }
    const first = !discovered.has(id); discovered.add(id); $(id).classList.add('discovered');
    $('encounters').textContent = `邂逅 ${discovered.size} / ${8+journeyPlaces.length}`;
    $('discovery-mark').textContent = poems[id][0]; $('discovery-text').textContent = poems[id][1];
    $('discovery-kicker').textContent = discovered.size === 8+journeyPlaces.length ? '长卷邂逅 · 山水已识你' : '山水有回声';
    if (first || id !== 'water') $('discovery').hidden = false;
    if (first) announce(poems[id][1]);
    if (soundOn && !encounterActive) window.InkJourneyAudio?.effect(id==='pavilion'?'bell':id==='water'?'ripple':id==='pine'||id==='egret'?'egret':'ripple');
    requestRender();
  }
  function discoverJourney(id, travel=false) {
    if(manuallyPaused)return;
    const place=journeyPlaces.find(p=>p.id===id);if(!place)return;
    if(travel){finish();setMode('explore');tigerCloseup=false;chapter=-1;if(panoramic)changeFraming(false);cameraY=clamp(place.y-viewH*.5,0,H-viewH);setPosition(place.x-viewW/2,false);}
    if(mode==='paint')return;
    if(!journey.trigger(id,interactionTime/1000,{reducedMotion:reducedQuery.matches}))return;
    discovered.add('journey-'+id);$('journey-'+id).classList.add('discovered');
    $('encounters').textContent=`邂逅 ${discovered.size} / ${8+journeyPlaces.length}`;
    $('discovery-mark').textContent=place.mark;$('discovery-text').textContent=place.description;
    $('discovery-kicker').textContent='长卷新游 · '+place.label;$('discovery').hidden=false;
    announce(place.description);
    if(soundOn&&!encounterActive)window.InkJourneyAudio?.effect(id==='chime'?'bell':'ripple');
    requestRender();
  }
  for(const place of journeyPlaces){$('journey-'+place.id).onclick=()=>discoverJourney(place.id);$('excursion-'+place.id).onclick=()=>discoverJourney(place.id,true);}
  landmarks.forEach(item => $(item.id).onclick = () => discover(item.id));
  $('dismiss-discovery').onclick = () => { $('discovery').hidden = true; };
  let shoreStatusKey='';
  function updateShoreControls(){
    const tiger=window.InkShoreTiger, state=tiger?.getState(interactionTime/1000), unavailable=!tiger?.ready||tiger?.failed;
    for(const id of ['shore-pounce','shore-roll','shore-lie'])$(id).disabled=unavailable||manuallyPaused||!!state?.busy;
    $('shore-lie').textContent=state?.resting?'起身':'趴下';$('shore-lie').setAttribute('aria-pressed',String(!!state?.resting));
    const key=unavailable?'loading':manuallyPaused?'paused':state?.busy?(state.action||'playing'):(state?.resting?'resting':'idle');
    if(key!==shoreStatusKey){shoreStatusKey=key;$('shore-tiger-status').textContent=({loading:tiger?.failed?'动作画作暂不可用，可进入山君特写':'正在唤醒山君…',paused:'静观中 · 继续后再邀请它',pounce:'蓄势、跃起，再稳稳落地',roll:'翻个身，在山风里打个滚',lie:'慢慢伏下，歇一会儿',resting:'山君正歇息 · 轻点起身',idle:'轻点山君，或选一式与它玩耍'})[key]||'等它完成这一式';}
  }
  function triggerShoreTiger(action){
    if(manuallyPaused||!window.InkShoreTiger?.ready)return false;
    const ok=window.InkShoreTiger.trigger(action,interactionTime/1000,{motion:!reducedQuery.matches});
    updateShoreControls();requestRender();return ok;
  }
  for(const action of ['pounce','roll','lie'])$('shore-'+action).onclick=()=>{
    finish();setMode('explore');if(panoramic)changeFraming(false);preferredChapter=2;
    cameraY=clamp(1355-viewH*.5,0,H-viewH);setPosition(4420-viewW/2,false);discover('tiger',{action});
  };
  window.addEventListener('ink-shore-tiger-ready',()=>{updateShoreControls();requestRender();});
  function finish() {
    if (current?.length) { strokes.push(current); $('undo').disabled = false; $('clear').disabled = false; }
    down = null; current = null;
  }
  function setMode(value) {
    finish(); mode = value; canvas.classList.toggle('painting', mode === 'paint');
    ['explore', 'paint'].forEach(id => { $(id).classList.toggle('active', id === mode); $(id).setAttribute('aria-pressed', String(id === mode)); });
    $('hint').textContent = mode === 'paint' ? '轻触落墨 · 看墨色在纸上慢慢生长' : '拖动画卷 · 轻点水面，看看谁会回应';
    updateScene(); requestRender();
  }
  function addDab(pt) {
    if (dabCount >= MAX_DABS) { announce('画纸已满，请撤回或清墨后继续。'); return; }
    const d = { ...pt, r: Number($('brush').value) * 1.8, time: performance.now(), angle: (dabCount * 2.399) % Math.PI };
    current.push(d); pending.push(d); dabCount++; requestRender();
  }
  canvas.addEventListener('pointerdown', e => {
    if (e.button !== 0 || down) return;
    canvas.setPointerCapture(e.pointerId); targetCamera = camera;
    down = { id: e.pointerId, x: e.clientX, y: e.clientY, camera, moved: false };
    if (mode === 'paint') { current = []; addDab(point(e)); }
  });
  canvas.addEventListener('pointermove', e => {
    if (!down || e.pointerId !== down.id) return;
    if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) down.moved = true;
    if (mode === 'explore') {
      setPosition(down.camera - (e.clientX - down.x) / viewport().scale);
      const pt = point(e); if (Math.abs(pt.x - 6870) < 140 && Math.abs(pt.y - 700) < 130 && !discovered.has('pavilion')) discover('pavilion');
    } else if (current?.length) {
      const pt = point(e), last = current[current.length - 1], distance = Math.hypot(pt.x - last.x, pt.y - last.y);
      const steps = Math.min(35, Math.floor(distance / Math.max(6, Number($('brush').value) * .4)));
      for (let i = 1; i <= steps; i++) addDab({ x: last.x + (pt.x - last.x) * i / steps, y: last.y + (pt.y - last.y) * i / steps });
    }
  });
  canvas.addEventListener('pointerup', e => {
    if (down?.id !== e.pointerId) return;
    if (mode === 'explore' && !down.moved) {
      const pt = point(e), tiger = tigerTrail();
      const onTiger = window.InkLandscapeScene.ready ? (window.InkShoreTiger?.hit(pt.x,pt.y,interactionTime/1000) ?? Math.hypot(pt.x-4420,pt.y-1355)<240) : pt.x >= tiger.x - 155 && pt.x <= tiger.x + 160 && pt.y >= tiger.y - 145 && pt.y <= tiger.y + 20;
      const near = onTiger ? { id: 'tiger' } : gate?.hit(pt.x,pt.y) ? {id:'gate'} : window.InkSceneryActors?.hitBoat(pt.x,pt.y,interactionTime/1000) ? {id:'lantern'} : egrets?.hit(pt.x,pt.y) ? {id:'egret'} : landmarks.find(l => l.id !== 'tiger' && Math.hypot((pt.x - l.x), (pt.y - l.y)) < 170);
      const journeyHit=journey?.hit(pt.x,pt.y);
      if(journeyHit)discoverJourney(typeof journeyHit==='string'?journeyHit:journeyHit.id);else if (near) discover(near.id, near.id === 'water' ? pt : null); else if (pt.y > 1850 && pt.x > 2300 && pt.x < 6800) discover('water', pt);
    }
    finish();
  });
  canvas.addEventListener('pointercancel', finish);
  canvas.addEventListener('lostpointercapture', () => { if (down) finish(); });
  canvas.addEventListener('keydown', e => {
    if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) { e.preventDefault(); finish(); }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') setPosition(camera + (e.key === 'ArrowLeft' ? -1 : 1) * viewW * .18, true);
    if (e.key === 'Home') setPosition(minX, true); if (e.key === 'End') setPosition(maxCamera(), true);
  });
  document.querySelectorAll('button[data-chapter]').forEach((button, i) => button.onclick = () => { if (tigerCloseup) { tigerCloseup = false; chapter = -1; resize(); } if(panoramic)changeFraming(false); finish(); setMode('explore'); $('discovery').hidden = true; preferredChapter = i; cameraY=clamp([1900,1120,1550,1160][i]-viewH*.5,0,H-viewH); setPosition(chapters[i].center - viewW / 2, true); });
  function changeFraming(next) {
    if (next === panoramic) return;
    finish(); tigerCloseup = false; panoramic = next;
    document.querySelector('.experience').classList.toggle('panorama', panoramic);
    $('framing').setAttribute('aria-pressed', String(!panoramic));
    $('framing').innerHTML = panoramic ? '步入山中 <span>↗</span>' : '远观山河 <span>↙</span>';
    $('framing').title = panoramic ? '切换到近景探索' : '切换到广角远观';
    chapter = -1; resize();
  }
  $('framing').onclick = () => changeFraming(!panoramic);
  $('chapter-action').onclick = () => {
    finish();setMode('explore');
    const id=['egret','falls','tiger','gate'][chapter];
    const place=landmarks.find(item=>item.id===id);
    if(panoramic)changeFraming(false);
    if(id==='tiger'){if(panoramic)changeFraming(false);tigerCloseup=true;chapter=-1;resize();}
    cameraY=clamp(place.y-viewH*.5,0,H-viewH);setPosition(place.x-viewW/2,false);discover(id);
  };
  $('seek-tiger').onclick=()=>{finish();setMode('explore');if(panoramic)changeFraming(false);cameraY=clamp(1355-viewH*.5,0,H-viewH);setPosition(4420-viewW/2,false);discover('tiger',{closeup:true});};
  $('position').addEventListener('input', e => { finish(); setPosition(minX + Number(e.target.value) / 1000 * (maxCamera()-minX)); });
  for(const end of ['left','right'])$('scroll-'+end).onclick=()=>{
    finish();setMode('explore');tigerCloseup=false;chapter=-1;if(panoramic)changeFraming(false);
    $('discovery').hidden=true;preferredChapter=end==='left'?0:3;cameraY=clamp((H-viewH)/2,0,H-viewH);
    setPosition(end==='left'?minX:maxCamera(),false);
    announce(end==='left'?'已到卷首远山，可向右继续游览。':'已到卷尾江天，可向左重游画卷。');
  };
  $('explore').onclick = () => setMode('explore'); $('paint').onclick = () => setMode('paint');
  function rebuild() {
    pending = []; inkCtx.clearRect(minX, 0, W, H); inkTiles.clear(); dabCount = 0;
    strokes.forEach(s => s.forEach(d => { drawDab(inkCtx, d, 1600); dabCount++; }));
    $('undo').disabled = !strokes.length; $('clear').disabled = !strokes.length; requestRender();
  }
  $('undo').onclick = () => { finish(); strokes.pop(); rebuild(); announce('已撤回上一笔。'); };
  $('clear').onclick = () => { finish(); strokes = []; rebuild(); announce('墨迹已清除，山水仍在。'); };
  ['inscription', 'seal'].forEach(id => $(id).addEventListener('input', requestRender));
  $('studio-toggle').onclick = () => { const open = $('studio').hidden; $('studio').hidden = !open; $('studio-toggle').setAttribute('aria-expanded', String(open)); if (!open) setMode('explore'); };
  $('help').onclick = () => { const open = $('guide').hidden; $('guide').hidden = !open; $('help').setAttribute('aria-expanded', String(open)); };
  function updateMotion() { $('motion').setAttribute('aria-pressed', String(motion)); $('motion').textContent = motion ? '静观' : '入境'; $('motion').title = motion ? '暂停画卷动效' : '恢复画卷动效'; lastFrame = 0; updateScene(); requestRender(); }
  $('motion').onclick = () => { motion = !motion; manuallyPaused=!motion; updateMotion(); };
  reducedQuery.addEventListener?.('change', e => { motion = !e.matches; manuallyPaused=false; updateMotion(); });
  function updateSoundUI() {
    $('sound').setAttribute('aria-pressed', String(soundOn));
    $('sound').innerHTML = soundOn ? '静音 <span aria-hidden="true">≈</span>' : '听山 <span aria-hidden="true">◌</span>';
    $('sound').title = soundOn ? '关闭全部环境音' : '开启合成风、水、鸟鸣；寒山境含钟声与无词吟唱';
  }
  function stopSound() { soundGeneration++; window.InkJourneyAudio?.suspend(); soundOn=false; updateSoundUI(); }
  async function toggleSound() {
    if(soundOn || soundBusy){stopSound();return;}
    const generation=++soundGeneration;soundBusy=true;
    try {
      const enabled=await window.InkJourneyAudio?.enable();
      if(generation!==soundGeneration)return;
      if(document.hidden||encounterActive||!running){stopSound();return;}
      soundOn=!!enabled;window.InkJourneyAudio?.setScene(chapter);updateSoundUI();
      if(!soundOn)announce('当前环境无法播放声音，仍可继续游览。');
    } catch {stopSound();announce('声音暂不可用。');}
    finally {soundBusy=false;}
  }
  $('sound').onclick = toggleSound;
  window.addEventListener('ink-journey-sound',e=>{if(!e.detail.enabled){soundOn=false;updateSoundUI();}});
  window.addEventListener('ink-temple', e => {
    encounterActive=e.detail.open;finish();lastFrame=0;
    if(encounterActive){if(raf)cancelAnimationFrame(raf);raf=0;stopSound();}
    else requestRender();
  });
  window.addEventListener('ink-encounter', e => {
    encounterActive=e.detail.open;finish();lastFrame=0;
    if(encounterActive){if(raf)cancelAnimationFrame(raf);raf=0;stopSound();}
    else requestRender();
  });
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){finish();if(raf)cancelAnimationFrame(raf);raf=0;stopSound();}
    else {lastFrame=0;requestRender();}
  });
  window.addEventListener('pagehide',()=>{running=false;if(raf)cancelAnimationFrame(raf);raf=0;stopSound();});
  window.addEventListener('pageshow',()=>{running=true;lastFrame=0;requestRender();});
  $('export').disabled = true;
  $('export').onclick = () => {
    if (!art || !window.InkSceneryActors?.ready || (!window.InkLandscapeScene.ready && !window.InkLandscapeScene.failed)) return;
    const out = document.createElement('canvas'); out.width = Math.round(viewW / viewH * 1200); out.height = 1200;
    const exportCtx = out.getContext('2d');
    exportCtx.setTransform(out.width / viewW, 0, 0, 1200 / viewH, 0, -cameraY * 1200 / viewH);
    drawWorld(exportCtx, performance.now(), true);
    out.toBlob(blob => {
      if (!blob) { announce('导出失败，请重试。'); return; }
      const url = URL.createObjectURL(blob), link = document.createElement('a'); link.href = url; link.download = panoramic ? 'ink-journey-panorama.png' : tigerCloseup ? 'ink-journey-tiger.png' : scenicEnd ? `ink-journey-${scenicEnd}.png` : `ink-journey-${chapter + 1}.png`;
      document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 60000);
      announce('此刻山水已生成 PNG，请查看下载。');
    }, 'image/png');
  };
  function landscapeReady() {
    if (art && window.InkSceneryActors?.ready && (window.InkLandscapeScene.ready || window.InkLandscapeScene.failed)) {
      $('loading').classList.add('ready'); $('export').disabled = false;
      if (window.InkLandscapeScene.failed) announce('山水画卷未能载入，请刷新后重试。题字与交互仍可使用。');
      else if(window.InkSceneryActors.failed)announce('舟或山君插画未能载入，已使用简笔备用图像；山君特写仍可进入。');
    }
    requestRender();
  }
  window.addEventListener('ink-landscape-ready', landscapeReady);
  window.addEventListener('ink-river-ready', requestRender);
  window.addEventListener('ink-actors-ready',landscapeReady);
  // Allow the loading screen to paint before preparing the cached landscape.
  updateMotion();
  requestAnimationFrame(() => {
    try {
      art = window.InkArt.create(); glade = window.InkGlade.create();
      // Prepare bounded portrait textures behind the existing loading state,
      // so the first approach never stalls midway through its reveal.
      const warm = document.createElement('canvas'); warm.width = warm.height = 1;
      window.InkTigerFace?.draw(warm.getContext('2d'), 0, 0, 1, 0, { mouth: 0, menace: 0, reach: 0 });
      new ResizeObserver(resize).observe(canvas); resize(); landscapeReady();
    }
    catch (error) { $('loading').textContent = '画卷未能展开，请刷新页面再试。'; console.error(error); }
  });
})();
