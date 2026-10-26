/* SPDX-License-Identifier: GPL-3.0-only */
#include <assert.h>
#include <math.h>
#include <stdio.h>
#include <string.h>
#include "../firmware/app.h"
#include "../dsp/engine.h"
static void render(int frames,int held) {
    while(frames>0) {
        int n=frames>128?128:frames;
        if(held)fw_button(10,1); /* physical scanner repeats the held level */
        float *p=fw_render(n);
        for(int i=0;i<n;i++)assert(isfinite(p[i]) && fabsf(p[i])<=.98f);
        frames-=n;
    }
}
int main(int argc,char **argv) {
    assert(argc==2);fw_boot();fw_button(10,1);
    render(5*GM_RATE-1,1);assert(!fw_easter_egg());assert(fw_attacks()==0);
    render(1,1);assert(fw_easter_egg());
    render(6*GM_RATE,1);assert(fw_easter_egg() && fw_attacks()==78);
    fw_button(10,0);fw_button(10,1);assert(!fw_easter_egg() && !gm_active());
    render(6*GM_RATE,1);assert(!fw_easter_egg() && !gm_active());
    fw_button(10,0);fw_button(10,1);render(5*GM_RATE,1);assert(fw_easter_egg());
    fw_button(10,0);fw_button(7,1);fw_button(7,0);
    uint32_t saved[FW_STORE_WORDS];memcpy(saved,fw_store(),sizeof saved);
    fw_boot();memcpy(fw_store(),saved,sizeof saved);assert(fw_restore() && !fw_easter_egg());
    fw_button(5,1);render(3*GM_RATE,0);assert(fw_factory_reset_menu());
    fw_button(10,1);render(6*GM_RATE,1);assert(!fw_easter_egg());
    /* Native/WASM deterministic capture covers more than one 4-bar loop. */
    fw_boot();fw_button(10,1);render(5*GM_RATE,1);fw_button(10,0);
    FILE *f=fopen(argv[1],"wb");assert(f);
    for(int block=0;block<5000;block++) {
        float *p=fw_render(128);for(int i=0;i<128;i++)assert(isfinite(p[i]) && fabsf(p[i])<=.98f);
        assert(fwrite(p,sizeof(float),128,f)==128);
    }
    fclose(f);assert(fw_easter_egg() && gm_active()<=GM_VOICES);
    fw_panic();assert(!fw_easter_egg() && !gm_active());
    puts("Easter egg: exact hold threshold, repeated scan input, stop/rearm, no restore/reset autoplay and finite loop passed");
}
