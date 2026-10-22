/* Generated illustration poses with continuous, anatomy-weighted texture articulation.
 * The background stays fixed while chest, muzzle and ears move within one connected mesh. */
'use strict';
(() => {
  const images = {}, states = { alert: false, roar: false, swipe: false };
  let failed = false;
  for (const key of ['alert', 'roar', 'swipe']) {
    const image = new Image(); images[key] = image;
    image.onload = () => { states[key] = true; window.dispatchEvent(new CustomEvent('ink-tiger-art-ready')); };
    image.onerror = () => { failed = true; window.dispatchEvent(new CustomEvent('ink-tiger-art-ready')); };
    image.src = window.InkTigerImages[key];
  }
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = v => { v = clamp(v); return v * v * (3 - 2 * v); };
  // Exported framing also positions the actual DOM hotspots and hit tests.
  function layout(w, h, { time = 0, phase = 'idle', action = null, phaseTime = 0, reduced = false, attention = { x: 0, y: 0 } } = {}) {
    const a = phaseTime, entering = phase === 'approach' ? ease(a / 2.8) : 1;
    let zoom = 1.065, blend = 0, swipeBlend = 0, panX = 0, panY = 0, roll = 0;
    if (!reduced) {
      zoom = 1.015 + entering * .05 + Math.sin(time * 1.45) * .002;
      panX = clamp(attention.x || 0, -1, 1) * w * .014;
      panY = clamp(attention.y || 0, -1, 1) * h * .012;
      if (phase === 'anticipation') {
        const p = ease(a / (action === 'lunge' ? .66 : action === 'swipe' ? .38 : .48));
        zoom -= p * (action === 'lunge' ? .022 : .01);
        if (action === 'swipe') { panX -= w * .018 * p; roll = -.008 * p; }
        blend = action === 'roar' ? p * .15 : 0;
      } else if (phase === 'action') {
        if (action === 'roar') {
          const hold = ease(a / .24) * (1 - ease((a - .95) / .5));
          blend = .15 + hold * .85; zoom += Math.sin(clamp(a / 1.45) * Math.PI) * .028;
        } else if (action === 'swipe') {
          const sweep = Math.sin(clamp(a / .82) * Math.PI);
          panX += (w < h ? h * .24 : w * .032) * sweep; panY += h * .012 * sweep; roll = .012 * sweep;
          zoom += .025 * sweep;
          swipeBlend = ease(a / .16) * (1 - ease((a - .50) / .32));
        } else if (action === 'lunge') {
          const thrust = a < .28 ? ease(a / .28) : 1 - ease((a - .28) / .72);
          zoom += .24 * thrust; panY += h * .03 * thrust;
          blend = ease(a / .13) * (1 - ease((a - .63) / .37));
        }
      } else if (phase === 'recovery' && action === 'roar') blend = .15 * (1 - ease(a / .35));
    } else if (phase === 'action') {
      // A deliberate still-pose response, with no camera motion or crossfade.
      blend = action === 'swipe' ? 0 : 1;
      swipeBlend = action === 'swipe' ? 1 : 0;
      if (action === 'swipe' && w < h) panX = h * .20;
    }
    const sourceW = images.alert.naturalWidth || images.alert.width || 1672;
    const sourceH = images.alert.naturalHeight || images.alert.height || 941;
    const scale = Math.max(w / sourceW, h / sourceH) * zoom;
    const iw = sourceW * scale, ih = sourceH * scale;
    const x = clamp((w - iw) * .5 + panX, w - iw, 0);
    const y = clamp((h - ih) * .48 + panY, h - ih, 0);
    return { x, y, iw, ih, roll, blend, swipeBlend, zoom, w, h };
  }
  function project(frame, x, y) {
    const dx = frame.x + x * frame.iw - frame.w / 2, dy = frame.y + y * frame.ih - frame.h / 2;
    const cs = Math.cos(frame.roll), sn = Math.sin(frame.roll);
    return { x: frame.w / 2 + dx * cs - dy * sn, y: frame.h / 2 + dx * sn + dy * cs };
  }
  function zones(w, h, options = {}) {
    const frame = layout(w, h, options);
    return [
      { id: 'face', action: 'roar', ...project(frame, .56, .47), rx: Math.min(frame.iw * .14, w * .35), ry: Math.min(frame.ih * .22, h * .23) },
      { id: 'paw', action: 'swipe', ...project(frame, .325, .81), rx: frame.iw * .105, ry: frame.ih * .125 }
    ].map(zone => ({ ...zone, visible: zone.x >= 35 && zone.x <= w - 35 && zone.y >= 90 && zone.y <= h - 65 && !(zone.y > h - 165 && Math.abs(zone.x - w / 2) < 230) }));
  }
  // Piecewise-affine connected texture mesh. Shared vertices prevent detached cutouts.
  function rig(c, image, x, y, width, height, deform, columns=16, rows=12) {
    const sw=image.naturalWidth||image.width, sh=image.naturalHeight||image.height;
    const vertices=[];
    for(let j=0;j<=rows;j++)for(let i=0;i<=columns;i++){
      const u=i/columns,v=j/rows,d=deform(u,v);
      vertices.push({sx:u*sw,sy:v*sh,x:x+(u+d.x)*width,y:y+(v+d.y)*height});
    }
    function tri(a,b,d){
      const det=a.sx*(b.sy-d.sy)+b.sx*(d.sy-a.sy)+d.sx*(a.sy-b.sy);
      const A=(a.x*(b.sy-d.sy)+b.x*(d.sy-a.sy)+d.x*(a.sy-b.sy))/det;
      const B=(a.y*(b.sy-d.sy)+b.y*(d.sy-a.sy)+d.y*(a.sy-b.sy))/det;
      const C=(a.x*(d.sx-b.sx)+b.x*(a.sx-d.sx)+d.x*(b.sx-a.sx))/det;
      const D=(a.y*(d.sx-b.sx)+b.y*(a.sx-d.sx)+d.y*(b.sx-a.sx))/det;
      const E=a.x-A*a.sx-C*a.sy,F=a.y-B*a.sx-D*a.sy;
      c.save();c.beginPath();
      const cx=(a.x+b.x+d.x)/3,cy=(a.y+b.y+d.y)/3;
      for(const [i,p]of [a,b,d].entries()){const dx=p.x-cx,dy=p.y-cy,l=Math.hypot(dx,dy)||1;const px=p.x+dx/l*.3,py=p.y+dy/l*.3;i?c.lineTo(px,py):c.moveTo(px,py);}
      c.closePath();c.clip();c.transform(A,B,C,D,E,F);
      const sx=Math.max(0,Math.min(a.sx,b.sx,d.sx)-1),sy=Math.max(0,Math.min(a.sy,b.sy,d.sy)-1);
      const tw=Math.min(sw,Math.max(a.sx,b.sx,d.sx)+1)-sx,th=Math.min(sh,Math.max(a.sy,b.sy,d.sy)+1)-sy;
      c.drawImage(image,sx,sy,tw,th,sx,sy,tw,th);c.restore();
    }
    for(let j=0;j<rows;j++)for(let i=0;i<columns;i++){
      const k=j*(columns+1)+i,a=vertices[k],b=vertices[k+1],d=vertices[k+columns+1],e=vertices[k+columns+2];
      tri(a,b,e);tri(a,e,d);
    }
  }
  window.InkTigerTextureRig=rig;
  const weight=(u,v,x,y,rx,ry)=>Math.exp(-(((u-x)/rx)**2+((v-y)/ry)**2)*2);
  function articulate(c,image,f,options){
    if(options.reduced){c.drawImage(image,f.x,f.y,f.iw,f.ih);return;}
    const t=options.time||0,breath=Math.sin(t*1.5),sniff=Math.sin(t*2.1);
    const ax=clamp(options.attention?.x||0,-1,1),ay=clamp(options.attention?.y||0,-1,1);
    const twitch=Math.pow(Math.max(0,Math.sin(t*.68)),18)*Math.sin(t*15);
    rig(c,image,f.x,f.y,f.iw,f.ih,(u,v)=>{
      const head=weight(u,v,.50,.31,.27,.35),chest=weight(u,v,.54,.65,.28,.26);
      const earL=weight(u,v,.36,.075,.08,.10),earR=weight(u,v,.64,.12,.08,.1);
      const muzzle=weight(u,v,.50,.50,.13,.15),paw=weight(u,v,.31,.79,.13,.16);
      return {x:head*(ax*.004+Math.sin(t*.63)*.0018)+(u-.53)*chest*breath*.013+(earL-earR)*twitch*.006,
        y:head*(ay*.003+breath*.0025)+chest*breath*.003+muzzle*sniff*.0018-(earL+earR)*twitch*.008+paw*Math.sin(t*1.5+.5)*.0015};
    });
  }
  function draw(c, w, h, options = {}) {
    c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
    if (!states.alert || !states.roar || !states.swipe) return false;
    const f = layout(w, h, options);
    c.save(); c.translate(w / 2, h / 2); c.rotate(f.roll); c.translate(-w / 2, -h / 2);
    articulate(c, images.alert, f, options);
    if (f.blend > 0) { c.globalAlpha *= f.blend; articulate(c, images.roar, f, options); }
    if (f.swipeBlend > 0) { c.globalAlpha = f.swipeBlend; articulate(c, images.swipe, f, options); }
    c.restore();
    return true;
  }
  window.InkTigerScene = Object.freeze({ draw, layout, zones, get ready() { return states.alert && states.roar && states.swipe; }, get failed() { return failed; } });
})();
