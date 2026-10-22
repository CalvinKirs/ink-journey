/* A second, explorable landscape beyond the mountain gate. Local Canvas artwork. */
'use strict';(()=>{
 const $=id=>document.getElementById(id), d=$('temple-dialog'),cv=$('temple-canvas'),c=cv.getContext('2d');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const image=new Image();let loaded=false,failed=false;
 let active=false,paused=false,sound=false,raf=0,last=0,time=0,entry=0,focus=null,w=1200,h=800,ox=0,oy=0,scale=1,panX=800;
 let ripples=[],bellAt=-100,incense=true,lantern=true,soundGeneration=0,soundBusy=false;
 const TAU=Math.PI*2,clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
 function status(s){$('temple-status').textContent=s;}
 function resize(){const r=cv.getBoundingClientRect();w=r.width||1200;h=r.height||800;const p=Math.min(devicePixelRatio||1,1.6);cv.width=Math.round(w*p);cv.height=Math.round(h*p);request();}
 function map(){scale=Math.max(w/1600,h/(1600*2/3));panX=clamp(panX,w/(2*scale),1600-w/(2*scale));ox=w/2-panX*scale;oy=(h-1600*2/3*scale)/2;}
 function ellipse(x,y,rx,ry,color){c.strokeStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.stroke();}
 function draw(){
  c.setTransform(cv.width/w,0,0,cv.height/h,0,0);c.fillStyle='#222c27';c.fillRect(0,0,w,h);map();c.save();c.translate(ox,oy);c.scale(scale,scale*16/15);
  if(loaded)c.drawImage(image,0,0,1600,1000);else{c.fillStyle='#303f36';c.fillRect(0,0,1600,1000);c.fillStyle='#c7bd98';c.font='24px serif';c.textAlign='center';c.fillText(window.InkI18n?.t(failed?'庭院画作暂未载入，请返回后重试。':'山门渐开，庭院将至…')||(failed?'庭院画作暂未载入，请返回后重试。':'山门渐开，庭院将至…'),800,500);}
  const t=reduced.matches?0:time;
  // Fine drifting incense, not a screen-wide filter.
  if(incense){for(let k=0;k<5;k++){c.strokeStyle=`rgba(236,225,195,${.08+k*.016})`;c.lineWidth=2+k*.7;c.beginPath();for(let j=0;j<26;j++){const y=612-j*5;const x=790+Math.sin(j*.21+t*.65+k*.8)*(3+j*.5)+k*2;(j?c.lineTo(x,y):c.moveTo(x,y));}c.stroke();}}
  // Pond reflection, fish moving along independent closed paths.
  c.save();c.beginPath();c.ellipse(1340,800,175,65,-.08,0,TAU);c.clip();
  for(let k=0;k<13;k++){const yy=755+k*7,xx=1150+Math.sin(t*.4+k)*13;c.lineWidth=.7;ellipse(xx+120,yy,115+k*5,2,`rgba(230,217,174,${.05+(k%3)*.015})`);}
  for(let i=0;i<5;i++){const a=t*(.09+i*.012)+i*1.4,x=1340+Math.cos(a)*110,y=800+Math.sin(a*1.15)*30;c.save();c.translate(x,y);c.rotate(Math.atan2(Math.cos(a*1.15)*48*1.15,-Math.sin(a)*155));c.fillStyle=i%2?'rgba(186,117,60,.6)':'rgba(230,190,111,.65)';c.beginPath();c.ellipse(0,0,13,4,0,0,TAU);c.fill();c.beginPath();c.moveTo(-10,0);c.lineTo(-20,Math.sin(t*4+i)*5-4);c.lineTo(-19,Math.sin(t*4+i)*5+4);c.fill();c.restore();}
  for(const r of ripples){const age=time-r.t;for(let i=0;i<3;i++){const a=age-i*.25;if(a>=0&&a<3){c.lineWidth=1.3;ellipse(r.x,r.y,10+a*60,3+a*17,`rgba(246,232,182,${(1-a/3)*.45})`);}}}c.restore();
  if(lantern){for(const p of [[748,435],[1100,430],[1435,510],[666,590]]){const g=c.createRadialGradient(...p,0,...p,52);g.addColorStop(0,`rgba(255,184,75,${.15+Math.sin(t*2.1)*.015})`);g.addColorStop(1,'rgba(255,184,75,0)');c.fillStyle=g;c.fillRect(p[0]-52,p[1]-52,104,104);}}
  // Falling ginkgo leaves drift slowly down, all positions deterministic.
  for(let i=0;i<16;i++){const y=(i*71+t*(10+i%4))%920,x=190+i*79+Math.sin(t*.3+i)*32;c.save();c.translate(x,y);c.rotate(t*.3+i);c.fillStyle='rgba(193,149,66,.32)';c.beginPath();c.ellipse(0,0,3.7,1.9,0,0,TAU);c.fill();c.restore();}
  const age=time-bellAt;if(age>=0&&age<4){for(let i=0;i<3;i++){const a=age-i*.35;if(a>=0){c.lineWidth=1;ellipse(156,385,40+a*44,50+a*49,`rgba(231,202,134,${Math.max(0,.22-a*.06)})`);}}}
  c.restore();
  const amount=reduced.matches?1:clamp(entry/1.15);if(amount<1){c.fillStyle=`rgba(31,28,22,${1-amount})`;const edge=w*(1-amount)/2;c.fillRect(0,0,edge,h);c.fillRect(w-edge,0,edge,h);}
 }
 function frame(now){raf=0;if(!active||document.hidden)return;const dt=Math.min((now-(last||now))/1000,.05);last=now;if(!paused){time+=dt;entry+=dt;}ripples=ripples.filter(r=>time-r.t<4);draw();if(!paused&&!reduced.matches)request();}
 function request(){if(active&&!document.hidden&&!raf)raf=requestAnimationFrame(frame);}
 function mute(){soundGeneration++;sound=false;window.InkJourneyAudio?.suspend();$('temple-sound').textContent='听庭 · 静音';$('temple-sound').setAttribute('aria-pressed','false');}
 async function toggleSound(){if(sound||soundBusy){mute();return;}const g=++soundGeneration;soundBusy=true;try{const ok=await window.InkJourneyAudio?.enable();if(g!==soundGeneration||!active||document.hidden)return;sound=!!ok;window.InkJourneyAudio?.setScene(3);$('temple-sound').textContent=sound?'听庭 · 已开启':'听庭 · 静音';$('temple-sound').setAttribute('aria-pressed',String(sound));if(!sound)status('当前浏览器无法播放声音，仍可继续游览。');}catch{mute();status('声音暂不可用。');}finally{soundBusy=false;}}
 function action(kind,x=1340,y=800){if(!active||paused)return;panX=kind==='bell'?230:kind==='pond'?1320:kind==='incense'?800:1040;if(kind==='pond'){ripples.push({x,y,t:time});ripples=ripples.slice(-8);status('池鱼游过倒影，涟漪散入暮色。');}if(kind==='bell'){if(time-bellAt<1)return;bellAt=time;status('一声钟鸣，穿过庭院与远山。');}if(kind==='incense'){incense=!incense;$('temple-incense').setAttribute('aria-pressed',String(incense));status(incense?'香烟缓缓升起。':'香炉静息。');}if(kind==='lantern'){lantern=!lantern;$('temple-lantern').setAttribute('aria-pressed',String(lantern));status(lantern?'廊灯照亮归路。':'廊灯暂歇，月色入庭。');}if(sound)window.InkJourneyAudio?.effect(kind==='bell'?'bell':'ripple');draw();request();}
 function open(){if(active)return;active=true;paused=false;entry=0;panX=800;last=0;focus=document.activeElement;d.showModal();window.dispatchEvent(new CustomEvent('ink-temple',{detail:{open:true}}));$('temple-pause').textContent='静观';$('temple-pause').setAttribute('aria-pressed','false');status('山门已开。拖动庭景，听钟、观鱼、看香烟与廊灯。此景为寒山寺的艺术想象。');resize();$('temple-close').focus();request();}
 function close(){if(!active)return;active=false;if(raf)cancelAnimationFrame(raf);raf=0;mute();if(d.open)d.close();window.dispatchEvent(new CustomEvent('ink-temple',{detail:{open:false}}));focus?.focus();}
 $('temple-close').onclick=close;d.addEventListener('cancel',e=>{e.preventDefault();close();});d.addEventListener('close',close);
 window.addEventListener('ink-language-change',()=>{if(active)draw();});
 window.addEventListener('ink-journey-sound',e=>{if(!e.detail.enabled){sound=false;$('temple-sound').textContent='听庭 · 静音';$('temple-sound').setAttribute('aria-pressed','false');}});
 $('temple-sound').onclick=toggleSound;$('temple-pause').onclick=()=>{paused=!paused;last=0;$('temple-pause').textContent=paused?'继续':'静观';$('temple-pause').setAttribute('aria-pressed',String(paused));if(paused)mute();draw();request();};
 for(const k of ['pond','bell','incense','lantern'])$('temple-'+k).onclick=()=>action(k);
 let pointer=null;cv.addEventListener('pointerdown',e=>{pointer={x:e.clientX,y:e.clientY,id:e.pointerId,pan:panX};cv.setPointerCapture?.(e.pointerId);});cv.addEventListener('pointermove',e=>{if(!pointer||pointer.id!==e.pointerId)return;panX=pointer.pan-(e.clientX-pointer.x)/scale;draw();});cv.addEventListener('pointercancel',()=>pointer=null);cv.addEventListener('pointerup',e=>{if(!pointer||e.pointerId!==pointer.id)return;const p=pointer;pointer=null;if(Math.hypot(e.clientX-p.x,e.clientY-p.y)>12)return;const r=cv.getBoundingClientRect(),x=(e.clientX-r.left-ox)/scale,y=(e.clientY-r.top-oy)/(scale*16/15);if(((x-1340)/190)**2+((y-800)/80)**2<1)action('pond',x,y);else if(x<300&&y>280&&y<500)action('bell');else if(x>680&&x<920&&y>480&&y<740)action('incense');});
 $('temple-export').onclick=()=>{if(!loaded)return;draw();cv.toBlob(blob=>{if(!blob)return;const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='ink-journey-temple-courtyard.png';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);status('庭院画作已生成 PNG。');});};
 document.addEventListener('visibilitychange',()=>{last=0;if(document.hidden){if(raf)cancelAnimationFrame(raf);raf=0;mute();}else request();});window.addEventListener('pagehide',()=>{if(raf)cancelAnimationFrame(raf);raf=0;mute();});window.addEventListener('pageshow',()=>{last=0;request();});window.addEventListener('resize',resize);reduced.addEventListener('change',()=>{last=0;draw();request();});
 image.onload=()=>{loaded=true;window.dispatchEvent(new CustomEvent('ink-courtyard-ready'));$('temple-export').disabled=false;request();};image.onerror=()=>{failed=true;window.dispatchEvent(new CustomEvent('ink-courtyard-ready'));request();};image.src=window.InkCourtyardImage||'./assets/courtyard.jpg';$('temple-export').disabled=true;
 window.InkCourtyard=Object.freeze({open,close,action,draw,getState:()=>({active,paused,sound,time,loaded,failed,incense,lantern,ripples:ripples.length})});
})();
