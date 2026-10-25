"""Build six pitch-class-preserving guitar shapes per chord/tuning, off the audio thread."""
from itertools import product
from heapq import nsmallest

def voicings(opens, original, root):
    pcs={p%12 for p in original if p is not None}
    target=sum(1<<p for p in pcs)
    found=set()
    # Open strings plus a four-fret hand window, up to fret 22.
    for low in range(0,20):
        choices=[[-1]+[o+f for f in range(0,low+5) if (f==0 or f>=low) and (o+f)%12 in pcs] for o in opens]
        candidates=[]
        for notes in product(*choices):
            sounding=[p for p in notes if p>=0]
            if len(sounding)<max(3,len(pcs)) or any(a>=b for a,b in zip(sounding,sounding[1:])):continue
            mask=0
            for p in sounding:mask|=1<<(p%12)
            if mask!=target:continue
            frets=[p-o for p,o in zip(notes,opens) if p>=0 and p!=o]
            if frets and (max(frets)-min(frets)>4 or len(set(frets))>4):continue
            candidates.append(notes)
        def rank(notes):
            sounding=[p for p in notes if p>=0]
            frets=[p-o for p,o in zip(notes,opens) if p>=0]
            return (sum(p<0 for p in notes)*5+sum(frets)/len(frets)+(0 if sounding[0]%12==root else 2),max(frets),notes)
        found.update(nsmallest(8,candidates,key=rank))
    def position(notes):return sum(p-o for p,o in zip(notes,opens) if p>=0)/sum(p>=0 for p in notes)
    candidates=sorted(found,key=lambda n:(position(n),sum(p<0 for p in n),n))
    if len(candidates)<6:raise ValueError(f'Only {len(candidates)} shapes for {opens}/{pcs}')
    # First choice: a low, full, root-bass shape. Others explore the neck.
    first=min(candidates,key=rank);chosen=[first];candidates.remove(first)
    for fraction in [0,.2,.4,.65,1]:chosen.append(candidates.pop(round(fraction*(len(candidates)-1))))
    assert len(set(chosen))==6
    return [[p-o if p>=0 else -1 for p,o in zip(notes,opens)] for notes in chosen]
