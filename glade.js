/* A quiet, low stone shelf for the tiger. Original deterministic canvas brushwork. */
'use strict';
(() => {
  const X = 5000, Y = 650, W = 1000, H = 550, TAU = Math.PI * 2;
  const INK = '57,72,58', GREEN = '99,118,88', STONE = '139,151,123';
  const PAPER = '239,235,217';
  let seed = 912807, cached;
  const rand = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
  const pick = (a, b) => a + rand() * (b - a);
  const color = (c, a) => `rgba(${c},${Math.max(0, Math.min(1, a))})`;
  function path(c, p, closed) {
    c.beginPath(); c.moveTo(p[0][0], p[0][1]);
    for (let i = 1; i < p.length; i++) c.lineTo(p[i][0], p[i][1]);
    if (closed) c.closePath();
  }
  function stroke(c, p, rgb = INK, a = .35, width = 1) {
    path(c, p); c.strokeStyle = color(rgb, a); c.lineWidth = width;
    c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke();
  }
  function curve(c, p, rgb = INK, a = .35, width = 1) {
    c.beginPath(); c.moveTo(p[0][0], p[0][1]);
    for (let i = 1; i < p.length - 1; i++)
      c.quadraticCurveTo(p[i][0], p[i][1], (p[i][0] + p[i+1][0]) / 2, (p[i][1] + p[i+1][1]) / 2);
    c.lineTo(p[p.length-1][0], p[p.length-1][1]);
    c.strokeStyle = color(rgb, a); c.lineWidth = width; c.lineCap = 'round'; c.lineJoin = 'round'; c.stroke();
  }
  function dot(c, x, y, rx, ry, rgb, a, angle = 0) {
    c.beginPath(); c.ellipse(x, y, rx, ry, angle, 0, TAU); c.fillStyle = color(rgb, a); c.fill();
  }
  function wash(c, x, y, rx, ry, rgb, a) {
    c.save(); c.translate(x, y); c.scale(1, ry / rx);
    const g = c.createRadialGradient(0, 0, 0, 0, 0, rx);
    g.addColorStop(0, color(rgb, a)); g.addColorStop(.5, color(rgb, a * .57)); g.addColorStop(1, color(rgb, 0));
    c.fillStyle = g; c.fillRect(-rx, -rx, rx * 2, rx * 2); c.restore();
  }
  const edge = [[5000,1198],[5050,1178],[5100,1150],[5141,1128],[5171,1112],
    [5200,1088],[5231,1089],[5277,1090],[5320,1091],[5368,1087],[5401,1087],
    [5440,1085],[5486,1089],[5531,1088],[5570,1090],[5611,1098],[5650,1107],
    [5680,1120],[5728,1151],[5763,1175],[5800,1200],[5900,1235]];
  function roof(x) {
    for (let i = 1; i < edge.length; i++) if (x <= edge[i][0]) {
      const a = edge[i-1], b = edge[i], t = (x-a[0])/(b[0]-a[0]); return a[1] + (b[1]-a[1]) * t;
    }
    return 1235;
  }
  function leaf(c, x, y, length, angle, a, width = .17, rgb = INK) {
    c.save(); c.translate(x, y); c.rotate(angle);
    c.beginPath(); c.moveTo(0, 0);
    c.bezierCurveTo(length * .22, -length * width, length * .66, -length * width * .72, length, 0);
    c.bezierCurveTo(length * .56, length * width * .46, length * .21, length * width * .52, 0, 0);
    c.fillStyle = color(rgb, a); c.fill(); c.restore();
  }
  function moss(c, x, y, size = 1, a = .5) {
    wash(c, x, y + 1, 18 * size, 5 * size, GREEN, a * .14);
    for (let i = 0; i < 14 * size; i++) {
      const dx = pick(-14, 14) * size, yy = y - Math.cos(dx / (17*size)) * 4 * size + pick(-2, 3) * size;
      dot(c, x + dx, yy, pick(.8,2.6)*size, pick(.6,1.9)*size, i%3?GREEN:INK, pick(.18,.62)*a, pick(-.5,.5));
      if (i%4===0) stroke(c, [[x+dx,yy+2],[x+dx-.8,yy-3*size]], GREEN, a*.5, .75);
    }
  }
  function rock(c, x, y, sx, sy, a = 1) {
    c.save(); c.translate(x, y); c.scale(sx, sy);
    const p = [[-42,6],[-38,-3],[-27,-15],[-12,-23],[8,-25],[23,-17],[38,-13],[46,2],[34,8],[9,10],[-16,8]];
    path(c,p,true); c.fillStyle=color('195,200,177',.6*a);c.fill();
    const g=c.createLinearGradient(-20,-25,19,15);g.addColorStop(0,color(STONE,.03));g.addColorStop(1,color(INK,.22*a));
    c.fillStyle=g;c.fill();
    curve(c,[[-42,6],[-38,-3],[-27,-15],[-12,-23],[8,-25],[23,-17],[38,-13],[46,2]],INK,.43*a,1.45);
    curve(c,[[-11,-22],[-5,-16],[-12,-7],[2,2],[28,6]],INK,.21*a,1.2);
    curve(c,[[22,-16],[17,-6],[31,1]],INK,.22*a,.8);
    curve(c,[[-37,2],[-24,-1],[-13,2]],PAPER,.46*a,1.9);
    for(let i=0;i<40;i++){
      const xx=pick(-30,35),yy=pick(-12,7);stroke(c,[[xx,yy],[xx+pick(2,7),yy+pick(.5,3)]],INK,pick(.045,.14)*a,pick(.5,1.1));
    }
    curve(c,[[-47,9],[-21,12],[8,11],[38,9],[54,10]],INK,.17*a,1.2);
    c.restore();
  }
  function reed(c, x, y, s, a) {
    for(let i=0;i<11;i++){
      const dx=pick(-17,17)*s,h=pick(20,67)*s,lean=pick(-26,27)*s;
      curve(c,[[x+dx,y],[x+dx+lean*.1,y-h*.4],[x+dx+lean,y-h]],INK,a*pick(.35,.8),pick(.7,1.15));
      if(i%4===0)curve(c,[[x+dx+lean*.79,y-h*.85],[x+dx+lean,y-h],[x+dx+lean*.98,y-h-6*s]],INK,a*.65,2.3*s);
      if(i%2===0)curve(c,[[x+dx,y-h*.16],[x+dx+lean*.4-13*s,y-h*.48],[x+dx-20*s,y-h*.36]],GREEN,a*.6,.9);
    }
  }
  function shrub(c) {
    const x=5144,y=1119;
    const branches=[[[0,0],[-9,-18],[-35,-27],[-55,-34]],[[0,0],[9,-20],[2,-42],[-14,-56]],
      [[4,0],[17,-21],[38,-38],[44,-54]],[[9,0],[25,-9],[52,-14],[72,-30]]];
    branches.forEach((p,b)=>{
      const q=p.map(v=>[x+v[0],y+v[1]]);curve(c,q,INK,.52,2-b*.25);
      for(let j=1;j<p.length;j++){
        const xx=x+p[j][0],yy=y+p[j][1];
        for(let k=0;k<9;k++){
          const lx=xx+pick(-15,15),ly=yy+pick(-8,7),angle=pick(-3.1,-.1);
          leaf(c,lx,ly,pick(6,12),angle,pick(.2,.48),.3,k%4===0?GREEN:INK);
        }
      }
    });
    curve(c,[[5142,1116],[5129,1125],[5115,1131]],INK,.41,1.8);
    curve(c,[[5150,1117],[5163,1120],[5175,1118]],INK,.31,1.4);
  }
  function bamboo(c) {
    // Five irregular culms, with deliberate space around the moving animal.
    const stalks=[{x:5652,h:314,l:23,w:4.0,a:.55},{x:5675,h:349,l:-15,w:4.6,a:.68},
      {x:5695,h:282,l:48,w:3.7,a:.52},{x:5632,h:240,l:-27,w:3.0,a:.41},
      {x:5710,h:218,l:57,w:2.7,a:.43}];
    stalks.forEach((s,si)=>{
      const by=1115+Math.abs(s.x-5652)*.32, segments=7;
      const at=t=>[s.x+s.l*t+Math.sin(t*2.4)*5,by-s.h*t];
      for(let j=0;j<segments;j++){
        const a=at(j/segments),b=at((j+1)/segments),middle=at((j+.5)/segments);
        curve(c,[[a[0],a[1]-2],middle,[b[0],b[1]+3]],INK,s.a,s.w*(1-j*.07));
        curve(c,[[a[0]-1,a[1]-3],[middle[0]-1,middle[1]],[b[0]-1,b[1]+4]],GREEN,s.a*.36,1.1);
        stroke(c,[[b[0]-3,b[1]+1],[b[0]+3,b[1]-.6]],INK,s.a*.94,1.5);
        stroke(c,[[b[0]-2.5,b[1]-2],[b[0]+2,b[1]-2.5]],PAPER,.46,1);
      }
      // Delicate alternating fans; outer branches never reach into the patrol.
      for(let j=3;j<7;j++){
        if(si===3 && j===3)continue;
        const n=at(j/segments),dir=(j+si)%2?1:-1,len=pick(35,66),up=pick(16,33),end=[n[0]+len*dir,n[1]-up];
        curve(c,[n,[n[0]+dir*len*.36,n[1]-up*.72],end],INK,s.a*.85,1.05);
        for(let k=1;k<=6;k++){
          const t=k/7,lx=n[0]+dir*len*t,ly=n[1]-up*(t*.8+.2),sgn=k%2?1:-1;
          const theta=dir===1?(sgn*.55-.14):Math.PI-sgn*.55+.14;
          leaf(c,lx,ly,pick(18,33),theta,pick(.32,.65)*s.a/.65,.13,si%2?INK:GREEN);
          if(k%3===0)leaf(c,lx+dir*3,ly-1,pick(14,24),theta+sgn*.32,s.a*.58,.11);
        }
        leaf(c,end[0]-dir*7,end[1]+1,pick(23,35),dir===1?-.35:Math.PI+.35,s.a*.84,.12);
      }
      const tip=at(1);curve(c,[tip,[tip[0]+s.l*.1,tip[1]-13],[tip[0]+s.l*.23,tip[1]-19]],INK,s.a*.8,.8);
      leaf(c,tip[0],tip[1]-5,20,si%2?-1.1:-2.2,s.a*.78,.12);
      curve(c,[[s.x,by-4],[s.x-9,by+2],[s.x-21,by+4]],INK,s.a*.44,1.2);
    });
  }
  function create() {
    if(cached)return cached;
    seed=912807;
    const canvas=document.createElement('canvas');canvas.width=W/2;canvas.height=H/2;
    const c=canvas.getContext('2d');c.scale(.5,.5);c.translate(-X,-Y);
    // A broken, broad, almost level shelf; individual fragments remain subordinate.
    const top=[];
    for(let i=0;i<edge.length-1;i++){
      const a=edge[i],b=edge[i+1],n=Math.ceil((b[0]-a[0])/5);
      for(let j=0;j<n;j++){
        const t=j/n;top.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t+Math.sin(t*Math.PI)*pick(-1.7,1.7)]);
      }
    }
    top.push(edge[edge.length-1]);
    const body=[...top,[5950,1260],[4990,1260]];
    c.save();path(c,body,true);c.clip();
    const base=c.createLinearGradient(0,1080,0,1230);
    base.addColorStop(0,color('211,214,190',.87));base.addColorStop(.3,color('183,191,163',.76));base.addColorStop(1,color('160,175,144',.27));
    c.fillStyle=base;c.fillRect(4990,1070,1000,200);
    wash(c,5358,1126,285,87,STONE,.18);wash(c,5540,1180,240,73,INK,.13);
    wash(c,5180,1150,116,95,GREEN,.18);wash(c,5690,1189,122,78,INK,.15);
    // Soft weathered rock folds, drawn in groups rather than a regular grid.
    const seams=[[[5104,1170],[5144,1151],[5193,1141],[5218,1129],[5270,1132],[5294,1127]],
      [[5202,1096],[5216,1113],[5262,1117],[5291,1124],[5340,1121],[5382,1126]],
      [[5323,1097],[5349,1104],[5387,1103],[5414,1111],[5440,1110]],
      [[5421,1122],[5462,1118],[5510,1127],[5550,1126],[5596,1147],[5646,1150]],
      [[5181,1177],[5221,1164],[5263,1166],[5318,1154],[5371,1161]],
      [[5332,1164],[5370,1153],[5432,1158],[5479,1149],[5518,1158],[5565,1157]],
      [[5473,1196],[5500,1178],[5544,1180],[5582,1173],[5629,1182],[5677,1177],[5719,1194]]];
    seams.forEach((p,i)=>{
      curve(c,p,INK,.07,10+i%3*2);
      curve(c,p.map(([x,y])=>[x,y-3]),PAPER,.27,3.3);
      curve(c,p,INK,.19+(i%3)*.025,1.3);
      if(i%2===0)curve(c,p.slice(1,4).map(([x,y])=>[x+2,y+3]),INK,.12,.7);
    });
    // Short descending grain hints at stone beneath the soft grassy surface.
    for(let i=0;i<450;i++){
      const x=pick(5060,5790),y=roof(x)+pick(7,113),len=pick(2,12);
      const density=(Math.sin(x*.051)+1)*.5;
      if(rand()>.42+density*.25)continue;
      curve(c,[[x,y],[x+pick(-3,4),y+len*.5],[x+pick(0,8),y+len]],INK,pick(.025,.12),pick(.6,1.3));
    }
    for(let i=0;i<1100;i++){
      const x=pick(5050,5820),y=roof(x)+pick(3,140);
      dot(c,x,y,pick(.45,1.3),pick(.4,.9),i%4?INK:PAPER,pick(.025,.12),pick(-.3,.3));
    }
    // A pale cap gives the paws a convincingly solid plane to touch.
    curve(c,[[5189,1096],[5235,1096],[5300,1099],[5361,1094],[5440,1092],[5506,1095],[5577,1099]],PAPER,.24,7);
    c.restore();
    for(let i=0;i<top.length-5;i+=Math.floor(pick(7,15))){
      const part=top.slice(i,i+Math.floor(pick(4,10)));
      curve(c,part,INK,pick(.23,.44),pick(.8,1.6));
    }
    // Sparse low details keep the central silhouette beautifully legible.
    [[5196,1091,.6,.68],[5259,1092,.55,.6],[5374,1089,.45,.49],[5508,1091,.62,.7],
      [5574,1095,.9,.68],[5667,1122,.9,.6],[5140,1135,.9,.54],[5289,1134,.55,.46],
      [5453,1161,.68,.36],[5566,1163,.56,.42]].forEach(v=>moss(c,...v));
    rock(c,5113,1156,1.1,.77,.77);rock(c,5170,1137,.75,.53,.86);
    rock(c,5602,1120,.68,.48,.7);rock(c,5687,1156,1.16,.79,.73);
    rock(c,5740,1182,.76,.52,.61);
    shrub(c);bamboo(c);
    reed(c,5079,1171,.86,.55);reed(c,5187,1120,.42,.46);
    reed(c,5737,1179,.72,.55);reed(c,5780,1200,.56,.48);
    // A single fallen twig and two dry leaves establish the animal's scale.
    curve(c,[[5403,1103],[5412,1105],[5423,1103],[5436,1105]],INK,.55,1.15);
    stroke(c,[[5415,1104],[5419,1100],[5424,1099]],INK,.45,.85);
    stroke(c,[[5427,1104],[5431,1108]],INK,.42,.7);
    leaf(c,5347,1103,9,.28,.48,.29,'126,122,79');
    leaf(c,5532,1105,11,-.28,.43,.26,'137,133,88');
    // Feather only the lateral joins; the bottom runs naturally off the scroll.
    c.save();c.setTransform(1,0,0,1,0,0);c.globalCompositeOperation='destination-in';
    const mask=c.createLinearGradient(0,0,canvas.width,0);
    mask.addColorStop(0,'rgba(0,0,0,0)');mask.addColorStop(.06,'rgba(0,0,0,.47)');
    mask.addColorStop(.16,'rgba(0,0,0,1)');mask.addColorStop(.78,'rgba(0,0,0,1)');
    mask.addColorStop(.9,'rgba(0,0,0,0)');mask.addColorStop(1,'rgba(0,0,0,0)');
    c.fillStyle=mask;c.fillRect(0,0,canvas.width,canvas.height);c.restore();
    cached={canvas,x:X,y:Y,width:W,height:H};return cached;
  }
  window.InkGlade={create};
})();
