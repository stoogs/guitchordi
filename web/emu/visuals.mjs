// Decorative browser-only visuals: bounded particles, event-driven, max 30 fps.
const COLOURS=['#8bd5ba','#e6ca77','#e7a38b'];
export function instrumentVisuals(canvas,toggle,caption){
  const ctx=canvas.getContext('2d'),W=canvas.width,H=canvas.height;
  const motes=Array.from({length:32},()=>({life:0,x:0,y:0,dx:0,dy:0,colour:COLOURS[0]}));
  let on=!matchMedia('(prefers-reduced-motion: reduce)').matches,visible=true,raf=0,lastFrame=0,previous=-1,cursor=0,tone=0,kind='guitar',pulse=0,playing=false;
  try{const saved=localStorage.getItem('guitchordi-visuals');if(saved!==null)on=saved==='on';}catch{}
  const bg=ctx.createLinearGradient(0,0,W,H);bg.addColorStop(0,'#14241f');bg.addColorStop(1,'#111b20');
  function draw(){
    ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);ctx.save();ctx.translate(W*.48,H*.5);
    ctx.strokeStyle='#8bd5ba';ctx.lineWidth=1.6;ctx.shadowColor=COLOURS[tone%3];ctx.shadowBlur=on?8+pulse*15:0;
    ctx.globalAlpha=.85;ctx.beginPath();
    if(kind==='harp'){
      ctx.moveTo(-64,45);ctx.lineTo(62,45);ctx.quadraticCurveTo(48,-70,-46,-44);ctx.closePath();ctx.stroke();
      for(let i=0;i<11;i++){const x=-44+i*8;ctx.beginPath();ctx.moveTo(x,-40+i*2);ctx.quadraticCurveTo(x+Math.sin(i+pulse*7)*pulse*9,0,x,43);ctx.stroke();}
    }else if(kind==='dulcimer'){
      ctx.moveTo(-88,34);ctx.lineTo(80,34);ctx.lineTo(48,-34);ctx.lineTo(-55,-34);ctx.closePath();ctx.stroke();
      for(let i=0;i<9;i++){ctx.beginPath();ctx.moveTo(-58+i*13,-29);ctx.lineTo(-68+i*16,29);ctx.stroke();}
    }else{
      ctx.rotate(-.52);ctx.translate(0,20);ctx.scale(.70,.70);
      const violin=kind==='violin';
      ctx.moveTo(-20,40);ctx.bezierCurveTo(-69,28,-47,-14,-24,-6);ctx.bezierCurveTo(-12,-28,-36,-53,-6,-54);ctx.bezierCurveTo(24,-57,29,-30,16,-13);ctx.bezierCurveTo(47,-4,37,39,-2,43);ctx.closePath();ctx.stroke();
      ctx.strokeRect(-8,-89,13,40);ctx.strokeRect(-10,-105,17,18);
      ctx.beginPath();ctx.ellipse(-9,1,violin?5:10,violin?10:10,0,0,Math.PI*2);ctx.stroke();
      const strings=violin||kind==='bass'?4:6;
      ctx.lineWidth=.6;for(let i=0;i<strings;i++){const x=-8+i*2.7;ctx.beginPath();ctx.moveTo(x,-97);ctx.quadraticCurveTo(x+Math.sin(i+pulse*7)*pulse*9,-20,x,27);ctx.stroke();}
      if(violin){ctx.lineWidth=2;ctx.strokeStyle='#e6ca77';ctx.beginPath();ctx.moveTo(-55,12+pulse*9);ctx.lineTo(52,-35+pulse*9);ctx.stroke();}
    }
    ctx.restore();
    if(on){for(const p of motes)if(p.life>0){ctx.globalAlpha=Math.min(1,p.life);ctx.fillStyle=p.colour;ctx.beginPath();ctx.arc(p.x,p.y,1.2+p.life*1.5,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;}
    ctx.strokeStyle='#456a593d';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(16,H-16);for(let i=0;i<48;i++)ctx.lineTo(16+i*6,H-16+Math.sin(i*.7+pulse*9)*pulse*6);ctx.stroke();
  }
  function frame(time){raf=0;if(!on||!visible||document.hidden)return;
    if(time-lastFrame<33){raf=requestAnimationFrame(frame);return;}
    const dt=Math.min(.07,(time-lastFrame)/1000);lastFrame=time;pulse=Math.max(0,pulse-dt*.65);
    for(const p of motes)if(p.life>0){p.life-=dt;p.x+=p.dx*dt;p.y+=p.dy*dt;}
    draw();if(pulse>0||motes.some(p=>p.life>0))raf=requestAnimationFrame(frame);
  }
  function wake(){if(on&&visible&&!document.hidden&&!raf){lastFrame=performance.now();raf=requestAnimationFrame(frame);}}
  function controls(){toggle.textContent=on?'Visuals on':'Visuals off';toggle.setAttribute('aria-pressed',String(on));canvas.parentElement.classList.toggle('visuals-off',!on);}
  toggle.onclick=()=>{on=!on;try{localStorage.setItem('guitchordi-visuals',on?'on':'off');}catch{}if(!on){cancelAnimationFrame(raf);raf=0;pulse=0;for(const p of motes)p.life=0;draw();}else wake();controls();};
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)wake();else{cancelAnimationFrame(raf);raf=0;}}).observe(canvas);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;}else wake();});
  controls();draw();
  return {update(data,patch){
    const changed=tone!==data.tone; tone=data.tone;kind=patch.id==='harp'?'harp':patch.id==='violin'||patch.id==='cello'?'violin':patch.id==='bass'?'bass':patch.id==='dulcimer'?'dulcimer':'guitar';
    caption.textContent=patch.name;
    const hits=previous<0?0:Math.max(0,data.attacks-previous);previous=data.attacks;
    if(on&&hits&&visible&&!document.hidden){pulse=1;const colour=COLOURS[data.lastKey<6?0:data.lastKey<12?1:2];for(let j=0;j<Math.min(hits*6,24);j++){const p=motes[cursor++%motes.length],a=cursor*2.39996;p.life=.5+(cursor%5)*.14;p.x=W*.48;p.y=H*.55;p.dx=Math.cos(a)*65;p.dy=Math.sin(a)*50;p.colour=colour;}wake();}
    const active=data.active>0;if(changed||active!==playing){playing=active;if(visible)draw();}
  },stop(){pulse=0;previous=-1;cancelAnimationFrame(raf);raf=0;for(const p of motes)p.life=0;draw();}};
}
