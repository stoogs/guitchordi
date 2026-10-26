/* SPDX-License-Identifier: GPL-3.0-only */
#include <assert.h>
#include <math.h>
#include <stdint.h>
#include <stdio.h>
#include "../firmware/fm1/audio-output.h"

/* Independent receiver interpretation: sign-extend the low 24 serial bits.
 * A negative int32 word is expected to arrive as the same signed PCM value. */
static int32_t codec_value(int32_t word) {
    uint32_t bits=(uint32_t)word&0xffffffu;
    return bits&0x800000u?(int32_t)(bits-0x1000000u):(int32_t)bits;
}
int main(void) {
    /* Independent approved ceiling: exactly 1.2 times the quiet beta, rounded. */
    assert(GM_DAC_LIMIT==629144 && GM_DAC_LIMIT<8388607/12);
    int32_t previous=-GM_DAC_LIMIT;
    for(int i=-10000;i<=10000;i++) {
        float x=i/10000.0f;
        int32_t word=gm_dac_sample(x,100), decoded=codec_value(word);
        assert(word==decoded && decoded>=previous);
        assert(decoded>=-629144 && decoded<=629144);
        assert(gm_dac_sample(x,0)==0);
        previous=decoded;
    }
    assert(codec_value(gm_dac_sample(1,100))==629144);
    assert(codec_value(gm_dac_sample(-1,100))==-629144);
    assert(gm_dac_sample(NAN,100)==0 && gm_dac_sample(INFINITY,100)==0);
    assert(gm_dac_sample(-INFINITY,100)==0 && gm_dac_sample(1.1f,100)==0);
    /* A 5% normalized signal stays 5% in the receiver, without serial-bit wrap. */
    int32_t quiet=codec_value(gm_dac_sample(.05f,5));
    assert(quiet>=31456 && quiet<=31458);
    assert(codec_value(gm_dac_sample(-.05f,5))==-quiet);
    int32_t smooth=0;
    for(int raw=0;raw<=1023;raw++) {
        unsigned level=gm_master_reading(raw,&smooth);
        assert(level<=100);
    }
    for(int n=0;n<50;n++)gm_master_reading(1023,&smooth);
    assert(gm_master_reading(1023,&smooth)==100);
    assert(gm_master_reading(0,&smooth)==0 && smooth==0);
    assert(gm_master_reading(9,&smooth)==0);
    for(int n=0;n<50;n++)gm_master_reading(60,&smooth);
    assert(gm_master_reading(60,&smooth)==5);
    assert(gm_master_reading(-1,&smooth)==0 && smooth==0);
    assert(gm_master_reading(1024,&smooth)==0 && smooth==0);
    puts("FM-1 output: signed 24-bit receiver, bounded level, 5% scaling, invalid/mute and ADC fail-silent checks passed");
}
