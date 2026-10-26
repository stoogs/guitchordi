/* SPDX-License-Identifier: GPL-3.0-only */
#pragma once
#include <stdint.h>

/* The configured ALNK/codec path consumes signed 24-bit VALUES in int32 words,
 * as Felucca audio.c does with Q15 * 128. Do not shift them left another 8 bits.
 * First-hardware bring-up ceiling: 1/16 full scale (~-24 dBFS). This is a digital
 * bound, not a guarantee of acoustic loudness on a particular speaker. */
#define GM_DAC_LIMIT 524287
static int32_t gm_dac_sample(float sample, unsigned master) {
    /* Also reject NaN/infinity before float-to-integer conversion. The separate
     * master gate enforces zero even when the application is in a reset dialog. */
    if (!master || !(sample >= -1.0f && sample <= 1.0f)) return 0;
    return (int32_t)(sample * (float)GM_DAC_LIMIT);
}

/* Cold start and ADC timeout are silent. Turn-down, especially zero, takes
 * effect immediately; smooth only upward movement. Leave a small zero deadband. */
static unsigned gm_master_reading(int raw, int32_t *smooth) {
    if (raw < 0 || raw <= 8 || raw > 1023) { *smooth=0; return 0; }
    if (raw < *smooth) *smooth=raw;
    else *smooth += (raw-*smooth+3)/4;
    if (*smooth<=8) return 0;
    return (unsigned)(*smooth-8)*100u/1015u;
}
