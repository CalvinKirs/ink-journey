/* Living water, registered to the continuous 7200 x 2400 master.
 * Shared scene clock only: paused/reduced-motion renders are deterministic.
 * Original procedural water, no timers, audio, downloads or dependencies. */
'use strict';(()=>{
  const TAU=Math.PI*2,clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
  let splashAt=-Infinity;
  const strands=Array.from({length:76},(_,i)=>({u:(i*.61803398875)%1,phase:(i*.754877666)%1,speed:140+(i%9)*18,width:1.1+(i%5)*.65,length:24+(i%11)*8}));
  const drops=Array.from({length:86},(_,i)=>({u:(i*.6180339)%1,phase:(i*.4142135)%1,speed:.24+(i%7)*.045}));
  function outline(c){c.beginPath();c.moveTo(2287,566);c.bezierCurveTo(2263,615,2249,704,2248,785);c.bezierCurveTo(2242,936,2230,1092,2214,1214);c.lineTo(2424,1239);c.bezierCurveTo(2405,1070,2408,921,2411,801);c.bezierCurveTo(2416,683,2417,610,2425,573);c.bezierCurveTo(2375,592,2331,550,2287,566);c.closePath();}
  function draw(c,time,{motion=true}={}){
    const t=motion&&Number.isFinite(time)?Math.max(0,time):0;
    const pulse=motion?clamp(1-(t-splashAt)/3):0;
    c.save();outline(c);c.clip();
    // A translucent veil keeps the photographed brushwork visible between rivulets.
    const veil=c.createLinearGradient(0,570,0,1230);veil.addColorStop(0,'rgba(247,243,219,.025)');veil.addColorStop(.62,'rgba(240,243,227,.09)');veil.addColorStop(1,'rgba(252,246,224,.16)');c.fillStyle=veil;c.fillRect(2200,565,250,700);
    for(const s of strands){
      const y=560+((s.phase*760+t*s.speed)%760),q=clamp((y-565)/670);
      const x=2285+s.u*132-25*q+Math.sin(q*9+s.u*21+t*.6)*3;
      const alpha=.09+.22*Math.sin(Math.PI*q);
      c.strokeStyle=`rgba(253,250,232,${alpha})`;c.lineWidth=s.width*(1+q*.7);c.lineCap='round';c.beginPath();c.moveTo(x,y);c.bezierCurveTo(x-2,y+s.length*.3,x+2,y+s.length*.72,x-3,y+s.length);c.stroke();
      if(s.u<.44){c.strokeStyle='rgba(129,151,146,.08)';c.lineWidth=.8;c.beginPath();c.moveTo(x+5,y);c.lineTo(x+2,y+s.length*.8);c.stroke();}
    }
    c.restore();
    // Low cascades follow the painted terraces instead of forming a second wall.
    c.save();
    for(let k=0;k<3;k++){
      const bx=[2250,2160,2040][k],by=[1340,1415,1505][k],w=[190,215,280][k],h=[75,55,45][k];
      for(let i=0;i<18;i++){
        const p=(i*.137+t*(.7+k*.13))%1,x=bx+(i/18)*w+Math.sin(i*2.1)*9,y=by+p*h;
        c.strokeStyle=`rgba(255,245,215,${.10+.17*Math.sin(p*Math.PI)})`;c.lineWidth=1.5+(i%3);c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x-5,y+10,x-12,y+21);c.stroke();
      }
    }
    // Ballistic spray and expanding contact rings continue even without interaction.
    for(const d of drops){
      const p=(d.phase+t*d.speed)%1,a=d.u*TAU;
      const x=2315+Math.cos(a)*(30+p*(130+pulse*60));
      const y=1230-Math.sin(p*Math.PI)*(28+60*d.u)+p*65;
      c.fillStyle=`rgba(252,246,220,${(1-p)*(.12+pulse*.08)})`;c.beginPath();c.ellipse(x,y,1.4+d.u*2,1.5+d.u*3,0,0,TAU);c.fill();
    }
    for(let i=0;i<7;i++){
      const p=(i/7+t*.16)%1;c.strokeStyle=`rgba(250,239,207,${.14*(1-p)})`;c.lineWidth=1.2;c.beginPath();c.ellipse(2210,1575,85+p*220,4+p*19,0,.1,Math.PI*1.85);c.stroke();
    }
    // Diffuse spindrift, with no opaque discs or rectangular fog seams.
    for(let i=0;i<5;i++){
      const x=2270+i*29+Math.sin(t*.27+i)*18,y=1240+Math.sin(t*.23+i*2)*13;
      const g=c.createRadialGradient(x,y,3,x,y,87);g.addColorStop(0,`rgba(246,240,215,${.025+pulse*.02})`);g.addColorStop(1,'rgba(246,240,215,0)');c.fillStyle=g;c.fillRect(x-87,y-87,174,174);
    }
    c.restore();
  }
  window.InkWaterfall=Object.freeze({draw,splash(time){if(Number.isFinite(time))splashAt=time;},reset(){splashAt=-Infinity;},bounds:Object.freeze({x:1990,y:550,width:540,height:1060})});
})();
