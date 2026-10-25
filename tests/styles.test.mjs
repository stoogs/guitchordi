import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const bank=JSON.parse(fs.readFileSync('web/chords.json'));
const {styles}=JSON.parse(fs.readFileSync('web/styles.json'));
const roots={C:0,'C#':1,Db:1,D:2,Eb:3,E:4,F:5,'F#':6,Gb:6,G:7,Ab:8,A:9,Bb:10,B:11};
const intervals={major:[0,4,7],m:[0,3,7],7:[0,4,7,10],maj7:[0,4,7,11],m7:[0,3,7,10],6:[0,4,7,9],m6:[0,3,7,9],sus2:[0,2,7],sus4:[0,5,7],add9:[0,2,4,7],5:[0,7],9:[0,2,4,7,10],m9:[0,2,3,7],maj9:[0,2,4,7,11],13:[0,2,4,9,10],dim7:[0,3,6,9],m7b5:[0,3,6,10],'7sus4':[0,5,7,10],'7#9':[0,3,4,7,10],'7b9':[0,1,4,7,10],aug:[0,4,8]};
test('50 distinct style banks have eleven voiced chord slots and valid starting settings',()=>{
  assert.equal(styles.length,50);assert.equal(new Set(styles.map(s=>s.id)).size,50);
  assert.equal(new Set(styles.map(s=>JSON.stringify(s.slots))).size,50);
  for(const style of styles){assert.equal(style.slots.length,11);assert.ok(style.description.length>20);assert.ok(['wood','wire','glow'].includes(style.tone));assert.ok(style.room>=0&&style.room<=100);for(const chord of style.slots)assert.ok(bank.voicings[chord],`${style.name}: ${chord}`);}
  for(const name of ['Light Rock','Hard Rock','Memphis Blues','Jazz Essentials','Lo-fi Bedroom','Pop Essentials'])assert.ok(styles.some(s=>s.name===name));
});
test('every labelled chord has the advertised pitch classes and fits standard guitar strings',()=>{
  const tuning=[40,45,50,55,59,64];
  for(const [name,notes]of Object.entries(bank.voicings)){
    const meta=bank.voicingMetadata[name];assert.ok(meta,`metadata for ${name}`);
    const actual=[...new Set(notes.filter(n=>n!==null).map(n=>(n-roots[meta.root]+120)%12))].sort((a,b)=>a-b);
    assert.deepEqual(actual,[...intervals[meta.quality]].sort((a,b)=>a-b),name);
    assert.equal(notes.length,6);
    notes.forEach((note,string)=>{if(note!==null){assert.ok(Number.isInteger(note)&&note>=tuning[string]&&note-tuning[string]<=22,`${name}: string ${string}`);assert.ok(note-12>=24&&note+12<=96);}});
  }
});
test('the original slots and legacy numeric voicing IDs stay unchanged',()=>{
  const original=['C','G','D','Am','Em','F','Dm','A','E','G7','B7'];
  assert.deepEqual(bank.slots,original);assert.deepEqual(Object.keys(bank.voicings).slice(0,11),original);assert.deepEqual(styles[0].slots,original);
});
