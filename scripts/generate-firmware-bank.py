"""Generate the C bank/style tables from the editable JSON sources."""
import json
from pathlib import Path
bank=json.loads(Path('web/chords.json').read_text())
styles=json.loads(Path('web/styles.json').read_text())['styles']
names=list(bank['voicings'])
assert bank['schemaVersion']==1 and len(bank['slots'])==11
assert all(len(notes)==6 for notes in bank['voicings'].values())
assert len(styles)==50 and all(len(style['slots'])==11 for style in styles)
quote=lambda s:json.dumps(s,ensure_ascii=True)
out=['/* Generated from web/chords.json + web/styles.json. */',f'#define FW_CHORDS {len(names)}',f'#define FW_MODES {len(styles)}',
     'static const char *const chord_names[FW_CHORDS] = {'+','.join(quote(n) for n in names)+'};',
     'static const int chord_notes[FW_CHORDS][6] = {']
for notes in bank['voicings'].values():out.append('{'+','.join(str(-1 if n is None else n) for n in notes)+'},')
out+=['};','static const int initial_slots[11] = {'+','.join(str(names.index(n)) for n in bank['slots'])+'};',
      'static const char *const mode_names[FW_MODES] = {'+','.join(quote(m['name']) for m in styles)+'};',
      'static const int mode_slots[FW_MODES][11] = {']
for mode in styles:out.append('{'+','.join(str(names.index(n)) for n in mode['slots'])+'},')
out+=['};','static const int mode_tones[FW_MODES] = {'+','.join(str(['wood','wire','glow'].index(m['tone'])) for m in styles)+'};',
      'static const int mode_rooms[FW_MODES] = {'+','.join(str(m['room']) for m in styles)+'};']
Path('build/generated').mkdir(parents=True,exist_ok=True)
# Alternate standard-EADGBE shapes. Preserve every pitch class in the original
# voicing; only string placement/register changes. No attacks are generated.
from itertools import product
opens=[40,45,50,55,59,64]
shapes=[]
for original in bank['voicings'].values():
 base=tuple(-1 if p is None else p for p in original)
 pcs={p%12 for p in base if p>=0}
 found={base}
 for low in range(0,14):
  choices=[[-1]+[o+f for f in range(0,low+5) if (f==0 or f>=low) and (o+f)%12 in pcs] for o in opens]
  for notes in product(*choices):
   sounding=[p for p in notes if p>=0]
   if len(sounding)<max(3,len(pcs)) or {p%12 for p in sounding}!=pcs:continue
   if any(a>=b for a,b in zip(sounding,sounding[1:])):continue
   frets=[p-o for p,o in zip(notes,opens) if p>=0 and p!=o]
   if frets and (max(frets)-min(frets)>4 or len(set(frets))>4):continue
   found.add(notes)
 def position(notes):return sum(p-o for p,o in zip(notes,opens) if p>=0)/sum(p>=0 for p in notes)
 candidates=sorted(found-{base},key=lambda n:(position(n),sum(p<0 for p in n),n))
 # Spread choices across the neck instead of six near-identical low shapes.
 chosen=[base]
 for fraction in [0,.2,.4,.65,1]:
  if candidates:
   index=round(fraction*(len(candidates)-1));chosen.append(candidates.pop(index))
 assert len(chosen)>=2
 assert len(set(chosen))==len(chosen)
 assert all({p%12 for p in n if p>=0}==pcs for n in chosen)
 shapes.append(chosen)
out+=['#define FW_SHAPES 6','static const uint8_t shape_counts[FW_CHORDS] = {'+','.join(str(len(s)) for s in shapes)+'};',
      'static const int16_t chord_shapes[FW_CHORDS][FW_SHAPES][6] = {']
for options in shapes:
 padded=options+[options[0]]*(6-len(options))
 out.append('{'+','.join('{'+','.join(map(str,n))+'}' for n in padded)+'},')
out+=['};']
# Compact harmonic metadata. Pitch classes use the actual sounding shapes.
roots={'C':0,'C#':1,'Db':1,'D':2,'Eb':3,'D#':3,'E':4,'F':5,'F#':6,'Gb':6,'G':7,'Ab':8,'G#':8,'A':9,'Bb':10,'A#':10,'B':11}
metadata=bank['voicingMetadata']
out+=['static const uint8_t chord_roots[FW_CHORDS] = {'+','.join(str(roots[metadata[n]['root']]) for n in names)+'};',
      'static const uint16_t chord_pcs[FW_CHORDS] = {'+','.join(str(sum(1<<pc for pc in {p%12 for p in bank['voicings'][n] if p is not None})) for n in names)+'};']
scales=[];tonics=[]
for style in styles:
 tonic=roots[style['key'].split(' / ')[0]];tonics.append(tonic)
 tonic_chords=[metadata[n]['quality'] for n in style['slots'] if roots[metadata[n]['root']]==tonic]
 minor=bool(tonic_chords and tonic_chords[0].startswith('m') and not tonic_chords[0].startswith('maj'))
 degrees=[0,2,3,5,7,8,10] if minor else [0,2,4,5,7,9,11]
 if style['id']=='jazz-modal':degrees=[0,2,3,5,7,9,10] # D Dorian palette
 if style['family']=='Blues':degrees=sorted(set(degrees+[3,6,10]))
 mask=0
 for key in style['key'].split(' / '):
  for degree in degrees:mask|=1<<((roots[key]+degree)%12)
 scales.append(mask)
out+=['static const uint8_t mode_tonics[FW_MODES] = {'+','.join(map(str,tonics))+'};',
      'static const uint16_t mode_scales[FW_MODES] = {'+','.join(map(str,scales))+'};']
# Alternate tunings are immutable compact fret tables in flash, generated once at build time.
import runpy
make_tuning=runpy.run_path('scripts/tuning-voicings.py')['voicings']
tunings=json.loads(Path('docs/tuning-presets.json').read_text())['presets']
out+=['#define FW_TUNINGS '+str(len(tunings)),
 'static const char *const tuning_names[FW_TUNINGS] = {'+','.join(quote(t['name']) for t in tunings)+'};',
 'static const char *const tuning_labels[FW_TUNINGS] = {'+','.join(quote(t['label']) for t in tunings)+'};',
 'static const int8_t tuning_opens[FW_TUNINGS][6] = {'+','.join('{'+','.join(map(str,t['midi']))+'}' for t in tunings)+'};',
 'static const int8_t tuning_frets[FW_TUNINGS-1][FW_CHORDS][FW_SHAPES][6] = {']
tuning_shapes={}
for tuning in tunings[1:]:
 options=[make_tuning(tuning['midi'],bank['voicings'][name],roots[metadata[name]['root']]) for name in names]
 tuning_shapes[tuning['id']]=dict(zip(names,options))
 out.append('{'+','.join('{'+','.join('{'+','.join(map(str,notes))+'}' for notes in chord)+'}' for chord in options)+'},')
 print('Tuning shapes:',tuning['name'],flush=True)
out+=['};']
Path('build/generated/tuning-shapes.json').write_text(json.dumps(tuning_shapes))
Path('build/generated/fw_bank.h').write_text('\n'.join(out)+'\n')
print(f'Voicings: {len(shapes)} chords, {min(map(len,shapes))}–{max(map(len,shapes))} distinct shapes each')

Path('build/generated/chord-shapes.json').write_text(json.dumps(dict(zip(names,shapes))))
