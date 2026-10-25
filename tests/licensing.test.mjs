import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import test from 'node:test';
const read=p=>readFileSync(new URL('../'+p,import.meta.url));
const hash=p=>createHash('sha256').update(read(p)).digest('hex');
test('vendored platform and MIT DSP retain audited bytes and license notices',()=>{
 const manifest=JSON.parse(read('third_party/fm1-platform/manifest.json'));
 for(const [path,sha] of Object.entries(manifest.files))assert.equal(hash('third_party/fm1-platform/'+path),sha,path);
 assert.equal(hash('third_party/clipper-phys/phys_dsp.c'),'5d39a4037b7686001189360a098edea64ff70aa2d9099ea1a448c792ae003e7c');
 const notice=read('third_party/clipper-phys/MIT-LICENSE.txt').toString();
 assert.match(notice,/Copyright \(c\) 2020 Electrosmith, Corp, Emilie Gillet/);assert.match(notice,/Permission is hereby granted/);assert.match(notice,/THE SOFTWARE IS PROVIDED/);
 const font=read('firmware/display-font.h').toString();assert.ok(font.includes(hash('firmware/fonts/NotoSans.ttf')));
 for(const [path,marker] of [['LICENSE','GNU GENERAL PUBLIC LICENSE'],['firmware/fonts/OFL.txt','SIL OPEN FONT LICENSE'],['third_party/fm1-platform/AC79-SDK-LICENSE.txt','Apache License']])assert.ok(read(path).toString().includes(marker),path);
});
