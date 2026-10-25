#!/usr/bin/env python3
"""Generate the one-page, vector A4 landscape control reference."""
from pathlib import Path
import math, shutil
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.colors import HexColor, white
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'output/pdf/Guitchordi-Cheatsheet-A4.pdf'
OUT.parent.mkdir(parents=True,exist_ok=True)
for name,file in [('Sans','Arial.ttf'),('Bold','Arial Bold.ttf')]:
    pdfmetrics.registerFont(TTFont(name,'/System/Library/Fonts/Supplemental/'+file))
c=canvas.Canvas(str(OUT),pagesize=landscape(A4));W,H=landscape(A4)
c.setTitle('Guitchordi - A4 quick controls');c.setAuthor('Guitchordi')
ink=HexColor('#172b33');muted=HexColor('#50636c');accent=HexColor('#256a71');line=HexColor('#a0afb3');pale=HexColor('#eef3f3')
def text(x,y,s,size=9,font='Sans',color=ink):
    c.setFillColor(color);c.setFont(font,size);c.drawString(x,y,s)
def center(x,y,s,size=9,font='Sans',color=ink):
    c.setFillColor(color);c.setFont(font,size);c.drawCentredString(x,y,s)
def box(x,y,w,h,fill=white,stroke=line,r=4):
    c.setFillColor(fill);c.setStrokeColor(stroke);c.setLineWidth(.6);c.roundRect(x,y,w,h,r,fill=1,stroke=1)
def route(points):
    c.setStrokeColor(accent);c.setLineWidth(.85);p=c.beginPath();p.moveTo(*points[0])
    for pt in points[1:]:p.lineTo(*pt)
    c.drawPath(p)
    x,y=points[-1];a,b=points[-2];angle=math.atan2(y-b,x-a)
    for d in [-.5,.5]:c.line(x,y,x-4*math.cos(angle+d),y-4*math.sin(angle+d))
def badge(n,x,y):
    c.setFillColor(white);c.setStrokeColor(accent);c.setLineWidth(1);c.circle(x,y,8,fill=1,stroke=1);center(x,y-3,str(n),8,'Bold',accent)
def knob(x,y,label):
    c.setFillColor(white);c.setStrokeColor(muted);c.circle(x,y,12,fill=1,stroke=1);c.setLineWidth(1.5);c.line(x,y,x+4,y+8);center(x,y-23,label,7,'Bold')
def button(x,y,label,reserved=False):
    box(x-20,y-12,40,24,white if not reserved else pale);center(x,y-3,label,7,'Bold',muted if reserved else ink)
text(28,560,'Guitchordi',25,'Bold');text(174,562,'QUICK CONTROLS',11,'Bold',accent)
text(28,540,'A4 landscape / print at 100% or Fit / current simulator + experimental FM-1 control map',9,color=muted)
# Device outline and the same control positions used by the simulator.
box(40,302,486,192,pale,muted,10)
knob(66,455,'MASTER');knob(112,455,'SELECT');knob(66,408,'PRESETS');knob(112,408,'ALGORITHM')
button(65,358,'OCT -');button(111,358,'OCT +')
box(146,387,83,91,white,muted)
center(187.5,462,'K1   K2   K3   K4',7,'Bold');center(187.5,443,'Classic Rock',7)
center(187.5,417,'E',26,'Bold');center(187.5,396,'STD EADGBE',6.8)
for i,x in enumerate([274,340,406,472],1):knob(x,455,'K'+str(i))
for i,label in enumerate(['FX','SEL','ENV','LFO','EDIT','GLO']):button(267+i*46,411,label,label=='LFO')
for i,label in enumerate(['HOME','SAVE','ARP','SEQ','PLAY','REC']):button(267+i*46,374,label,label in ['SEQ','REC'])
# Keybed shown as 16 string contacts + 11 chord contacts.
for i in range(16):
    x=52+i*28.7;box(x,311,27,27,white,line,2)
for i,after in enumerate([0,1,2,4,5,7,8,9,11,12,14]):
    x=52+(after+1)*28.7-8;c.setFillColor(muted);c.roundRect(x,329,16,13,2,fill=1,stroke=0)
text(50,287,'Black keys: choose a chord; hold for Strum/Arp repeats.',8.5,'Bold')
text(50,274,'White keys: tap or sweep to play. Soft / normal / accent zones.',8.5)
# Numbered leaders; grouped controls share one matching explanation.
for n,x,y,pts in [
 (1,28,487,[(35,484),(52,478),(66,467)]),
 (2,122,514,[(122,506),(112,488),(112,467)]),
 (3,28,409,[(36,409),(54,408)]),
 (4,28,355,[(36,355),(45,358)]),
 (5,379,514,[(379,506),(379,484)]),
 (6,242,352,[(247,358),(247,374)]),
 (7,309,352,[(309,360),(313,362)]),
 (8,357,514,[(357,506),(357,423)]),
 (9,453,514,[(453,506),(451,423)]),
 (10,541,443,[(533,443),(520,443),(497,423)]),
 (11,414,352,[(430,352),(451,362)])]:
    route(pts);badge(n,x,y)
# K1-4 bracket.
c.setStrokeColor(accent);c.setLineWidth(.8);c.line(274,484,472,484)
for x in [274,340,406,472]:c.line(x,484,x,469)
# Pair labels are physically printed on the device diagram; legend gives behavior.
legend=[
 ('MASTER','Output volume. Start comfortably low.'),
 ('SELECT','Turn for tempo: 40-240 BPM. Default 90.'),
 ('PRESETS / ALGORITHM','PRESETS: chord style. ALGORITHM: instrument.'),
 ('OCT - / OCT +','Shift by one octave, from -1 to +1.'),
 ('K1-K4','Page-dependent parameters: use the chart below.'),
 ('FX / HOME','FX: tone page <-> Home. HOME: play / cancel.'),
 ('SEL / SAVE','SEL: OK / confirm. SAVE: keep browser settings.'),
 ('ENV','Hold 3 seconds: lock / unlock chord and voicing.'),
 ('EDIT','Tap: assign slot with PRESETS; SEL finishes.'),
 ('GLO','Tap: global page. Hold 3 seconds: reset prompt.'),
 ('ARP / PLAY','ARP: Freeplay > Strum > Arp. PLAY: damp all.')]
for i,(title,desc) in enumerate(legend):
    y=511-i*23.5;badge(i+1,562,y-1);text(577,y+1,title,9,'Bold');text(577,y-10,desc,8.1)
# Edit reset and reset confirmation are deliberately explicit.
text(552,247,'Hold EDIT 1.2 s: PRESETS selects Cancel / This slot / All slots.',7.7)
text(552,236,'Reset prompts: SEL confirms; HOME cancels. No instant reset.',7.7,'Bold',accent)
# Bottom mode matrix.
text(28,245,'WHAT THE FOUR KNOBS DO',10,'Bold',accent)
cols=[28,188,344,500,656,814];top=231;row=24
head=['PAGE / MODE','K1','K2','K3','K4']
rows=[
 ['Freeplay / FX','Intensity (50% neutral)','Transpose','Shared room','Voicing of selected slot'],
 ['Strum / Home','Pattern (6 choices)','Division','Gate: FREE or 25-100%','Sweep: INSTANT / 5-250 ms'],
 ['Arp / Home','Pattern (6 choices)','Division','Gate: FREE or 25-100%','Swing: 0-60%'],
 ['GLO','Gate tails: Off / On','Strum humanity: 0-100%','Guitar tuning (14 choices)','Rhythm velocity: 1-100%']]
for r,values in enumerate([head]+rows):
    y=top-r*row;c.setFillColor(pale if r%2==0 else white);c.rect(28,y-row,786,row,fill=1,stroke=0)
    for j,value in enumerate(values):text(cols[j]+7,y-15,value,8.1,'Bold' if r==0 or j==0 else 'Sans')
c.setStrokeColor(line);c.setLineWidth(.5)
for r in range(6):c.line(28,top-r*row,814,top-r*row)
text(28,94,'JAM START',9,'Bold',accent)
text(97,94,'Steel Acoustic / Classic Rock / Standard EADGBE / 90 BPM / Down / 1/8 / FREE / 50 ms sweep',8.5)
text(28,78,'Tap ARP for Strum, then hold a black chord key. Release to stop repeats; notes ring naturally. PLAY damps them.',8.6)
text(28,63,'Rhythm velocity defaults to 80%: soft 40% / normal 80% / accent 100%. GLO K4 changes it; tone intensity stays separate.',8.3)
text(28,48,'Division: 1/1 through 1/32, each straight, dotted (D) or triplet (T). FREE gate rings; GLO K1 adds tails to percentage gates.',8.3)
text(28,26,'25 OCT 2026 / github.com/stoogs/guitchordi',7.3,color=muted)
text(321,26,'LFO / SEQ / REC reserved. Device SAVE is RAM-only; physical hardware validation remains pending.',7.3,color=muted)
c.showPage();c.save()
web=ROOT/'web/emu/manual/Guitchordi-Cheatsheet-A4.pdf';shutil.copyfile(OUT,web)
print(OUT)
