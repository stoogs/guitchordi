"""Author the style catalogue and add explicit, playable six-string voicings.

Run deliberately when editing the library, not on every build. Existing original
voicings/IDs stay first, preserving saved simulator assignments.
"""
import json
from pathlib import Path
bank_path = Path('web/chords.json')
bank = json.loads(bank_path.read_text())
roots = ['C','C#','D','Eb','E','F','F#','G','Ab','A','Bb','B']
# Offsets from E2 in real low-to-high string order. null explicitly mutes a string.
# Each template translates a fixed guitar fingering; high extensions use A-root shapes.
templates = {
 '': [0,7,12,16,19,24], 'm': [0,7,12,15,19,24],
 '7': [0,7,10,16,19,24], 'maj7': [0,7,11,16,19,24],
 'm7': [0,7,10,15,19,24], '6': [0,7,12,16,21,24],
 'm6': [0,7,12,15,21,24], 'sus2': [0,7,14,19,19,24],
 'sus4': [0,7,12,17,19,24], 'add9': [0,7,14,16,19,24],
 '5': [0,7,12,19,19,24], '9': [None,12,16,22,26,31],
 'm9': [0,7,14,15,19,24], 'maj9': [0,None,11,16,19,26],
 '13': [0,None,10,16,21,26], 'dim7': [None,12,18,21,27,None],
 'm7b5': [None,12,18,22,27,None], '7sus4': [0,7,10,17,19,24],
 '7#9': [0,None,10,16,19,27], '7b9': [None,12,16,22,25,31],
 'aug': [0,None,12,16,20,24],
}
info = {}
for root in roots:
    base = 40 + (roots.index(root) - 4) % 12
    for quality, shape in templates.items():
        name = root + quality
        if name not in bank['voicings']:
            bank['voicings'][name] = [None if n is None else base+n for n in shape]
        info[name] = {'root': root, 'quality': quality or 'major'}
for alias, canonical in [('Db','C#'),('Gb','F#')]:
    for quality in templates:
        bank['voicings'][alias+quality] = bank['voicings'][canonical+quality].copy()
        info[alias+quality] = {'root':alias,'quality':quality or 'major'}
bank['voicingMetadata'] = info
styles = [{'id':'original','name':'Original Sixstring','family':'Original','key':'C / G',
           'description':'The original open-position chord set, kept exactly as it was.',
           'slots':bank['slots'],'tone':'wood','room':12}]
def add(name, family, key, recipe, tone='wood', room=12, description=''):
    tonic = roots.index(key)
    slots=[]
    for token in recipe.split():
        degree, quality = token.split(':'); quality='' if quality=='maj' else quality
        root=roots[(tonic+int(degree))%12]
        if key in ['C','F','Bb','Eb','Ab'] and root=='C#': root='Db'
        if key in ['F','Bb','Eb','Ab'] and root=='F#': root='Gb'
        slots.append(root+quality)
    assert len(slots)==11 and all(name in bank['voicings'] for name in slots), name
    styles.append({'id':name.lower().replace(' ','-').replace('/','-'), 'name':name,'family':family,'key':key,
                   'description':description,'slots':slots,'tone':tone,'room':room})
add('Jazz Essentials','Jazz','C','0:maj7 2:m7 7:7 9:m7 5:maj7 4:m7 11:m7b5 4:7 9:7 2:9 7:13',description='Major sevenths, ii–V colours and secondary dominants around C.')
add('Jazz After Hours','Jazz','F','0:maj9 0:6 2:m9 7:13 9:m9 5:maj7 4:m7 9:7b9 2:9 10:13 11:dim7',room=19,description='Warm F-major extensions and a late-night dominant palette.')
add('Jazz ii V I','Jazz','Bb','2:m7 7:9 0:maj7 9:m7 2:m9 7:13 0:maj9 5:maj7 4:7 9:7b9 11:m7b5',description='Bb-centred ii–V–I options with several dominant resolutions.')
add('Jazz Minor','Jazz','D','0:m9 5:m7 7:7b9 8:maj7 2:m7b5 10:9 0:m6 3:maj7 7:7#9 8:6 11:dim7',room=16,description='D-minor colours, half-diminished tension and altered A dominants.')
add('Jazz Bossa','Jazz','G','0:6 2:m9 7:9 4:m7 9:7 2:m7 7:13 0:maj9 5:maj7 6:dim7 10:9',description='Compact sixths and ninths for a G-centred bossa-inspired palette.')
add('Jazz Modal','Jazz','D','0:m7 0:m9 5:9 10:maj7 3:maj7 7:m7 8:maj7 2:m7 5:m7 0:sus2 0:7sus4',room=21,description='Suspended and minor-seventh colours around D, with borrowed modal chords.')
add('Jazz Soul','Jazz','F','0:maj9 9:m9 2:m9 7:13 5:maj9 4:m7 10:9 9:7#9 5:m6 8:maj7 7:7b9',room=15,description='F-major soul-jazz extensions and a borrowed minor-four chord.')
add('Jazz Altered','Jazz','C','0:maj7 2:m7 7:7b9 7:7#9 1:7 4:7#9 9:7b9 2:m7b5 5:m6 11:dim7 0:maj9',description='Dominant tension, a tritone substitute and C-major release.')
add('Lo-fi Bedroom','Lo-fi','C','0:maj7 9:m7 5:maj7 2:m7 4:m7 7:7sus4 0:maj9 9:m9 5:6 10:maj7 7:9','glow',24,'Soft C-major seventh and ninth colours.')
add('Lo-fi Rainy Day','Lo-fi','F','0:maj9 9:m9 2:m7 7:9 5:maj7 4:m7 8:maj7 5:m6 0:6 10:maj7 7:7sus4','wood',28,'F-major warmth with a borrowed minor-four shade.')
add('Lo-fi Tape Haze','Lo-fi','Eb','0:maj7 9:m7 5:maj9 2:m9 7:13 4:m7 10:maj7 8:maj7 0:6 5:m7 7:7b9','glow',30,'Eb-centred extended voicings; the name is a mood, not tape processing.')
add('Lo-fi Late Train','Lo-fi','Bb','0:maj9 4:m7 9:m9 2:m7 7:9 5:6 10:maj7 5:m6 3:maj7 7:7sus4 0:maj7','wood',22,'Bb-major colours with minor-sixth and suspended detours.')
add('Lo-fi Dusk','Lo-fi','A','0:m9 5:m7 10:maj7 3:maj7 8:maj9 7:7sus4 0:m7 2:m7b5 7:7b9 5:m9 10:6','glow',27,'A-minor ninths and soft borrowed colours.')
add('Lo-fi Dusty Soul','Lo-fi','D','0:maj9 9:m9 2:m9 7:13 5:maj7 4:m7 10:9 5:m6 8:maj7 0:6 7:7#9','wood',18,'D-major extended chords with soul-flavoured dominant turns.')
add('Light Rock','Rock','G','0:maj 7:maj 9:m 5:maj 2:m 4:m 0:add9 7:sus4 5:add9 9:m7 7:7','wood',10,'Open major/minor shapes and added ninths around G.')
add('Classic Rock','Rock','E','0:maj 7:maj 5:maj 10:maj 3:maj 9:m 2:m 0:7 7:7 5:sus4 0:5','wire',8,'E-centred major chords, borrowed G/D and dominant sevenths.')
add('Hard Rock','Rock','E','0:5 3:5 5:5 10:5 7:5 8:5 2:5 0:m 5:maj 7:7 0:7#9','wire',5,'Full-string power voicings with E-minor and sharp-nine tension.')
add('Heavy Rock','Rock','D','0:5 1:5 3:5 5:5 7:5 8:5 10:5 0:m 5:m 7:7 0:sus4','wire',4,'D-centred power voicings with a chromatic flat-second option.')
add('Indie Rock','Rock','A','0:add9 7:sus2 9:m7 5:maj7 2:m7 0:maj 7:maj 5:sus2 10:maj 4:m 7:sus4','wire',19,'A-major open extensions and suspended guitar shapes.')
add('Alternative Rock','Rock','C','0:5 8:5 3:5 10:5 5:5 7:5 0:m 8:maj7 5:m 10:sus2 7:7','wire',12,'C-minor and borrowed power-chord movement.')
add('Southern Rock','Rock','G','0:maj 10:maj 5:maj 0:7 5:7 7:7 3:maj 7:maj 9:m 0:6 10:9','wire',9,'G, C and F colours with blues-dominant options.')
add('Garage Rock','Rock','A','0:5 5:5 7:5 3:5 10:5 0:7 5:7 7:7 0:m 2:maj 0:maj','wire',3,'A-centred power shapes and direct blues-rock sevenths.')
add('Dream Rock','Rock','D','0:add9 7:sus2 9:m9 5:maj7 2:m7 0:maj9 7:sus4 5:add9 10:maj7 4:m7 0:sus2','glow',32,'D-major added-note chords and spacious borrowed sevenths.')
add('Stadium Rock','Rock','D','0:maj 7:maj 9:m 5:maj 0:sus2 7:sus4 5:add9 2:m 10:maj 0:5 7:5','wire',17,'D-major anthem colours with suspended and power alternatives.')
add('Delta Blues','Blues','E','0:7 5:7 7:7 0:maj 5:maj 7:maj 0:m 10:maj 3:maj 7:9 0:7#9','wood',7,'E blues essentials, mixing major/minor and dominant colours.')
add('Memphis Blues','Blues','Bb','0:9 5:9 7:13 0:7 5:7 7:7 9:7 2:9 4:7 6:dim7 0:6','wire',13,'Bb-centred ninths, sixths and passing diminished harmony.')
add('Chicago Blues','Blues','A','0:7 5:9 7:9 0:9 5:7 7:7 0:m7 3:maj 10:maj 7:7#9 0:6','wire',8,'A electric-blues dominant palette with minor-seventh contrast.')
add('Texas Blues','Blues','E','0:7#9 5:7 7:9 0:7 5:9 7:7 0:m7 3:7 10:maj 2:9 0:6','wire',6,'E sharp-nine bite and straightforward dominant movement.')
add('Jump Blues','Blues','F','0:6 5:9 7:13 0:9 2:m7 7:9 9:7 2:9 6:dim7 5:6 0:7','wire',10,'F swing-oriented sixths, ninths and turnaround dominants.')
add('Slow Blues','Blues','G','0:9 5:9 7:7b9 0:7 5:7 7:9 0:m7 3:7 8:7 2:m7 7:13','wood',20,'G-centred dominant colour for slower expressive playing.')
add('Minor Blues','Blues','A','0:m7 5:m7 7:7 0:m9 5:m9 8:7 10:7 7:7b9 2:m7b5 3:maj7 0:m6','wire',15,'A-minor blues with a strong E-dominant resolution.')
add('Jazz Blues','Blues','C','0:9 5:9 0:13 6:dim7 2:m7 7:13 4:m7 9:7b9 2:9 7:7#9 0:6','wood',12,'C blues enriched with ii–V and diminished passing options.')
add('Pop Essentials','Pop','C','0:maj 7:maj 9:m 5:maj 2:m 4:m 0:add9 7:sus4 5:add9 9:m7 0:6','wood',13,'C-major essentials plus gentle added-note alternatives.')
add('Bright Pop','Pop','G','0:maj 7:maj 9:m 5:maj 2:m 4:m 0:6 5:6 0:add9 7:sus2 7:7','wire',15,'G-major bright sixths and suspended dominant colours.')
add('Indie Pop','Pop','D','0:maj7 7:add9 9:m7 5:maj7 2:m7 4:m7 0:add9 5:6 10:maj7 7:sus4 0:6','wood',22,'D-major sevenths and added ninths with a borrowed flat-seven.')
add('Dream Pop','Pop','A','0:maj9 7:sus2 9:m9 5:maj7 2:m9 4:m7 0:add9 5:add9 10:maj7 7:7sus4 0:6','glow',34,'A-major shimmering extensions and suspended voicings.')
add('Dark Pop','Pop','A','0:m 8:maj 3:maj 10:maj 5:m 7:7 0:m9 8:maj7 3:add9 10:sus2 2:m7b5','glow',23,'A-minor harmony with a choice of natural and dominant resolutions.')
add('Synth Pop','Pop','E','0:m7 8:maj7 3:maj7 10:sus2 5:m7 7:m7 0:m9 8:add9 3:add9 7:7 2:m7b5','glow',25,'E-minor seventh and suspended chords for a synthetic tone.')
add('Acoustic Pop','Pop','D','0:maj 7:maj 9:m 5:maj 2:m 4:m 0:sus2 5:add9 7:sus4 9:m7 0:add9','wood',11,'D-major guitar shapes and practical suspended alternatives.')
add('Pop Ballads','Pop','F','0:maj7 7:sus4 9:m7 5:maj7 2:m7 4:m7 0:add9 5:m6 8:maj7 7:7 0:6','wood',24,'F-major warmth with a borrowed minor-four and flat-six.')
add('Soul Classics','Soul','F','0:6 9:m7 2:m7 7:9 5:maj7 4:m7 9:7 2:9 10:9 5:m6 0:maj9','wood',16,'F soul colours with secondary dominants and a minor plagal option.')
add('Neo Soul','Soul','Eb','0:maj9 9:m9 2:m9 7:13 5:maj9 4:m7 10:13 9:7#9 5:m9 8:maj7 7:7b9','glow',22,'Eb-major extended harmony and richer altered dominant choices.')
add('Memphis Soul','Soul','Bb','0:6 5:6 7:9 9:m7 2:m7 4:m7 0:9 5:9 10:9 9:7 7:13','wire',13,'Bb-centred sixths and dominant ninths for a soul-inspired bank.')
add('Gospel Soul','Soul','Ab','0:maj9 5:maj7 2:m7 7:13 9:m7 4:m7 5:m6 6:dim7 9:7b9 2:9 0:6','wood',23,'Ab-major extensions, a passing diminished and borrowed minor-four.')
add('Folk Open','Folk','G','0:maj 5:maj 7:maj 9:m 2:m 4:m 0:add9 5:add9 7:sus4 0:sus2 10:maj','wood',8,'G-major chord vocabulary with open/suspended alternatives.')
add('Country Roads','Folk','D','0:maj 5:maj 7:7 9:m 2:m 0:6 5:6 7:9 2:7 9:7 0:add9','wire',9,'D-major sixths and the secondary dominants used in country harmony.')
add('Americana','Folk','A','0:maj 5:maj 7:maj 9:m 2:m 10:maj 0:7 5:6 7:7 0:add9 3:maj','wood',12,'A-major roots vocabulary with flat-seven and blues borrowing.')
add('Ambient Air','Ambient','C','0:maj9 5:maj9 9:m9 2:m9 7:sus2 0:sus2 5:add9 10:maj7 3:maj7 8:maj7 7:7sus4','glow',40,'Spacious C-centred suspended and ninth-rich colours.')
add('Cinematic Night','Ambient','E','0:m9 8:maj9 3:maj7 10:sus2 5:m9 7:sus4 0:m6 2:m7b5 7:7b9 8:6 10:7sus4','glow',36,'E-minor colours with suspended tension and a dominant release.')
assert len(styles)==50, len(styles)
assert len({tuple(s['slots']) for s in styles})==50
bank_path.write_text(json.dumps(bank,indent=2)+'\n')
Path('web/styles.json').write_text(json.dumps({'schemaVersion':1,'voicingCount':len(bank['voicings']),'styles':styles},indent=2)+'\n')
print(f"Authored {len(styles)} distinct styles, {len(bank['voicings'])} six-string voicings")
