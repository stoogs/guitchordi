/* SPDX-License-Identifier: GPL-3.0-only */
#include <assert.h>
#include <math.h>
#include <stdio.h>
#include "../dsp/engine.h"
int main(void) {
    /* Upper B/C#m chord tones that previously left a piercing high partial.
     * Compare energy and first-difference energy in the 1–2 second tail.
     * These are audible-signal bounds, not a subjective sound-quality claim. */
    const int pitches[]={61,63,66,68,71};
    for(unsigned p=0;p<sizeof pitches/sizeof *pitches;p++) {
        gm_reset();gm_set_character(50);assert(gm_note_on(0,pitches[p],.8f,4));
        double energy=0,difference=0;float previous=0,peak=0;
        for(int frame=0;frame<3*GM_RATE;frame+=100) {
            float *s=gm_render(100);
            for(int i=0;i<100;i++) {
                assert(isfinite(s[i]) && fabsf(s[i])<=.98f);
                if(fabsf(s[i])>peak)peak=fabsf(s[i]);
                if(frame+i>=GM_RATE && frame+i<2*GM_RATE) {
                    energy+=(double)s[i]*s[i];
                    double delta=s[i]-previous;difference+=delta*delta;
                }
                previous=s[i];
            }
        }
        double rms=sqrt(energy/GM_RATE),ratio=difference/energy;
        assert(peak>.02f && rms>.0001 && rms<.005);
        assert(ratio<.013);assert(!gm_active() && !gm_clips());
        printf("Steel pitch %d: tail RMS %.6f, difference/energy %.6f\n",pitches[p],rms,ratio);
    }
    puts("Steel B/C#m upper-tail regression passed");
}
