/* 山水之间 · White egrets, drawn in original Canvas brushwork.
 * Standalone: scene time is in seconds. No timers, images, audio, or DOM work.
 * create({x, y}): x is the flock centre, y is its resting waterline.
 * draw(ctx, time, {motion:false}) substitutes a still, brief alert pose.
 * Repeated draws at the same time are identical; reset() clears the encounter.
 */
'use strict';
(() => {
  const TAU = Math.PI * 2;
  const DURATION = 7.25, COOLDOWN = 8.8, REDUCED_DURATION = 1.7;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = v => { v = clamp(v); return v * v * (3 - 2 * v); };
  const mix = (a, b, t) => a + (b - a) * t;
  const WHITE = '#f3f2df', LIGHT = '#fffcdf';
  const flock = Object.freeze([
    Object.freeze({x: 30, y: -15, scale: .73, dir: -1, phase: 2.1, delay: .18}),
    Object.freeze({x: 108, y: 3, scale: .87, dir: 1, phase: 4.4, delay: .34}),
    Object.freeze({x: -48, y: 0, scale: 1, dir: 1, phase: .3, delay: 0})
  ]);

  function line(c, color, width, points) {
    c.beginPath(); c.moveTo(points[0], points[1]);
    for (let i = 2; i < points.length; i += 2) c.lineTo(points[i], points[i + 1]);
    c.strokeStyle = color; c.lineWidth = width; c.stroke();
  }
  function shape(c, color = WHITE, outline = true) {
    c.fillStyle = color; c.fill();
    if (outline) { c.strokeStyle = 'rgba(65,76,61,.34)'; c.lineWidth = .65; c.stroke(); }
  }
  function oval(c, x, y, rx, ry, color, rotation = 0) {
    c.beginPath(); c.ellipse(x, y, rx, ry, rotation, 0, TAU); c.fillStyle = color; c.fill();
  }
  function water(c, x, y, scale, clock, active) {
    c.save(); c.translate(x, y); c.scale(scale, scale);
    // Narrow broken rings read as water rather than heavy drop shadows.
    c.strokeStyle = 'rgba(64,91,77,.22)'; c.lineWidth = .7;
    c.beginPath(); c.ellipse(-2, 1.5, 20, 2.6, 0, .12, Math.PI * .91);
    c.ellipse(1, 1.5, 29, 4.1, 0, Math.PI * 1.1, Math.PI * 1.9); c.stroke();
    if (active) {
      const pulse = (clock * .19) % 1;
      c.globalAlpha *= (1 - pulse) * .6;
      c.beginPath(); c.ellipse(0, 2, 23 + pulse * 21, 3 + pulse * 3, 0, .1, Math.PI * 1.87); c.stroke();
    }
    c.restore();
  }

  function legs(c, step, crouch, flying, landing) {
    if (flying) {
      // Legs trail after push-off, then extend ahead of the touchdown.
      const l=landing;
      const back=[-8,-29,mix(-31,-8,l),mix(-23,-16,l),mix(-61,-10,l),mix(-23,0,l)];
      const near=[1,-29,mix(-26,1,l),mix(-18,-15,l),mix(-57,5,l),mix(-17,0,l)];
      line(c, '#69715b', 1.5, back); line(c, '#424f43', 1.7, near);
      line(c, '#464e3b', .8, [back[4],back[5],back[4]+mix(-6,6,l),back[5]+1,back[4],back[5],back[4]-3,back[5]+1]);
      line(c, '#464e3b', .9, [near[4],near[5],near[4]+mix(-6,7,l),near[5]+1,near[4],near[5],near[4]-3,near[5]+1.4]);
      return;
    }
    const lift = Math.max(0, Math.sin(step)) * 4.5;
    const stride = Math.sin(step) * 5.4;
    line(c, '#75806b', 1.5, [-5,-30 + crouch, -8 + stride * .3,-16 + crouch * .45, -10 + stride, -lift]);
    line(c, '#465545', 1.8, [4,-29 + crouch, 1 - stride * .25,-15 + crouch * .5, 5 - stride, -Math.max(0,-Math.sin(step)) * 4.5]);
    line(c, '#53614b', .8, [-10 + stride,-lift,-4 + stride,-lift + .6,-10 + stride,-lift,-13 + stride,-lift + 1]);
    const fy = -Math.max(0,-Math.sin(step)) * 4.5;
    line(c, '#435343', .9, [5 - stride,fy,12 - stride,fy + .4,5 - stride,fy,2 - stride,fy + 1.4]);
  }
  function body(c, flying, fold = 0) {
    // Tail tapers to several dry-brush points; the breast remains full and round.
    c.beginPath(); c.moveTo(14,-42);
    c.bezierCurveTo(7,-50,-10,-51,-23,-45);
    c.bezierCurveTo(-30,-41,-33,-37,-36,-33);
    c.lineTo(-27,-34); c.lineTo(-32,-29); c.lineTo(-23,-32); c.lineTo(-27,-28);
    c.bezierCurveTo(-12,-28,8,-24,17,-34);
    c.bezierCurveTo(22,-38,20,-42,14,-42); shape(c);
    c.beginPath(); c.moveTo(-27,-35); c.bezierCurveTo(-13,-33,4,-30,13,-37);
    c.bezierCurveTo(3,-31,-12,-28,-23,-31); shape(c,'rgba(125,144,124,.24)',false);
    if (!flying || fold > 0) {
      c.save(); if(flying) c.globalAlpha *= fold;
      c.beginPath(); c.moveTo(9,-43); c.bezierCurveTo(-2,-47,-19,-45,-27,-34);
      c.bezierCurveTo(-11,-32,4,-34,9,-43); shape(c,'#edeedc');
      c.strokeStyle = 'rgba(114,133,115,.42)'; c.lineWidth = .65;
      for (let j = 0; j < 4; j++) {
        c.beginPath(); c.moveTo(3-j*3,-42+j*.7); c.quadraticCurveTo(-8-j*2,-38+j,-23+j,-34+j*.55); c.stroke();
      }
      // Airy scapular plumes, restrained enough to suit the painted landscape.
      c.strokeStyle = 'rgba(255,253,229,.76)'; c.lineWidth = .8;
      for (let j = 0; j < 3; j++) {
        c.beginPath(); c.moveTo(-2,-43+j*2); c.quadraticCurveTo(-20,-40+j*2,-34-j*3,-31+j); c.stroke();
      }
      c.restore();
    }
  }
  function head(c, x, y, alert) {
    oval(c, x, y, 8.5, 5.3, LIGHT, -.08);
    c.beginPath(); c.moveTo(x+6,y-1.8); c.lineTo(x+31,y+.3); c.lineTo(x+7,y+2.1); c.closePath(); shape(c,'#b19b5b',false);
    c.beginPath(); c.moveTo(x+22,y-.45); c.lineTo(x+31,y+.3); c.lineTo(x+22,y+1.05); c.closePath(); shape(c,'#485442',false);
    line(c, 'rgba(71,80,55,.7)', .6, [x+8,y+.3,x+27,y+.3]);
    oval(c, x+3.7, y-1.15, 1.65, 1.65, '#9c9d56');
    oval(c, x+4, y-1.15, 1.0, 1.0, '#253b31');
    if (alert) oval(c, x+4.25,y-1.45,.3,.3,'#fffce5');
    line(c, 'rgba(246,245,223,.85)', .8, [x-6,y-2,x-14,y+1,x-19,y+1.5]);
  }
  function neck(c, forage, alert, flying, landing = 0) {
    if (flying) {
      // Herons and egrets retract their necks in flight, unfolding on landing.
      const l=landing;
      const m=(a,b)=>mix(a,b,l);
      c.beginPath(); c.moveTo(m(8,6),m(-36,-35));
      c.bezierCurveTo(m(28,25),m(-32,-37),m(34,26),m(-40,-46),m(24,18),m(-47,-56));
      c.bezierCurveTo(m(18,7),m(-52,-69),m(20,10),m(-57,-81),m(29,22),m(-56,-84));
      c.bezierCurveTo(m(34,29),m(-56,-86),m(37,35),m(-53,-82),m(37,35),m(-51,-78));
      c.lineTo(m(29,26),m(-48,-76));
      c.bezierCurveTo(m(33,18),m(-44,-77),m(33,16),m(-37,-71),m(25,22),m(-33,-63));
      c.bezierCurveTo(m(20,35),m(-30,-48),m(16,36),m(-30,-39),m(13,18),-31);
      c.closePath(); shape(c);
      head(c,m(33,30),m(-53,-81),1); return;
    }
    c.save(); c.translate(8,-37); c.rotate(forage*.8-alert*.045);
    c.scale(1,1-forage*.26+alert*.07);
    c.beginPath(); c.moveTo(-2,2);
    c.bezierCurveTo(17,0,18,-9,10,-19);
    c.bezierCurveTo(-1,-32,2,-44,14,-47);
    c.bezierCurveTo(21,-49,27,-45,27,-41);
    c.lineTo(18,-39); c.bezierCurveTo(10,-40,8,-34,14,-26);
    c.bezierCurveTo(27,-11,28,-2,10,6); c.closePath(); shape(c);
    c.beginPath(); c.moveTo(3,1); c.bezierCurveTo(19,-4,16,-11,9,-21); c.bezierCurveTo(2,-32,6,-42,15,-44);
    c.strokeStyle='rgba(135,151,129,.34)'; c.lineWidth=1.1; c.stroke();
    head(c,22,-44,alert); c.restore();
  }
  function wing(c, flap, far, glide, bank, fold = 0) {
    c.save(); c.globalAlpha *= 1 - fold; c.translate(far ? 3 : -1, far ? -43 : -40);
    const lift = (far ? .83 : 1) * (mix(flap, -.43, glide));
    c.scale(far ? .88 : 1, lift);
    c.rotate(bank * (far ? -.12 : .12));
    c.beginPath(); c.moveTo(8,1);
    c.bezierCurveTo(2,-13,-8,-29,-21,-40);
    c.bezierCurveTo(-32,-50,-47,-60,-60,-60);
    c.quadraticCurveTo(-59,-53,-46,-44);
    c.lineTo(-66,-53); c.quadraticCurveTo(-63,-43,-45,-36);
    c.lineTo(-64,-43); c.quadraticCurveTo(-61,-33,-40,-27);
    c.lineTo(-57,-32); c.quadraticCurveTo(-53,-23,-34,-19);
    c.lineTo(-47,-22); c.quadraticCurveTo(-42,-14,-27,-11);
    c.lineTo(-34,-12); c.quadraticCurveTo(-16,-1,8,1); c.closePath();
    shape(c,far ? '#d8dfcf' : '#f5f3df');
    c.strokeStyle = far ? 'rgba(102,125,109,.3)' : 'rgba(134,151,129,.4)'; c.lineWidth=.65;
    for (let j=0;j<5;j++) {
      c.beginPath(); c.moveTo(-11-j*3,-18-j*4); c.quadraticCurveTo(-28-j*3,-25-j*4,-40-j*5,-27-j*6); c.stroke();
    }
    c.restore();
  }

  // Hermite curves preserve position and velocity through each flight stage.
  function curve(a,b,va,vb,t,duration) {
    const t2=t*t,t3=t2*t;
    return (2*t3-3*t2+1)*a+(t3-2*t2+t)*va*duration+(-2*t3+3*t2)*b+(t3-t2)*vb*duration;
  }
  const path = Object.freeze([
    [0,0,0,0,0],
    [.72,35,-94,75,-150],
    [1.6,119,-202,112,-45],
    [3.15,281,-222,54,9],
    [3.8,287,-204,-65,38],
    [4.85,142,-111,-165,95],
    [5.9,0,0,0,0]
  ]);
  function flightPoint(t) {
    t=clamp(t,0,5.9);
    for(let i=1;i<path.length;i++) {
      const b=path[i],a=path[i-1];
      if(t<=b[0]) { const d=b[0]-a[0],u=(t-a[0])/d; return {x:curve(a[1],b[1],a[3],b[3],u,d),y:curve(a[2],b[2],a[4],b[4],u,d)}; }
    }
    return {x:0,y:0};
  }
  function pose(b,time,start,motion) {
    // Each bird takes its own occasional exploratory circuit; a human startle
    // takes priority, and the flock remains safely at rest in reduced motion.
    const autoPeriod=31, autoOffset=2+b.phase*2.4;
    const autoCycle=Math.floor((time-autoOffset)/autoPeriod);
    const autoStart=autoOffset+autoCycle*autoPeriod;
    const manualAge=time-start-b.delay;
    const manual=Number.isFinite(start)&&manualAge>=0&&manualAge<DURATION;
    const autoAllowed=motion&&autoCycle>=0&&autoStart>start+COOLDOWN;
    const effective=manual?start:(autoAllowed?autoStart:-Infinity);
    const age=time-effective-b.delay, active=Number.isFinite(effective)&&age>=0&&age<DURATION-b.delay;
    if(!motion) return {x:b.x,y:b.y,s:b.scale,dir:b.dir,step:0,forage:0,alert:active&&age<1.35?1:0,crouch:0,flying:false,flap:0,glide:0,bank:0,land:0};
    const clock=time+b.phase*5, stride=Math.sin(clock*.58);
    const forage=Math.pow(Math.max(0,Math.sin(clock*.38)),8)*.91;
    const idle={x:b.x+Math.sin(clock*.18)*4,y:b.y,s:b.scale,dir:b.dir,step:stride*.9,forage,alert:Math.pow(Math.max(0,Math.sin(clock*.14)),16)*.45,crouch:Math.sin(clock*.9)*.7,flying:false,flap:0,glide:0,bank:0,land:0};
    if(!active) return idle;
    if(age<.32) { const u=age/.32; return {...idle,forage:forage*(1-ease(u)),alert:ease(u),crouch:Math.sin(u*Math.PI)*5,step:0}; }
    const ft=age-.32;
    if(ft<5.9) {
      const p=flightPoint(ft),bank=ease((ft-3.12)/.62);
      const glide=ease((ft-1.8)/.45)*(1-ease((ft-3.35)/.45));
      const opening=ease(ft/.22),landing=ease((ft-5.35)/.55);
      const face=mix(1-2*bank,b.dir,ease((ft-5.42)/.48));
      return {x:b.x+p.x*(.88+b.scale*.12),y:b.y+p.y,s:b.scale,dir:face,step:0,forage:0,alert:1,crouch:0,flying:true,flap:Math.sin(ft*9.4+b.phase)*opening,glide,bank:Math.sin(bank*Math.PI),land:landing,leg:Math.max(1-ease(ft/.48),landing)};
    }
    const settle=ease((ft-5.9)/.65);
    return {...idle,x:b.x,y:b.y,step:0,forage:0,alert:1-settle,crouch:Math.sin(settle*Math.PI)*4,land:1-settle};
  }
  function bird(c,p) {
    c.save(); c.translate(p.x,p.y); c.scale(p.s,p.s);
    // A small width at the bank's midpoint gives a readable edge-on silhouette.
    const direction=p.dir<0?-1:1;
    c.scale(direction*Math.max(.22,Math.abs(p.dir)),1);
    c.lineCap='round'; c.lineJoin='round';
    legs(c,p.step,p.crouch,p.flying,p.leg === undefined ? p.land : p.leg);
    c.translate(0,p.crouch);
    if(p.flying) wing(c,p.flap,true,p.glide,p.bank,p.land);
    body(c,p.flying,p.land); neck(c,p.forage,p.alert,p.flying,p.land);
    if(p.flying) wing(c,p.flap,false,p.glide,p.bank,p.land);
    c.restore();
  }

  function create(options={}) {
    const x=Number.isFinite(options.x)?options.x:0,y=Number.isFinite(options.y)?options.y:0;
    let started=-Infinity, available=-Infinity,lastTime=0,lastMotion=true;
    const bounds=Object.freeze({x:x-140,y:y-340,width:620,height:370});
    const instance={
      draw(c,time,{motion=true}={}) {
        if(!c) return;
        const t=Number.isFinite(time)?Math.max(0,time):lastTime;
        lastTime=t;lastMotion=motion!==false;
        c.save();c.translate(x,y);
        // Draw water before feathers so the flock remains crisp and lightweight.
        for(const b of flock) {
          const p=pose(b,t,started,lastMotion);
          const grounded=!p.flying;
          c.save(); c.globalAlpha*=grounded?1:Math.max(0,1-Math.abs(p.y-b.y)/90)*.65;
          water(c,b.x,b.y,b.scale,t+b.phase,lastMotion&&grounded); c.restore();
        }
        for(const b of flock) bird(c,pose(b,t,started,lastMotion));
        c.restore();
      },
      startle(time) {
        if(!Number.isFinite(time)||time<0||time<available) return false;
        started=time;available=time+COOLDOWN;lastTime=time;return true;
      },
      hit(px,py) {
        if(!Number.isFinite(px)||!Number.isFinite(py))return false;
        const lx=px-x,ly=py-y;
        // Resting shore remains targetable while the flock circles above it.
        if(((lx-25)/143)**2+((ly+35)/63)**2<=1)return true;
        return flock.some(b=>{const p=pose(b,lastTime,started,lastMotion);return ((lx-p.x)/(p.s*72))**2+((ly-p.y+p.s*45)/(p.s*57))**2<=1;});
      },
      reset() {started=-Infinity;available=-Infinity;lastTime=0;lastMotion=true;},
      // Active includes cooldown so event-clock render loops can finish naturally.
      isActive(time=lastTime) {return Number.isFinite(started)&&Number.isFinite(time)&&time>=started&&time<available;},
      isAnimating(time=lastTime, {motion=lastMotion}={}) {return Number.isFinite(started)&&Number.isFinite(time)&&time>=started&&time-started<(motion ? DURATION : REDUCED_DURATION);},
      get active(){return instance.isActive();},
      get cooldownRemaining(){return Math.max(0,available-lastTime);},
      bounds
    };
    return Object.freeze(instance);
  }
  window.InkEgrets=Object.freeze({create,DURATION,COOLDOWN,REDUCED_DURATION});
})();
