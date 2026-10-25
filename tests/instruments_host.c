/* Instrument stress/parity sequence: real C synthesis, including bowed excitation. */
#include <assert.h>
#include <math.h>
#include <stdint.h>
#include <stdio.h>
#include <string.h>
#include "../firmware/app.h"
#include "../dsp/engine.h"
static uint32_t seed=0x8769;
static uint32_t random_word(void) { seed^=seed<<13;seed^=seed>>17;seed^=seed<<5;return seed; }
int main(int argc,char **argv) {
    assert(argc==2 && gm_tone_count()==16);
    FILE *f=fopen(argv[1],"wb"); assert(f);
    const int whites[16]={0,2,4,6,7,9,11,12,14,16,18,19,21,23,24,26};
    for(int tone=0;tone<16;tone++) {
        fw_boot(); assert(fw_set_tone(tone));
        float peak=0;double energy=0;
        for(int b=0;b<1400;b++) {
            if(b<300 && b%3==0) { int key=(b/3)%16;fw_keys(1u<<whites[key]);fw_keys(0); }
            float *s=fw_render(128);
            assert(gm_active()<=14);
            for(int i=0;i<128;i++) { assert(isfinite(s[i]));assert(fabsf(s[i])<=.98f);float x=fabsf(s[i]);if(x>peak)peak=x;energy+=(double)s[i]*s[i]; }
            assert(fwrite(s,sizeof(float),128,f)==128);
        }
        assert(peak>.0001f && energy>.0001 && gm_active()==0);
        fw_button(7,1);fw_button(7,0);uint32_t saved[FW_STORE_WORDS];memcpy(saved,fw_store(),sizeof saved);
        fw_boot();memcpy(fw_store(),saved,sizeof saved);assert(fw_restore() && fw_tone()==tone);
        printf("instrument %2d %-20s peak %.5f energy %.5f\n",tone,gm_tone_name(tone),peak,energy);
    }
    fclose(f);
    assert(!fw_set_tone(-1) && !fw_set_tone(16));
    gm_reset();assert(!gm_note_on(0,60,NAN,0));assert(!gm_note_on(0,60,INFINITY,0));
    /* Deterministic random live edits/retriggers with all valid pitches/intensities and all patches. */
    for(int i=0;i<20000;i++) {
        uint32_t r=random_word();
        gm_set_character((r/1000)%101);
        assert(gm_note_on(r%6,24+(r/6)%73,.1f+(r%901)/1000.0f,(r/73)%16));
        float *s=gm_render(1+r%128);assert(gm_active()<=14);
        for(unsigned j=0;j<1+r%128;j++)assert(isfinite(s[j]) && fabsf(s[j])<=.98f);
        if(i%997==0)gm_reset();
    }
    puts("16 instrument persistence/tails and 20000 mixed-patch retriggers pass");
    return 0;
}
