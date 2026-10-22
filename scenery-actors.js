/* Local RGBA illustrations with restrained shared-clock motion. */
'use strict';(()=>{
  const images={},loaded={};let settled=0;
  for(const key of ['boat','tiger']){const im=images[key]=new Image();im.onload=()=>{loaded[key]=true;settled++;window.dispatchEvent(new CustomEvent('ink-actors-ready'));};im.onerror=()=>{settled++;window.dispatchEvent(new CustomEvent('ink-actors-ready'));};im.src=window.InkActorImages[key];}
  let sailing=false,phase=0,started=0,lastTime=0,reduced=false;
  function boat(time){const p=phase+(sailing&&!reduced?Math.max(0,time-started):0);return {x:4200+1400*(.5-.5*Math.cos(p*Math.PI*2/32)),y:1970+(sailing&&!reduced?Math.sin(p*.9)*2:0),phase:p};}
  function toggleBoat(time,{motion=true}={}){if(!Number.isFinite(time))return false;phase=boat(time).phase;started=time;lastTime=time;reduced=!motion;sailing=!sailing;return sailing;}
  // The source illustration is a planted standing pose (far hind leg occluded).
  // Keep a grounded stance: no translation and no paw displacement.
  const tigerOrigin=Object.freeze({x:4215,y:1131,width:410,height:273.3333333333333});
  const contacts=Object.freeze([
    Object.freeze({u:.385,v:.930}),Object.freeze({u:.765,v:.937}),Object.freeze({u:.866,v:.924})
  ]);
  function tigerDeform(u,v,time,{motion=true}={}){
    if(!motion||v>=.70)return {x:0,y:0};
    const weight=(a,b,rx,ry)=>Math.exp(-(((u-a)/rx)**2+((v-b)/ry)**2)*2);
    const taper=Math.max(0,Math.min(1,(.70-v)/.14));
    const anchor=taper*taper*(3-2*taper);
    const tail=weight(.13,.57,.23,.24),head=weight(.87,.27,.18,.24),flank=weight(.48,.40,.34,.27);
    const ear=weight(.81,.11,.07,.08)+weight(.95,.11,.05,.09);
    const flick=Math.pow(Math.max(0,Math.sin(time*.73)),16)*Math.sin(time*13);
    return {x:anchor*(tail*Math.sin(time*1.15)*.018+head*Math.sin(time*.52)*.0035),
      y:anchor*(-tail*Math.sin(time*.9+.4)*.016+head*Math.sin(time*.68)*.003-flank*Math.sin(time*1.35)*.004-ear*flick*.006)};
  }
  function draw(c,time,{motion=true}={}){
    if(reduced!==!motion){phase=boat(time).phase;started=time;reduced=!motion;}lastTime=time;
    const b=boat(time);c.save();
    // Contact shadow and low, tapered wakes hold the hull on the river surface.
    c.fillStyle='rgba(36,48,40,.19)';c.beginPath();c.ellipse(b.x,b.y-5,265,16,0,0,Math.PI*2);c.fill();
    if(sailing){for(let i=0;i<6;i++){const r=(i*31+(motion?time*21:30))%190;c.strokeStyle=`rgba(237,227,193,${.22*(1-r/210)})`;c.lineWidth=2;c.beginPath();c.ellipse(b.x,b.y+4+r*.10,270+r,14+r*.1,0,0,Math.PI);c.stroke();}}
    if(loaded.boat)c.drawImage(images.boat,0,150,1774,600,b.x-300,b.y-202,600,203);
    else {c.fillStyle='#68543b';c.beginPath();c.moveTo(b.x-220,b.y-35);c.lineTo(b.x+220,b.y-35);c.lineTo(b.x+165,b.y);c.lineTo(b.x-170,b.y);c.closePath();c.fill();}
    if(window.InkShoreTiger?.ready && !window.InkShoreTiger.failed){window.InkShoreTiger.draw(c,time,{motion});}
    else {
    // Fixed footprint and contact shadows. Upper-body motion fades out well
    // above all paws; all mesh vertices at v >= .70 are exactly stationary.
    const {x,y,width:w,height:h}=tigerOrigin;
    c.fillStyle='rgba(38,39,25,.12)';c.beginPath();c.ellipse(4470,1388,118,6,0,0,Math.PI*2);c.fill();
    for(const p of contacts){c.fillStyle='rgba(34,33,24,.23)';c.beginPath();c.ellipse(x+p.u*w,y+p.v*h-1,15,3,0,0,Math.PI*2);c.fill();}
    if(loaded.tiger){
      if(motion&&window.InkTigerTextureRig)window.InkTigerTextureRig(c,images.tiger,x,y,w,h,(u,v)=>tigerDeform(u,v,time,{motion}),18,12);
      else c.drawImage(images.tiger,x,y,w,h);
    }else if(window.InkTiger)window.InkTiger.draw(c,4420,1355,motion?time:0,{scale:1.1,glance:1,moving:false});
    }
    c.restore();
  }
  window.InkSceneryActors=Object.freeze({draw,toggleBoat,boat,tigerRig:Object.freeze({origin:tigerOrigin,contacts,deform:tigerDeform,mode:'grounded-idle'}),hitBoat(x,y,time=lastTime){const p=boat(time);return Math.abs(x-p.x)<310&&y>p.y-220&&y<p.y+30;},get active(){return sailing&&!reduced;},get sailing(){return sailing;},get ready(){return settled===2;},get failed(){return settled===2&&(!loaded.boat||!loaded.tiger);},reset(){sailing=false;phase=0;started=lastTime=0;reduced=false;}});
})();
