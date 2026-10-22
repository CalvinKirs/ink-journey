/* V14 extended river scroll. The original center and two distinct generated ends
 * are sampled at their native aspect ratios. Only the outer overlap margins fade. */
'use strict';(()=>{
  const H=2400,CORE_W=7200,config=window.InkLandscapeExtensions||{},overlap=config.overlap||720;
  const outer=window.InkLandscapeOuterExtensions||{};
  const records={outerLeft:outer.left,outerRight:outer.right,core:{src:window.InkUnifiedImage,width:2172,height:724},left:config.left,right:config.right};
  const leftW=config.left?H*config.left.width/config.left.height:0,rightW=config.right?H*config.right.width/config.right.height:0;
  const innerMin=leftW?overlap-leftW:0,innerMax=rightW?CORE_W-overlap+rightW:CORE_W;
  const outerLeftW=outer.left?H*outer.left.width/outer.left.height:0,outerRightW=outer.right?H*outer.right.width/outer.right.height:0;
  const minX=outerLeftW?innerMin+overlap-outerLeftW:innerMin,maxX=outerRightW?innerMax-overlap+outerRightW:innerMax;
  const images={},status={};let coreMask=null;const edgeMasks={};
  const ready=()=>Object.keys(records).filter(k=>records[k]).every(k=>status[k]);
  function notify(){window.dispatchEvent(new CustomEvent('ink-landscape-ready'));}
  for(const [key,record]of Object.entries(records)){if(!record)continue;const im=images[key]=new Image();im.onload=()=>{status[key]='loaded';notify();};im.onerror=()=>{status[key]='failed';notify();};im.src=record.src;}
  function maskedCore(){
    if(coreMask)return coreMask;const im=images.core,w=im.naturalWidth||im.width,h=im.naturalHeight||im.height;
    const cache=document.createElement('canvas');cache.width=w;cache.height=h;const cc=cache.getContext('2d');cc.drawImage(im,0,0);
    const mask=document.createElement('canvas');mask.width=w;mask.height=h;const mc=mask.getContext('2d');
    // Keep tree trunks, the bell tower and bridge opaque. Feather the lower-detail
    // sky and open river more broadly, rather than ghosting foreground structures.
    for(let row=0;row<h;row++){
      const worldY=row/h*H,sky=Math.max(0,1-worldY/500),water=Math.max(0,Math.min(1,(worldY-1750)/350));
      const atmosphere=Math.max(sky*sky,water*water);
      const leftFade=120/CORE_W*w,rightFade=(60+660*atmosphere)/CORE_W*w;
      const rightInset=(1-atmosphere)*(50+20*Math.sin(worldY*.012)+15*Math.sin(worldY*.027))/CORE_W*w;
      const g=mc.createLinearGradient(0,0,w,0);
      g.addColorStop(0,status.left==='loaded'?'transparent':'#fff');g.addColorStop(leftFade/w,'#fff');g.addColorStop(1-(rightFade+rightInset)/w,'#fff');g.addColorStop(1-rightInset/w,status.right==='loaded'?'transparent':'#fff');g.addColorStop(1,status.right==='loaded'?'transparent':'#fff');
      mc.fillStyle=g;mc.fillRect(0,row,w,1);
    }
    cc.globalCompositeOperation='destination-in';cc.drawImage(mask,0,0);coreMask=cache;return cache;
  }
  function maskedEnd(key){
    if(edgeMasks[key])return edgeMasks[key];
    const im=images[key],w=im.naturalWidth||im.width,h=im.naturalHeight||im.height;
    const cache=document.createElement('canvas');cache.width=w;cache.height=h;const cc=cache.getContext('2d');cc.drawImage(im,0,0);
    const mask=document.createElement('canvas');mask.width=w;mask.height=h;const mc=mask.getContext('2d');
    for(let y=0;y<h;y++){
      const wy=y/h*H,atmosphere=Math.max(Math.max(0,1-wy/550),Math.max(0,Math.min(1,(wy-1800)/400)));
      const feather=(key==='right'?55+305*atmosphere:110+250*atmosphere)/7200*w;
      const inset=key==='right'?(1-atmosphere)*(35+25*Math.sin(wy*.009)+15*Math.sin(wy*.027))/7200*w:0;
      const g=mc.createLinearGradient(0,0,w,0);
      if(key==='left'){g.addColorStop(0,'transparent');g.addColorStop(feather/w,'#fff');g.addColorStop(1,'#fff');}
      else{g.addColorStop(0,'#fff');g.addColorStop(1-(feather+inset)/w,'#fff');g.addColorStop(1-inset/w,'transparent');g.addColorStop(1,'transparent');}
      mc.fillStyle=g;mc.fillRect(0,y,w,1);
    }
    cc.globalCompositeOperation='destination-in';cc.drawImage(mask,0,0);edgeMasks[key]=cache;return cache;
  }
  function draw(c,camera,viewW){
    c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';if(!ready())return false;
    c.fillStyle='#e9e7d7';c.fillRect(0,0,viewW,H);
    if(status.outerLeft==='loaded'&&camera<innerMin+overlap&&camera+viewW>minX)c.drawImage(images.outerLeft,minX-camera,0,outerLeftW,H);
    if(status.outerRight==='loaded'&&camera<maxX&&camera+viewW>innerMax-overlap)c.drawImage(images.outerRight,innerMax-overlap-camera,0,outerRightW,H);
    if(status.left==='loaded'&&camera<overlap&&camera+viewW>innerMin)c.drawImage(status.outerLeft==='loaded'&&camera<innerMin+360?maskedEnd('left'):images.left,innerMin-camera,0,leftW,H);
    if(status.right==='loaded'&&camera<maxX&&camera+viewW>CORE_W-overlap)c.drawImage(status.outerRight==='loaded'&&camera+viewW>innerMax-360?maskedEnd('right'):images.right,CORE_W-overlap-camera,0,rightW,H);
    if(status.left==='loaded'&&status.outerLeft==='loaded'&&camera<innerMin+360&&camera+viewW>innerMin+360){c.save();c.beginPath();c.rect(innerMin+360-camera,0,leftW-360,H);c.clip();c.drawImage(images.left,innerMin-camera,0,leftW,H);c.restore();}
    if(status.right==='loaded'&&status.outerRight==='loaded'&&camera+viewW>innerMax-360&&camera<innerMax-360){c.save();c.beginPath();c.rect(CORE_W-overlap-camera,0,rightW-360,H);c.clip();c.drawImage(images.right,CORE_W-overlap-camera,0,rightW,H);c.restore();}
    if(status.core==='loaded'&&camera<CORE_W&&camera+viewW>0){
      if(camera>=120&&camera+viewW<=CORE_W-720){c.drawImage(images.core,-camera,0,CORE_W,H);return true;}
      c.drawImage(maskedCore(),-camera,0,CORE_W,H);
      // Direct original sampling in the untouched center avoids any offscreen
      // premultiplication/rounding changes introduced by the edge-mask cache.
      c.save();c.beginPath();c.rect(120-camera,0,CORE_W-840,H);c.clip();c.drawImage(images.core,-camera,0,CORE_W,H);c.restore();
    }
    if(status.core==='failed'){c.fillStyle='#77816d';c.font='42px serif';c.fillText(window.InkI18n?.t('画卷未能展开，请刷新后重试。')||'画卷未能展开，请刷新后重试。',viewW*.2,1200,viewW*.65);}
    return true;
  }
  window.InkLandscapeScene=Object.freeze({draw,get ready(){return ready();},get failed(){return Object.values(status).includes('failed');},get sourceWidth(){return records.core.width;},get sourceHeight(){return Math.min(...Object.values(records).filter(Boolean).map(r=>r.height));},W:maxX-minX,H,minX,maxX,geometry:Object.freeze({core:{x:0,y:0,w:CORE_W,h:H},left:{x:innerMin,y:0,w:leftW,h:H},outerLeft:{x:minX,y:0,w:outerLeftW,h:H},outerRight:{x:innerMax-overlap,y:0,w:outerRightW,h:H},right:{x:CORE_W-overlap,y:0,w:rightW,h:H},overlap,untouched:[120,CORE_W-720],foregroundFadeWidth:120,rightForegroundFeather:60,skyWaterFadeWidth:720})});
})();
