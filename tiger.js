/* Original hand-drawn Canvas tiger. No assets, dependencies, timers, or network.
 * InkTiger.draw(ctx, x, y, seconds, { scale, glance, moving })
 * x/y is the ground-centre; the tiger faces right. Positive glance turns its
 * face towards the viewer. Caller owns time, transforms and motion preferences.
 */
(() => {
  'use strict';
  const TAU = Math.PI * 2;
  const INK = '#30372f', PAPER = '#eeecdf';
  const paths = new Map();
  const P = d => { if (!paths.has(d)) { if(paths.size>=768)paths.clear(); paths.set(d,new Path2D(d)); } return paths.get(d); };
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const mix = (a, b, t) => a + (b - a) * t;
  const smooth = t => t * t * (3 - 2 * t);
  let seed = 728104;
  const rand = () => ((seed = Math.imul(seed, 1664525) + 1013904223 >>> 0) / 4294967296);
  const fur = Array.from({ length: 650 }, () => ({ x: rand() * 197 - 96, y: rand() * 87 - 134, l: 1.2 + rand() * 3.1, a: rand(), w: .25 + rand() * .36 }));
  const faceFur = Array.from({ length: 150 }, () => ({ x: rand() * 70 - 12, y: rand() * 72 - 43, a: rand() }));

  function shape(c, d, fill, outline = .8, alpha = 1) {
    c.save(); c.globalAlpha *= alpha; const p = typeof d === 'string' ? P(d) : d;
    if (fill) { c.fillStyle = fill; c.fill(p); }
    if (outline) {
      c.lineJoin = 'round'; c.lineCap = 'round';
      c.strokeStyle = 'rgba(61,60,43,.23)'; c.lineWidth = outline * 1.8; c.stroke(p);
      c.strokeStyle = 'rgba(50,55,44,.39)'; c.lineWidth = outline * .52; c.stroke(p);
    }
    c.restore();
  }
  function line(c, d, color, width = 1) {
    c.strokeStyle = color; c.lineWidth = width; c.lineCap = 'round'; c.lineJoin = 'round'; c.stroke(P(d));
  }
  function ellipse(c, x, y, rx, ry, color, rotation = 0) {
    c.fillStyle = color; c.beginPath(); c.ellipse(x, y, rx, ry, rotation, 0, TAU); c.fill();
  }
  function wash(c, x, y, rx, ry, rgb, opacity) {
    c.save(); c.translate(x, y); c.scale(rx, ry);
    const g = c.createRadialGradient(0, 0, .05, 0, 0, 1);
    g.addColorStop(0, `rgba(${rgb},${opacity})`); g.addColorStop(.58, `rgba(${rgb},${opacity * .6})`); g.addColorStop(1, `rgba(${rgb},0)`);
    c.fillStyle = g; c.fillRect(-1, -1, 2, 2); c.restore();
  }
  function stripe(c, d, alpha = .91) {
    c.save(); c.shadowColor='rgba(48,55,47,.14)'; c.shadowBlur=.75; shape(c, d, INK, .15, alpha); c.restore();
    // A pale, broken paper tooth takes the hard digital edge off each stroke.
  }

  function footAt(t, phase, anchor, moving, far) {
    const p = moving ? ((t * .34 + phase) % 1 + 1) % 1 : phase;
    const stance = .67;
    let dx, lift;
    if (p < stance) { dx = 21 - 42 * (p / stance); lift = 0; }
    else { const q = (p - stance) / (1 - stance); dx = -21 + 42 * smooth(q); lift = Math.sin(Math.PI * q) * 15.5; }
    if (!moving) { dx *= .38; lift = 0; }
    return { x: anchor + dx, y: -lift - (far ? 3 : 0), lift, phase: p };
  }
  function knee(a, b, l1, l2, bend) {
    let dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
    d = clamp(d, .01, l1 + l2 - .1);
    const along = (l1 * l1 - l2 * l2 + d * d) / (2 * d);
    const h = Math.sqrt(Math.max(0, l1 * l1 - along * along));
    const ux = dx / Math.hypot(dx, dy), uy = dy / Math.hypot(dx, dy);
    return { x: a.x + ux * along + uy * h * bend, y: a.y + uy * along - ux * h * bend };
  }
  function ring(c, a, b, q, r, width, reverse = false) {
    const x = mix(a.x, b.x, q), y = mix(a.y, b.y, q);
    c.save(); c.translate(x, y); c.rotate(Math.atan2(b.y - a.y, b.x - a.x) - Math.PI / 2);
    stripe(c, `M ${-r - 3} ${-width * .7} Q ${-r * .2} ${width * .7} ${r + 3} ${-width * .4} L ${r + 3} ${width * .5} Q ${r * .1} ${width * 1.3} ${reverse ? -r * .5 : -r - 3} ${width * .3} Z`, .83);
    c.restore();
  }
  function leg(c, foot, isFront, far, breath) {
    const root = { x: isFront ? 53 : -64, y: (isFront ? -90 : -88) + breath };
    const ankle = { x: foot.x - (isFront ? 2 : 7), y: foot.y - (isFront ? 13 : 19) };
    const joint = knee(root, ankle, isFront ? 43 : 44, isFront ? 38 : 43, isFront ? -1 : 1);
    const rw = isFront ? 15.5 : 19, kw = isFront ? 9 : 12, aw = isFront ? 5.8 : 5.2;
    // A tapered ribbon follows the bones. Normals at the knee and hock
    // keep both sides continuous even in the sharply flexed recovery pose.
    const joints=[root,joint,ankle,{x:foot.x-1,y:foot.y-5}];
    const radii=[rw,kw,aw,5.5];
    const sides=[[],[]];
    joints.forEach((p,i)=>{
      const prev=joints[Math.max(0,i-1)],next=joints[Math.min(joints.length-1,i+1)];
      const dx=next.x-prev.x,dy=next.y-prev.y,l=Math.hypot(dx,dy)||1;
      const nx=dy/l,ny=-dx/l;
      sides[0].push({x:p.x-nx*radii[i],y:p.y-ny*radii[i]});
      sides[1].push({x:p.x+nx*radii[i],y:p.y+ny*radii[i]});
    });
    const edge=arr=>{
      let d='';
      for(let i=1;i<arr.length-1;i++)d+=` Q ${arr[i].x} ${arr[i].y} ${(arr[i].x+arr[i+1].x)/2} ${(arr[i].y+arr[i+1].y)/2}`;
      const end=arr[arr.length-1];return d+` L ${end.x} ${end.y}`;
    };
    const d=`M ${sides[0][0].x} ${sides[0][0].y}${edge(sides[0])} L ${sides[1][3].x} ${sides[1][3].y}${edge(sides[1].slice().reverse())} Z`;
    c.save();
    const grad = c.createLinearGradient(root.x - 15, root.y, foot.x + 14, foot.y);
    grad.addColorStop(0, far ? '#847f61' : '#b49a65'); grad.addColorStop(.56, far ? '#a09a78' : '#c6b58b'); grad.addColorStop(1, far ? '#b3ae91' : '#ded5b5');
    shape(c, d, grad, far ? .35 : .48);
    c.save(); c.clip(P(d));
    // The inner leg is ivory; each dark band wraps around the joint.
    line(c, `M ${joint.x + 5} ${joint.y - 12} Q ${ankle.x + 10} ${ankle.y - 10} ${foot.x + 8} ${foot.y - 3}`, far ? 'rgba(220,215,190,.15)' : 'rgba(241,234,207,.42)', 8);
    ring(c, root, joint, .38, rw * .8, 5.5);
    ring(c, root, joint, .71, rw * .66, 4.6, true);
    ring(c, joint, ankle, .18, kw, 4.1);
    ring(c, joint, ankle, .51, kw * .7, 3.1, true);
    ring(c, joint, ankle, .8, aw + 1, 2.7);
    for (let i = 0; i < 17; i++) {
      const q = i / 17, xx = mix(joint.x, ankle.x, q), yy = mix(joint.y, ankle.y, q);
      line(c, `M ${xx - 3} ${yy} l 1.5 3`, 'rgba(82,76,50,.14)', .35);
    }
    c.restore();
    shape(c,`M ${foot.x-6} ${foot.y-8} Q ${foot.x+1} ${foot.y-9} ${foot.x+7} ${foot.y-7}
      Q ${foot.x+15} ${foot.y-8} ${foot.x+17} ${foot.y-2} Q ${foot.x+18} ${foot.y+1} ${foot.x+11} ${foot.y+1}
      L ${foot.x-2} ${foot.y+1} Q ${foot.x-8} ${foot.y} ${foot.x-6} ${foot.y-8} Z`,far?'#b0aa8e':'#dcd3b4',0);
    line(c,`M ${foot.x-5} ${foot.y-.5} Q ${foot.x+5} ${foot.y+1.6} ${foot.x+14} ${foot.y+.3}`,'rgba(57,61,45,.28)',.45);
    // Short individual toe lines, never visible claws on a walking tiger.
    for (let i = 0; i < 3; i++) line(c, `M ${foot.x + 3 + i * 4} ${foot.y - 3.2} q 1.5 1.1 .9 3.1`, far ? 'rgba(58,60,46,.35)' : 'rgba(48,55,44,.64)', .55);
    if (!far) line(c, `M ${joint.x - kw + 1} ${joint.y - 2} Q ${joint.x - kw - 1} ${joint.y + 7} ${ankle.x - aw} ${ankle.y - 3}`, 'rgba(60,62,44,.24)', .6);
    c.restore();
  }

  function tail(c, t, breath) {
    const wave = Math.sin(t * .63), curl = Math.sin(t * .47 + .6);
    const points = [];
    const a = {x: -78, y: -100 + breath}, b = {x: -125, y: -107 + breath + wave * 5},
      d = {x: -161 + curl * 7, y: -52 + wave * 11}, e = {x: -174 + curl * 5, y: -79 + wave * 9};
    const tip = {x: -177 + curl * 5, y: -91 + wave * 7};
    // Two joined cubic curves keep the long tail supple and tapered.
    for (let i = 0; i <= 36; i++) {
      const u = i / 36, v = 1 - u;
      points.push({x:v*v*v*a.x+3*v*v*u*b.x+3*v*u*u*d.x+u*u*u*e.x,
        y:v*v*v*a.y+3*v*v*u*b.y+3*v*u*u*d.y+u*u*u*e.y});
    }
    points.push({x: mix(e.x, tip.x, .4), y: mix(e.y, tip.y, .4)}, tip);
    const edges = [[],[]];
    for (let i = 0; i < points.length; i++) {
      const prev = points[Math.max(0,i-1)], next = points[Math.min(points.length-1,i+1)];
      const dx=next.x-prev.x,dy=next.y-prev.y,l=Math.hypot(dx,dy)||1,r=mix(5.6,1.4,i/(points.length-1));
      edges[0].push([points[i].x-dy/l*r,points[i].y+dx/l*r]); edges[1].push([points[i].x+dy/l*r,points[i].y-dx/l*r]);
    }
    const dPath = `M ${edges[0].map(p=>p.join(' ')).join(' L ')} L ${edges[1].reverse().map(p=>p.join(' ')).join(' L ')} Z`;
    shape(c, dPath, '#b5a274', .65);
    c.save(); c.clip(P(dPath));
    points.forEach((p,i)=>{if (i > 3 && i % 4 === 0) {const n=points[Math.min(i+1,points.length-1)],r=mix(5.8,2.1,i/(points.length-1));c.save();c.translate(p.x,p.y);c.rotate(Math.atan2(n.y-p.y,n.x-p.x));shape(c,`M -2 ${-r-2} Q 2 0 -1 ${r+2} L 3 ${r+2} Q 5 0 2 ${-r-2} Z`,INK,0,.9);c.restore();}});
    line(c,`M ${points[points.length-4].x} ${points[points.length-4].y} Q ${e.x} ${e.y} ${tip.x} ${tip.y}`,INK,4.1);
    ellipse(c,tip.x,tip.y,1.5,1.5,INK);
    c.restore();
  }

  const BODY = 'M -88 -94 C -88 -108 -77 -117 -62 -119 C -41 -124 -20 -117 4 -118 C 23 -120 35 -131 51 -127 C 67 -124 75 -115 84 -107 C 89 -96 85 -81 76 -68 Q 73 -54 60 -53 C 46 -52 34 -62 20 -65 Q -8 -70 -25 -65 C -39 -60 -51 -56 -68 -64 Q -87 -73 -88 -94 Z';
  const STRIPES = [
    'M -79 -114 Q -69 -113 -64 -101 Q -65 -91 -72 -85 Q -67 -96 -73 -102 L -83 -106 Z',
    'M -66 -119 Q -55 -115 -52 -106 Q -49 -98 -54 -89 Q -55 -99 -61 -104 L -72 -112 Z',
    'M -48 -120 Q -37 -115 -39 -102 Q -44 -93 -39 -85 Q -49 -90 -48 -103 Q -48 -111 -53 -117 Z',
    'M -31 -119 Q -21 -112 -23 -98 Q -26 -92 -22 -80 Q -31 -87 -31 -98 Q -27 -109 -35 -117 Z',
    'M -16 -118 Q -8 -111 -9 -101 Q -12 -90 -7 -83 Q -16 -88 -17 -100 Q -12 -109 -20 -118 Z',
    'M 1 -119 Q 9 -115 10 -105 Q 11 -99 7 -91 Q 5 -99 3 -104 Q 4 -112 -2 -118 Z',
    'M 18 -122 Q 25 -116 24 -108 Q 21 -102 27 -94 L 32 -84 Q 20 -89 19 -98 Q 15 -103 17 -109 L 13 -119 Z',
    'M 35 -126 Q 45 -120 42 -109 Q 36 -101 40 -93 Q 31 -98 34 -109 Q 38 -117 30 -123 Z',
    'M 52 -126 Q 60 -122 60 -112 Q 54 -103 56 -96 Q 47 -102 51 -112 Q 56 -118 47 -123 Z',
    'M 67 -119 Q 76 -112 75 -105 Q 69 -98 70 -88 L 65 -83 Q 61 -98 67 -105 Q 69 -111 61 -119 Z',
    'M -84 -90 Q -74 -84 -65 -84 Q -56 -84 -53 -75 Q -64 -80 -71 -78 L -80 -82 Z',
    'M -72 -67 Q -65 -71 -60 -75 Q -52 -79 -45 -83 Q -49 -73 -57 -69 L -64 -62 Z',
    'M -43 -63 Q -41 -74 -34 -81 Q -32 -72 -36 -65 L -38 -61 Z',
    'M -21 -66 Q -18 -76 -21 -83 Q -11 -78 -14 -67 Z',
    'M 1 -68 Q -2 -79 2 -85 Q 7 -76 8 -66 Z',
    'M 27 -63 Q 30 -71 27 -79 Q 38 -74 38 -59 Z',
    'M 45 -56 Q 43 -65 47 -75 Q 54 -82 62 -85 Q 55 -74 55 -66 Q 56 -60 58 -54 Z',
    'M 69 -59 Q 63 -68 70 -77 Q 75 -82 81 -83 Q 78 -74 76 -69 L 74 -61 Z'
  ];
  function paintBody(c) {
    c.save();
    const g=c.createLinearGradient(0,-127,0,-51);
    g.addColorStop(0,'#9a8656');g.addColorStop(.26,'#b59b63');g.addColorStop(.67,'#c2ac79');g.addColorStop(1,'#dfd5b3');
    shape(c,BODY,g,0);
    line(c,'M -87 -91 Q -92 -115 -65 -119 Q -43 -122 -25 -118 Q 8 -114 33 -125 Q 55 -134 74 -115','rgba(58,62,44,.34)',.8);
    c.save();c.clip(P(BODY));
    wash(c,-54,-83,40,40,'103,98,65',.22);wash(c,40,-89,33,38,'117,105,63',.23);wash(c,-10,-98,63,23,'211,190,132',.25);
    // Ragged warm ivory underneath, following the ribs and chest.
    shape(c,'M -80 -69 Q -63 -67 -58 -72 L -56 -68 L -52 -72 L -46 -69 Q -28 -73 -16 -76 L -12 -73 L -8 -76 Q 7 -75 23 -71 Q 43 -62 48 -66 L 51 -63 L 54 -65 Q 65 -67 77 -80 L 81 -72 L 76 -48 L -74 -47 Z','#e3d9ba',0,.86);
    STRIPES.forEach((s,i)=>stripe(c,s,.82+(i%4)*.035));
    wash(c,-65,-85,23,30,'70,76,53',.14);wash(c,48,-94,27,37,'72,78,51',.15);
    wash(c,-21,-103,36,23,'233,218,174',.19);wash(c,0,-73,68,10,'230,219,184',.13);
    // Uneven pigment pools and lifted strokes, baked into the still coat.
    for(let i=0;i<30;i++) {
      const f=fur[i*9], radius=3+(i%5)*1.5;
      wash(c,f.x,f.y,radius*2,radius,'225,210,165',.04+(i%3)*.015);
    }
    // Shoulder blades, haunch and ribs are suggested by strokes rather than circles.
    line(c,'M 44 -114 Q 33 -104 37 -88 Q 40 -79 49 -78','rgba(74,74,48,.19)',1.1);
    wash(c,58,-68,16,19,'177,154,103',.28);
    line(c,'M -64 -105 Q -48 -99 -47 -87 Q -45 -79 -52 -73','rgba(83,78,47,.25)',1.05);
    line(c,'M -38 -78 Q -9 -84 17 -77','rgba(243,226,180,.32)',2.2);
    line(c,'M -80 -112 Q -57 -121 -32 -116 Q -9 -112 14 -116','rgba(244,226,172,.3)',1.2);
    for (const f of fur) {
      const angle = f.x < -38 ? .66 : f.x > 32 ? 1.03 : .22;
      c.strokeStyle=f.a>.52?'rgba(245,235,200,.16)':'rgba(57,62,45,.09)';c.lineWidth=f.w;
      c.beginPath();c.moveTo(f.x,f.y);c.lineTo(f.x+Math.cos(angle)*f.l,f.y+Math.sin(angle)*f.l);c.stroke();
    }
    c.restore();
    // A sparse dry-brush edge creates a natural coat without a fuzzy halo.
    for(let i=0;i<35;i++) {
      const xx=-65+i*3.6, yy=-119+(Math.sin(i*.22)*2.1);
      if(xx<26)line(c,`M ${xx} ${yy+.5} l ${-1.8+i%3*.4} -1.1`,'rgba(69,69,46,.24)',.37);
    }
    c.restore();
  }

  let bodyLayer=null, cacheAttempted=false;
  function body(c, breath) {
    // The still torso is rasterised once at 3×. Fixed multi-scale pigment and
    // paper tooth give a real wash surface, rather than animated digital noise.
    if(!cacheAttempted) {
      cacheAttempted=true;
      try {
        const layer=typeof OffscreenCanvas!=='undefined'?new OffscreenCanvas(600,270):
          typeof document!=='undefined'?document.createElement('canvas'):null;
        if(layer) {
          layer.width=600;layer.height=270;
          const b=layer.getContext('2d',{willReadFrequently:true});
          b.setTransform(3,0,0,3,291,405);paintBody(b);
          const im=b.getImageData(0,0,600,270),d=im.data;
          for(let y=0;y<270;y++)for(let x=0;x<600;x++) {
            const i=(y*600+x)*4;if(!d[i+3])continue;
            const hash=Math.sin(x*12.9898+y*78.233)*43758.5453;
            const grain=hash-Math.floor(hash);
            const cloud=(Math.sin(x*.035+Math.sin(y*.049)*1.8)+Math.sin(y*.027+x*.013)+Math.sin(x*.069-y*.043))/3;
            const fleck=grain>.83?(grain-.83)*1.65:0;
            const pale=.095+cloud*.095+fleck;
            d[i]=d[i]*(1-pale)+229*pale;
            d[i+1]=d[i+1]*(1-pale)+221*pale;
            d[i+2]=d[i+2]*(1-pale)+190*pale;
            d[i+3]*=.91+grain*.09;
          }
          b.putImageData(im,0,0);bodyLayer=layer;
        }
      } catch(_) { bodyLayer=null; }
    }
    c.save();c.translate(0,breath);
    if(bodyLayer)c.drawImage(bodyLayer,-97,-135,200,90);else paintBody(c);
    c.restore();
  }

  function head(c, t, glance, breath) {
    const g=clamp(glance,0,1), low=clamp(-glance,0,1);
    c.save();c.translate(74,-92+breath+Math.sin(t*.76)*.5);c.rotate(-.07+g*.045+low*.08);c.scale(.92,.92);
    // Far ear stays behind the skull; its small white eye-spot is characteristic.
    shape(c,'M 25 -29 Q 27 -39 33 -39 Q 40 -38 39 -31 L 35 -26 Z','#555b44',.6);
    ellipse(c,32,-34,2.5,2.8,'#d6d3b7',-.25);
    const nose=mix(55,45,g), farX=mix(43,54,g);
    const headD=`M -4 -14 Q -9 -29 5 -35 Q 17 -41 32 -33 Q ${farX} -32 ${mix(43,53,g)} -21 Q ${mix(45,52,g)} -12 ${nose-2} -6 L ${nose+1} 2 Q ${nose+2} 9 ${nose-7} 13 Q ${nose-10} 23 ${mix(27,26,g)} 25 Q 14 27 7 21 L 6 18 L 2 18 L 1 14 Q -11 4 -4 -14 Z`;
    const gold=c.createLinearGradient(7,-37,30,27);gold.addColorStop(0,'#ac9058');gold.addColorStop(.5,'#c6ab6e');gold.addColorStop(1,'#e1d3ad');
    shape(c,headD,gold,.52);
    c.save();c.clip(P(headD));
    wash(c,9,-7,20,31,'95,92,61',.23);
    // The ruff is white around the jaw, with hand-cut fur tips.
    shape(c,`M -5 2 Q 9 6 15 0 Q 20 -4 ${mix(30,27,g)} 1 L ${mix(36,29,g)} 13 L ${mix(40,30,g)} 17 Q 24 23 16 29 L -5 22 Z`,'#e7e1c8',0,.96);
    shape(c,`M 21 -19 Q 27 -23 35 -19 L 34 -17 Q 27 -20 22 -16 Z`,'#e4d8b5',0,.72);
    // Forehead, temple and cheek stripes vary in thickness like a loaded brush.
    stripe(c,'M 8 -34 Q 13 -31 17 -29 Q 21 -25 18 -19 Q 17 -25 10 -27 L 4 -31 Z');
    stripe(c,`M 21 -36 Q 29 -32 ${mix(39,47,g)} -31 L ${mix(41,49,g)} -27 Q 30 -29 25 -28 L 21 -31 Z`);
    stripe(c,`M 26 -26 Q 33 -25 ${mix(44,52,g)} -23 L ${mix(44,53,g)} -19 Q 35 -22 27 -21 L 22 -23 Z`);
    stripe(c,'M -4 -22 Q 8 -20 11 -12 Q 12 -8 9 -5 Q 7 -12 -4 -14 Z');
    stripe(c,'M -6 -7 Q 1 -10 8 -3 L 16 2 Q 7 2 0 -1 L -6 -1 Z');
    stripe(c,'M -3 6 Q 6 4 13 8 L 21 11 Q 12 12 4 10 L -1 12 Z',.94);
    stripe(c,'M 4 15 Q 11 12 19 16 L 24 18 Q 14 20 8 18 Z',.84);
    if(g>.05) {
      c.globalAlpha*=g;
      stripe(c,'M 55 -15 Q 48 -7 48 -1 Q 54 -2 59 -8 L 62 -15 Z');
      stripe(c,'M 57 1 Q 50 3 48 9 Q 55 9 61 4 Z');
      c.globalAlpha/=g;
    }
    // Fine, fixed fur texture. It must never flicker between animation frames.
    for(const f of faceFur)line(c,`M ${f.x} ${f.y} l ${f.x<17?-1.8:1.2} 2.1`,f.a>.5?'rgba(246,237,202,.32)':'rgba(53,60,44,.14)',.35);
    c.restore();
    // Near ear: rounded, with a real dark back, pale ocellus and furry lower rim.
    shape(c,'M 1 -29 Q -4 -32 -3 -38 Q -2 -43 3 -42 Q 10 -42 11 -35 Q 10 -30 7 -28 Z','#414b3d',.85);
    shape(c,'M 1 -38 Q 4 -41 7 -36 Q 8 -33 4 -33 Q 1 -33 1 -36 Z','#d9d8bf',0,.94);
    line(c,'M -2 -37 Q -1 -40 2 -40','rgba(230,219,180,.48)',.7);
    line(c,'M -4 -30 l 1 4 M 0 -29 l .5 3 M 5 -28 l -.7 3','rgba(72,77,52,.6)',.55);
    // Small eyes sit under a heavy brow; just one amber light is visible.
    const ex=mix(31,26,g), ey=mix(-14,-13,g);
    shape(c,`M ${ex-5} ${ey-.5} Q ${ex} ${ey-2.2} ${ex+4} ${ey-1} Q ${ex+1} ${ey+1.2} ${ex-3} ${ey+.6} Z`,'#bca75b',0);
    line(c,`M ${ex-7} ${ey-2.3} Q ${ex-1} ${ey-3.2} ${ex+5} ${ey-.2}`,INK,1.7);
    ellipse(c,ex+1,ey-.45,.8,1.25,'#202b25',.16);ellipse(c,ex+1.6,ey-.9,.28,.28,'#e9e1b8');
    line(c,`M ${ex-4} ${ey+1} Q ${ex+1} ${ey+1.8} ${ex+4} ${ey-1}`,'rgba(49,56,43,.5)',.4);
    line(c,`M ${ex+4} ${ey-1} Q ${ex+5.5} ${ey+3} ${ex+7} ${ey+4}`,'#434a36',1.35);
    if(g>.35) {
      c.save();c.clip(P(headD));c.globalAlpha*=smooth((g-.35)/.65);
      shape(c,'M 42 -13 Q 47 -17 52 -14 Q 49 -10 44 -11 Z','#c7b875',0);
      line(c,'M 42 -13 Q 46 -15 52 -14',INK,1.35);ellipse(c,46.5,-13,1,1.8,'#273128');
      line(c,'M 41 -12 Q 40 -8 38 -6','#464e38',.85);c.restore();
    }
    // The blunt bridge, twin whisker pads, broad nose and chin define a tiger.
    const nx=nose-2, ny=4;
    const mx=mix(40,35,g);
    shape(c,`M ${mx-8} 2 Q ${mx-3} -3 ${nx-5} 0 Q ${nx+1} 0 ${nx+2} 6 Q ${nx} 13 ${mx+3} 15 Q ${mx-6} 14 ${mx-8} 8 Z`,'#e5dfc7',0);
    if(g>.08){c.save();c.globalAlpha*=g;shape(c,'M 41 3 Q 48 -1 52 5 Q 54 11 47 15 L 38 14 Z','#e4dcc3',0);c.restore();}
    const noseLeft=mix(nx-4,34,g), noseRight=mix(nx+3,43,g), noseY=mix(1,5,g);
    shape(c,`M ${noseLeft} ${noseY} Q ${(noseLeft+noseRight)/2} ${noseY-1.2} ${noseRight} ${noseY+.2} L ${mix(nx+1,38.5,g)} ${noseY+5.6} Q ${mix(nx-3,35,g)} ${noseY+6} ${noseLeft} ${noseY+3} Z`,'#51483b',.45);
    line(c,`M ${mix(nx,38.5,g)} ${noseY+5} l -.4 3.8 L ${mx-4} 12.5`,'rgba(55,60,46,.82)',.7);
    line(c,`M ${mx-8} 20.5 Q ${mx+1} 21.4 ${nx-6} 19.5`,'rgba(56,61,45,.32)',.5);
    // Two staggered rows of whisker follicles.
    for(let i=0;i<8;i++) {
      const xx=mx-3+(i%4)*2.7, yy=6+Math.floor(i/4)*3.4+(i%4)*.3;
      ellipse(c,xx,yy,.55,.45,'rgba(59,60,45,.73)');
    }
    for(let i=0;i<6;i++) {
      const startX=mx-1+(i%3)*2, startY=7+i*.8;
      line(c,`M ${startX} ${startY} Q ${startX+12} ${startY-6+i*1.2} ${nose+13-i*.9} ${startY-7+i*2.1}`,'rgba(234,232,205,.84)',.48);
      if(i<4)line(c,`M ${mx-4} ${8+i} Q ${mx-13} ${9+i*2} ${mx-24} ${7+i*4}`,'rgba(235,232,206,.76)',.44);
    }
    // A few ruff hairs finish the contour without tracing a mechanical border.
    line(c,'M 5 17 l -3 4 M 9 19 l -1 5 M 14 21 l -1 5 M 19 20 l .5 3','rgba(72,75,52,.45)',.5);
    c.restore();
  }

  function draw(ctx, x, y, time, options = {}) {
    if (!ctx || !Number.isFinite(x) || !Number.isFinite(y)) return;
    const {scale=1, glance=0, moving=true}=options;
    const t=Number.isFinite(time)?time:0, s=Number.isFinite(scale)?scale:1;
    const breath=Math.sin(t*1.42)*.75 + (moving?Math.sin(t*.34*TAU*2)*.65:0);
    const feet={
      frontNear:footAt(t,.02,55,moving,false),hindNear:footAt(t,.27,-65,moving,false),
      frontFar:footAt(t,.52,55,moving,true),hindFar:footAt(t,.77,-65,moving,true)
    };
    ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.lineCap='round';ctx.lineJoin='round';
    wash(ctx,2,3,101,8,'48,55,47',.09);
    for(const f of Object.values(feet))if(f.lift<1)wash(ctx,f.x+4,f.y+2,14,3,'45,51,42',.14);
    tail(ctx,t,breath);
    leg(ctx,feet.hindFar,false,true,breath);leg(ctx,feet.frontFar,true,true,breath);
    leg(ctx,feet.hindNear,false,false,breath);leg(ctx,feet.frontNear,true,false,breath);
    body(ctx,breath);
    head(ctx,t,Number.isFinite(glance)?glance:0,breath);
    ctx.restore();
  }
  window.InkTiger=Object.freeze({draw});
})();
