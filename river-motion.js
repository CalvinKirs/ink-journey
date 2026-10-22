/* V14 river surface: one immutable native-height composite, shared-clock rows.
 * Shoreline geometry is measured against the five paintings, in world units.
 * No RAF, timer, audio, network, mutable-canvas frame copies or new artwork. */
'use strict';(()=>{
  const H=2400,MIN=window.InkLandscapeScene?.minX??-12960,MAX=window.InkLandscapeScene?.maxX??20160,NATIVE_H=724,SCALE=NATIVE_H/H;
  // Deliberately inset from rocks and reeds. Separate regions preserve the dry
  // foreground peninsula at the left join instead of dragging it with water.
  const regions=[
    {name:'western-river',top:[[-6480,1685],[-5700,1640],[-4800,1640],[-4000,1690],[-3200,1710],[-2400,1690],[-1700,1700],[-1000,1725],[-650,1750]],bottom:[[-6480,2500],[-5700,2500],[-4800,2500],[-4000,2470],[-3400,2350],[-2900,2180],[-2300,2140],[-1700,2020],[-1000,1880],[-650,1770]]},
    {name:'central-river',top:[[1150,1760],[1700,1710],[2400,1680],[3000,1720],[3500,1770],[4300,1800],[5000,1810],[5800,1820],[6500,1820],[7100,1800]],bottom:[[1150,1830],[1500,1970],[2000,2080],[2400,2160],[2800,2210],[3200,2330],[3700,2470],[4700,2500],[5800,2500],[6500,2500],[7100,2500]]},
    {name:'eastern-river',top:[[6950,1810],[7600,1760],[8300,1740],[9000,1710],[9800,1650],[10600,1620],[11400,1610],[12100,1590],[12900,1600],[13450,1660]],bottom:[[6950,2500],[7600,2500],[8300,2500],[9000,2500],[9600,2450],[10200,2350],[10800,2290],[11400,2180],[12000,2050],[12600,1960],[13100,1800],[13450,1700]]}
  ];
  if(MIN<-6480)regions.unshift({name:'bamboo-reach',top:[[-11050,1940],[-10700,1900],[-10300,1870],[-9900,1870],[-9700,1850],[-9500,1850],[-9200,1850],[-8800,1840],[-8600,1580],[-8300,1580],[-7600,1610],[-7000,1640],[-6480,1690]],bottom:[[-11050,1980],[-10700,2020],[-10300,2060],[-9900,2080],[-9500,2150],[-9000,2300],[-8600,2450],[-8000,2500],[-7000,2500],[-6480,2500]]});
  if(MAX>13680)regions.push({name:'lotus-village',top:[[13600,1640],[14100,1590],[14900,1540],[15700,1560],[16500,1680],[17500,1690],[18400,1780],[19000,2000],[19600,2140],[20160,2140]],bottom:[[13600,1830],[14100,1990],[14600,2150],[15000,2310],[15400,2490],[16500,2500],[18000,2500],[19200,2500],[20160,2500]]});
  // Small, separate masks inside the new terrace cascade. Their white water is
  // animated vertically; the dark boulders between channels remain untouched.
  const cascades=MIN<-6480?[
    {x:-7580,y:1120,w:68,h:37,dx:7}, {x:-7500,y:1140,w:55,h:41,dx:7},
    {x:-7400,y:1190,w:95,h:49,dx:8}, {x:-7290,y:1200,w:54,h:45,dx:5},
    {x:-7230,y:1270,w:98,h:51,dx:11}, {x:-7100,y:1290,w:52,h:48,dx:7},
    {x:-7090,y:1360,w:112,h:53,dx:15}, {x:-6900,y:1420,w:148,h:36,dx:18}
  ]:[];
  let phase='waiting',texture=null,textureBuilds=0,lastTime=0,lastMotion=false,drawRows=0,error=null;
  const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
  const smooth=n=>{n=clamp(n);return n*n*(3-2*n);};
  function interp(points,x){if(x<points[0][0]||x>points[points.length-1][0])return null;for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i];if(x<=b[0])return a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0]);}return points[points.length-1][1];}
  function readyEvent(){window.dispatchEvent(new CustomEvent('ink-river-ready'));}
  function prepare(){
    const scene=window.InkLandscapeScene;if(phase!=='waiting'||!scene?.ready)return;
    if(scene.failed){phase='failed';error='landscape unavailable';readyEvent();return;}
    phase='encoding';textureBuilds++;
    try{
      const canvas=document.createElement('canvas');canvas.width=Math.ceil((MAX-MIN)*SCALE);canvas.height=NATIVE_H;
      const ctx=canvas.getContext('2d');ctx.setTransform(SCALE,0,0,SCALE,0,0);scene.draw(ctx,MIN,MAX-MIN);ctx.setTransform(1,0,0,1,0,0);
      // Alpha-only edit to the cached rendered composition, not a repeated read.
      const pixels=ctx.getImageData(0,0,canvas.width,canvas.height),data=pixels.data;
      // Interpolate the contour only once per source column, not per pixel.
      for(let x=0;x<canvas.width;x++){
        const wx=MIN+x/SCALE,intervals=[];
        for(const r of regions){const top=interp(r.top,wx),bottom=interp(r.bottom,wx);if(top!==null&&bottom!==null)intervals.push({top,bottom,side:smooth(Math.min(wx-r.top[0][0],r.top[r.top.length-1][0]-wx)/90)});}
        for(let y=0;y<canvas.height;y++){
          let alpha=0;const wy=y/SCALE;
          if(y>465)for(const q of intervals)alpha=Math.max(alpha,smooth((wy-q.top)/70)*smooth((q.bottom-wy)/85)*q.side);
          data[(y*canvas.width+x)*4+3]=Math.round(255*alpha);
        }
      }
      // Include only the independently measured waterfall channel interiors.
      for(const f of cascades){const x0=Math.max(0,Math.floor((f.x-MIN)*SCALE)),x1=Math.min(canvas.width,Math.ceil((f.x+f.w-MIN)*SCALE));const y0=Math.floor(f.y*SCALE),y1=Math.ceil((f.y+f.h)*SCALE);for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){const a=smooth(Math.min(x-x0,x1-x)/3)*smooth(Math.min(y-y0,y1-y)/2);data[(y*canvas.width+x)*4+3]=Math.max(data[(y*canvas.width+x)*4+3],Math.round(a*255));}}
      ctx.putImageData(pixels,0,0);
      const image=new Image();image.onload=()=>{texture=image;phase='ready';readyEvent();};image.onerror=()=>{phase='failed';error='river texture decode failed';readyEvent();};image.src=canvas.toDataURL('image/png');
    }catch(e){phase='failed';error=String(e?.message||e);readyEvent();}
  }
  function draw(c,time,{camera=MIN,viewW=MAX-MIN,motion=true}={}){
    prepare();drawRows=0;if(phase!=='ready'||!c)return false;
    const t=Number.isFinite(time)?Math.max(0,time):lastTime;lastTime=t;lastMotion=motion!==false;
    // In reduced motion keep the authoritative painting untouched, not a newly
    // resampled static copy. Pausing uses the caller's unchanged scene time.
    if(!lastMotion)return true;
    const left=Math.max(MIN,camera-70),right=Math.min(MAX,camera+viewW+70);
    if(!(right>left))return true;
    c.save();c.imageSmoothingEnabled=true;
    const sx=(left-MIN)*SCALE,sw=(right-left)*SCALE;
    for(let sy=Math.floor(1570*SCALE);sy<NATIVE_H;sy+=2){
      const wy=sy/SCALE,depth=clamp((wy-1570)/830);
      // Several wavelengths break up reflections without bending solid shore.
      const dx=(10+depth*22)*Math.sin(t*1.35+wy*.045)+(5+depth*8)*Math.sin(t*.73-wy*.021);
      const dy=.40*Math.sin(t*1.1+wy*.018),sh=Math.min(2,NATIVE_H-sy);
      const srcY=clamp(sy+dy,0,NATIVE_H-sh);
      c.globalAlpha=.91;
      c.drawImage(texture,sx,srcY,sw,sh,left+dx,wy,right-left,sh/SCALE+.12);
      drawRows++;
    }
    // Visible descending strands occupy white-water channels only. Each fixed
    // clip is stationary in world coordinates and excludes terrace rocks.
    for(const f of cascades){if(f.x+f.w<camera||f.x>camera+viewW)continue;c.save();c.beginPath();c.rect(f.x,f.y,f.w,f.h);c.clip();c.globalAlpha=.72;const fallOffset=(t*31)%f.h;for(const oy of[fallOffset-f.h,fallOffset])c.drawImage(texture,(f.x-MIN)*SCALE,f.y*SCALE,f.w*SCALE,f.h*SCALE,f.x,f.y+oy,f.w,f.h);for(let i=0;i<9;i++){const p=(t*(.8+i*.045)+i*.137)%1;const xx=f.x+f.w*(i+.5)/9,yy=f.y+p*f.h;c.globalAlpha=.18+Math.sin(p*Math.PI)*.22;c.strokeStyle='#fff1cf';c.lineWidth=1.8+(i%3);c.beginPath();c.moveTo(xx,yy);c.quadraticCurveTo(xx+f.dx*.35,yy+9,xx+f.dx,yy+24);c.stroke();}c.restore();}
    c.restore();return true;
  }
  window.InkRiverMotion=Object.freeze({draw,get ready(){return phase==='ready';},get failed(){return phase==='failed';},geometry:Object.freeze({minX:MIN,maxX:MAX,height:H,nativeHeight:NATIVE_H,regions,cascades,feather:85,maxDisplacement:45}),getState(){return {phase,textureBuilds,lastTime,lastMotion,drawRows,error,width:texture?.width||0,height:texture?.height||0};}});
  window.addEventListener('ink-landscape-ready',prepare);prepare();
})();
