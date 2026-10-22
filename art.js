/*
 * Mountains beyond the ink · original procedural landscape, 2026.
 * All marks are authored Canvas paths. No assets or network dependencies.
 * Three transparent half-resolution caches total 25.9 MB of pixel storage.
 */
'use strict';
(() => {
  const W = 7200, H = 1200, TAU = Math.PI * 2;
  const PAPER = '239,235,217';
  const palettes = {
    dawn: {dark:'43,63,57', mid:'91,112,99', light:'154,168,142', accent:'159,155,114'},
    rain: {dark:'38,58,56', mid:'87,108,102', light:'149,166,154', accent:'117,136,116'},
    dusk: {dark:'62,66,51', mid:'123,132,106', light:'175,174,139', accent:'180,139,93'}
  };
  let seed = 827391;
  function random() {seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296;}
  const between = (a,b) => a + random() * (b-a);
  const rgba = (rgb,a) => `rgba(${rgb},${Math.max(0,Math.min(1,a))})`;
  const choose = arr => arr[Math.floor(random()*arr.length)];
  function trace(c, pts, closed=false) {
    c.beginPath(); c.moveTo(pts[0][0],pts[0][1]);
    for(let i=1;i<pts.length;i++) c.lineTo(pts[i][0],pts[i][1]);
    if(closed)c.closePath();
  }
  function line(c,pts,color,width=1) {trace(c,pts);c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.stroke();}
  function curve(c,pts,color,width=1) {
    c.beginPath();c.moveTo(pts[0][0],pts[0][1]);
    for(let i=1;i<pts.length-1;i++) c.quadraticCurveTo(pts[i][0],pts[i][1],(pts[i][0]+pts[i+1][0])/2,(pts[i][1]+pts[i+1][1])/2);
    c.lineTo(pts[pts.length-1][0],pts[pts.length-1][1]);c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.stroke();
  }
  function ellipse(c,x,y,rx,ry,angle,color){c.beginPath();c.ellipse(x,y,rx,ry,angle,0,TAU);c.fillStyle=color;c.fill();}
  function glow(c,x,y,rx,ry,color,alpha){
    c.save();c.translate(x,y);c.scale(1,ry/rx);
    const g=c.createRadialGradient(0,0,0,0,0,rx);g.addColorStop(0,rgba(color,alpha));g.addColorStop(.55,rgba(color,alpha*.48));g.addColorStop(1,rgba(color,0));c.fillStyle=g;c.fillRect(-rx,-rx,rx*2,rx*2);c.restore();
  }
  function washPolygon(c,pts,color,alpha,top,bottom){
    trace(c,pts,true);const g=c.createLinearGradient(0,top,0,bottom);g.addColorStop(0,rgba(color,alpha));g.addColorStop(.6,rgba(color,alpha*.72));g.addColorStop(1,rgba(color,0));c.fillStyle=g;c.fill();
  }
  // Interpolated, finely broken contours retain each hand-authored ridge's character.
  function brokenRidge(points,rough=7){
    const out=[];
    for(let i=0;i<points.length-1;i++){
      const a=points[i],b=points[i+1],length=Math.hypot(b[0]-a[0],b[1]-a[1]),n=Math.max(3,Math.ceil(length/9));
      const bend=between(-1,1)*Math.min(30,length*.2),phase=between(0,6),steps=between(2,5);
      for(let j=0;j<n;j++){
        const t=j/n,envelope=Math.sin(t*Math.PI);
        const wave=Math.sin(t*Math.PI*2+phase)*rough*1.8+Math.sin(t*Math.PI*steps*2+phase)*rough*.8;
        const yy=a[1]+(b[1]-a[1])*t+(bend+wave+between(-rough*.5,rough*.5))*envelope;
        out.push([a[0]+(b[0]-a[0])*t,yy]);
      }
    }
    out.push(points[points.length-1]);return out;
  }
  function ridgeY(ridge,x){
    for(let i=1;i<ridge.length;i++)if(x<=ridge[i][0]){const a=ridge[i-1],b=ridge[i],t=(x-a[0])/(b[0]-a[0]||1);return a[1]+(b[1]-a[1])*t;}
    return ridge[ridge.length-1][1];
  }
  function mountain(c,outline,base,pal,strength=1,detail=1){
    const ridge=brokenRidge(outline,3+detail*3),start=outline[0][0],end=outline[outline.length-1][0];
    const top=Math.min(...outline.map(p=>p[1]));
    const poly=[...ridge,[end+100,base+80],[start-100,base+80]];
    c.save();
    washPolygon(c,poly,pal.mid,strength*.62,top,base+45);
    trace(c,poly,true);c.clip();
    // Broad asymmetrical washes make overlapping rock planes rather than triangular hats.
    for(let i=1;i<outline.length-1;i++){
      const a=outline[i];if(a[1]>=outline[i-1][1]||a[1]>=outline[i+1][1])continue;
      const lean=between(-75,110),foot=a[0]+lean;
      const pts=[[a[0],a[1]-2],[a[0]+between(8,38),a[1]+50],[foot+35,base-80],[foot-100,base+40],[a[0]-between(50,125),a[1]+90]];
      washPolygon(c,pts,pal.dark,strength*between(.035,.09),a[1],base);
      glow(c,a[0]+20,a[1]+(base-a[1])*.36,between(55,100),(base-a[1])*.52,pal.dark,strength*.13);
      for(let wet=0;wet<4;wet++) {
        const dx=between(-25,35),dd=between(-30,30);
        curve(c,[[a[0]+dx,a[1]+18],[a[0]+dx+dd,a[1]+(base-a[1])*.22],[foot+dx-12,a[1]+(base-a[1])*.6],[foot+dx+24,base-20]],rgba(pal.dark,strength*.025),between(9,24));
      }
      const face=[[a[0]+4,a[1]+10],[a[0]+45,a[1]+75],[foot+85,base-20],[foot+12,base+35],[a[0]-18,a[1]+95]];
      washPolygon(c,face,pal.light,strength*.12,a[1],base);
    }
    // Long "hemp-fibre" strokes descend along broken rock grain in loose groups.
    const groups=Math.floor((end-start)/24*detail);
    for(let k=0;k<groups;k++){
      const x=between(start,end),y=ridgeY(ridge,x)+between(5,90),length=between(55,Math.max(70,(base-y)*.82));
      const drift=between(-90,80),segments=between(5,10)|0;
      for(let strand=0;strand<between(2,5);strand++){
        let xx=x+strand*between(2,6),yy=y+between(-9,8);const pts=[[xx,yy]];
        for(let j=1;j<=segments;j++){xx=x+drift*j/segments+between(-13,13)+strand*4;yy=y+length*j/segments;pts.push([xx,yy]);}
        curve(c,pts,rgba(pal.dark,strength*between(.08,.24)),between(.6,2));
      }
    }
    // Broken axe-cut hatches: short, angled brush planes, never evenly distributed.
    for(let k=0;k<(end-start)*detail*1.3;k++){
      const x=between(start,end),roof=ridgeY(ridge,x),y=between(roof+10,base),fade=Math.max(0,1-(y-top)/(base-top));
      if(random()>.35+fade*.4)continue;
      const len=between(3,19),w=between(.7,2.8);
      line(c,[[x,y],[x+between(-5,8),y+len],[x+between(-4,9),y+len+3]],rgba(pal.dark,strength*fade*between(.11,.35)),w);
    }
    // Ridge shelves and tiny vegetation dots distinguish rock from flowing water.
    for(let k=0;k<(end-start)/18*detail;k++){
      const x=between(start,end),roof=ridgeY(ridge,x),y=roof+between(15,Math.max(20,(base-roof)*.7));
      if(random()<.6){line(c,[[x-9,y+2],[x,y],[x+between(8,20),y+4]],rgba(pal.dark,strength*.13),between(.6,1.4));}
      for(let j=0;j<3;j++)ellipse(c,x+between(-8,8),y+between(-4,4),between(1,3),between(.6,2),between(-1,1),rgba(pal.dark,strength*between(.15,.35)));
    }
    // Irregular rounded boulders and scrub on ledges are small enough to read as brushwork.
    if(detail>.5) for(let k=0;k<(end-start)/19*detail;k++) {
      const xx=between(start,end),roof=ridgeY(ridge,xx),yy=roof+between(8,Math.max(10,(base-roof)*.53));
      const rw=between(7,21),rh=between(8,25),fade=Math.max(0,1-(yy-top)/(base-top));
      curve(c,[[xx-rw,yy+rh],[xx-rw*.8,yy],[xx-rw*.2,yy-rh*.32],[xx+rw*.5,yy-rh*.4],[xx+rw,yy+rh*.9]],rgba(pal.dark,strength*fade*between(.1,.25)),between(.6,1.4));
      for(let j=0;j<between(3,7);j++) ellipse(c,xx+between(-rw,rw),yy+between(-rh*.4,2),between(1,3.5),between(1,2.2),between(-1,1),rgba(pal.dark,strength*fade*between(.14,.4)));
    }
    c.restore();
    // Only pieces of the crest are inked, as in a brush losing water.
    for(let i=0;i<ridge.length-4;i+=between(4,10)|0){const part=ridge.slice(i,i+(between(3,9)|0));line(c,part,rgba(pal.dark,strength*between(.1,.28)),between(.8,2));}
  }
  function rock(c,x,y,s=1,pal=palettes.dawn){
    c.save();c.translate(x,y);c.scale(s,s);
    const pts=[[-43,6],[-33,-18],[-12,-35],[9,-32],[37,-12],[46,5],[15,11],[-16,10]];
    trace(c,pts,true);c.fillStyle=rgba(pal.light,.34);c.fill();
    curve(c,[[-42,6],[-31,-17],[-12,-35],[9,-32],[37,-12],[45,5]],rgba(pal.dark,.61),1.4);
    curve(c,[[-12,-33],[-17,-15],[-4,-2],[16,6]],rgba(pal.dark,.28),1.2);
    curve(c,[[9,-31],[16,-18],[28,-14]],rgba(pal.dark,.3),.8);
    for(let k=0;k<23;k++){const xx=between(-30,32),yy=between(-18,4);line(c,[[xx,yy],[xx+between(2,8),yy+between(2,6)]],rgba(pal.dark,between(.08,.25)),between(.5,1.1));}
    line(c,[[-50,12],[-20,13],[37,10],[57,13]],rgba(pal.dark,.18),1);
    c.restore();
  }
  function reeds(c,x,y,s=1,dark='58,76,59'){
    c.save();c.translate(x,y);c.scale(s,s);
    for(let i=0;i<11;i++){
      const dx=between(-32,32),h=between(22,79),bend=between(-25,30),a=between(.3,.7);
      curve(c,[[dx,1],[dx+bend*.15,-h*.6],[dx+bend,-h]],rgba(dark,a),between(.7,1.5));
      if(i%3===0){line(c,[[dx+bend,-h+7],[dx+bend+4,-h-8]],rgba(dark,a*.9),2.8);}
      curve(c,[[dx,-h*.28],[dx+bend+between(-18,22),-h*.52],[dx+bend+between(-24,28),-h*.45]],rgba(dark,a*.7),1.1);
    }c.restore();
  }
  function needleCloud(c,x,y,rx,ry,alpha,pal){
    // Flattened clusters, with air between needles and ragged silhouettes.
    for(let i=0;i<rx*1.55;i++){
      const a=random()*TAU,r=Math.sqrt(random()),px=x+Math.cos(a)*rx*r,py=y+Math.sin(a)*ry*r;
      const radius=between(4,11);
      for(let j=0;j<5;j++){
        const ang=-Math.PI*.9+j*.55+between(-.2,.2);
        line(c,[[px,py],[px+Math.cos(ang)*radius,py+Math.sin(ang)*radius]],rgba(pal.dark,alpha*between(.32,.83)),between(.65,1.15));
      }
      if(i%5===0)ellipse(c,px,py,between(4,10),between(1.3,3.2),between(-.25,.25),rgba(pal.dark,alpha*.22));
    }
  }
  function pine(c,x,y,s=1,pal=palettes.dawn,lean=1){
    c.save();c.translate(x,y);c.scale(s*lean,s);
    // A bent, tapering old trunk, left hollow by the soft highlight.
    c.beginPath();c.moveTo(-11,5);c.bezierCurveTo(3,-57,-18,-104,7,-156);c.bezierCurveTo(22,-185,16,-220,34,-253);c.lineTo(39,-254);c.bezierCurveTo(25,-204,34,-181,17,-148);c.bezierCurveTo(-3,-105,13,-50,9,5);c.closePath();c.fillStyle=rgba(pal.dark,.81);c.fill();
    curve(c,[[-5,0],[1,-54],[-7,-103],[14,-165],[22,-205],[35,-251]],rgba(pal.light,.42),3);
    const limbs=[
      {p:[[0,-70],[-37,-102],[-79,-112],[-111,-108]],cl:[[-103,-118,59,17],[-58,-123,40,16]]},
      {p:[[6,-101],[39,-122],[76,-133],[113,-126]],cl:[[102,-137,57,17],[55,-140,42,16]]},
      {p:[[8,-143],[-19,-163],[-59,-168],[-84,-178]],cl:[[-71,-184,53,18],[-29,-177,36,15]]},
      {p:[[19,-170],[54,-189],[92,-186]],cl:[[82,-197,48,17],[38,-205,41,15]]},
      {p:[[23,-209],[-3,-228],[-35,-225]],cl:[[-20,-237,44,17],[29,-254,43,18]]}
    ];
    limbs.forEach((b,i)=>{curve(c,b.p,rgba(pal.dark,.72),Math.max(1.4,5-i*.65));curve(c,b.p.map(p=>[p[0],p[1]-1.5]),rgba(pal.light,.22),1);b.cl.forEach(v=>needleCloud(c,...v,.72,pal));});
    // Bark fissures follow the curvature; exposed roots clasp the shore.
    for(let i=0;i<22;i++){const yy=-i*10,xx=yy<-140?15+(Math.abs(yy)-140)*.13:Math.sin(i*.6)*4;curve(c,[[xx-4,yy],[xx-7,yy-6],[xx-3,yy-11]],rgba(pal.light,.5),.9);}
    curve(c,[[0,-11],[-11,1],[-36,9],[-52,8]],rgba(pal.dark,.66),3);
    curve(c,[[4,-9],[14,3],[30,6],[39,15]],rgba(pal.dark,.58),2.4);
    c.restore();
  }
  function shrub(c,x,y,s=1,pal=palettes.dawn){
    for(let j=0;j<7;j++){const dx=between(-20,20)*s,dy=between(-22,0)*s;curve(c,[[x,y],[x+dx*.4,y-15*s],[x+dx,y+dy-20*s]],rgba(pal.dark,.5),.8*s);for(let k=0;k<6;k++)ellipse(c,x+dx+between(-8,8)*s,y+dy-20*s+between(-6,5)*s,between(2,5)*s,between(1,2.5)*s,between(-1,1),rgba(pal.dark,between(.2,.5)));}
  }
  function bamboo(c,x,y,s=1,flip=1){
    const pal=palettes.rain;c.save();c.translate(x,y);c.scale(s*flip,s);
    for(let stalk=0;stalk<7;stalk++){
      const bx=between(-40,40),height=between(130,265),lean=between(-45,45),points=[];
      for(let k=0;k<=7;k++)points.push([bx+lean*k/7,-height*k/7]);
      curve(c,points,rgba(pal.dark,between(.3,.61)),between(1.8,3.4));
      for(let k=1;k<7;k++){
        const xx=bx+lean*k/7,yy=-height*k/7;line(c,[[xx-3,yy],[xx+3,yy-1]],rgba(pal.dark,.61),1.4);
        if(k<3)continue;
        const dir=(stalk+k)%2?1:-1,end=xx+dir*between(30,65),up=yy-between(10,32);
        curve(c,[[xx,yy],[xx+dir*14,yy-12],[end,up]],rgba(pal.dark,.5),1.1);
        for(let n=0;n<6;n++){
          const t=n/6,lx=xx+(end-xx)*t,ly=yy+(up-yy)*t,len=between(15,35),angle=(n%2?-1:1)*between(.3,1.1);
          c.beginPath();c.moveTo(lx,ly);c.quadraticCurveTo(lx+dir*len*.5,ly+Math.sin(angle)*len*.3-6,lx+dir*len,ly+Math.sin(angle)*len);c.quadraticCurveTo(lx+dir*len*.4,ly+Math.sin(angle)*len*.4+4,lx,ly);c.fillStyle=rgba(pal.dark,between(.38,.7));c.fill();
        }
      }
    }c.restore();
  }
  function bank(c,points,bottom,pal,strength=.7){
    mountain(c,points,bottom,pal,strength,.65);
    const ridge=brokenRidge(points,2);line(c,ridge,rgba(pal.dark,.37*strength),1.3);
    for(let i=0;i<points.length-1;i++){
      const [x,y]=points[i];if(i%2===0){glow(c,x,y+30,80,26,pal.accent,.05);}
    }
  }
  function drawDock(c,x,y){
    c.save();c.translate(x,y);
    c.beginPath();c.moveTo(-155,-17);c.lineTo(61,-4);c.lineTo(91,18);c.lineTo(-133,7);c.closePath();c.fillStyle=rgba('78,84,61',.28);c.fill();
    for(let i=0;i<19;i++){const xx=-155+i*12;line(c,[[xx,-17+(xx+155)*.06],[xx+22,8+(xx+155)*.05]],rgba('44,60,48',.55),1.3);}
    line(c,[[-156,-18],[64,-5],[91,18]],rgba('45,58,44',.7),2.8);line(c,[[-133,8],[91,19]],rgba('45,58,44',.6),2);
    [-104,-24,57].forEach((xx,i)=>{line(c,[[xx,-13+i*4],[xx+3,43-i*3]],rgba('43,57,45',.68),4);line(c,[[xx-6,-13+i*4],[xx+5,-13+i*4]],rgba('43,57,45',.7),2);line(c,[[xx,47],[xx+22,50]],rgba('79,99,80',.18),1);});
    // A coil of rope and tied reed mat make the small landing feel inhabited.
    for(let i=0;i<4;i++){c.beginPath();c.ellipse(-74+i,-10+i*.4,10-i*1.7,3-i*.4,.04,0,TAU);c.strokeStyle=rgba('63,70,48',.6);c.lineWidth=.8;c.stroke();}
    curve(c,[[51,-8],[67,-18],[75,-11],[65,4]],rgba('58,69,49',.6),1.4);
    c.restore();
  }
  function waterfall(c,x,y,height){
    c.save();c.translate(x,y);
    // The negative-space waterfall cuts through its dark, split cliff.
    c.beginPath();c.moveTo(-10,0);c.bezierCurveTo(-19,height*.27,15,height*.34,-7,height*.58);c.bezierCurveTo(-19,height*.77,-37,height*.87,-39,height);c.lineTo(18,height);c.bezierCurveTo(8,height*.84,18,height*.69,20,height*.53);c.bezierCurveTo(25,height*.33,6,height*.2,10,0);c.closePath();
    const g=c.createLinearGradient(0,0,0,height);g.addColorStop(0,rgba(PAPER,.87));g.addColorStop(.58,rgba('248,245,230',.95));g.addColorStop(1,rgba(PAPER,.08));c.fillStyle=g;c.fill();
    for(let i=0;i<9;i++){const xx=-9+i*2.3;curve(c,[[xx,8],[xx-4,height*.22],[xx+11,height*.43],[xx-3,height*.68],[xx-21,height*.92]],rgba('105,132,123',between(.1,.22)),between(.6,1.5));}
    glow(c,-12,height,110,43,PAPER,.65);
    for(let i=0;i<12;i++){const yy=height+between(0,35),xx=between(-60,60);line(c,[[xx,yy],[xx+between(12,34),yy]],rgba('78,109,97',.1),.8);}
    c.restore();
  }
  function bridge(c,x,y,s=1){
    c.save();c.translate(x,y);c.scale(s,s);const pal=palettes.rain;
    // Slender masonry moon bridge, with open water under the arch.
    c.beginPath();c.moveTo(-147,8);c.bezierCurveTo(-105,-8,-74,-74,0,-78);c.bezierCurveTo(73,-78,106,-14,149,10);c.lineTo(130,24);c.bezierCurveTo(84,5,68,-56,0,-57);c.bezierCurveTo(-65,-57,-92,6,-132,26);c.closePath();c.fillStyle=rgba(pal.light,.53);c.fill();
    curve(c,[[-147,8],[-103,-14],[-68,-74],[0,-78],[70,-74],[112,-10],[149,10]],rgba(pal.dark,.64),2.3);
    curve(c,[[-132,26],[-93,5],[-67,-55],[0,-57],[66,-54],[91,3],[130,24]],rgba(pal.dark,.65),1.8);
    for(let i=0;i<=12;i++){const xx=-140+i*23.5,yy=-77*Math.pow(Math.max(0,1-Math.pow(xx/147,2)),1.45)+5;line(c,[[xx,yy],[xx,yy-21]],rgba(pal.dark,.59),2.3);}
    curve(c,[[-143,-17],[-102,-40],[-64,-93],[0,-98],[66,-92],[111,-35],[148,-13]],rgba(pal.dark,.64),2);
    for(let i=0;i<14;i++){const xx=-115+i*17,yy=-76*Math.pow(Math.max(0,1-Math.pow(xx/145,2)),1.45)+11;line(c,[[xx-3,yy-8],[xx+2,yy+2]],rgba(pal.dark,.28),1);}
    c.restore();
  }
  function drawPavilion(c,x,y){
    c.save();c.translate(x,y);c.scale(.74,.74);const ink='48,61,50',light='157,155,117';
    // Six-post lakeside pavilion. Ground center is the supplied landmark.
    c.beginPath();c.moveTo(-81,-8);c.lineTo(72,-8);c.lineTo(88,4);c.lineTo(-95,4);c.closePath();c.fillStyle=rgba(light,.5);c.fill();
    for(const xx of [-58,-23,30,65]){line(c,[[xx,-15],[xx,-117]],rgba(ink,.88),xx===-23||xx===30?3.3:4.2);line(c,[[xx+2,-16],[xx+2,-111]],rgba(light,.52),.8);}
    line(c,[[-66,-48],[70,-48]],rgba(ink,.7),2.4);line(c,[[-66,-20],[70,-20]],rgba(ink,.74),2.3);
    for(let xx=-58;xx<70;xx+=13)line(c,[[xx,-48],[xx,-22]],rgba(ink,.58),1.4);
    // Upper roof has lifted, ragged eaves and a fine ridge finial.
    c.beginPath();c.moveTo(-109,-105);c.bezierCurveTo(-68,-109,-39,-130,-13,-148);c.lineTo(13,-148);c.bezierCurveTo(44,-130,73,-110,106,-113);c.quadraticCurveTo(90,-96,73,-98);c.quadraticCurveTo(0,-111,-78,-94);c.quadraticCurveTo(-97,-94,-109,-105);c.closePath();c.fillStyle=rgba(ink,.83);c.fill();
    curve(c,[[-109,-105],[-82,-99],[-43,-116],[0,-143],[43,-120],[83,-105],[106,-113]],rgba(light,.67),1.4);
    line(c,[[-10,-148],[-4,-154],[8,-151],[14,-147]],rgba(ink,.9),2.6);
    for(let i=0;i<15;i++){const xx=-83+i*12,top=-143+Math.abs(xx)*.43;curve(c,[[xx*.45,top],[xx*.8,-115],[xx,-101]],rgba(light,.23),1);}
    line(c,[[-73,-98],[72,-103]],rgba(ink,.74),3.1);
    line(c,[[-89,6],[83,6]],rgba(ink,.65),1.5);line(c,[[-101,12],[94,12]],rgba(ink,.35),1.2);
    // A rolled bamboo blind, a little table, and a red silk tassel.
    for(let yy=-94;yy<-83;yy+=2)line(c,[[-17,yy],[25,yy]],rgba(light,.48),1);
    line(c,[[-3,-30],[23,-30]],rgba(ink,.66),2);line(c,[[3,-30],[3,-12]],rgba(ink,.55),1.4);
    line(c,[[60,-95],[60,-77]],'rgba(143,71,52,.6)',.8);ellipse(c,60,-74,2,5,0,'rgba(143,71,52,.7)');
    c.restore();
  }
  function temple(c,x,y,s=.6){
    c.save();c.translate(x,y);c.scale(s,s);const col='76,82,62';
    for(let level=0;level<3;level++){
      const yy=-level*42,width=65-level*12;
      c.fillStyle=rgba(col,.51);c.fillRect(-width*.58,yy-35,width*1.16,32);
      c.beginPath();c.moveTo(-width,yy-32);c.quadraticCurveTo(-width*.6,yy-35,-10,yy-53);c.lineTo(10,yy-53);c.quadraticCurveTo(width*.6,yy-35,width,yy-36);c.lineTo(width*.8,yy-27);c.lineTo(-width*.82,yy-24);c.closePath();c.fillStyle=rgba(col,.68);c.fill();
      for(let k=-1;k<2;k++)line(c,[[k*width*.32,yy-22],[k*width*.32,yy-6]],rgba(PAPER,.42),2.4);
    }
    line(c,[[0,-138],[0,-161]],rgba(col,.66),2);ellipse(c,0,-151,3,3,0,rgba(col,.6));
    c.restore();
  }
  // Distant human marks provide a measure of the valley without competing with it.
  function hamlet(c,x,y,count,pal,scale=1){
    c.save();c.translate(x,y);c.scale(scale,scale);
    const shore=(count-1)*25;
    ellipse(c,shore*.5,4,shore*.6+25,8,-.015,rgba(pal.light,.22));
    curve(c,[[-20,5],[shore*.18,1],[shore*.52,3],[shore*.8,-1],[shore+22,4]],rgba(pal.mid,.2),1.4);
    for(let i=0;i<count;i++){
      const xx=i*between(22,30),yy=Math.sin(i*1.8)*5-i*.9,w=between(14,21),h=between(8,13);
      c.fillStyle=rgba(PAPER,.75);c.fillRect(xx-w*.4,yy-h,w*.8,h);
      c.beginPath();c.moveTo(xx-w*.65,yy-h+1);c.lineTo(xx-w*.12,yy-h-7);c.lineTo(xx+w*.18,yy-h-7);c.lineTo(xx+w*.66,yy-h+2);c.lineTo(xx+w*.43,yy-h+3);c.lineTo(xx-w*.46,yy-h+2);c.closePath();c.fillStyle=rgba(pal.dark,.52);c.fill();
      line(c,[[xx-w*.4,yy-h],[xx-w*.4,yy],[xx+w*.4,yy],[xx+w*.4,yy-h]],rgba(pal.dark,.34),.8);
      line(c,[[xx+2,yy-5],[xx+2,yy]],rgba(pal.dark,.46),1.6);
      if(i%3===0){line(c,[[xx+w*.8,yy+2],[xx+w*.8-1,yy-15]],rgba(pal.dark,.35),.8);ellipse(c,xx+w*.8,yy-15,5,7,-.2,rgba(pal.dark,.18));}
    }
    const end=(count-1)*25;
    curve(c,[[-18,7],[end*.35,4],[end*.65,5],[end+24,2]],rgba(pal.dark,.21),.9);
    for(let i=0;i<5;i++){const xx=between(-12,end+15);line(c,[[xx,11+i*3],[xx+between(9,27),11+i*3]],rgba(pal.mid,.1),.8);}
    c.restore();
  }
  function distantBoat(c,x,y,size,pal,sail=false){
    c.save();c.translate(x,y);c.scale(size,size);
    c.beginPath();c.moveTo(-18,-1);c.quadraticCurveTo(0,3,18,-2);c.lineTo(12,5);c.quadraticCurveTo(-2,8,-14,4);c.closePath();c.fillStyle=rgba(pal.dark,.54);c.fill();
    if(sail){line(c,[[1,1],[1,-33]],rgba(pal.dark,.42),.9);c.beginPath();c.moveTo(0,-32);c.quadraticCurveTo(-14,-23,-13,-7);c.lineTo(0,-6);c.closePath();c.fillStyle=rgba(pal.mid,.33);c.fill();}
    else{ellipse(c,3,-4,1.7,3,0,rgba(pal.dark,.54));line(c,[[5,-4],[17,10]],rgba(pal.dark,.4),.8);}
    line(c,[[-23,9],[23,9]],rgba(pal.mid,.14),.7);c.restore();
  }
  function cliffPath(c,points,pal){
    // A pale ribbon with an interrupted ink edge winds around immense rock faces.
    curve(c,points,rgba(PAPER,.42),3.2);
    for(let i=1;i<points.length-1;i+=2){const [x,y]=points[i];line(c,[[x-3,y+2],[x+6,y+3]],rgba(pal.dark,.24),.65);}
  }
  function waterMarks(c){
    for(let i=0;i<650;i++){
      const x=between(0,W),y=between(790,1180),len=between(10,105)*(1+(y-800)/450),pal=x<2400?palettes.dawn:x<4800?palettes.rain:palettes.dusk;
      const a=between(.025,.105)*(y<880?.5:1);
      curve(c,[[x,y],[x+len*.35,y-between(.3,2)],[x+len*.7,y+between(-.7,.7)],[x+len,y]],rgba(pal.mid,a),between(.45,1.1));
    }
    for(let k=0;k<8;k++){
      const y=885+k*34;line(c,[[450-k*20,y],[750+k*35,y+1]],rgba(palettes.dawn.light,.045),3+k*.8);
    }
  }
  function drawBoat(c,x,y,t=0){
    c.save();c.translate(x,y+Math.sin(t*.0012)*1.5);c.scale(.74,.74);c.rotate(Math.sin(t*.0008)*.009);
    const dark='43,59,48';
    c.beginPath();c.moveTo(-83,-5);c.quadraticCurveTo(-25,5,79,-8);c.quadraticCurveTo(55,14,26,18);c.quadraticCurveTo(-35,22,-65,10);c.closePath();c.fillStyle=rgba(dark,.89);c.fill();
    curve(c,[[-82,-6],[-38,3],[28,2],[80,-9]],rgba('162,160,116',.74),1.6);
    // Woven canopy, open at its forward end.
    c.beginPath();c.moveTo(-42,-2);c.bezierCurveTo(-47,-49,-23,-52,-3,-48);c.bezierCurveTo(22,-49,29,-28,29,0);c.closePath();c.fillStyle=rgba('125,132,95',.82);c.fill();
    for(let i=0;i<10;i++)curve(c,[[-41+i*7,-2],[-44+i*7,-28],[-35+i*6,-46]],rgba(dark,.32),1);
    curve(c,[[-42,-1],[-44,-26],[-26,-49],[-3,-48],[22,-38],[29,0]],rgba(dark,.83),1.7);
    curve(c,[[18,-41],[9,-26],[11,-1]],rgba(dark,.67),1.5);line(c,[[-38,-8],[24,-8]],rgba(dark,.24),1);
    // A boatman in a straw hat holds one long sculling oar.
    ellipse(c,50,-34,4.4,5.4,.1,rgba(dark,.94));
    c.beginPath();c.moveTo(38,-37);c.lineTo(49,-45);c.lineTo(61,-37);c.quadraticCurveTo(50,-34,38,-37);c.fillStyle=rgba('126,126,87',.93);c.fill();
    curve(c,[[49,-28],[45,-13],[51,-2]],rgba(dark,.95),5.2);line(c,[[46,-17],[60,-21]],rgba(dark,.9),3);
    const swing=Math.sin(t*.0012)*8;line(c,[[60,-26],[89+swing,28]],rgba(dark,.82),1.7);line(c,[[87+swing,24],[96+swing,40]],rgba(dark,.72),3);
    for(let i=0;i<4;i++){const yy=28+i*8,w=66+i*9;curve(c,[[-w,yy],[0,yy+2],[w+9,yy]],rgba('92,115,93',.14-i*.025),.9);}
    c.restore();
  }
  function drawBird(c,x,y,t=0){
    c.save();c.translate(x,y);const flap=Math.sin(t*.0045),col='57,76,64';
    c.beginPath();c.moveTo(-1,0);c.quadraticCurveTo(-8,-5-flap*7,-18,-4-flap*13);c.quadraticCurveTo(-10,1-flap*3,0,2);c.quadraticCurveTo(8,-1-flap*3,18,-5-flap*11);c.quadraticCurveTo(8,-4-flap*7,1,0);c.fillStyle=rgba(col,.65);c.fill();line(c,[[0,0],[3,5]],rgba(col,.65),1.2);c.restore();
  }
  function drawFish(c,x,y,t=0){
    c.save();c.translate(x,y);c.rotate(Math.sin(t*.002)*.12);
    const flex=Math.sin(t*.006)*3;
    c.beginPath();c.moveTo(17,0);c.bezierCurveTo(6,-9,-9,-7,-17,flex);c.lineTo(-27,-7+flex);c.quadraticCurveTo(-23,0+flex,-28,8+flex);c.lineTo(-17,flex+1);c.bezierCurveTo(-7,8,9,8,17,0);c.closePath();c.fillStyle='rgba(102,117,86,.23)';c.fill();
    curve(c,[[-13,0],[0,3],[12,0]],'rgba(72,88,65,.18)',1);ellipse(c,11,-1,1.1,1.1,0,'rgba(67,81,57,.32)');c.restore();
  }
  function create(){
    seed=827391;
    const layers=[.82,.92,1].map(parallax=>{const canvas=document.createElement('canvas');canvas.width=W/2;canvas.height=H/2;const c=canvas.getContext('2d');c.scale(.5,.5);return {canvas,parallax,c};});
    const f=layers[0].c,m=layers[1].c,n=layers[2].c;
    const dawn=palettes.dawn,rain=palettes.rain,dusk=palettes.dusk;
    // Layer one: sky tint, remoter peaks, and warm sunset, with huge breathing spaces.
    glow(f,1050,320,1750,590,'171,182,141',.12);
    glow(f,3490,330,1500,610,'126,150,145',.12);
    glow(f,6050,370,1300,600,'207,171,108',.16);
    glow(f,5920,384,138,138,'208,151,89',.13);
    ellipse(f,5920,384,55,55,0,'rgba(185,130,73,.3)');
    // Faint cloud wisps cross the sun's lower edge.
    glow(f,5870,425,210,19,PAPER,.42);glow(f,6080,394,180,15,PAPER,.33);
    // Almost lost in the paper: long mountain systems behind the individual peaks.
    // Their shallow washes and occasional ink edges imply many more days of travel.
    const horizon=[
      {p:[[-250,552],[-40,434],[140,457],[310,334],[430,366],[570,258],[705,299],[828,192],[914,214],[1000,304],[1150,267],[1300,396],[1410,337],[1580,443],[1780,477]],b:765,pal:dawn,a:.105},
      {p:[[870,503],[1040,385],[1170,401],[1280,260],[1350,278],[1450,143],[1510,157],[1590,230],[1670,216],[1790,320],[1930,263],[2070,383],[2200,357],[2330,469],[2510,508]],b:760,pal:dawn,a:.13},
      {p:[[2030,508],[2160,398],[2290,421],[2420,292],[2510,313],[2625,183],[2710,209],[2800,306],[2880,279],[2990,376],[3150,324],[3280,424],[3430,492]],b:760,pal:rain,a:.11},
      {p:[[3020,515],[3160,422],[3300,446],[3450,316],[3540,338],[3650,201],[3710,213],[3790,125],[3860,149],[3950,253],[4050,225],[4160,353],[4290,315],[4440,449],[4580,489]],b:775,pal:rain,a:.13},
      {p:[[4290,530],[4440,423],[4540,445],[4660,299],[4750,324],[4880,223],[4960,239],[5060,353],[5170,316],[5290,423],[5420,388],[5580,510],[5750,542]],b:770,pal:rain,a:.105},
      {p:[[5520,526],[5650,430],[5800,454],[5910,311],[5980,334],[6110,197],[6210,229],[6280,312],[6380,285],[6520,403],[6670,356],[6810,459],[6950,419],[7150,527],[7420,566]],b:770,pal:dusk,a:.12}
    ];
    horizon.forEach(o=>mountain(f,o.p,o.b,o.pal,o.a,.085));
    const distant=[
      {p:[[-200,661],[-20,550],[90,575],[210,450],[280,464],[360,310],[410,318],[465,271],[530,297],[600,425],[680,401],[780,543],[870,513],[1010,645]],b:815,pal:dawn,a:.2},
      {p:[[760,662],[910,535],[975,551],[1080,388],[1150,410],[1220,256],[1260,261],[1310,196],[1370,222],[1440,354],[1530,309],[1630,453],[1730,417],[1850,551],[1980,518],[2150,674]],b:810,pal:dawn,a:.26},
      {p:[[1820,683],[1960,564],[2040,580],[2140,430],[2205,445],[2260,318],[2310,329],[2390,449],[2470,416],[2590,560],[2700,532],[2870,676]],b:815,pal:dawn,a:.2},
      {p:[[2570,675],[2690,528],[2750,551],[2830,364],[2880,382],[2930,248],[2980,249],[3030,169],[3090,199],[3160,342],[3240,313],[3340,467],[3440,421],[3550,586],[3670,543],[3810,680]],b:820,pal:rain,a:.27},
      {p:[[3580,682],[3720,569],[3810,581],[3910,402],[3980,424],[4040,251],[4090,273],[4150,163],[4210,185],[4290,341],[4380,298],[4490,485],[4580,444],[4720,592],[4840,565],[5000,686]],b:825,pal:rain,a:.25},
      {p:[[4630,673],[4800,555],[4900,585],[5010,458],[5090,479],[5180,340],[5230,344],[5320,480],[5400,450],[5520,577],[5620,548],[5790,686]],b:800,pal:rain,a:.19},
      {p:[[5550,682],[5680,587],[5780,603],[5900,461],[5960,478],[6040,328],[6100,341],[6170,256],[6220,286],[6300,425],[6400,383],[6510,536],[6630,497],[6750,623],[6880,591],[7070,690]],b:810,pal:dusk,a:.23},
      {p:[[6650,670],[6790,551],[6900,575],[7000,427],[7070,451],[7180,313],[7260,346],[7370,497],[7490,459],[7620,678]],b:820,pal:dusk,a:.2}
    ];
    distant.forEach(o=>mountain(f,o.p,o.b,o.pal,o.a,.2));
    // High clouds drift across only the saddles, revealing peaks above their veils.
    [[1090,568,380,34],[2360,590,360,30],[3640,525,390,31],[5260,590,440,32],[6070,555,330,25]].forEach(v=>glow(f,...v,PAPER,.27));
    for(let x=200;x<W;x+=820)glow(f,x,757,720,78,PAPER,.24);
    // Layer two: three unequal mountain systems, separated by open river reaches.
    mountain(m,[[-200,801],[-20,660],[80,671],[174,502],[229,522],[294,361],[334,369],[391,236],[430,243],[469,285],[505,276],[557,453],[620,420],[696,572],[756,532],[849,657],[967,694],[1070,803]],892,dawn,.45,.8);
    mountain(m,[[1120,805],[1255,701],[1320,719],[1410,554],[1460,567],[1503,377],[1544,398],[1580,245],[1615,261],[1654,151],[1683,157],[1719,103],[1752,125],[1794,121],[1831,224],[1868,213],[1918,380],[1961,347],[2020,499],[2078,476],[2158,646],[2238,622],[2372,773],[2450,816]],900,dawn,.57,1.02);
    // The mountain road is only a hairline at the scale of the great dawn wall.
    cliffPath(m,[[1834,299],[1901,364],[1854,394],[1940,444],[1897,476],[2001,543],[1954,578],[2082,645],[2049,681],[2174,735]],dawn);
    mountain(m,[[2110,824],[2230,746],[2290,757],[2380,667],[2440,680],[2515,527],[2566,541],[2610,518],[2665,630],[2730,613],[2820,704],[2910,683],[3050,816]],895,rain,.36,.65);
    // Monumental split gorge. The waterfall becomes a silver thread against its face.
    mountain(m,[[2780,845],[2860,750],[2898,574],[2940,585],[2974,414],[3010,432],[3042,275],[3071,283],[3107,188],[3141,201],[3170,248],[3203,251],[3234,213],[3267,229],[3294,379],[3334,354],[3370,491],[3412,474],[3458,647],[3509,625],[3590,815]],929,rain,.67,1.15);
    m.save();m.translate(3183,0);m.scale(.62,1);waterfall(m,0,250,614);m.restore();
    cliffPath(m,[[3299,411],[3350,448],[3315,473],[3390,521],[3358,551],[3438,604],[3399,639],[3480,688],[3442,718],[3538,787]],rain);
    mountain(m,[[3660,829],[3761,721],[3810,740],[3870,595],[3913,616],[3955,436],[3988,451],[4026,289],[4054,312],[4091,190],[4123,204],[4158,111],[4181,128],[4215,96],[4249,143],[4284,139],[4320,289],[4353,267],[4393,422],[4441,393],[4490,554],[4544,529],[4610,690],[4688,665],[4805,814]],902,rain,.53,.95);
    mountain(m,[[4520,830],[4650,744],[4720,761],[4810,635],[4870,652],[4923,481],[4970,503],[5026,451],[5082,484],[5140,624],[5215,594],[5300,725],[5402,703],[5520,822]],902,rain,.37,.7);
    // The small ridge pagoda is visible across a broad, deliberately quiet lake.
    mountain(m,[[5310,816],[5430,728],[5510,741],[5595,621],[5650,638],[5710,462],[5751,449],[5792,430],[5827,439],[5860,520],[5910,511],[5960,659],[6030,630],[6132,754],[6240,823]],880,dusk,.35,.7);
    temple(m,5793,436,.34);
    cliffPath(m,[[5789,452],[5744,498],[5793,529],[5733,577],[5765,605],[5686,657]],dusk);
    mountain(m,[[6100,835],[6200,740],[6250,754],[6316,588],[6362,607],[6405,424],[6442,444],[6484,282],[6520,300],[6560,184],[6598,198],[6631,162],[6664,194],[6708,185],[6743,324],[6780,302],[6830,463],[6883,437],[6940,595],[7003,573],[7087,727],[7180,694],[7320,841]],928,dusk,.59,1.02);
    // Tiny conifer groves cling to high ledges rather than lining every hill.
    [[397,249,.15,dawn],[449,282,.12,dawn],[1672,177,.13,dawn],[1785,142,.12,dawn],[1920,400,.13,dawn],[2524,546,.16,rain],[3002,441,.14,rain],[3091,286,.11,rain],[3295,396,.15,rain],[4109,210,.13,rain],[4255,166,.14,rain],[4978,510,.14,rain],[5540,742,.13,dusk],[5892,537,.11,dusk],[6519,314,.14,dusk],[6664,217,.12,dusk]].forEach(a=>pine(m,...a));
    for(let x=100;x<W;x+=650)glow(m,x,861,540,74,PAPER,.32);
    waterMarks(m);
    // Low inhabited shores and a few river craft make the surrounding rock feel vast.
    hamlet(m,1280,861,5,dawn,.9);
    hamlet(m,1850,886,4,dawn,.74);
    hamlet(m,3020,899,3,rain,.72);
    hamlet(m,4140,901,5,rain,.7);
    hamlet(m,5390,874,7,dusk,.83);
    hamlet(m,6090,906,4,dusk,.76);
    [[1500,940,.8,dawn,true],[1590,958,.54,dawn,false],[1680,929,.48,dawn,false],[1860,1001,.63,dawn,true],[3140,972,.55,rain,false],[4250,954,.46,rain,true],[5220,981,.65,dusk,true],[5320,995,.44,dusk,false],[5470,947,.4,dusk,false],[6020,967,.52,dusk,true]].forEach(a=>distantBoat(m,...a));
    // Layer three: close banks, asymmetrical paths and details at human scale.
    bank(n,[[-140,1090],[-60,988],[20,959],[100,862],[148,891],[220,744],[268,756],[316,645],[365,671],[420,830],[500,846],[553,958],[635,994],[713,1043],[830,1058]],1220,dawn,.84);
    // Foreground trunk frames the opening without covering the open lake.
    pine(n,230,909,1.18,dawn,-1);pine(n,415,981,.64,dawn,1);
    [[112,1020,1.7],[382,1005,1.2],[523,1040,.95],[598,1075,.7],[12,1118,2.1]].forEach(a=>rock(n,...a,dawn));
    [[79,1070,1.2],[472,1050,.9],[624,1084,.7],[314,1064,.75]].forEach(a=>reeds(n,...a));
    // A tiny path winds through the foreground ridge and down to the ferry landing.
    curve(n,[[350,799],[324,864],[378,916],[453,941],[477,986],[568,1008],[649,1040]],rgba(PAPER,.56),11);
    curve(n,[[350,799],[324,864],[378,916],[453,941],[477,986],[568,1008],[649,1040]],rgba(dawn.dark,.2),.9);
    n.save();n.translate(739,1047);n.scale(.72,.72);drawDock(n,0,0);n.restore();
    shrub(n,534,1026,.85,dawn);shrub(n,390,1010,.7,dawn);
    // A low island between the dawn ferry and rainy pavilion.
    bank(n,[[2020,1000],[2110,959],[2170,953],[2240,882],[2310,898],[2370,815],[2440,832],[2510,761],[2580,781],[2660,728],[2710,752],[2780,864],[2850,874],[2910,935],[3050,984]],1120,rain,.73);
    pine(n,2600,807,.79,rain,-1);pine(n,2708,848,.56,rain,1);pine(n,2420,887,.42,rain,1);pine(n,2320,924,.35,rain,-1);
    [[2200,990,.7],[2500,976,1.1],[2807,961,1.25],[2889,1016,.75]].forEach(a=>rock(n,...a,rain));
    reeds(n,2177,1021,.65,rain.dark);reeds(n,2900,1035,.7,rain.dark);
    // The empty pavilion terrace is deliberately left for its discovery animation.
    bank(n,[[3270,901],[3360,852],[3450,825],[3520,746],[3570,739],[3650,736],[3720,755],[3790,826],[3840,841],[3940,867],[4090,914]],1010,rain,.58);
    // Light stone landing at y=720 for drawPavilion's ground anchor.
    ellipse(n,3600,730,83,15,-.04,rgba(PAPER,.45));
    curve(n,[[3506,735],[3555,729],[3626,733],[3682,731]],rgba(rain.dark,.26),1.5);
    curve(n,[[3590,747],[3629,774],[3701,788],[3754,825],[3844,843]],rgba(PAPER,.64),9);
    curve(n,[[3590,747],[3629,774],[3701,788],[3754,825],[3844,843]],rgba(rain.dark,.22),1);
    bridge(n,3928,892,.58);
    bamboo(n,3425,837,.62,1);pine(n,3754,833,.48,rain,1);
    shrub(n,3670,764,.56,rain);rock(n,3480,842,.72,rain);rock(n,4085,948,.9,rain);
    bank(n,[[4240,1030],[4340,978],[4395,980],[4480,929],[4530,939],[4610,830],[4670,845],[4740,794],[4800,840],[4860,914],[4950,942],[5060,1006],[5160,1038]],1180,rain,.68);
    bamboo(n,4610,943,.91,1);bamboo(n,4780,986,.61,-1);pine(n,4410,1002,.42,rain,-1);
    rock(n,4900,1034,1.2,rain);reeds(n,5052,1096,.86,rain.dark);
    // Warm last shore. A moongate-like gap in the pines reveals the distant temple.
    bank(n,[[5550,1095],[5650,1068],[5760,1084],[5850,1050],[5960,1063],[6050,1018],[6130,1031],[6210,963],[6290,971],[6360,923],[6430,962],[6500,949],[6590,1060],[6700,1076]],1220,dusk,.57);
    pine(n,6275,1030,.65,dusk,-1);pine(n,6440,1069,.5,dusk,1);
    [[5900,1112,1],[6140,1094,.8],[6510,1129,1.1]].forEach(a=>rock(n,...a,dusk));
    reeds(n,5817,1128,.8,dusk.dark);reeds(n,6570,1153,.75,dusk.dark);
    bank(n,[[6590,1100],[6670,1032],[6725,1001],[6800,928],[6850,955],[6910,829],[6960,849],[7030,766],[7095,814],[7150,891],[7250,940],[7400,954]],1240,dusk,.92);
    pine(n,6950,1012,1.28,dusk,-1);pine(n,7160,1042,.91,dusk,1);
    rock(n,6775,1118,1.4,dusk);reeds(n,6707,1150,1.05,dusk.dark);
    // Sparse tactile specks sit in the ink only; the parent owns its paper ground.
    for(let i=0;i<12000;i++){
      const x=random()*W,y=between(450,H),rgb=x<2400?dawn.dark:x<4800?rain.dark:dusk.dark;
      n.fillStyle=rgba(rgb,between(.006,.025));n.fillRect(x,y,between(.5,1.3),between(.5,1.8));
    }
    return {layers:layers.map(({canvas,parallax})=>({canvas,parallax})),drawBoat,drawBird,drawFish,drawPavilion};
  }
  window.InkArt={W,H,landmarks:[{id:'water',x:1100,y:930},{id:'pine',x:2600,y:720},{id:'pavilion',x:3600,y:720}],create,drawBoat,drawBird,drawFish,drawPavilion};
})();
