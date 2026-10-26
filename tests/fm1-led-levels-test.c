/* SPDX-License-Identifier: GPL-3.0-only */
#include <assert.h>
#include <stdio.h>
#include "../firmware/fm1/led-levels.h"
int main(void) {
    unsigned count[4]={0};
    for(unsigned frame=0;frame<1200;frame++) {
        uint8_t mask=gm_led_mask(frame%GM_LED_PHASES,2u,4u,8u);
        for(unsigned row=0;row<4;row++)count[row]+=!!(mask&(1u<<row));
        /* Selected/pressed wins even if masks happen to overlap. */
        assert((gm_led_mask(frame%GM_LED_PHASES,2u,2u,2u)&2u)!=0);
    }
    assert(count[0]==0 && count[1]==1200 && count[2]==300 && count[3]==100);
    puts("FM-1 LEDs: full/quarter/twelfth duty, inactive dark and active override passed");
}
