/* V14 drifting atmosphere. Static terrain is never displaced. Shared caller clock in seconds only. */
'use strict';(()=>{
  const world=window.InkLandscapeScene||{},minX=world.minX??-6480,maxX=world.maxX??13680,H=2400;
  // Coordinates traced conservatively inside the open sky in the full panorama.
  // The gap at the near pine and the mountain peaks keeps clouds behind the land.
  const originalRidge=[[0,11],[20,4],[45,17],[70,12],[100,24],[135,16],[180,19],[205,8],[240,20],[280,25],[320,17],[355,27],[400,34],[450,22],[500,34],[550,43],[590,25],[620,13],[641,0],[700,0],[735,24],[770,30],[810,3],[850,0],[885,4],[920,15],[950,7],[995,20],[1040,28],[1100,22],[1155,34],[1200,24],[1250,24],[1300,26],[1340,10],[1380,18],[1420,8],[1460,4],[1490,0],[1520,3],[1550,18],[1600,27],[1650,28],[1700,25],[1750,30],[1800,30],[1850,38],[1900,40],[1950,44],[2000,37],[2048,44]].map(([x,y])=>[-6480+x/2048*20160,y/244*H]);
  const outerWestRidge=[[0,0],[.15,0],[.19,.015],[.22,.04],[.26,.06],[.30,.05],[.35,.085],[.39,.10],[.43,.12],[.47,.08],[.51,.025],[.55,.015],[.59,.08],[.64,.10],[.69,.06],[.73,.05],[.78,.13],[.83,.16],[.88,.11],[.90,.10]].map(([x,y])=>[-12960+x*7200,y*H]);
  const outerEastRidge=[[.10,.20],[.16,.21],[.22,.20],[.28,.23],[.32,.23],[.36,.18],[.41,.16],[.46,.12],[.50,.12],[.55,.15],[.60,.12],[.65,.11],[.70,.03],[.74,.01],[.78,.05],[.83,.015],[.87,.05],[.91,.04],[.95,.08],[1,.10]].map(([x,y])=>[12960+x*7200,y*H]);
  const ridge=[...(minX<-6480?outerWestRidge:[]),...originalRidge,...(maxX>13680?outerEastRidge:[])];
  const valleys=[
    {x:-4590,y:955,w:1250,h:140,speed:23,alpha:.25},
    {x:-2800,y:1100,w:1400,h:155,speed:19,alpha:.23},
    {x:2480,y:1220,w:980,h:150,speed:24,alpha:.25},
    {x:8420,y:1110,w:1400,h:155,speed:22,alpha:.24},
    {x:10680,y:1170,w:1500,h:170,speed:20,alpha:.26}
  ];
  if(minX<-6480)valleys.unshift({x:-10500,y:760,w:1100,h:140,speed:18,alpha:.22},{x:-8900,y:1050,w:1350,h:165,speed:22,alpha:.25});
  if(maxX>13680)valleys.push({x:15400,y:1010,w:1300,h:160,speed:19,alpha:.23},{x:17900,y:810,w:1500,h:160,speed:22,alpha:.24});
  function mask(seed){
    const cv=document.createElement('canvas');cv.width=512;cv.height=128;const c=cv.getContext('2d');
    let n=seed;const random=()=>{n=(n*1664525+1013904223)>>>0;return n/4294967296;};
    for(let i=0;i<28;i++){
      const x=40+random()*432,y=40+random()*46,rx=22+random()*62,ry=10+random()*19;
      c.save();c.translate(x,y);c.scale(rx,ry);const g=c.createRadialGradient(0,0,0,0,0,1);
      g.addColorStop(0,'rgba(255,246,222,.42)');g.addColorStop(.48,'rgba(255,245,221,.26)');g.addColorStop(1,'rgba(255,245,221,0)');c.fillStyle=g;c.fillRect(-1,-1,2,2);c.restore();
    }
    return cv;
  }
  const masks=[mask(17),mask(842),mask(9135)];
  const banks=[];
  for(let i=0,x=minX-1400;x<maxX+1400;i++,x+=1050)banks.push({x,y:12+(i%3)*55,w:1450+(i%4)*180,h:200+(i%3)*45,speed:26+(i%4)*4,alpha:.27+(i%3)*.035,mask:i%3});
  function timeValue(time,motion){return motion===false?0:Math.max(0,Number(time)||0);}
  function skyState(b,t){const period=maxX-minX+4200;return {...b,x:minX-2100+((b.x-(minX-2100)+t*b.speed)%period),y:b.y+Math.sin(t*.11+b.x*.001)*11};}
  function getState(time,{motion=true}={}){const t=timeValue(time,motion);return {time:t,sky:banks.map(b=>skyState(b,t)),valleys:valleys.map((v,i)=>({...v,offset:Math.sin(t*.13+i)*v.w*.19,opacity:v.alpha*(.84+.16*Math.sin(t*.23+i))}))};}
  function draw(c,time,{camera=minX,viewW=maxX-minX,motion=true}={}){
    const state=getState(time,{motion});
    c.save();c.beginPath();c.moveTo(minX,0);c.lineTo(maxX,0);for(let i=ridge.length-1;i>=0;i--)c.lineTo(...ridge[i]);c.closePath();c.clip();
    for(const b of state.sky){if(b.x+b.w<camera||b.x>camera+viewW)continue;c.globalAlpha=b.alpha;c.drawImage(masks[b.mask],b.x,b.y,b.w,b.h);}
    c.restore();
    for(let i=0;i<state.valleys.length;i++){
      const v=state.valleys[i];if(v.x+v.w/2<camera||v.x-v.w/2>camera+viewW)continue;
      // Mist texture itself has soft zero-alpha edges. No moving clipping edge
      // or rectangular fog layer can reveal/erase the underlying land.
      c.save();c.globalAlpha=v.opacity;c.drawImage(masks[(i+1)%3],v.x-v.w/2+v.offset,v.y-v.h/2,v.w,v.h);c.restore();
    }
  }
  window.InkCloudMotion={draw,getState,geometry:{minX,maxX,H,ridge,valleys,skyBanks:banks.length,maskSize:[512,128]}};
})();
