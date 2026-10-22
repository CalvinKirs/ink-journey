/* Grounded shore tiger action theatre. All movement uses the caller's seconds clock.
 * No timers/RAF, no audio, and no rigid-body spin of a standing illustration.
 * Load actor-images.js and shore-tiger-images.js first. All pose frames are local.
 */
'use strict';(()=>{
  const images={},loaded={},errors={};
  const keys=['stand','crouch','pounce','side','back','prone'];
  for(const key of keys){const im=images[key]=new Image();im.onload=()=>{loaded[key]=true;window.dispatchEvent(new CustomEvent('ink-shore-tiger-ready'));};im.onerror=()=>{errors[key]=true;window.dispatchEvent(new CustomEvent('ink-shore-tiger-ready'));};const src=key==='stand'?window.InkActorImages?.tiger:window.InkShoreTigerImages?.[key];if(src)im.src=src;else errors[key]=true;}
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  const ease=v=>{v=clamp(v);return v*v*(3-2*v);};
  const ORIGIN=Object.freeze({x:4470,ground:1387});
  // Native texture dimensions retained. Pose-specific anchors are inspected from art.
  const POSES={
    stand:{width:410,anchorX:255/410,anchorY:256/273.3333333333333},
    crouch:{width:410,anchorX:.62,anchorY:900/1024,bodyContact:.86},
    pounce:{width:440,anchorX:.62,anchorY:866/1024},
    side:{width:390,anchorX:.62,anchorY:842/1024,bodyContact:.695},
    back:{width:390,anchorX:.62,anchorY:774/1024,bodyContact:.750},
    prone:{width:400,anchorX:.62,anchorY:851/1024,bodyContact:.795}
  };
  const DURATIONS=Object.freeze({pounce:2.65,roll:4.5,lie:1.25,stand:1.45});
  let action=null,started=-Infinity,posture='stand',target='stand',lastTime=0,lastMotion=true,cooldown=-Infinity;
  function blend(a,b,u,window=1){const q=ease(clamp((u-(1-window))/window));return [{pose:a,alpha:1-q},{pose:b,alpha:q}].filter(x=>x.alpha>.0001);}
  function state(time,{motion=lastMotion}={}){
    const t=Number.isFinite(time)?Math.max(0,time):lastTime,age=Math.max(0,t-started);
    let frames=[{pose:posture==='prone'?'prone':'stand',alpha:1}],lift=0,phase=posture==='prone'?'resting':'standing',airborne=false,compress=0;
    const running=!!action&&age<DURATIONS[action]&&motion;
    if(action&&!running){frames=[{pose:target,alpha:1}];phase=target==='prone'?'resting':'standing';}
    if(running){
      if(action==='pounce'){
        if(age<.55){frames=blend(posture,'crouch',age/.55,.35);phase='compress';compress=ease(age/.55);}
        else if(age<1.75){const q=(age-.55)/1.20;lift=4*85*q*(1-q);airborne=q>0&&q<1;phase='airborne';frames=q<.12?blend('crouch','pounce',q/.12):q>.86?blend('pounce','crouch',(q-.86)/.14):[{pose:'pounce',alpha:1}];}
        else if(age<2.03){frames=[{pose:'crouch',alpha:1}];phase='landing';compress=1;}
        else{frames=blend('crouch',target,(age-2.03)/.62,.32);phase='settle';compress=1-ease((age-2.03)/.62);}
      }else if(action==='roll'){
        // Actual anatomical poses share a contact line; never rotate an upright cutout.
        const stops=[{t:0,pose:posture},{t:.7,pose:'prone'},{t:1.45,pose:'side'},{t:2.25,pose:'back'},{t:3.05,pose:'side'},{t:3.85,pose:'prone'},{t:4.5,pose:'prone'}];
        let i=1;while(i<stops.length-1&&age>stops[i].t)i++;const a=stops[i-1],b=stops[i];frames=blend(a.pose,b.pose,(age-a.t)/(b.t-a.t),.23);phase=b.pose==='back'?'roll-back':b.pose==='side'?'roll-side':b.pose==='prone'?'roll-settle':'roll';
      }else if(action==='lie'){
        phase='lie-down';frames=age<.55?blend('stand','crouch',age/.55,.35):blend('crouch','prone',(age-.55)/.7,.28);
      }else if(action==='stand'){
        phase='stand-up';frames=age<.72?blend('prone','crouch',age/.72,.28):blend('crouch','stand',(age-.72)/.73,.28);
      }
    }
    const contact=airborne?'air':phase==='roll-back'?'back':phase==='roll-side'?'side':frames.some(f=>f.pose==='prone'&&f.alpha>.5)?'belly':'paws';
    return {action,phase,age,active:running,busy:running,resting:!running&&(action?target:posture)==='prone',posture:running?posture:(action?target:posture),target,frames,lift,airborne,compress,x:ORIGIN.x,groundY:ORIGIN.ground,contact,contactY:airborne?null:ORIGIN.ground,shadowX:ORIGIN.x,shadowY:ORIGIN.ground+2,footDisplacement:airborne?lift:0};
  }
  function settle(t){if(action&&t-started>=DURATIONS[action]){posture=target;action=null;}}
  function trigger(name,time,{motion=true}={}){
    if(!Number.isFinite(time)||time<0||!['pounce','roll','lie','stand','toggleLie'].includes(name))return false;
    settle(time);if(action||time<cooldown)return false;
    if(keys.some(k=>!loaded[k]))return false;
    if(name==='toggleLie'||name==='lie')name=posture==='prone'?'stand':'lie';
    if(name==='stand'&&posture==='stand')return false;
    action=name;started=time;lastTime=time;lastMotion=motion;
    target=name==='roll'||name==='lie'?'prone':name==='pounce'?posture:'stand';
    cooldown=time+(motion?DURATIONS[name]+.20:0);
    if(!motion){posture=target;action=null;}
    return true;
  }
  function frameBounds(frame,s){const image=images[frame.pose],m=POSES[frame.pose],sw=image.naturalWidth||image.width||1536,sh=image.naturalHeight||image.height||1024;const w=m.width,h=w*sh/sw;return {x:s.x-m.anchorX*w,y:s.groundY-m.anchorY*h-s.lift,w,h};}
  function draw(c,time,{motion=true}={}){
    lastTime=Number.isFinite(time)?Math.max(0,time):lastTime;lastMotion=motion;
    settle(lastTime);if(!motion&&action){posture=target;action=null;}
    const s=state(lastTime,{motion});if(!loaded.stand)return false;
    c.save();const air=s.lift/85;
    c.fillStyle=`rgba(35,34,24,${.16-air*.065})`;c.beginPath();c.ellipse(s.shadowX,s.shadowY,118-air*23,7-air*2,0,0,Math.PI*2);c.fill();
    for(const frame of s.frames){if(!loaded[frame.pose])continue;const b=frameBounds(frame,s);c.save();c.globalAlpha*=frame.alpha;
      const rig=window.InkSceneryActors?.tigerRig,m=POSES[frame.pose];
      if(m.bodyContact&&!s.airborne){c.fillStyle='rgba(34,33,24,.18)';c.beginPath();c.ellipse(b.x+.60*b.w,b.y+m.bodyContact*b.h,frame.pose==='crouch'?85:112,7,0,0,Math.PI*2);c.fill();}
      if(frame.pose==='stand'&&rig&&!s.airborne){for(const p of rig.contacts){c.fillStyle='rgba(34,33,24,.23)';c.beginPath();c.ellipse(b.x+p.u*b.w,b.y+p.v*b.h-1,15,3,0,0,Math.PI*2);c.fill();}}
      if(frame.pose==='stand'&&motion&&window.InkTigerTextureRig&&rig)window.InkTigerTextureRig(c,images.stand,b.x,b.y,b.w,b.h,(u,v)=>rig.deform(u,v,lastTime,{motion}),18,12);
      else if(frame.pose==='prone'&&motion&&!s.active&&window.InkTigerTextureRig){window.InkTigerTextureRig(c,images.prone,b.x,b.y,b.w,b.h,(u,v)=>{if(v>=.70)return{x:0,y:0};const bell=Math.exp(-(((u-.57)/.3)**2+((v-.50)/.19)**2)*2),taper=clamp((.70-v)/.15);return{x:0,y:-.004*Math.sin(lastTime*1.25)*bell*taper};},18,12);}
      else c.drawImage(images[frame.pose],b.x,b.y,b.w,b.h);
      c.restore();
    }
    // Contact dust only after touchdown; no glow or hover shadow on grounded paws.
    if(motion&&s.phase==='landing'){const q=clamp((s.age-1.75)/.28);c.strokeStyle=`rgba(156,137,97,${.22*(1-q)})`;c.lineWidth=1.4;c.beginPath();c.ellipse(s.x,s.groundY+1,65+q*55,3+q*5,0,0,Math.PI*2);c.stroke();}
    c.restore();return true;
  }
  function hit(x,y,time=lastTime){if(!Number.isFinite(x)||!Number.isFinite(y))return false;const s=state(time);return s.frames.some(f=>{const b=frameBounds(f,s);return f.alpha>.15&&x>b.x+20&&x<b.x+b.w-10&&y>b.y+20&&y<b.y+b.h;});}
  window.InkShoreTiger=Object.freeze({draw,trigger,hit,getState:state,origin:ORIGIN,poses:POSES,durations:DURATIONS,get ready(){return keys.every(k=>loaded[k]);},get failed(){return keys.some(k=>errors[k]);},get active(){return state(lastTime).active;},reset(){action=null;started=-Infinity;posture=target='stand';lastTime=0;lastMotion=true;cooldown=-Infinity;}});
})();
