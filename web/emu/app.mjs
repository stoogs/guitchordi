import {instrumentVisuals} from './visuals.mjs';
const $=id=>document.getElementById(id);
const catalogue=await fetch('./styles.json').then(r=>{if(!r.ok)throw new Error('Style catalogue unavailable');return r.json();});
const styles=catalogue.styles;
const instruments=(await fetch('./instruments.json').then(r=>{if(!r.ok)throw new Error('Instrument catalogue unavailable');return r.json();})).instruments;
for(const groupName of new Set(instruments.map(p=>p.family))){const group=document.createElement('optgroup');group.label=groupName;instruments.forEach((p,i)=>{if(p.family===groupName)group.append(new Option(p.name,String(i)));});$('instrument').append(group);}
for(const family of new Set(styles.map(s=>s.family))){
  const group=document.createElement('optgroup');group.label=family;
  styles.forEach((style,index)=>{if(style.family===family)group.append(new Option(style.name,String(index)));});
  $('style').append(group);
}
const WHITE=[0,2,4,6,7,9,11,12,14,16,18,19,21,23,24,26];
const BLACK=[1,3,5,8,10,13,15,17,20,22,25];
const AFTER=[0,1,2,4,5,7,8,9,11,12,14];
const LABELS=['E','A','D','G','B','e'];
const STORE='guitchordi-firmware-simulator-v1';
const LEGACY_STORE='fm-guitomnichord-firmware-simulator-v1';
const keyControls=new Map(), buttonControls=new Map(), knobs=[], chordGuides=[];
let ctx,node,output,enabled=false,muted=false,starting=false,latest=null,spaceLock=false,mappingTone='';
const contacts=new Map();
const visuals=instrumentVisuals($('instrument-visual'),$('visual-toggle'),$('visual-caption'));
const canvas=$('screen'), drawing=canvas.getContext('2d'), image=drawing.createImageData(240,240);
function send(message){if(enabled)node.port.postMessage(message);}
function mask(){let value=0;for(const key of contacts.values())value|=1<<key;return value>>>0;}
function contact(id,key){if(key===null)contacts.delete(id);else contacts.set(id,key);send({type:'keys',mask:mask()});}
function clearInputs(){spaceLock=false;contacts.clear();send({type:'keys',mask:0});for(const button of buttonControls.keys())send({type:'button',button,down:false});}
function makeKey(note,label,kind,parent){
  const b=document.createElement('button');b.type='button';b.dataset.note=note;b.className=kind;
  b.setAttribute('aria-label',label);
  b.onkeydown=e=>{if(['Space','Enter'].includes(e.code)){e.preventDefault();e.stopPropagation();if(!e.repeat)contact(`accessible-${note}`,note);}};
  b.onkeyup=e=>{if(['Space','Enter'].includes(e.code)){e.preventDefault();e.stopPropagation();contact(`accessible-${note}`,null);}};
  b.onblur=()=>contact(`accessible-${note}`,null);
  parent.append(b);keyControls.set(note,b);return b;
}
WHITE.forEach((note,key)=>{
  const string=key<12?key%6:key-10;
  const zone=key<6?'soft':key<12?'normal':'accent';
  const b=makeKey(note,`${zone} string ${LABELS[string]}, white key ${key+1}`,`white-key ${zone}`,$('white-keys'));
  b.innerHTML=`<span>${LABELS[string]}</span><small>${key+1}</small>`;
});
BLACK.forEach((note,slot)=>{
  const name=styles[0].slots[slot];
  const b=makeKey(note,`Chord slot ${slot+1}: ${name}`,'black-key',$('black-keys'));
  b.innerHTML=`<span>${name}</span><small>${slot+1}</small>`;
  const guide=document.createElement('button');guide.type='button';guide.innerHTML=`<small>BLACK ${slot+1}</small><span>${name}</span>`;
  guide.setAttribute('aria-label',`Select chord ${name}, slot ${slot+1}`);
  guide.onpointerdown=e=>{if(e.button!==0)return;e.preventDefault();guide.setPointerCapture(e.pointerId);contact(`guide-${slot}`,note);};
  for(const type of ['pointerup','pointercancel','lostpointercapture'])guide.addEventListener(type,()=>contact(`guide-${slot}`,null));
  guide.onkeydown=e=>{if(['Space','Enter'].includes(e.code)){e.preventDefault();e.stopPropagation();if(!e.repeat)contact(`guide-${slot}`,note);}};
  guide.onkeyup=e=>{if(['Space','Enter'].includes(e.code)){e.preventDefault();e.stopPropagation();contact(`guide-${slot}`,null);}};
  guide.onblur=()=>contact(`guide-${slot}`,null);
  $('chord-guide').append(guide);chordGuides.push(guide);
  b.style.left=`calc(12px + (100% - 24px) * ${(AFTER[slot]+1)/16})`;
});
const activePointers=new Set();
function keyAt(e){const b=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-note]');return b&&$('keybed').contains(b)?Number(b.dataset.note):null;}
$('keybed').onpointerdown=e=>{if(e.button!==0)return;e.preventDefault();document.activeElement?.blur();activePointers.add(e.pointerId);$('keybed').setPointerCapture(e.pointerId);contact(`pointer-${e.pointerId}`,keyAt(e));};
$('keybed').onpointermove=e=>{if(activePointers.has(e.pointerId))contact(`pointer-${e.pointerId}`,keyAt(e));};
for(const type of ['pointerup','pointercancel','lostpointercapture'])$('keybed').addEventListener(type,e=>{activePointers.delete(e.pointerId);contact(`pointer-${e.pointerId}`,null);});
function knob(label,subtitle,role,parent){
  const box=document.createElement('div');box.className='knob-control';
  box.innerHTML=`<div class="knob" role="slider" tabindex="0" aria-label="${label}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"></div><label>${label}</label><small>${subtitle}</small><output class="knob-value">—</output><div class="nudge"><button aria-label="Decrease ${label}">−</button><button aria-label="Increase ${label}">+</button></div>`;
  const dial=box.querySelector('.knob');
  const turn=delta=>send({type:'encoder',role:role==='master'?7:role,delta});
  box.querySelectorAll('button').forEach((b,i)=>b.onclick=()=>turn(i?1:-1));
  let lastY=0,drag=null;
  dial.onpointerdown=e=>{if(e.button!==0)return;e.preventDefault();dial.focus();drag=e.pointerId;lastY=e.clientY;dial.setPointerCapture(e.pointerId);};
  dial.onpointermove=e=>{if(e.pointerId!==drag)return;const step=Math.trunc((lastY-e.clientY)/5);if(step){turn(step);lastY-=step*5;}};
  for(const type of ['pointerup','pointercancel','lostpointercapture'])dial.addEventListener(type,()=>{drag=null;});
  dial.addEventListener('wheel',e=>{e.preventDefault();turn(e.deltaY<0?1:-1);},{passive:false});
  dial.onkeydown=e=>{const delta=({ArrowUp:1,ArrowRight:1,ArrowDown:-1,ArrowLeft:-1,PageUp:5,PageDown:-5})[e.code];if(delta){e.preventDefault();turn(delta);}};
  parent.append(box);knobs.push({role,dial,valueLabel:box.querySelector('.knob-value')});
}
knob('MASTER','output level','master',$('left-knobs'));
knob('SELECT','BPM',0,$('left-knobs'));
knob('PRESETS','style / assign',2,$('left-knobs'));
knob('ALGORITHM','16 instruments',1,$('left-knobs'));
knob('KNOB 1','50% = normal',3,$('performance-knobs'));
knob('KNOB 2','transpose',4,$('performance-knobs'));
knob('KNOB 3','shared room',5,$('performance-knobs'));
knob('KNOB 4','chord voicing',6,$('performance-knobs'));
const panels=[['FX',0,'tone / home'],['SEL',1,'OK / confirm'],['ENV',2,'hold to lock'],['LFO',3,'reserved'],['EDIT',4,'tap assign / hold reset'],['GLO',5,'settings / hold reset'],['HOME',6,'play page'],['SAVE',7,'browser save'],['ARP',8,'play mode'],['SEQ',9,'reserved'],['PLAY',10,'damp / stop'],['REC',11,'reserved'],['OCT−',12,'transpose'],['OCT+',13,'transpose']];
for(const [label,button,description] of panels){
  const b=document.createElement('button');b.type='button';b.className='panel-button';b.innerHTML=`${label}<small>${description}</small>`;b.setAttribute('aria-label',`${label}: ${description}`);
  b.disabled=[3,9,11].includes(button);
  b.onpointerdown=e=>{if(e.button!==0)return;e.preventDefault();b.setPointerCapture(e.pointerId);send({type:'button',button,down:true});};
  for(const type of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(type,()=>send({type:'button',button,down:false}));
  b.onkeydown=e=>{if(['Space','Enter'].includes(e.code)){e.preventDefault();e.stopPropagation();if(!e.repeat)send({type:'button',button,down:true});}};
  b.onkeyup=e=>{if(['Space','Enter'].includes(e.code)){e.preventDefault();e.stopPropagation();send({type:'button',button,down:false});}};
  b.onblur=()=>send({type:'button',button,down:false});
  $(button>=12?'left-knobs':'buttons').append(b);buttonControls.set(button,b);
}
const stringCodes=['KeyA','KeyS','KeyD','KeyF','KeyG','KeyH','KeyJ','KeyK','KeyL','Semicolon','Quote','KeyZ','KeyX','KeyC','KeyV','KeyB'];
const chordCodes=['KeyQ','KeyW','KeyE','KeyR','KeyT','KeyY','KeyU','KeyI','KeyO','KeyP','BracketLeft'];
window.addEventListener('keydown',e=>{
  if(e.defaultPrevented||e.ctrlKey||e.metaKey||e.altKey||e.target.matches('input,select,textarea'))return;
  const string=stringCodes.indexOf(e.code),chord=chordCodes.indexOf(e.code);
  if(string>=0||chord>=0){e.preventDefault();if(!e.repeat)contact(`keyboard-${e.code}`,string>=0?WHITE[string]:BLACK[chord]);}
  else if(e.code==='Enter'&&!e.target.closest('button,summary,a')){e.preventDefault();if(!e.repeat)send({type:'button',button:1,down:true});}
  else if(e.code==='Space'&&!e.target.closest('button,summary,[role=slider],a')){e.preventDefault();if(!e.repeat){spaceLock=true;send({type:'button',button:2,down:true});}}
  else if(e.code==='Escape'){e.preventDefault();clearInputs();send({type:'panic'});}
});
window.addEventListener('keyup',e=>{if(e.code==='Enter')send({type:'button',button:1,down:false});if(contacts.has(`keyboard-${e.code}`))contact(`keyboard-${e.code}`,null);if(e.code==='Space'&&spaceLock){spaceLock=false;send({type:'button',button:2,down:false});}});
window.addEventListener('blur',clearInputs);
document.addEventListener('visibilitychange',()=>{if(document.hidden)clearInputs();});
function publish(data){
  latest=data;
  const pages=['Play','Chord slots','Levels','Global settings'];
  const semitones=`${data.transpose>0?'+':''}${data.transpose} st`;
  const resetChoices=['Cancel','This slot','All slots'];
  const performanceNames=['Freeplay','Strum','Arp'];
  const divisions=['1/1','1/1D','1/1T','1/2','1/2D','1/2T','1/4','1/4D','1/4T','1/8','1/8D','1/8T','1/16','1/16D','1/16T','1/32','1/32D','1/32T'];
  const patterns=data.performance===1?['Down','Up','Alternate','Block','Bass + chord','Shuffle']:['Up','Down','Up-down','Down-up','Outside-in','Random'];
  const rhythmActive=data.performance>0&&data.page===0;
  const rhythmLabels=['Pattern','Division','Gate',data.performance===1?'Strum sweep':'Swing'];
  const rhythmValues=[patterns[data.rhythm[0]],divisions[data.rhythm[1]],data.rhythm[2]===4?'FREE':`${(data.rhythm[2]+1)*25}%${data.gateTails?' + tail':''}`,data.performance===1?(data.rhythm[3]?`${data.rhythm[3]*5} ms`:'INSTANT'):`${data.rhythm[3]*5}%`];
  const selectValue=`${data.bpm} BPM`;
  const values=[selectValue,instruments[data.tone].name,data.resetMenu?resetChoices[data.resetMenu-1]:data.editing?data.chords[data.selected]:styles[data.mode].name,`${data.velocity}%`,semitones,`${data.room}%`,`Shape ${data.voicing+1}/${data.voicingCount}`,`${data.volume}%`];
  const names=['SELECT · Tempo','ALGORITHM · Instrument',data.resetMenu?'PRESET · Reset choice':data.editing?'PRESET · Slot assignment':'PRESET · Chord style','KNOB 1 · Intensity','KNOB 2 · Transpose','KNOB 3 · Shared room','KNOB 4 · Chord voicing','MASTER · Output'];
  if(rhythmActive)for(let i=0;i<4;i++){values[i+3]=rhythmValues[i];names[i+3]=`KNOB ${i+1} · ${rhythmLabels[i]}`;}
  const setText=(id,text)=>{if($(id).textContent!==text)$(id).textContent=text;};
  setText('guide-preset',values[2]);setText('guide-algorithm',values[1]);setText('guide-select',values[0]);
  setText('guide-preset-help',data.resetMenu?'Turn PRESETS · tap SEL to confirm':data.editing?'EDIT is on · PRESETS reassigns the selected slot':'PRESETS chooses the chord style · 50 banks');
  const globals=data.page===3;
  if(globals){
    const globalNames=['Gate tails','Strum humanity','Tuning','Rhythm velocity'];
    const globalValues=[data.gateTails?'ON':'OFF',`${data.humanity}%`,data.tuningName,`${data.rhythmVelocity}%`];
    for(let i=0;i<4;i++){values[i+3]=globalValues[i];names[i+3]=`KNOB ${i+1} · ${globalNames[i]}`;}
  }
  const freeLabels=['Intensity','Transpose','Shared room','Chord voicing'];
  for(let i=0;i<4;i++){
    setText(`guide-knob${i+1}`,values[i+3]);
    document.querySelector(`[data-control="${i+3}"]>span`).textContent=`Knob ${i+1} · ${globals?['Gate tails','Strum humanity','Tuning','Rhythm velocity'][i]:rhythmActive?rhythmLabels[i]:freeLabels[i]}`;
    knobs.find(k=>k.role===i+3).dial.parentElement.querySelector('small').textContent=globals?['Gate tails','Strum humanity','Tuning','Rhythm velocity'][i]:rhythmActive?rhythmLabels[i]:freeLabels[i];
  }
  $('select-help').textContent='Turn SELECT for 40–240 BPM · ARP cycles Freeplay / Strum / Arp';
  $('chord-hint').textContent=data.locked?'ENV lock holds the current chord · unlock to follow suggestions.':'Next chord: green / bright = smooth or strong · amber / medium = colour · red / dim = adventurous. Suggestions, not rules.';
  $('performance-hint').textContent=globals?'Global settings · K1: percentage-gate tails On/Off · K2: strum humanity · K3: tuning · K4: strum/arp velocity · Hold GLO 3 seconds: reset confirmation · SEL / GLO / HOME returns to play.':data.performance?`${performanceNames[data.performance]} · ${data.bpm} BPM · ${data.running?'Playing':'Hold a black chord key to play'} · SELECT sets BPM; ARP cycles modes; FX toggles tone / Home; GLO sets gate tails and humanity.`:'Freeplay · direct key attacks. Press ARP for Strum or Arp. SELECT sets BPM.';
  document.querySelectorAll('[data-control]').forEach(card=>card.classList.toggle('active',Number(card.dataset.control)===data.control));
  setText('control-feedback',data.control>=0?`${names[data.control]}: ${data.locked&&(data.control===2 || (globals&&data.control===5) || (!rhythmActive&&!globals&&data.control===6))?'Chord locked':values[data.control]}`:'Turn a knob to see its function and value here.');
  $('control-feedback').classList.toggle('active',data.control>=0);
  $('reset-menu').hidden=!data.resetMenu&&!data.factoryReset;
  $('reset-menu').querySelector('strong').textContent=data.factoryReset?'Reset everything?':'Reset chord slots';
  $('reset-menu').querySelector('small').textContent=data.factoryReset?'SEL confirms · HOME cancels':'PRESETS chooses · SEL confirms · HOME cancels';
  setText('reset-options',data.factoryReset?'All settings and chord slots return to factory defaults.':resetChoices.map((label,i)=>`${data.resetMenu===i+1?'▸ ':''}${label}`).join('  ·  '));
  $('guide-knob1').title=rhythmActive?'Six patterns for this mode':'50% normal · below: soft/dark · above: bright/driven · applies to new notes';
  const style=styles[data.mode]??styles[0];
  const patch=instruments[data.tone]??instruments[0];
  $('instrument').value=String(data.tone);$('instrument').disabled=!enabled||!!data.resetMenu||!!data.factoryReset;
  $('instrument-description').textContent=patch.description;
  $('instrument-count').textContent=`${patch.family} · ${data.tone+1} / ${instruments.length} · 14 voices shared`;
  $('instrument-mapping').textContent=globals?`Tuning: ${data.tuningName}. K3 changes string layout; chord names stay accurate.`:rhythmActive?'Six chord parts · hold a chord key for rhythm. FX opens the saved voicing and tone controls.':'Six chord parts · soft / normal / accent zones. Knob 4 recalls a voicing for each slot.';
  const mappingSignature=[data.tone,data.chord,data.voicing,data.transpose,data.tuning].join(':');
  if(mappingTone!==mappingSignature){mappingTone=mappingSignature;WHITE.forEach((note,key)=>{
    const original=key<12?key%6:key-10,part=patch.mapping[original],b=keyControls.get(note),pitch=data.pitches[key];
    const noteName=pitch<0?'×':['C','C♯','D','E♭','E','F','F♯','G','A♭','A','B♭','B'][pitch%12]+(Math.floor(pitch/12)-1);
    const label=patch.family==='Other'?noteName:['C','C♯','D','E♭','E','F','F♯','G','A♭','A','B♭','B'][data.openPitches[part]%12],zone=key<6?'soft':key<12?'normal':'accent',partLabel=patch.mapping.indexOf(part)+1;
    b.querySelector('span').textContent=label;
    b.title=`${zone.toUpperCase()} · ${noteName} · part ${partLabel} · key ${key+1}`;
    b.setAttribute('aria-label',`${patch.name}, ${zone}, ${noteName}, part ${partLabel}, white key ${key+1}`);
  });}
  visuals.update(data,patch);
  $('summary-instrument').textContent=`${patch.name} · ${data.chords[data.selected]}`;
  $('summary-voices').textContent=`${data.active}/14 voices`;
  $('chord-lock').classList.toggle('is-locked',!!data.locked);
  $('chord-lock').setAttribute('aria-label',data.locked?'Chord locked':'Chord unlocked');
  $('chord-lock').title=`Chord ${data.locked?'locked':'unlocked'} · hold ENV for 3 seconds`;
  $('chord-lock').style.color=data.lockProgress?`rgb(248,${Math.round(180-120*data.lockProgress/1000)},70)`:'';
  $('lock-shackle').setAttribute('d',data.locked?'M8 10V6a4 4 0 0 1 8 0v4':'M8 10V6a4 4 0 0 1 8 0');
  $('live-summary').classList.toggle('locked',!!data.locked);
  if($('style').value!==String(data.mode))$('style').value=String(data.mode);
  $('style').disabled=!enabled||!!data.locked||!!data.resetMenu||!!data.factoryReset;
  $('previous-style').disabled=!enabled||!!data.locked||!!data.resetMenu||!!data.factoryReset||data.mode===0;
  $('next-style').disabled=!enabled||!!data.locked||!!data.resetMenu||!!data.factoryReset||data.mode===styles.length-1;
  $('style-key').textContent=`${style.family} · ${style.key} · ${data.mode+1} / ${styles.length}${data.custom?' · edited slots':''}`;
  $('style-description').textContent=style.description;
  $('style-lock').textContent=data.locked?'Chord lock is on. Unlock to change style.':'PRESETS chooses chords. Instrument, tuning/transpose, intensity and room stay independent.';
  data.chords.forEach((name,slot)=>{
    const black=keyControls.get(BLACK[slot]), guide=chordGuides[slot];
    if(black.querySelector('span').textContent!==name)black.querySelector('span').textContent=name;
    black.setAttribute('aria-label',`Chord slot ${slot+1}: ${name}`);
    if(guide.querySelector('span').textContent!==name)guide.querySelector('span').textContent=name;
    guide.classList.toggle('selected',slot===data.selected);
    guide.setAttribute('aria-label',`Select chord ${name}, slot ${slot+1}`);
    const level=data.suggestions[slot],labels=['Current chord','Adventurous','Colour change','Smooth / strong next move'];
    const reasons=['Current chord','Resolution','Shared notes','Voice-leading','Circle of fifths','More harmonic tension'];
    guide.title=`${name} · voicing ${data.slotVoicings[slot]+1} · ${labels[level]} · ${reasons[data.suggestionReasons[slot]]}`;
    guide.setAttribute('aria-description',`${labels[level]}; ${reasons[data.suggestionReasons[slot]]}`);
    black.setAttribute('aria-description',`${labels[level]}; ${reasons[data.suggestionReasons[slot]]}`);
    black.title=guide.title;
    for(const element of [guide,black]){element.dataset.suggestion=level;element.style.setProperty('--hint-fill',level===3?'36%':level===2?'17%':'6%');element.style.setProperty('--hint-glow',level===3?'26%':level===2?'12%':'4%');}
    guide.setAttribute('aria-pressed',slot===data.selected);
  });
  if(data.frame){
    for(let i=0;i<data.frame.length;i++){const p=data.frame[i],j=i*4;image.data[j]=((p>>11)&31)*255/31;image.data[j+1]=((p>>5)&63)*255/63;image.data[j+2]=(p&31)*255/31;image.data[j+3]=255;}
    drawing.putImageData(image,0,0);
  }
  for(const [note,b] of keyControls){b.classList.toggle('lit',!!(data.keys&(1<<note)));b.classList.toggle('muted',!!(data.muted&(1<<note)));}
  for(const [button,b] of buttonControls)b.classList.toggle('lit',!!(data.buttons&(1<<button)));
  for(const {role,dial,valueLabel} of knobs){
    const [value,max]=globals&&role>=3&&role<=6?(role===3?[data.gateTails,1]:role===4?[data.humanity/10,10]:role===5?[data.tuning,data.tuningCount-1]:[data.rhythmVelocity,100]):rhythmActive&&role>=3&&role<=6?[data.rhythm[role-3],role===3?5:role===4?17:role===5?4:data.performance===1?50:12]:role==='master'?[data.volume,100]:role===6?[data.voicing,data.voicingCount-1]:role===0?[data.bpm-40,200]:role===1?[data.tone,instruments.length-1]:role===2?(data.resetMenu?[data.resetMenu-1,2]:data.editing?[data.chord,catalogue.voicingCount-1]:[data.mode,styles.length-1]):role===3?[data.velocity,100]:role===4?[data.transpose+12,24]:[data.room,100];
    dial.setAttribute('aria-disabled',data.factoryReset?'true':'false');
    const valueText=values[role==='master'?7:role];
    if(valueLabel.textContent!==valueText)valueLabel.textContent=valueText;
    dial.setAttribute('aria-valuetext',valueText);
    dial.style.setProperty('--angle',`${-130+260*value/max}deg`);dial.setAttribute('aria-valuenow',value);dial.setAttribute('aria-valuemax',max);
  }
  canvas.setAttribute('aria-label',data.egg?'Hidden Yellow instrumental chord loop; press PLAY to stop':data.boot?'GuitChordi boot screen':`Firmware screen: ${style.name}, ${patch.name}, chord ${data.chords[data.selected]}, slot ${data.selected+1}, ${data.locked?'locked':'unlocked'}, ${data.active} of 14 voices, page ${data.page+1}`);
  if(data.store){try{localStorage.setItem(STORE,JSON.stringify(data.store));$('status').textContent='On · settings saved in this browser';}catch{$('status').textContent='On · browser storage unavailable';}}
  $('diagnostics').textContent=`C application host/WASM build · 44100 Hz · AudioWorklet\nDevice clock: ${data.now} ms · attacks: ${data.attacks} · voices: ${data.active}/14 · steals: ${data.steals}\nStyle: ${style.name} (${data.mode+1}/${styles.length})\nChords: ${data.chords.map((name,i)=>`${i+1}:${name}`).join(' | ')}\nChord slot: ${data.selected+1} · assign mode: ${data.editing?'ON':'OFF'} · lock: ${data.locked?'ON':'OFF'} · tone: ${patch.name}\nMaster: ${data.volume}% · intensity: ${data.velocity}% · transpose: ${data.transpose} · shared room: ${data.room}% · mode: ${performanceNames[data.performance]} · BPM: ${data.bpm} · tuning: ${data.tuningName} · gate tails: ${data.gateTails?'ON':'OFF'} · humanity: ${data.humanity}% · voicing: ${data.voicing+1}/${data.voicingCount}\nLast white key: ${data.lastKey<0?'none':data.lastKey+1} · pitch: ${data.lastPitch<0?'muted/none':data.lastPitch}\nC-reported application buffers/state: ${data.stateBytes} bytes · DSP-limited samples: ${data.clips}\nScreen: 240 × 240 RGB565 from C · firmware input: 27-key bitmap\nFM-1 peripheral timing/scan codes and on-device performance unverified.`;
}
$('style').onchange=e=>{send({type:'mode',index:Number(e.target.value)});e.target.blur();};
$('previous-style').onclick=()=>send({type:'mode',index:(latest?.mode??0)-1});
$('next-style').onclick=()=>send({type:'mode',index:(latest?.mode??0)+1});
$('power').onclick=async()=>{
  if(starting)return;starting=true;
  try{
    if(enabled){visuals.stop();$('instrument').disabled=true;clearInputs();send({type:'panic'});await ctx.suspend();enabled=false;$('style').disabled=$('previous-style').disabled=$('next-style').disabled=true;$('power').textContent='Switch on';$('status').textContent='Off';$('power-light').classList.remove('on');return;}
    $('status').textContent='Building the audio connection…';
    if(!ctx)ctx=new AudioContext({latencyHint:'interactive',sampleRate:44100});
    await ctx.resume();if(ctx.sampleRate!==44100)throw new Error('This simulator requires a 44.1 kHz context');
    if(!node){
      const response=await fetch('./firmware.wasm');if(!response.ok)throw new Error(`Firmware host build unavailable (${response.status})`);
      const module=await WebAssembly.compile(await response.arrayBuffer());
      await ctx.audioWorklet.addModule(new URL('./worklet.mjs',import.meta.url));
      let store;try{store=JSON.parse(localStorage.getItem(STORE)||localStorage.getItem(LEGACY_STORE)||'null');}catch{}
      node=new AudioWorkletNode(ctx,'guitchordi-firmware',{numberOfInputs:0,numberOfOutputs:1,outputChannelCount:[2],processorOptions:{module,store}});
      node.port.onmessage=({data})=>publish(data);
      node.onprocessorerror=()=>{enabled=false;$('status').textContent='Firmware processor stopped. Reload to restart.';};
      output=ctx.createGain();output.gain.value=muted?0:1;node.connect(output).connect(ctx.destination);
    }
    enabled=true;$('power').textContent='Switch off';$('status').textContent='On · C application running';$('power-light').classList.add('on');
  }catch(error){$('status').textContent=`Could not start: ${error.message}`;}finally{starting=false;}
};
$('mute').onclick=()=>{muted=!muted;$('mute').setAttribute('aria-pressed',muted);$('mute').textContent=muted?'Unmute output':'Mute output';if(output)output.gain.setTargetAtTime(muted?0:1,ctx.currentTime,0.01);};
$('damp').onclick=()=>{visuals.stop();clearInputs();send({type:'panic'});};

$('instrument').onchange=()=>{send({type:'tone',index:Number($('instrument').value)});$('instrument').blur();};
