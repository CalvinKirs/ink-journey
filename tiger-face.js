/*
 * InkTigerFace — an original, layered ink-and-mineral-pigment tiger portrait.
 * No images, dependencies, requests, timers or random animation state.
 *
 * draw(ctx, cx, cy, size, seconds, { mouth, menace, reach })
 * size is the cheek-to-cheek width (~400 drawing units); (cx,cy) is the
 * centre of the face, just above the nose. The skull occupies y -205..155;
 * shoulders and paws extend to y 410. Open jaw reaches y 235. Reaching paws
 * extend to x ±370. All dimensions scale by size/400. Transparent silhouette.
 * Callers own the clock, compositing, reduced motion, input and audio.
 */
(() => {
  'use strict';
  const TAU = Math.PI * 2;
  const INK = '#292d25', IVORY = '#dfd9bf';
  const clamp = (n,a=0,b=1) => Math.max(a, Math.min(b, Number.isFinite(n) ? n : a));
  const paths = new Map();
  const P = d => { if (!paths.has(d)) { if (paths.size > 384) paths.clear(); paths.set(d,new Path2D(d)); } return paths.get(d); };
  function rng(seed) { return () => ((seed = (Math.imul(seed,1664525)+1013904223)>>>0)/4294967296); }
  function shape(c,d,fill,stroke,width=1) {
    const p=typeof d==='string'?P(d):d;
    if(fill) {c.fillStyle=fill;c.fill(p);}
    if(stroke) {c.strokeStyle=stroke;c.lineWidth=width;c.lineJoin='round';c.lineCap='round';c.stroke(p);}
  }
  function line(c,d,color,width=1) { shape(c,d,null,color,width); }
  function ellipse(c,x,y,rx,ry,color,angle=0) {
    c.beginPath();c.ellipse(x,y,rx,ry,angle,0,TAU);c.fillStyle=color;c.fill();
  }
  function wash(c,x,y,rx,ry,color,alpha) {
    c.save();c.translate(x,y);c.scale(rx,ry);
    const g=c.createRadialGradient(0,0,0,0,0,1);
    g.addColorStop(0,`rgba(${color},${alpha})`);g.addColorStop(.52,`rgba(${color},${alpha*.59})`);g.addColorStop(1,`rgba(${color},0)`);
    c.fillStyle=g;c.fillRect(-1,-1,2,2);c.restore();
  }
  function stripe(c,d,alpha=.94) {
    c.save();c.globalAlpha*=alpha;shape(c,d,INK);
    c.strokeStyle='rgba(43,44,33,.14)';c.lineWidth=1.3;c.stroke(P(d));c.restore();
  }
  function pigment(c,x,y,w,h,seed,amount=900) {
    const r=rng(seed);
    for(let i=0;i<amount;i++) {
      const px=x+r()*w, py=y+r()*h, a=.025+r()*.055;
      c.fillStyle=r()>.42?`rgba(232,223,192,${a})`:`rgba(44,49,36,${a*.6})`;
      const s=.2+r()*.65;c.fillRect(px,py,s,s*(.7+r()));
    }
  }
  function fur(c,rect,count,seed,flow,brightness=1) {
    const r=rng(seed);
    c.lineCap='round';
    for(let i=0;i<count;i++) {
      const x=rect[0]+r()*rect[2],y=rect[1]+r()*rect[3];
      const f=flow(x,y),a=f[0]+(r()-.5)*.5,l=f[1]*(.35+r()*.8),light=r()>.4;
      c.strokeStyle=light?`rgba(244,230,190,${(.10+r()*.26)*brightness})`:`rgba(38,44,29,${(.07+r()*.19)*brightness})`;
      c.lineWidth=(.15+r()*.43)*(light?.8:1);
      c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+Math.cos(a+.16)*l*.53,y+Math.sin(a+.16)*l*.53,x+Math.cos(a)*l,y+Math.sin(a)*l);c.stroke();
    }
  }
  function edgeFur(c,points,seed,color,count=1) {
    const r=rng(seed);c.strokeStyle=color;c.lineCap='round';
    points.forEach(p=>{for(let j=0;j<count;j++) {
      const x=p[0]+(r()-.5)*3,y=p[1]+(r()-.5)*3,a=p[2]+(r()-.5)*.3,l=p[3]*(.5+r()*.7);
      c.lineWidth=.25+r()*.65;c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+Math.cos(a)*l*.5,y+Math.sin(a)*l*.5,x+Math.cos(a+.15)*l,y+Math.sin(a+.15)*l);c.stroke();
    }});
  }

  const HEAD = 'M -150 -122 C -132 -158 -102 -177 -68 -183 Q -26 -195 3 -190 Q 47 -195 81 -180 C 121 -166 145 -143 156 -112 Q 174 -87 173 -60 C 181 -40 184 -7 179 23 Q 181 42 168 61 C 158 86 136 97 117 107 Q 91 124 59 122 Q 28 127 1 124 Q -34 128 -66 122 Q -101 119 -125 103 C -145 94 -161 78 -171 56 Q -180 39 -181 18 C -185 -7 -178 -36 -172 -57 Q -172 -93 -150 -122 Z';
  const SHOULDERS = 'M -122 -6 C -178 5 -220 55 -239 112 Q -266 154 -277 218 C -287 267 -297 302 -277 354 Q -208 397 -137 399 Q -62 420 1 415 Q 77 420 145 396 Q 224 401 281 354 Q 297 299 279 243 C 271 195 254 151 242 119 C 218 56 176 9 123 -4 Z';
  const PAW = 'M -55 -63 C -57 -86 -34 -102 -6 -98 Q 37 -99 52 -61 Q 61 -43 57 -25 C 76 -6 71 24 58 38 Q 49 51 34 45 Q 21 60 4 50 Q -12 58 -27 46 Q -46 50 -59 38 C -75 26 -77 4 -66 -14 Q -63 -41 -55 -63 Z';

  function paintShoulders(c) {
    const g=c.createLinearGradient(-240,25,160,420);
    g.addColorStop(0,'#8e805b');g.addColorStop(.28,'#b9a575');g.addColorStop(.72,'#a99b75');g.addColorStop(1,'#666f57');
    shape(c,SHOULDERS,g);
    c.save();c.clip(P(SHOULDERS));
    wash(c,-163,94,133,225,'49,57,41',.41);wash(c,186,170,123,211,'44,53,40',.39);
    shape(c,'M -105 22 Q -45 76 -4 71 Q 47 76 107 17 L 139 68 L 129 108 L 144 138 L 125 158 L 142 180 L 115 198 L 123 222 L 95 236 L 107 261 L 81 278 L 90 307 L 54 326 L 40 366 L -5 405 L -47 364 L -65 329 L -93 309 L -84 278 L -112 263 L -99 238 L -125 225 L -114 195 L -136 181 L -121 157 L -139 135 L -125 113 L -141 81 Z','#d6d3b9');
    wash(c,0,145,96,210,'244,238,210',.54);wash(c,0,80,80,90,'74,78,54',.36);
    for(const side of [-1,1]) {
      c.save();c.scale(side,1);
      [
        'M 138 23 Q 163 32 180 61 Q 165 53 145 55 L 107 72 Q 123 47 138 23 Z',
        'M 195 59 Q 225 85 232 111 Q 206 89 184 93 Q 150 99 133 113 Q 146 91 178 80 Z',
        'M 234 127 Q 243 144 247 164 Q 206 145 178 160 Q 153 173 131 170 Q 156 152 174 139 Q 202 124 234 127 Z',
        'M 257 183 L 269 213 Q 242 191 218 194 Q 197 193 184 205 Q 195 183 212 179 Q 237 174 257 183 Z',
        'M 180 214 Q 159 232 140 236 Q 123 239 108 250 Q 121 230 144 222 Q 161 221 180 214 Z',
        'M 277 240 L 281 266 Q 252 247 231 255 Q 209 266 189 267 Q 211 243 232 237 Q 256 231 277 240 Z',
        'M 278 296 L 281 320 Q 251 305 217 317 Q 196 326 172 324 Q 196 307 213 298 Q 242 286 278 296 Z',
        'M 166 281 Q 145 295 133 313 Q 122 326 103 332 Q 111 314 129 303 Q 146 297 166 281 Z',
        'M 267 349 L 263 370 L 198 389 Q 206 368 227 360 Q 249 357 267 349 Z'
      ].forEach((d,i)=>stripe(c,d,.78+(i%3)*.05));
      wash(c,150,191,46,155,'57,62,45',.32);
      line(c,'M 186 84 Q 152 148 157 214 Q 166 265 143 317','rgba(43,52,36,.26)',2);
      c.restore();
    }
    fur(c,[-300,-5,600,430],10500,46342,(x,y)=>[Math.atan2(210+Math.max(0,y-120)*.2,x*.52),7+(y+10)*.012],.8);
    pigment(c,-300,0,600,420,99630,3300);
    c.restore();
    const points=[];
    for(let i=0;i<65;i++) {const y=43+i*4.7,x=153+Math.sin(Math.min(1,(y-43)/270)*1.3)*130;points.push([x,y,.75,10],[-x,y,2.45,10]);}
    edgeFur(c,points,12874,'rgba(91,90,64,.65)',4);
    // The torso dissolves into the landscape rather than ending at a hard cut.
    c.save();c.globalCompositeOperation='destination-in';
    const fade=c.createLinearGradient(0,275,0,428);fade.addColorStop(0,'rgba(0,0,0,1)');fade.addColorStop(.55,'rgba(0,0,0,.85)');fade.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=fade;c.fillRect(-340,-30,680,475);c.restore();
  }

  function paintEars(c) {
    for(const side of [-1,1]) {
      c.save();c.scale(side,1);c.translate(5,13);c.scale(.94,.94);
      shape(c,'M 103 -154 C 103 -183 118 -202 143 -200 C 170 -201 188 -181 183 -152 Q 180 -128 158 -113 Q 132 -127 103 -154 Z','#363b2d');
      shape(c,'M 113 -157 C 114 -181 128 -193 145 -189 Q 171 -187 173 -166 Q 173 -145 155 -130 Q 134 -139 113 -157 Z','#a59b77');
      shape(c,'M 120 -158 Q 117 -179 137 -182 Q 159 -187 163 -169 Q 169 -148 152 -139 Q 136 -145 120 -158 Z','#514f3c');
      wash(c,142,-158,25,24,'230,225,199',.6);
      fur(c,[115,-188,54,54],260,8231+side,(x,y)=>[Math.atan2(-160-y,144-x),5],1.15);
      line(c,'M 119 -184 Q 139 -197 157 -186','rgba(226,218,187,.34)',.8);
      c.restore();
    }
  }
  function paintHead(c) {
    const g=c.createLinearGradient(-150,-165,120,130);
    g.addColorStop(0,'#a28c58');g.addColorStop(.32,'#bda268');g.addColorStop(.6,'#c1a775');g.addColorStop(1,'#a59165');
    shape(c,HEAD,g);
    c.save();c.clip(P(HEAD));
    wash(c,-91,-66,91,129,'233,208,148',.46);wash(c,99,-19,107,143,'79,80,49',.32);
    wash(c,0,-131,77,68,'219,197,136',.4);wash(c,0,-3,45,87,'228,197,128',.35);
    // Broad ivory cheek ruffs are laid in with angular, broken brush margins.
    for(const side of [-1,1]) {
      c.save();c.scale(side,1);
      shape(c,'M 80 -41 Q 106 -45 126 -36 L 137 -24 L 148 -24 L 144 -13 L 161 -6 L 156 4 L 174 16 L 165 25 L 178 37 L 166 42 L 169 58 L 155 58 L 156 72 L 142 73 L 144 86 L 128 84 Q 107 109 81 110 Q 56 106 51 89 Q 63 50 60 17 Q 67 -13 80 -41 Z','#dcdac1');
      wash(c,133,41,61,87,'243,237,212',.65);wash(c,79,62,44,64,'92,91,62',.26);
      // Pale orbital fur narrows toward the nose and stays under the heavy brow.
      shape(c,'M 31 -43 Q 51 -72 83 -65 Q 101 -63 111 -48 Q 91 -55 72 -52 Q 49 -47 34 -27 Z','#d6cba6');
      shape(c,'M 35 -26 Q 57 -15 81 -24 Q 101 -26 116 -41 Q 105 -14 84 -6 Q 57 5 41 -10 Z','#ddd6b4');
      wash(c,54,-23,29,20,'58,60,38',.22);
      c.restore();
    }
    // Forehead stripes branch and taper like loaded brush strokes, rather than
    // forming a uniform mirrored decal. The central marks suggest the 王 pattern.
    [
      'M -17 -191 Q -7 -182 -8 -166 Q -6 -155 -1 -149 Q 8 -163 8 -176 L 16 -191 Q 7 -185 1 -183 Z',
      'M -54 -178 Q -34 -181 -13 -172 L -10 -163 Q -31 -173 -51 -168 L -76 -166 Q -64 -169 -54 -178 Z',
      'M 17 -174 Q 37 -181 56 -175 Q 69 -169 80 -168 Q 56 -166 41 -168 Q 25 -168 13 -163 Z',
      'M -101 -157 Q -70 -164 -47 -152 Q -28 -147 -10 -146 L -6 -137 Q -31 -138 -49 -145 Q -74 -151 -102 -145 L -120 -143 Z',
      'M 10 -147 Q 35 -154 56 -151 Q 83 -159 110 -150 L 125 -136 Q 104 -146 84 -143 Q 59 -139 42 -141 Q 25 -142 9 -135 Z',
      'M -118 -127 Q -86 -140 -62 -125 Q -40 -114 -12 -118 L -7 -108 Q -36 -108 -57 -115 Q -91 -126 -117 -115 L -137 -107 Z',
      'M 12 -117 Q 42 -121 64 -124 Q 86 -135 111 -124 L 137 -105 Q 108 -120 90 -117 Q 66 -109 44 -112 Q 27 -108 11 -107 Z',
      'M -11 -164 Q -3 -147 -6 -130 L -3 -119 L 1 -97 L 8 -115 Q 5 -139 12 -153 L 4 -165 Q 0 -152 -3 -151 Z',
      'M -79 -102 Q -56 -105 -35 -87 Q -22 -82 -13 -83 L -18 -69 Q -39 -72 -50 -87 Q -59 -94 -79 -102 Z',
      'M 82 -102 Q 56 -103 37 -89 Q 26 -81 15 -83 L 20 -68 Q 40 -74 52 -87 Q 65 -93 82 -102 Z',
      'M -131 -110 Q -141 -90 -126 -68 Q -119 -61 -118 -46 Q -136 -57 -140 -75 Q -148 -86 -150 -90 Z',
      'M 136 -111 Q 147 -94 134 -71 Q 122 -60 121 -48 Q 139 -57 143 -74 L 153 -88 Z'
    ].forEach(d=>stripe(c,d));
    for(const side of [-1,1]) {
      c.save();c.scale(side,1);
      [
        'M 176 -59 Q 151 -57 136 -43 Q 121 -35 110 -32 Q 118 -45 139 -56 L 162 -75 Z',
        'M 184 -24 Q 154 -27 131 -13 Q 116 -2 98 -3 Q 113 -16 129 -23 Q 155 -40 175 -36 Z',
        'M 184 13 Q 160 1 143 10 Q 121 26 106 25 Q 115 13 128 7 Q 153 -9 176 -2 Z',
        'M 178 41 Q 151 24 133 36 Q 114 52 99 49 Q 112 37 123 29 Q 150 16 175 28 Z',
        'M 164 69 Q 146 51 130 57 Q 111 67 99 66 Q 109 54 123 48 Q 145 41 169 55 Z',
        'M 145 88 Q 130 76 112 78 L 95 86 Q 105 73 123 68 Q 142 68 156 78 Z',
        'M 34 -36 Q 28 -20 33 -4 Q 36 5 40 17 L 34 34 Q 24 17 25 4 Q 19 -12 25 -27 Z',
        'M 59 4 Q 66 8 69 22 L 76 32 L 67 31 Q 59 21 57 14 Z'
      ].forEach((d,i)=>stripe(c,d,i===6?.94:.91));
      // A strong supraorbital ridge carries the gaze; the eyes animate on top.
      shape(c,'M 27 -49 Q 48 -69 76 -64 Q 97 -63 111 -50 Q 87 -58 67 -53 Q 45 -45 30 -36 Z','#34372a');
      wash(c,80,-60,38,13,'51,54,34',.23);
      line(c,'M 32 -57 Q 62 -80 94 -64','rgba(233,219,178,.5)',2.2);
      c.restore();
    }
    // Glazed planes model a broad adult skull: temples turn away from the
    // light while the heavy brow throws a real shadow over the orbital rim.
    wash(c,-161,-72,56,127,'47,53,34',.43);
    wash(c,163,-43,65,148,'44,51,34',.53);
    wash(c,-112,-118,64,58,'73,74,41',.24);
    wash(c,96,-135,78,61,'71,71,40',.26);
    wash(c,-45,-154,49,39,'243,218,155',.34);
    wash(c,15,-89,26,89,'228,200,131',.38);
    wash(c,-26,-3,13,47,'66,67,38',.37);
    wash(c,27,1,15,46,'62,66,36',.46);
    wash(c,-67,-37,48,18,'35,46,29',.47);
    wash(c,69,-39,49,18,'32,44,28',.52);
    wash(c,-110,78,45,50,'81,87,54',.25);
    wash(c,111,77,45,49,'63,77,48',.33);
    wash(c,0,86,85,28,'56,63,38',.34);
    // Pigment and hair follow the anatomy: short forehead hair; fans on the ruff.
    fur(c,[-190,-195,380,318],14500,180917,(x,y)=> {
      if(y<-72) return [Math.atan2(-155-y,x*.33),3.2+Math.abs(x)*.012];
      if(Math.abs(x)<39) return [1.57+(x/39)*.28,3.1];
      return [Math.atan2(y+78,x),4.2+Math.abs(x)*.021];
    },.88);
    // Fine white fur over the cheek stripes gives the softened dry-brush edge.
    for(const side of [-1,1]) {
      c.save();c.scale(side,1);
      c.save();c.clip(P('M 97 -10 Q 137 -19 182 7 L 177 70 L 133 106 L 81 100 Q 104 61 97 -10 Z'));
      fur(c,[89,-14,101,125],1700,23461+side,(x,y)=>[Math.atan2(y+36,x-36),7],1.35);
      c.restore();c.restore();
    }
    pigment(c,-190,-200,380,330,55513,5700);
    wash(c,0,19,22,55,'238,211,154',.38);
    c.restore();
    const pts=[];
    for(let i=0;i<110;i++) {const a=-Math.PI+i/109*Math.PI*2;const x=Math.cos(a)*172,y=-36+Math.sin(a)*159;if(y>-57 && Math.abs(x)>93)pts.push([x,y,Math.atan2(y+55,x),8]);}
    edgeFur(c,pts,39951,'rgba(199,194,161,.9)',9);
    edgeFur(c,pts,3951,'rgba(78,82,56,.45)',3);
    line(c,'M -76 -179 Q -37 -193 -3 -189 Q 38 -195 75 -179','rgba(65,68,44,.4)',.9);
  }

  function paintPaw(c) {
    const g=c.createLinearGradient(-50,-80,42,54);g.addColorStop(0,'#a08d60');g.addColorStop(.48,'#c7b485');g.addColorStop(1,'#d8ceb0');
    shape(c,PAW,g);
    c.save();c.clip(P(PAW));
    wash(c,-42,-40,37,84,'57,66,44',.28);wash(c,36,-29,36,80,'238,225,186',.37);
    stripe(c,'M -64 -75 Q -26 -52 4 -65 Q 26 -75 51 -66 L 55 -51 Q 30 -61 14 -52 Q -22 -37 -65 -52 Z');
    stripe(c,'M -66 -29 Q -30 -7 0 -20 Q 29 -29 63 -14 L 67 -2 Q 28 -14 7 -8 Q -28 5 -69 -13 Z',.84);
    wash(c,0,21,59,30,'244,238,214',.43);
    fur(c,[-80,-105,160,170],2800,74891,(x,y)=>[1.56+x*.006,5],.82);
    for(const x of [-39,-13,16,42]) {
      line(c,`M ${x} 13 Q ${x-5} 26 ${x-1} 43`,'rgba(52,58,40,.59)',1.25);
      line(c,`M ${x+2} 14 Q ${x-1} 28 ${x+2} 39`,'rgba(238,229,196,.5)',.8);
    }
    pigment(c,-75,-100,150,160,8271,700);c.restore();
    const pts=[];for(let i=0;i<25;i++){const a=.05+i/24*3.05;pts.push([Math.cos(a)*66,3+Math.sin(a)*43,a,5]);}edgeFur(c,pts,3817,'rgba(197,188,150,.8)',3);
  }

  const cache = {head:null, ears:null, shoulders:null, paw:null, attempted:false};
  function layer(bounds,scale,paint) {
    const w=Math.ceil(bounds[2]*scale),h=Math.ceil(bounds[3]*scale);
    const canvas=typeof OffscreenCanvas!=='undefined'?new OffscreenCanvas(w,h):typeof document!=='undefined'?document.createElement('canvas'):null;
    if(!canvas) return null;
    canvas.width=w;canvas.height=h;const c=canvas.getContext('2d');if(!c)return null;
    c.setTransform(scale,0,0,scale,-bounds[0]*scale,-bounds[1]*scale);paint(c);
    // Fixed pigment granulation and water blooms. Colour is modulated rather
    // than opacity, so fine silhouettes and transparent surroundings stay clean.
    c.save();c.setTransform(1,0,0,1,0,0);
    const pixels=c.getImageData(0,0,w,h),data=pixels.data;
    c.restore();
    // Coarse pigment fields are interpolated. This retains broad water blooms
    // while keeping millions of trigonometric calls out of the first draw.
    const step=12,gw=Math.ceil(w/step)+1,gh=Math.ceil(h/step)+1;
    const field=new Float32Array(gw*gh);
    for(let yy=0;yy<gh;yy++)for(let xx=0;xx<gw;xx++) {
      const x=xx*step,y=yy*step;
      field[yy*gw+xx]=(Math.sin(x*.023+Math.sin(y*.018)*2.1)+Math.sin(y*.031+x*.009)+Math.sin(x*.059-y*.041)*.42)/2.42;
    }
    let seed=912318+w;const imul=Math.imul;
    for(let y=0;y<h;y++) {
      const gy=(y/step)|0,fy=y/step-gy,row=gy*gw;
      for(let x=0;x<w;x++) {
        const i=(y*w+x)*4;if(!data[i+3])continue;
        seed=(imul(seed,1664525)+1013904223)>>>0;
        const grain=seed/4294967296,gx=(x/step)|0,fx=x/step-gx;
        const top=field[row+gx]*(1-fx)+field[row+gx+1]*fx;
        const bottom=field[row+gw+gx]*(1-fx)+field[row+gw+gx+1]*fx;
        const cloud=top*(1-fy)+bottom*fy;
        const tooth=grain>.77?(grain-.77)*.36:0;
        const lift=.04+cloud*.075+tooth,shade=(grain-.5)*11;
        // Uint8ClampedArray itself handles colour saturation.
        data[i]=data[i]*(1-lift)+224*lift+shade;
        data[i+1]=data[i+1]*(1-lift)+214*lift+shade;
        data[i+2]=data[i+2]*(1-lift)+183*lift+shade*.85;
      }
    }
    c.save();c.setTransform(1,0,0,1,0,0);c.putImageData(pixels,0,0);c.restore();
    return {canvas,bounds};
  }
  function getCache() {
    if(cache.attempted)return;cache.attempted=true;
    try {
      cache.shoulders=layer([-310,-25,620,465],2,paintShoulders);
      cache.ears=layer([-212,-212,424,150],2.5,paintEars);
      cache.head=layer([-212,-212,424,365],2.5,paintHead);
      cache.paw=layer([-85,-110,170,180],2.5,paintPaw);
    } catch (_) { /* Functional direct drawing fallback on restricted canvases. */ }
  }
  function cached(c,item,paint) {if(item){const b=item.bounds;c.drawImage(item.canvas,b[0],b[1],b[2],b[3]);}else paint(c);}

  function drawJaw(c,m) {
    const drop=-26+m*96;
    c.save();c.translate(0,drop);
    const jaw='M -82 66 Q -107 96 -91 122 L -98 124 L -88 132 L -91 140 L -78 141 L -78 149 L -65 149 Q -38 165 -3 164 Q 35 168 66 151 L 77 153 L 79 144 L 91 143 L 87 133 L 98 127 L 89 119 Q 105 90 82 66 Q 41 76 1 77 Q -39 77 -82 66 Z';
    shape(c,jaw,'#c4c3a7');c.save();c.clip(P(jaw));
    wash(c,0,139,80,38,'238,236,211',.62);wash(c,-62,98,38,60,'56,62,43',.38);wash(c,63,103,36,57,'66,71,50',.34);
    stripe(c,'M -92 112 Q -63 122 -54 138 L -37 148 Q -65 141 -81 133 L -95 127 Z',.74);
    stripe(c,'M 91 112 Q 65 122 54 138 L 35 149 Q 66 139 81 135 L 96 126 Z',.8);
    fur(c,[-99,70,198,99],480,51091,(x,y)=>[Math.atan2(60,x*.65),5.8],.8);
    c.restore();c.restore();
  }
  function drawMouth(c,m) {
    const d=m*124;
    // The mouth is fully bounded by the lower jaw. It never becomes a hole in
    // the canvas; a dark, warm wash provides the depth without graphic detail.
    const cavity=`M -68 57 Q -86 72 -77 ${81+d*.32} Q -66 ${94+d} 0 ${102+d} Q 67 ${95+d} 79 ${81+d*.32} Q 85 70 68 57 Q 32 66 0 62 Q -34 65 -68 57 Z`;
    shape(c,cavity,'#26271f');
    if(m>.018) {
      c.save();c.clip(P(cavity));
      wash(c,0,91+d*.72,58,46,'91,64,56',.51);
      shape(c,`M -56 ${81+d*.76} Q -36 ${69+d*.82} 0 ${73+d*.82} Q 39 ${69+d*.82} 57 ${81+d*.76} Q 39 ${99+d} 0 ${100+d} Q -39 ${99+d} -56 ${81+d*.76} Z`,'#6c5d50');
      wash(c,0,88+d*.86,39,21,'160,129,103',.27);
      line(c,`M 0 ${77+d*.86} Q -3 ${90+d*.92} 0 ${99+d*.96}`,'rgba(42,36,30,.44)',1);
      // Upper gums and small incisors are subdued, with no blood or saliva.
      shape(c,'M -64 64 Q -35 79 0 76 Q 34 79 64 64 L 63 79 Q 33 91 0 85 Q -33 91 -63 79 Z','#67614d');
      c.save();c.globalAlpha*=clamp(m*3);
      for(let i=0;i<6;i++) {
        const x=-25+i*10;
        const tip=83+(i===0||i===5?3:0)+(i%2);shape(c,`M ${x-3.7} 75 Q ${x} 76 ${x+3.4} 75 Q ${x+4.5} ${tip-2} ${x+1} ${tip} Q ${x-2.5} ${tip+1} ${x-3.7} 75 Z`,'#bab79b','rgba(48,43,31,.55)',.6);
      }
      for(const side of [-1,1]) {
        c.save();c.scale(side,1);
        const t=c.createLinearGradient(40,75,62,133);t.addColorStop(0,'#a9a180');t.addColorStop(.28,'#eee5c6');t.addColorStop(1,'#bab69a');
        shape(c,'M 43 74 Q 54 68 64 77 Q 62 102 53 120 Q 48 131 43 133 Q 48 113 43 96 Q 40 83 43 74 Z',t,'rgba(43,42,28,.47)',.75);
        line(c,'M 50 82 Q 54 101 47 120','rgba(255,248,216,.52)',1.1);
        const lowerY=89+d;
        shape(c,`M 39 ${lowerY+4} Q 51 ${lowerY+7} 56 ${lowerY-1} Q 50 ${lowerY-17} 44 ${lowerY-23} Q 46 ${lowerY-8} 39 ${lowerY+4} Z`,'#d5cfb3','rgba(44,43,29,.5)',.7);
        c.restore();
      }
      for(let i=0;i<6;i++) {const x=-22.5+i*9;shape(c,`M ${x-3.4} ${99+d} L ${x-2.8} ${91+d} Q ${x} ${89+d} ${x+2.8} ${92+d} L ${x+3.5} ${99+d} Z`,'#bdbb9f');}
      c.restore();c.restore();
    }
    line(c,`M -73 ${88+d*.4} Q -69 ${94+d} 0 ${102+d} Q 68 ${94+d} 76 ${88+d*.4}`,'rgba(43,44,33,.68)',2.3);
  }
  const muzzleHair=(()=>{const r=rng(6719);return Array.from({length:430},()=>({x:8+r()*76,y:34+r()*60,a:r(),l:1.2+r()*3.4}));})();
  function drawMuzzle(c,m) {
    for(const side of [-1,1]) {
      c.save();c.scale(side,1);c.translate(m*4,-m*(side===1?15:13));c.rotate(-m*.07);
      const d='M 7 34 Q 28 24 54 33 Q 79 36 87 55 Q 95 73 77 88 Q 60 103 37 98 Q 10 95 1 76 Q -5 50 7 34 Z';
      const g=c.createLinearGradient(0,32,47,100);g.addColorStop(0,'#c8c6a6');g.addColorStop(.43,'#eeead3');g.addColorStop(1,'#c3c3a7');
      shape(c,d,g);c.save();c.clip(P(d));
      wash(c,14,50,19,40,'63,64,44',.25);wash(c,71,80,24,30,'57,65,43',.2);
      c.lineCap='round';
      for(const f of muzzleHair) {
        c.strokeStyle=f.a>.5?'rgba(251,246,222,.55)':'rgba(75,79,53,.22)';c.lineWidth=.27+f.a*.18;
        c.beginPath();c.moveTo(f.x,f.y);c.lineTo(f.x+f.l,f.y+f.l*.3);c.stroke();
      }
      // Rows of whisker follicles follow the muzzle's three-dimensional dome.
      for(let row=0;row<3;row++)for(let j=0;j<5;j++) {
        const x=22+j*10.2+row*3, y=49+row*10+Math.sin(j*.55)*4;
        ellipse(c,x,y,1.15+(j%2)*.35,.9+(j%2)*.2,'rgba(47,54,39,.77)',-.2);
      }
      c.restore();
      line(c,'M 2 72 Q 13 95 37 98 Q 63 102 80 87','rgba(43,49,34,.69)',1.6);
      if(m>.3)line(c,'M 51 30 Q 75 28 88 44','rgba(49,54,35,.65)',1.4*m);
      c.restore();
    }
    // Broad feline nose, low triangular leather plane with distinct nostrils.
    c.save();c.translate(0,-m*11);
    const ng=c.createLinearGradient(0,25,0,54);ng.addColorStop(0,'#806d58');ng.addColorStop(.46,'#7b6a56');ng.addColorStop(1,'#454a37');
    shape(c,'M -28 31 Q -20 25 -7 28 Q 0 31 7 28 Q 20 25 28 31 Q 27 40 13 48 Q 7 53 0 55 Q -9 52 -15 47 Q -28 40 -28 31 Z',ng,'#333c2b',1.2);
    shape(c,'M -27 32 Q -16 30 -10 36 Q -16 41 -23 38 Z','#242d22');shape(c,'M 27 32 Q 15 30 10 36 Q 16 41 23 38 Z','#242d22');
    line(c,'M -18 29 Q 0 32 18 29','rgba(190,159,123,.54)',1);
    line(c,'M 0 54 L 0 70 Q -7 78 -16 80','rgba(41,48,33,.85)',2.1);line(c,'M 0 70 Q 7 78 16 80','rgba(41,48,33,.85)',2.1);
    pigment(c,-24,30,48,20,7190,120);c.restore();
  }
  function drawEyes(c,t,menace,m) {
    // A long, sparse blink is a closed-form function of time, so screenshots
    // and seeking are reproducible. Menace suppresses the most restful blink.
    const phase=((t+1.3)%7.4+7.4)%7.4;
    const blink=phase<.17?Math.sin(phase/.17*Math.PI)*(1-menace*.73):0;
    for(const side of [-1,1]) {
      c.save();c.scale(side,1);
      const y=-40-menace*.5-m*1.1,open=1-blink*.91;
      c.translate(66,y);c.scale(.88,open*.79);c.translate(-66,0);
      const eye=`M 34 ${1+menace*4} Q 49 ${-13+menace*9} 70 ${-14+menace*3} Q 88 -14 100 ${-7-menace*4} Q 86 6 68 8 Q 47 9 34 ${1+menace*4} Z`;
      shape(c,eye,'#1e2b21');
      c.save();c.clip(P(eye));
      const eg=c.createRadialGradient(66,-3,1,66,-3,18);eg.addColorStop(0,'#c59a46');eg.addColorStop(.53,'#ac843d');eg.addColorStop(.82,'#777047');eg.addColorStop(1,'#38462e');
      ellipse(c,66,-3,15,14,eg);
      for(let i=0;i<32;i++){const a=i/32*TAU;c.strokeStyle=i%3?'rgba(50,64,34,.56)':'rgba(222,188,102,.63)';c.lineWidth=.45;c.beginPath();c.moveTo(66+Math.cos(a)*7,-3+Math.sin(a)*7);c.lineTo(66+Math.cos(a)*14,-3+Math.sin(a)*13);c.stroke();}
      ellipse(c,66,-3,6.2-menace*1.4,7.2-menace*1.1,'#13231a');
      ellipse(c,62.8,-6.8,1.85,1.25,'rgba(250,243,211,.92)',-.2);
      ellipse(c,69.4,.8,.7,.5,'rgba(220,207,159,.55)');
      wash(c,68,-14,31,10,'19,31,21',.8);
      c.restore();
      line(c,`M 34 ${1+menace*4} Q 49 ${-13+menace*9} 70 ${-14+menace*3} Q 88 -14 100 ${-7-menace*4}`,'#242e22',2.4);
      line(c,'M 35 3 Q 62 17 88 3','rgba(234,224,186,.74)',1.3);
      line(c,'M 37 3 Q 55 13 75 7 Q 89 4 99 -6','rgba(31,42,28,.9)',1.5);
      c.restore();
      if(menace>.01) {
        c.save();c.scale(side,1);c.globalAlpha*=menace;
        shape(c,'M 23 -62 Q 46 -72 70 -72 Q 97 -70 113 -53 Q 89 -63 71 -57 Q 51 -49 31 -37 L 25 -43 Q 40 -56 23 -62 Z','#494e31');
        line(c,'M 28 -57 Q 46 -64 62 -65','rgba(231,211,162,.43)',1.1);
        line(c,'M 29 -42 Q 48 -53 67 -57','rgba(29,40,25,.88)',2.3);
        c.restore();
      }
      // Small animated contraction, concentrated at the medial brow.
      c.save();c.scale(side,1);
      line(c,`M 26 ${-54+menace*5} Q 39 ${-66+menace*5} 54 -65`,'rgba(42,48,30,.48)',1.7+menace*1.2);
      c.restore();
    }
  }
  function drawWhiskers(c,t,m,menace) {
    for(const side of [-1,1]) {
      c.save();c.scale(side,1);
      for(let i=0;i<10;i++) {
        const x=45+(i%4)*7,y=57+(i%3)*10-m*15;
        const endX=121+i*5.7+menace*8,endY=26+i*7.1-m*25+Math.sin(t*1.2+i)*.6;
        const d=`M ${x} ${y} Q ${109+i*2.9} ${y-18+i*1.4-m*6} ${endX} ${endY}`;
        line(c,d,'rgba(49,58,39,.3)',1.05);
        line(c,d,`rgba(244,241,217,${.74+(i%3)*.07})`,.5+(i%3)*.13);
      }
      for(let i=0;i<4;i++)line(c,`M ${69+i*8} -63 Q ${86+i*12} ${-90-i*4} ${104+i*10} ${-94-i*6}`,'rgba(228,223,193,.78)',.55);
      c.restore();
    }
  }
  function drawPaws(c,t,reach) {
    for(const side of [-1,1]) {
      c.save();c.translate(side*(193+reach*61),278-reach*(side===1?105:126)+(side===1?7:-4)+Math.sin(t*.83+side)*.6);
      c.rotate(side*(-.075-reach*.20));c.scale((1+reach*.58)*side,1+reach*.53);
      cached(c,cache.paw,paintPaw);
      if(reach>.035) {
        c.save();c.globalAlpha*=clamp(reach*3);
        for(let i=0;i<4;i++) {
          const x=-46+i*29,y=37-Math.abs(i-1.5)*3,l=11+reach*25;
          const g=c.createLinearGradient(x,y,x+3,y+l);g.addColorStop(0,'#777a60');g.addColorStop(.25,'#e3ddbe');g.addColorStop(1,'#a5a98d');
          shape(c,`M ${x-5} ${y} Q ${x+4} ${y-5} ${x+7} ${y+2} Q ${x+10} ${y+l*.57} ${x+2} ${y+l} Q ${x+3} ${y+l*.55} ${x-5} ${y} Z`,g,'rgba(45,53,36,.65)',.7);
          line(c,`M ${x+2} ${y+5} Q ${x+6} ${y+l*.5} ${x+3} ${y+l*.78}`,'rgba(248,241,213,.72)',.7);
        }c.restore();
      }
      c.restore();
    }
  }
  function draw(c,cx,cy,size,time=0,options={}) {
    if(!c||!(size>0)||!Number.isFinite(size)||!Number.isFinite(cx)||!Number.isFinite(cy))return;
    const t=Number.isFinite(time)?time:0,m=clamp(options.mouth||0),menace=clamp(options.menace||0),reach=clamp(options.reach||0);
    getCache();
    const breath=Math.sin(t*1.43)*.72;
    c.save();c.translate(cx,cy);c.scale(size/400,size/400);
    c.save();c.translate(0,breath*.6);c.scale(1+Math.sin(t*1.43)*.0023,1);cached(c,cache.shoulders,paintShoulders);c.restore();
    // With reach=0 the paws stay grounded; at reach=1 they advance into the
    // foreground without detaching from the shoulders.
    if(reach<.42)drawPaws(c,t,reach);
    c.save();c.translate(Math.sin(t*.47)*.6*(1-menace),breath-m*2);c.rotate(Math.sin(t*.31)*.002*(1-menace));
    drawJaw(c,m);
    c.save();c.translate(0,menace*13);c.scale(1+menace*.16,1-menace*.14);cached(c,cache.ears,paintEars);c.restore();
    cached(c,cache.head,paintHead);drawMouth(c,m);drawMuzzle(c,m);drawEyes(c,t,menace,m);
    if(menace>.01) {
      c.save();c.globalAlpha*=menace;
      for(let i=0;i<3;i++) {
        const y=10-i*9-m*5,w=26-i*4;
        line(c,`M ${-w} ${y+3} Q ${-w*.5} ${y-5} 0 ${y-1} Q ${w*.5} ${y-6} ${w} ${y+1}`,'rgba(58,62,37,.66)',1.25+i*.15);
        line(c,`M ${-w+3} ${y+4.7} Q 0 ${y-1} ${w-3} ${y+4}`,'rgba(225,203,153,.68)',1.3);
      }
      c.restore();
    }
    drawWhiskers(c,t,m,menace);
    c.restore();if(reach>=.42)drawPaws(c,t,reach);c.restore();
  }
  window.InkTigerFace=Object.freeze({draw});
})();
