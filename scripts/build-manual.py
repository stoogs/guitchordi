#!/usr/bin/env python3
"""Build Guitchordi's illustrated HTML guide and printable PDF from the same content."""
from pathlib import Path
import argparse, html, json, shutil
ROOT=Path(__file__).resolve().parents[1]
WEB=ROOT/'web/emu/manual'
PAGES=[
 ('start','Start playing','01-overview.png',[
 ('Open and switch on','Open the browser instrument, then click Switch on. Start with a comfortable MASTER level. Standard EADGBE remains the default guitar reference.'),
 ('Choose a chord, then play','The eleven black keys choose chord slots. The strip above them shows every chord at all times; the LCD shows the selected chord. Tap or sweep the sixteen light keys to make sound. Only contacted keys attack; muted parts stay silent.'),
 ('Let it ring, or stop it','Releasing a key leaves its natural, finite tail. Click Damp all strings, press Escape, or use PLAY to stop ringing notes. Mute output silences the speaker path while the instrument continues running.')]),
 ('instruments','Change instrument and style','02-instruments.png',[
 ('1. Choose the chord style first','Use CHORD STYLE or turn PRESETS. There are fifty banks, including jazz, lo-fi, rock, blues, pop, soul and folk. A style loads its factory chords. Instrument, tuning, intensity and room remain independent.'),
 ('2. Choose the sound','Use INSTRUMENT or turn ALGORITHM. The sixteen choices include Wood/Wire/Glow; nylon, steel, jumbo, palm-muted, clean, jazz, crunch and heavy guitars; harp, bowed violin, pizzicato cello, bass and dulcimer. Instrument changes affect future key contacts and create no attack.'),
 ('3. Keep your combination','Press SAVE after choosing your bank, instrument and settings. In the browser this persists across reloads. Changing style again loads that bank\'s factory chords while retaining the instrument and tuning.')]),
 ('zones','Violin notes and playing zones','03-violin-zones.png',[
 ('Green: soft / keys 1-6','Gentle attacks. Amber keys 7-12 give normal attacks; coral keys 13-16 give accented attacks. The coloured key tops, note lettering, active highlights and zone legend stay consistent. This is a simulated contact intensity, not measured pressure or bow speed.'),
 ('Four parts across sixteen contacts','Violin and cello repeat four upper chord parts; bass repeats four lower parts. The violin key labels now show the actual sounding note and octave, such as D4. The same pitch can appear in several zones: play it softly, normally or with an accent. Hover for the note, part and physical key number.'),
 ('A bowed colour with a finite tail','Bowed Violin uses a bounded periodic bow approximation and a gentle onset. Notes are capped at three seconds and releases retain the tail. It is a lightweight synthesis approximation, with no continuous bow-pressure control. The LCD shows note names and colours the last-played part for its zone.')]),
 ('chords','Lock, edit and save','04-lock-save.png',[
 ('Lock the chord','Hold ENV for three uninterrupted seconds. The lock warms from orange to red as the hold completes. Releasing early cancels. Black keys, chord styles and slot edits are then blocked; instrument, master and transpose remain available. Hold ENV again to unlock.'),
 ('Edit a chord slot','While unlocked, choose a black-key slot, press EDIT, then turn PRESETS to change its assigned voicing. Press SEL to confirm. Hold EDIT to choose a reset of this slot or all slots with PRESETS, then SEL to confirm; HOME cancels. The black-key labels, chord strip and LCD follow the actual assignment.'),
 ('Understand SAVE','SAVE stores the active bank, its current slot edits, instrument and settings in this browser. It does not maintain fifty separately edited banks. Loading another style replaces current slots with its factory set. Reload restores the last save; ringing notes and held keys are never saved. Browser saves are specific to the website origin. SAVE on the FM-1 is RAM-only and does not persist across a power cycle.')]),
 ('controls','Controls and keyboard shortcuts',None,[
 ('Knobs','MASTER: output level. SELECT: BPM. PRESETS: chord style, or assigned chord while EDIT is active. ALGORITHM: instrument. On Freeplay/FX, K1: intensity (50% standard); K2: transpose; K3: room; K4: saved voicing for the selected slot. In Strum/Arp, K1: pattern; K2: division; K3: gate (FREE default); K4: strum sweep or swing. Strum sweep is INSTANT, then 5-250 ms in 5 ms steps. Drag up/down, scroll, use arrow keys when focused, or press the minus/plus buttons.'),
 ('Panel buttons','FX toggles tone controls/Home. ARP cycles Freeplay, Strum and Arp. GLO opens globals: K1 gate tails, K2 humanity, K3 tuning, K4 rhythm velocity. Hold GLO for three seconds for reset confirmation; SEL confirms, HOME cancels. HOME returns to play. OCT- and OCT+ transpose by an octave. PLAY damps sound. Hold PLAY five seconds for a hidden instrumental chord loop; tap PLAY again to stop. ENV held three seconds toggles lock. LFO, SEQ and REC are reserved.'),
 ('Computer keys','String contacts, left to right: A S D F G H J K L ; \' Z X C V B. Chord slots: Q W E R T Y U I O P [. Hold Space with page focus for the three-second ENV lock; Enter is SEL/OK. Escape damps. Focused buttons/keys also support Space or Enter. Repeated keydown events do not create repeated attacks.'),
 ('Two small details','Switching off pauses audio; switching back on resumes the current session. Reloading boots from your last save. On a phone, landscape gives more room; the device panel can scroll horizontally.')]),
 ('hardware','Sound, headroom and troubleshooting',None,[
 ('Will the FM-1 sound like this?','The browser and target firmware share the C instrument and fixed-point string model, with the same patch settings and 44.1 kHz design rate. That is a strong basis for the same core timbre. The corrected quiet beta boots on a real FM-1, and its maker reports audio and controls match the browser. Its output ceiling is deliberately conservative. Worst-case CPU load, all-instrument behavior and restoration still need qualification.'),
 ('Memory fits; CPU is still unknown','Sixteen instruments are selectable patches, sharing fourteen voice slots. They are not sixteen simultaneous engines. The application, display buffers and reserved stacks fit the target linker layout. This is a build-time check. That does not measure real-time audio headroom or stack high-water usage. A 128-frame half-buffer allows about 2.90 ms at 44.1 kHz, including input handling and rendering. Real hardware must meet that deadline under the worst patch/voice load.'),
 ('Next device checks','Recovery entry and a complete private backup were verified from Felucca. Installation into GuitChordi and an outgoing update have completed on the developer’s FM-1. Measure output rate, render times, missed buffers and stack depth across the instruments before a public release. Device SAVE remains RAM-only; actual restoration is still untested.'),
 ('If something seems wrong','No sound: switch on, unmute and check MASTER. Missing notes: inspect muted keys and the selected voicing; four-part patches repeat notes. Wrong sound after changing style: reselect INSTRUMENT, then SAVE. Bank will not change: unlock with ENV and leave EDIT if active. Stuck or overly busy tails: Damp all strings or Escape. The simulator requires a 44.1 kHz AudioContext and reports startup failures beside Switch on.')])]

def build_html():
 WEB.mkdir(parents=True,exist_ok=True)
 nav=''.join(f'<a href="#{id}">{html.escape(title)}</a>' for id,title,img,items in PAGES)
 sections=[]
 for n,(id,title,img,items) in enumerate(PAGES,1):
  body=''.join(f'<h3>{html.escape(h)}</h3><p>{html.escape(t)}</p>' for h,t in items)
  figure=f'<figure><a href="images/{img}"><img src="images/{img}" alt="Guitchordi: {html.escape(title)}"></a><figcaption>Live simulator screenshot. Open the image to inspect it at full resolution.</figcaption></figure>' if img else ''
  sections.append(f'<section id="{id}"><span class="chapter">{n:02d} / GUIDE</span><h2>{html.escape(title)}</h2>{figure}{body}</section>')
 data='''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Guitchordi manual</title><style>
:root{color-scheme:dark;font:16px/1.7 system-ui;background:#111b18;color:#e8f1ed}*{box-sizing:border-box}body{margin:0}main{max-width:1000px;margin:auto;padding:42px 28px 80px}a{color:#a3e0c5}header{padding:28px 0 30px;border-bottom:1px solid #42584a}h1{font-size:54px;letter-spacing:-2px;line-height:1.1;margin:16px 0}h2{font-size:30px;letter-spacing:-.8px;margin:7px 0 22px;line-height:1.3}h3{font-size:18px;color:#d9e9df;margin:25px 0 5px}p{color:#bacfc1;margin:0 0 15px}.eyebrow,.chapter{font-size:11px;letter-spacing:2px;color:#8cc8ad}.actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:22px}.actions a{padding:9px 18px;border:1px solid #638370;border-radius:24px;text-decoration:none}nav{display:flex;flex-wrap:wrap;gap:10px 22px;padding:25px 0;font-size:13px}section{padding:36px 0;border-bottom:1px solid #344d3d;scroll-margin-top:24px}figure{margin:18px 0 28px;background:#18241e;border:1px solid #49624f;border-radius:12px;overflow:hidden}img{display:block;width:100%;height:auto}figcaption{font-size:11px;padding:10px 15px;color:#9db9a6}.note{padding:15px 19px;background:#28392d;border-left:3px solid #e1c273}footer{font-size:12px;color:#93ae9d;padding-top:30px}@media(max-width:600px){main{padding:20px}h1{font-size:40px}h2{font-size:25px}}@media print{:root{color-scheme:light;background:white;color:#14251b}p{color:#334d3c}nav,.actions{display:none}section{break-before:page}h3{color:#14251b}figure{break-inside:avoid}}
</style></head><body><main><header><span class="eyebrow">PLAYER'S GUIDE / 26 OCTOBER 2026</span><h1>Guitchordi</h1><p>16 instruments. 50 chord styles. Sixteen direct contacts and fourteen ringing voices.</p><div class="actions"><a href="../">Back to instrument</a><a href="Guitchordi-Cheatsheet-A4.pdf" download>Current A4 cheatsheet</a></div></header><nav>'''+nav+'''</nav><p class="note">This guide covers the browser instrument and current FM-1 beta controls. The quiet beta works on the developer’s FM-1; broader hardware qualification is ongoing. Standard EADGBE remains the guitar default.</p>'''+''.join(sections)+'''<footer>GuitChordi beta manual. Screenshots show the browser application and may depict an earlier layout. Worst-case hardware measurements remain pending. The browser guide uses the same C application as the experimental target build.</footer></main></body></html>'''
 (WEB/'index.html').write_text(data)

def build_pdf():
 from reportlab.pdfgen import canvas
 from reportlab.pdfbase import pdfmetrics
 from reportlab.pdfbase.ttfonts import TTFont
 pdfmetrics.registerFont(TTFont("GuitSans","/System/Library/Fonts/Supplemental/Arial.ttf"))
 pdfmetrics.registerFont(TTFont("GuitSans-Bold","/System/Library/Fonts/Supplemental/Arial Bold.ttf"))
 pdfmetrics.registerFontFamily("GuitSans",normal="GuitSans",bold="GuitSans-Bold",italic="GuitSans",boldItalic="GuitSans-Bold")
 from reportlab.lib.colors import HexColor
 from reportlab.platypus import Paragraph
 from reportlab.lib.styles import ParagraphStyle
 from reportlab.lib.utils import ImageReader
 from PIL import Image
 out=ROOT/'output/pdf/Guitchordi-Manual.pdf';out.parent.mkdir(parents=True,exist_ok=True)
 c=canvas.Canvas(str(out),pagesize=(595.28,841.89));c.setTitle('Guitchordi - Illustrated Player\'s Guide');c.setAuthor('Guitchordi project')
 dark=HexColor('#17392d');muted=HexColor('#51685c');green=HexColor('#50816a');width=507.28
 style=ParagraphStyle('body',fontName='GuitSans',fontSize=10.1,leading=14,textColor=dark,spaceAfter=10)
 for n,(id,title,img,items) in enumerate(PAGES,1):
  c.setFillColor(HexColor('#f5f7f1'));c.rect(0,0,595.28,841.89,fill=1,stroke=0)
  c.setFillColor(green);c.setFont('GuitSans-Bold',9);c.drawString(44,802,'GUITCHORDI / PLAYER\'S GUIDE')
  c.setFillColor(dark);c.setFont('GuitSans-Bold',25);c.drawString(44,764,title)
  c.setStrokeColor(HexColor('#bdcfc1'));c.line(44,744,551,744);y=721
  if img:
   path=WEB/'images'/img
   im=Image.open(path);iw,ih=im.size
   # Keep the full native screenshot in the web guide; focus PDF figures on the relevant UI.
   if id=='instruments':box=(130,220,490,465)
   elif id=='zones':box=(145,530,1365,1225)
   elif id=='chords':box=(450,550,1330,830)
   else:box=(135,480,1355,1245)
   box=(box[0],box[1],min(box[2],iw),min(box[3],ih));im=im.crop(box)
   draw_h=min(290,width*im.height/im.width);draw_w=draw_h*im.width/im.height
   c.drawImage(ImageReader(im),44+(width-draw_w)/2,y-draw_h,width=draw_w,height=draw_h,mask='auto');y-=draw_h+18
  for heading,body in items:
   p=Paragraph('<b>'+html.escape(heading)+'</b><br/>'+html.escape(body),style)
   w,h=p.wrap(width,700)
   if y-h<66:raise RuntimeError(f'Page {n} overflows at {heading}: y={y}, height={h}')
   p.drawOn(c,44,y-h);y-=h+14
  if id=='hardware':
   r=json.loads((ROOT/'docs/fm1-build-measurements.json').read_text())
   line=f"Link report: app {r['app_bytes']:,} B; data/BSS {r['ram_data_bss_bytes']:,} B; framebuffer pool {r['pool_bytes']:,} B."
   p=Paragraph(html.escape(line),ParagraphStyle('small',parent=style,fontSize=8.6,leading=12));w,h=p.wrap(width,80);p.drawOn(c,44,y-h)
  c.setFont('GuitSans',8);c.setFillColor(muted);c.drawString(44,34,'Browser guide - hardware bring-up pending | 21 October 2026');c.drawRightString(551,34,f'{n} / {len(PAGES)}');c.showPage()
 c.save();shutil.copy2(out,WEB/'Guitchordi-Manual.pdf');print(out)
if __name__=='__main__':
 ap=argparse.ArgumentParser();ap.add_argument('--html-only',action='store_true');a=ap.parse_args();build_html()
 if not a.html_only:build_pdf()
